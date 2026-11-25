'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const { inspectTenantMigration } = require('../modules/platform/tenantMigrationInventory');

const databaseUrl = process.env.TENANT_MIGRATION_TEST_DATABASE_URL;

function quoteIdentifier(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

test('inspects real PostgreSQL FK ownership, cross-tenant links and orphan rows', {
  skip: !databaseUrl && 'TENANT_MIGRATION_TEST_DATABASE_URL is not configured',
}, async () => {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 10);
  const sourceSchema = `src_${suffix}`;
  const sharedSchema = `shared_${suffix}`;
  const destinationSchema = `tenant_${randomUUID().replace(/-/g, '')}`;
  const tenantId = randomUUID();
  const companyId = randomUUID();
  const otherCompanyId = randomUUID();
  const employeeId = randomUUID();
  const otherEmployeeId = randomUUID();
  const attendanceOne = randomUUID();
  const attendanceTwo = randomUUID();
  const nullableAttendance = randomUUID();
  const noteId = randomUUID();
  const setupPool = new Pool({ connectionString: databaseUrl });

  try {
    await setupPool.query(`CREATE SCHEMA ${quoteIdentifier(sourceSchema)}`);
    await setupPool.query(`CREATE SCHEMA ${quoteIdentifier(sharedSchema)}`);
    await setupPool.query(`
      CREATE TABLE ${quoteIdentifier(sourceSchema)}.companies (
        id UUID PRIMARY KEY, gstin TEXT, pan TEXT
      );
      CREATE TABLE ${quoteIdentifier(sourceSchema)}.employees (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES ${quoteIdentifier(sourceSchema)}.companies(id)
      );
      CREATE TABLE ${quoteIdentifier(sourceSchema)}.attendance (
        id UUID PRIMARY KEY,
        employee_id UUID REFERENCES ${quoteIdentifier(sourceSchema)}.employees(id)
      );
      CREATE TABLE ${quoteIdentifier(sourceSchema)}.employee_notes (
        id UUID PRIMARY KEY,
        company_id UUID NOT NULL,
        employee_id UUID NOT NULL REFERENCES ${quoteIdentifier(sourceSchema)}.employees(id)
      );
      CREATE TABLE ${quoteIdentifier(sourceSchema)}.lookup_values (
        id UUID PRIMARY KEY, code TEXT NOT NULL
      );
      CREATE TABLE ${quoteIdentifier(sharedSchema)}.global_codes (
        id UUID PRIMARY KEY
      );
      CREATE TABLE ${quoteIdentifier(sourceSchema)}.audit_outbox (
        id UUID PRIMARY KEY,
        code_id UUID REFERENCES ${quoteIdentifier(sharedSchema)}.global_codes(id)
      );
      CREATE TABLE ${quoteIdentifier(sourceSchema)}.unvalidated_refs (
        id UUID PRIMARY KEY,
        employee_id UUID
      );
      ALTER TABLE ${quoteIdentifier(sourceSchema)}.unvalidated_refs
        ADD CONSTRAINT unvalidated_employee_fk
        FOREIGN KEY (employee_id)
        REFERENCES ${quoteIdentifier(sourceSchema)}.employees(id)
        NOT VALID;
    `);

    await setupPool.query(
      `INSERT INTO ${quoteIdentifier(sourceSchema)}.companies (id, gstin, pan)
       VALUES ($1, '29ABCDE1234F1Z5', 'ABCDE1234F'), ($2, '27ABCDE1234F1Z5', 'FGHIJ5678K')`,
      [companyId, otherCompanyId]
    );
    await setupPool.query(
      `INSERT INTO ${quoteIdentifier(sourceSchema)}.employees (id, company_id)
       VALUES ($1, $2), ($3, $4)`,
      [employeeId, companyId, otherEmployeeId, otherCompanyId]
    );
    await setupPool.query(
      `INSERT INTO ${quoteIdentifier(sourceSchema)}.attendance (id, employee_id)
       VALUES ($1, $2), ($3, $4), ($5, NULL)`,
      [attendanceOne, employeeId, attendanceTwo, employeeId, nullableAttendance]
    );
    await setupPool.query(
      `INSERT INTO ${quoteIdentifier(sourceSchema)}.employee_notes (id, company_id, employee_id)
       VALUES ($1, $2, $3)`,
      [noteId, companyId, otherEmployeeId]
    );

    const result = await inspectTenantMigration({
      databaseUrl,
      tenantId,
      gstin: '29ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      sourceSchema,
      destinationSchema,
    });

    assert.equal(result.copyAllowed, false);
    assert.equal(result.inventoryOnly, true);
    assert.equal(result.summary.destinationSchemaExists, false);
    assert.equal(result.summary.crossSchemaForeignKeyCount, 1);
    assert.equal(result.summary.crossTenantReferenceCount, 1);
    assert.ok(result.blockers.some((item) => item.includes('NOT VALID')));
    assert.ok(result.blockers.some((item) => item.includes('cross the source schema boundary')));
    assert.ok(result.blockers.some((item) => item.includes('another tenant')));

    const attendance = result.tables.find((item) => item.name === 'attendance');
    assert.equal(attendance.scope, 'dependent');
    assert.equal(attendance.sourceRows, 2);
    assert.equal(attendance.orphanRows, 1);
    assert.equal(attendance.nullableReferenceRows, 1);

    const employeeNotes = result.tables.find((item) => item.name === 'employee_notes');
    assert.equal(employeeNotes.scope, 'direct');
    assert.equal(employeeNotes.sourceRows, 1);
    assert.equal(employeeNotes.unownedRows, 0);

    assert.equal(result.tables.find((item) => item.name === 'lookup_values').scope, 'unclassified');
    assert.ok(result.foreignKeys.some((fk) => fk.constraint === 'unvalidated_employee_fk' && !fk.validated));
    assert.ok(result.crossTenantReferences.some((item) => item.constraint === 'employee_notes_employee_id_fkey' && item.rows === 1));
  } finally {
    await setupPool.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(sourceSchema)} CASCADE`);
    await setupPool.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(sharedSchema)} CASCADE`);
    await setupPool.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(destinationSchema)} CASCADE`);
    await setupPool.end();
  }
});
