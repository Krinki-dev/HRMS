/**
 * migrate-pii-encryption.js
 * Phase-0: One-time migration script to encrypt existing plain-text PII fields.
 *
 * Run ONCE after deploying Phase-0 to encrypt any unencrypted PII already in the DB.
 * Safe to run multiple times — encryptPII() is idempotent (skips already-encrypted values).
 *
 * Usage:
 *   cd backend
 *   ENCRYPTION_KEY=<your_key> node scripts/migrate-pii-encryption.js
 *
 * Fields encrypted:
 *   employees.aadhaar_number
 *   employees.pan_number
 *   employees.bank_account_number
 *
 * After running: verify a few rows in the DB look like "ENC:..."
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { encryptPII } = require('../shared/utils/piiEncryption');
const { centralPrisma } = require('../shared/utils/centralPrisma');

async function migrateTenant(tenantUrl, tenantId) {
  const db = new PrismaClient({ datasources: { db: { url: tenantUrl } } });
  try {
    // Fetch all employees with any PII field that may be unencrypted
    const employees = await db.$queryRaw`
      SELECT id, aadhaar_number, pan_number, bank_account_number
      FROM employees
      WHERE aadhaar_number IS NOT NULL
         OR pan_number IS NOT NULL
         OR bank_account_number IS NOT NULL
    `;

    let updated = 0;
    for (const emp of employees) {
      const data = {};
      if (emp.aadhaar_number && !emp.aadhaar_number.startsWith('ENC:')) {
        data.aadhaar_number = encryptPII(emp.aadhaar_number);
      }
      if (emp.pan_number && !emp.pan_number.startsWith('ENC:')) {
        data.pan_number = encryptPII(emp.pan_number);
      }
      if (emp.bank_account_number && !emp.bank_account_number.startsWith('ENC:')) {
        data.bank_account_number = encryptPII(emp.bank_account_number);
      }
      if (Object.keys(data).length > 0) {
        await db.employees.update({ where: { id: emp.id }, data });
        updated++;
      }
    }
    console.log(`[Tenant ${tenantId}] Encrypted ${updated}/${employees.length} employee PII records.`);
  } finally {
    await db.$disconnect();
  }
}

async function run() {
  console.log('[PII Migration] Starting...');

  // Get all active tenants from central DB
  const tenants = await centralPrisma.$queryRaw`
    SELECT id, subdomain, db_mode, db_url, schema_name,
           local_db_host, local_db_port, local_db_name, local_db_user, local_db_pass
    FROM tenants
    WHERE is_active = true AND deleted_at IS NULL
  `;

  console.log(`[PII Migration] Found ${tenants.length} active tenants.`);

  for (const tenant of tenants) {
    try {
      let dbUrl = tenant.db_url;
      if (!dbUrl && tenant.db_mode === 'local') {
        dbUrl = `postgresql://${tenant.local_db_user}:${tenant.local_db_pass}@${tenant.local_db_host}:${tenant.local_db_port}/${tenant.local_db_name}`;
      }
      if (!dbUrl) {
        console.warn(`[Tenant ${tenant.id}] No DB URL — skipping.`);
        continue;
      }
      await migrateTenant(dbUrl, tenant.id);
    } catch (err) {
      console.error(`[Tenant ${tenant.id}] Migration failed:`, err.message);
    }
  }

  await centralPrisma.$disconnect();
  console.log('[PII Migration] Complete.');
}

run().catch(err => {
  console.error('[PII Migration] Fatal error:', err);
  process.exit(1);
});
