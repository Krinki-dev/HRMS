'use strict';

const { Pool } = require('pg');
const { assertSchemaName } = require('../../shared/utils/tenantStorageConfig');

function quoteIdentifier(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

function classifyTenantTables({ tables, columns, foreignKeys }) {
  const tableSet = new Set(tables);
  const direct = new Set(
    columns
      .filter((column) => tableSet.has(column.table_name) && column.column_name === 'company_id')
      .map((column) => column.table_name)
  );
  // The registration flow creates a separate companies.id UUID; it is not the
  // Central tenants.id. Treat the companies row as the ownership root.
  if (tableSet.has('companies') && columns.some((column) => column.table_name === 'companies' && column.column_name === 'id')) {
    direct.add('companies');
  }
  const parents = new Map();
  for (const fk of foreignKeys) {
    if (!tableSet.has(fk.table_name) || !tableSet.has(fk.foreign_table_name)) continue;
    if (!parents.has(fk.table_name)) parents.set(fk.table_name, []);
    parents.get(fk.table_name).push(fk.foreign_table_name);
  }

  const classification = {};
  for (const table of tables) {
    if (direct.has(table)) {
      classification[table] = { scope: 'direct', via: null };
      continue;
    }
    const queue = [{ table, path: [table] }];
    const visited = new Set([table]);
    let match = null;
    while (queue.length && !match) {
      const current = queue.shift();
      for (const parent of parents.get(current.table) || []) {
        if (visited.has(parent)) continue;
        const path = [...current.path, parent];
        if (direct.has(parent)) {
          match = path;
          break;
        }
        visited.add(parent);
        queue.push({ table: parent, path });
      }
    }
    classification[table] = match
      ? { scope: 'dependent', via: match.slice(1) }
      : { scope: 'unclassified', via: null };
  }
  return classification;
}

async function inspectTenantMigration({
  databaseUrl,
  tenantId,
  sourceSchema,
  destinationSchema,
  gstin = null,
  pan = null,
  poolFactory = (config) => new Pool(config),
}) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(tenantId || ''))) {
    throw new Error('A valid tenant UUID is required for migration inventory.');
  }
  assertSchemaName(sourceSchema);
  assertSchemaName(destinationSchema);
  if (sourceSchema === destinationSchema) {
    throw new Error('Source and destination schemas must be different.');
  }

  const parsed = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('Migration inventory supports PostgreSQL only.');
  }
  parsed.searchParams.delete('schema');
  const pool = poolFactory({ connectionString: parsed.toString(), max: 2, connectionTimeoutMillis: 8000 });
  try {
    const schemaResult = await pool.query(
      'SELECT schema_name FROM information_schema.schemata WHERE schema_name = ANY($1::text[])',
      [[sourceSchema, destinationSchema]]
    );
    const existingSchemas = new Set(schemaResult.rows.map((row) => row.schema_name));
    if (!existingSchemas.has(sourceSchema)) throw new Error('The tenant source schema does not exist.');

    const [tableResult, columnResult, fkResult] = await Promise.all([
      pool.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = $1 AND table_type = 'BASE TABLE'
         ORDER BY table_name`,
        [sourceSchema]
      ),
      pool.query(
        `SELECT table_name, column_name, data_type
         FROM information_schema.columns WHERE table_schema = $1`,
        [sourceSchema]
      ),
      pool.query(
        `SELECT child.relname AS table_name, parent.relname AS foreign_table_name
         FROM pg_constraint c
         JOIN pg_class child ON child.oid = c.conrelid
         JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
         JOIN pg_class parent ON parent.oid = c.confrelid
         JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
         WHERE c.contype = 'f' AND child_ns.nspname = $1 AND parent_ns.nspname = $1`,
        [sourceSchema]
      ),
    ]);
    const tables = tableResult.rows.map((row) => row.table_name);
    if (!tables.includes('companies') || (!gstin && !pan)) {
      throw new Error('Cannot prove the tenant company record. A companies table and verified GSTIN or PAN are required.');
    }
    const companyResult = await pool.query(
      `SELECT id FROM ${quoteIdentifier(sourceSchema)}.companies
       WHERE ($1::text IS NULL OR UPPER(gstin) = UPPER($1))
         AND ($2::text IS NULL OR UPPER(pan) = UPPER($2))
       LIMIT 2`,
      [gstin, pan]
    );
    if (companyResult.rows.length !== 1) {
      throw new Error('Tenant company identity could not be resolved uniquely from the registered GSTIN/PAN.');
    }
    const companyId = companyResult.rows[0].id;
    const classification = classifyTenantTables({
      tables,
      columns: columnResult.rows,
      foreignKeys: fkResult.rows,
    });

    const directCounts = {};
    for (const table of tables) {
      if (classification[table].scope !== 'direct') continue;
      const count = table === 'companies'
        ? await pool.query(
            `SELECT COUNT(*)::text AS count FROM ${quoteIdentifier(sourceSchema)}.companies WHERE id = $1`,
            [companyId]
          )
        : await pool.query(
            `SELECT COUNT(*)::text AS count FROM ${quoteIdentifier(sourceSchema)}.${quoteIdentifier(table)} WHERE company_id = $1`,
            [companyId]
          );
      directCounts[table] = Number(count.rows[0].count);
    }

    const summary = {
      totalTables: tables.length,
      directlyScoped: Object.values(classification).filter((item) => item.scope === 'direct').length,
      dependentTables: Object.values(classification).filter((item) => item.scope === 'dependent').length,
      unclassifiedTables: Object.values(classification).filter((item) => item.scope === 'unclassified').length,
      destinationSchemaExists: existingSchemas.has(destinationSchema),
    };
    const blockers = [];
    if (!summary.directlyScoped) blockers.push('No company_id-owned tables were discovered; tenant ownership cannot be proven.');
    if (summary.unclassifiedTables) blockers.push('Some tables have no proven tenant ownership path and require explicit classification.');
    if (summary.dependentTables) blockers.push('Dependent tables were discovered; relation-scoped row counts and foreign-key validation are not yet implemented.');
    if (summary.destinationSchemaExists) blockers.push('The destination schema already exists; automatic migration is disabled to prevent overwriting data.');

    return {
      tenantId,
      companyId,
      sourceSchema,
      destinationSchema,
      inventoryOnly: true,
      copyAllowed: false,
      summary,
      blockers,
      tables: tables.map((name) => ({
        name,
        scope: classification[name].scope,
        ownershipPath: classification[name].via,
        sourceRows: directCounts[name] ?? null,
      })),
      foreignKeyCount: fkResult.rows.length,
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await pool.end();
  }
}

module.exports = { classifyTenantTables, inspectTenantMigration };
