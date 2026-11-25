'use strict';

const { Pool } = require('pg');
const { assertSchemaName } = require('../../shared/utils/tenantStorageConfig');

function quoteIdentifier(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

function classifyTenantTables({ tables, columns, foreignKeys, sourceSchema = null }) {
  const tableSet = new Set(tables);
  const direct = new Set(
    columns
      .filter((column) => tableSet.has(column.table_name) && column.column_name === 'company_id')
      .map((column) => column.table_name)
  );
  // Operational companies.id is distinct from Central tenants.id.
  if (tableSet.has('companies') && columns.some((column) => column.table_name === 'companies' && column.column_name === 'id')) {
    direct.add('companies');
  }

  const parents = new Map();
  for (const fk of foreignKeys) {
    if (sourceSchema && (fk.child_schema !== sourceSchema || fk.foreign_schema !== sourceSchema)) continue;
    if (!tableSet.has(fk.table_name) || !tableSet.has(fk.foreign_table_name)) continue;
    const childColumns = Array.isArray(fk.child_columns) ? fk.child_columns : [];
    const parentColumns = Array.isArray(fk.parent_columns) ? fk.parent_columns : [];
    // Never infer ownership from table names alone: a real ordered FK column
    // mapping is required, including every member of a composite key.
    if (!childColumns.length || childColumns.length !== parentColumns.length) continue;
    if (!parents.has(fk.table_name)) parents.set(fk.table_name, []);
    const columnByName = new Map(columns.filter((column) => column.table_name === fk.table_name).map((column) => [column.column_name, column]));
    parents.get(fk.table_name).push({
      table: fk.foreign_table_name,
      constraint: fk.constraint_name || null,
      childColumns,
      parentColumns,
      childNullable: childColumns.map((column) => columnByName.get(column)?.is_nullable !== 'NO'),
      validated: fk.is_validated !== false,
    });
  }

  const classification = {};
  for (const table of tables) {
    if (direct.has(table)) {
      classification[table] = { scope: 'direct', via: null, relations: [] };
      continue;
    }

    const queue = [{ table, path: [table], relations: [], visited: new Set([table]) }];
    const matches = [];
    while (queue.length && matches.length < 2) {
      const current = queue.shift();
      for (const relation of parents.get(current.table) || []) {
        if (current.visited.has(relation.table)) continue;
        const path = [...current.path, relation.table];
        const relations = [...current.relations, {
          fromTable: current.table,
          toTable: relation.table,
          constraint: relation.constraint,
          childColumns: relation.childColumns,
          parentColumns: relation.parentColumns,
          childNullable: relation.childNullable,
          validated: relation.validated,
        }];
        if (direct.has(relation.table)) {
          matches.push({ path, relations });
          if (matches.length > 1) break;
        } else {
          const visited = new Set(current.visited);
          visited.add(relation.table);
          queue.push({ table: relation.table, path, relations, visited });
        }
      }
    }

    if (matches.length > 1) {
      classification[table] = { scope: 'ambiguous', via: null, relations: [] };
    } else if (matches.length === 1) {
      classification[table] = {
        scope: 'dependent',
        via: matches[0].path.slice(1),
        relations: matches[0].relations,
      };
    } else {
      classification[table] = { scope: 'unclassified', via: null, relations: [] };
    }
  }
  return classification;
}

function buildDependentInventoryQuery({ sourceSchema, table, relations, rootTable }) {
  if (!Array.isArray(relations) || !relations.length) throw new Error('A verified ownership relation path is required.');
  const aliases = relations.map((_, index) => `t${index}`);
  let from = `${quoteIdentifier(sourceSchema)}.${quoteIdentifier(table)} AS ${aliases[0]}`;
  for (let index = 0; index < relations.length; index += 1) {
    const relation = relations[index];
    if (!relation.validated) throw new Error('Unvalidated foreign keys cannot be used for tenant row counting.');
    if (!relation.childColumns?.length || relation.childColumns.length !== relation.parentColumns?.length) {
      throw new Error('Foreign-key column mappings are incomplete.');
    }
    const nextAlias = `t${index + 1}`;
    const join = relation.childColumns.map((column, columnIndex) =>
      `${aliases[index]}.${quoteIdentifier(column)} = ${nextAlias}.${quoteIdentifier(relation.parentColumns[columnIndex])}`
    ).join(' AND ');
    from += ` LEFT JOIN ${quoteIdentifier(sourceSchema)}.${quoteIdentifier(relation.toTable)} AS ${nextAlias} ON ${join}`;
  }
  const rootAlias = `t${relations.length}`;
  const rootKey = relations[relations.length - 1].parentColumns[0];
  const ownerPredicate = rootTable === 'companies'
    ? `${rootAlias}.${quoteIdentifier('id')} = $1`
    : `${rootAlias}.${quoteIdentifier('company_id')} = $1`;
  const nullableChecks = relations.flatMap((relation, index) =>
    relation.childColumns.map((column) => `${aliases[index]}.${quoteIdentifier(column)} IS NULL`)
  );
  const nullablePredicate = nullableChecks.length ? nullableChecks.join(' OR ') : 'FALSE';
  return {
    sql: `SELECT
      COUNT(*) FILTER (WHERE ${ownerPredicate})::text AS tenant_owned_rows,
      COUNT(*) FILTER (WHERE ${rootAlias}.${quoteIdentifier(rootKey)} IS NULL OR (${rootTable !== 'companies' ? `${rootAlias}.${quoteIdentifier('company_id')} IS NULL` : 'FALSE'}))::text AS orphan_rows,
      COUNT(*) FILTER (WHERE ${nullablePredicate})::text AS nullable_reference_rows
      FROM ${from}`,
  };
}

function buildCrossTenantReferenceQuery({ sourceSchema, foreignKey, parentIsCompanies = false }) {
  if (!foreignKey.child_columns?.length || foreignKey.child_columns.length !== foreignKey.parent_columns?.length) {
    throw new Error('Foreign-key column mappings are incomplete.');
  }
  const join = foreignKey.child_columns.map((column, index) =>
    `child.${quoteIdentifier(column)} = parent.${quoteIdentifier(foreignKey.parent_columns[index])}`
  ).join(' AND ');
  const parentTenantColumn = parentIsCompanies ? 'id' : 'company_id';
  return {
    sql: `SELECT COUNT(*)::text AS cross_tenant_rows
      FROM ${quoteIdentifier(sourceSchema)}.${quoteIdentifier(foreignKey.table_name)} AS child
      JOIN ${quoteIdentifier(sourceSchema)}.${quoteIdentifier(foreignKey.foreign_table_name)} AS parent
        ON ${join}
      WHERE child.company_id = $1
        AND parent.${quoteIdentifier(parentTenantColumn)} <> $1`,
  };
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
        `SELECT table_name, column_name, data_type, is_nullable
         FROM information_schema.columns WHERE table_schema = $1`,
        [sourceSchema]
      ),
      pool.query(
        `SELECT
           child_ns.nspname AS child_schema,
           child.relname AS table_name,
           parent_ns.nspname AS foreign_schema,
           parent.relname AS foreign_table_name,
           c.conname AS constraint_name,
           c.convalidated AS is_validated,
           c.condeferrable AS is_deferrable,
           c.confmatchtype AS match_type,
           array_agg(child_attr.attname ORDER BY key_columns.ordinality) AS child_columns,
           array_agg(parent_attr.attname ORDER BY key_columns.ordinality) AS parent_columns
         FROM pg_constraint c
         JOIN pg_class child ON child.oid = c.conrelid
         JOIN pg_namespace child_ns ON child_ns.oid = child.relnamespace
         JOIN pg_class parent ON parent.oid = c.confrelid
         JOIN pg_namespace parent_ns ON parent_ns.oid = parent.relnamespace
         JOIN LATERAL unnest(c.conkey, c.confkey) WITH ORDINALITY
           AS key_columns(child_attnum, parent_attnum, ordinality) ON TRUE
         JOIN pg_attribute child_attr
           ON child_attr.attrelid = child.oid AND child_attr.attnum = key_columns.child_attnum
         JOIN pg_attribute parent_attr
           ON parent_attr.attrelid = parent.oid AND parent_attr.attnum = key_columns.parent_attnum
         WHERE c.contype = 'f'
           AND (child_ns.nspname = $1 OR parent_ns.nspname = $1)
         GROUP BY child_ns.nspname, child.relname, parent_ns.nspname, parent.relname, c.conname,
           c.convalidated, c.condeferrable, c.confmatchtype
         ORDER BY child_ns.nspname, child.relname, c.conname`,
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
      sourceSchema,
    });

    const directCounts = {};
    const dependentCounts = {};
    const crossTenantReferences = [];
    for (const table of tables) {
      if (classification[table].scope !== 'direct') continue;
      const count = table === 'companies'
        ? await pool.query(
            `SELECT COUNT(*)::text AS count, '0'::text AS unowned_rows FROM ${quoteIdentifier(sourceSchema)}.companies WHERE id = $1`,
            [companyId]
          )
        : await pool.query(
            `SELECT COUNT(*) FILTER (WHERE company_id = $1)::text AS count,
                    COUNT(*) FILTER (WHERE company_id IS NULL)::text AS unowned_rows
             FROM ${quoteIdentifier(sourceSchema)}.${quoteIdentifier(table)}`,
            [companyId]
          );
      directCounts[table] = { tenantRows: Number(count.rows[0].count), unownedRows: Number(count.rows[0].unowned_rows || 0) };
    }

    for (const table of tables) {
      if (classification[table].scope !== 'dependent') continue;
      const relations = classification[table].relations;
      if (relations.some((relation) => !relation.validated)) continue;
      const rootTable = classification[table].via[classification[table].via.length - 1];
      const inventoryQuery = buildDependentInventoryQuery({ sourceSchema, table, relations, rootTable });
      const count = await pool.query(inventoryQuery.sql, [companyId]);
      dependentCounts[table] = {
        tenantRows: Number(count.rows[0].tenant_owned_rows),
        orphanRows: Number(count.rows[0].orphan_rows),
        nullableReferenceRows: Number(count.rows[0].nullable_reference_rows),
      };
    }

    const directTableNames = new Set(Object.entries(classification).filter(([, item]) => item.scope === 'direct').map(([name]) => name));
    const columnNamesByTable = new Map();
    for (const column of columnResult.rows) {
      if (!columnNamesByTable.has(column.table_name)) columnNamesByTable.set(column.table_name, new Set());
      columnNamesByTable.get(column.table_name).add(column.column_name);
    }
    for (const fk of fkResult.rows) {
      if (fk.child_schema !== sourceSchema || fk.foreign_schema !== sourceSchema) continue;
      if (!directTableNames.has(fk.table_name) || !directTableNames.has(fk.foreign_table_name)) continue;
      if (!columnNamesByTable.get(fk.table_name)?.has('company_id')) continue;
      const parentIsCompanies = fk.foreign_table_name === 'companies';
      if (!parentIsCompanies && !columnNamesByTable.get(fk.foreign_table_name)?.has('company_id')) continue;
      if (!fk.is_validated) continue;
      const query = buildCrossTenantReferenceQuery({ sourceSchema, foreignKey: fk, parentIsCompanies });
      const result = await pool.query(query.sql, [companyId]);
      const count = Number(result.rows[0].cross_tenant_rows);
      if (count > 0) crossTenantReferences.push({
        table: fk.table_name,
        referencesTable: fk.foreign_table_name,
        constraint: fk.constraint_name,
        rows: count,
      });
    }

    const summary = {
      totalTables: tables.length,
      directlyScoped: Object.values(classification).filter((item) => item.scope === 'direct').length,
      dependentTables: Object.values(classification).filter((item) => item.scope === 'dependent').length,
      unclassifiedTables: Object.values(classification).filter((item) => item.scope === 'unclassified').length,
      ambiguousTables: Object.values(classification).filter((item) => item.scope === 'ambiguous').length,
      crossSchemaForeignKeyCount: fkResult.rows.filter((fk) => fk.child_schema !== sourceSchema || fk.foreign_schema !== sourceSchema).length,
      crossTenantReferenceCount: crossTenantReferences.reduce((total, item) => total + item.rows, 0),
      destinationSchemaExists: existingSchemas.has(destinationSchema),
    };
    const blockers = [];
    if (!summary.directlyScoped) blockers.push('No company_id-owned tables were discovered; tenant ownership cannot be proven.');
    if (summary.unclassifiedTables) blockers.push('Some tables have no proven tenant ownership path and require explicit classification.');
    if (summary.ambiguousTables) blockers.push('Some tables have multiple foreign-key ownership paths; explicit reviewed ownership rules are required.');
    if (summary.dependentTables) blockers.push('Dependent tables were discovered; migration copy remains disabled until cross-tenant reference validation and per-table verification are implemented.');
    if (Object.values(dependentCounts).some((item) => item.orphanRows > 0)) blockers.push('Dependent tables contain orphaned or unowned foreign-key records that cannot be assigned to a tenant safely.');
    if (Object.values(directCounts).some((item) => item.unownedRows > 0)) blockers.push('Directly scoped tables contain rows with NULL company_id; these records require manual ownership classification.');
    if (Object.values(dependentCounts).some((item) => item.nullableReferenceRows > 0)) blockers.push('Dependent tables contain nullable ownership references; rows without a complete ownership path require manual classification.');
    if (fkResult.rows.some((fk) => !fk.is_validated)) blockers.push('One or more foreign-key constraints are NOT VALID and must be validated before migration.');
    if (summary.crossSchemaForeignKeyCount) blockers.push('Foreign-key relationships cross the source schema boundary; external dependencies must be reviewed before migration.');
    if (summary.crossTenantReferenceCount) blockers.push('Tenant-owned rows reference records owned by another tenant; repair and review are required before migration.');
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
        ownershipRelations: classification[name].relations,
        sourceRows: directCounts[name]?.tenantRows ?? dependentCounts[name]?.tenantRows ?? null,
        unownedRows: directCounts[name]?.unownedRows ?? null,
        orphanRows: dependentCounts[name]?.orphanRows ?? null,
        nullableReferenceRows: dependentCounts[name]?.nullableReferenceRows ?? null,
      })),
      foreignKeyCount: fkResult.rows.length,
      crossSchemaForeignKeyCount: fkResult.rows.filter((fk) => fk.child_schema !== sourceSchema || fk.foreign_schema !== sourceSchema).length,
      crossTenantReferences,
      foreignKeys: fkResult.rows.map((fk) => ({
        schema: fk.child_schema,
        table: fk.table_name,
        referencesSchema: fk.foreign_schema,
        referencesTable: fk.foreign_table_name,
        constraint: fk.constraint_name,
        childColumns: fk.child_columns,
        parentColumns: fk.parent_columns,
        validated: fk.is_validated,
        deferrable: fk.is_deferrable,
        matchType: fk.match_type,
      })),
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await pool.end();
  }
}

module.exports = { classifyTenantTables, buildDependentInventoryQuery, buildCrossTenantReferenceQuery, inspectTenantMigration };
