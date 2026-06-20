/**
 * Migration Script: Populate central_user_index with existing users
 * Scans all tenant databases and indexes users for fast email-based lookup
 * 
 * Run once on production to fix "Company not found" login errors
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const centralPrisma = new PrismaClient({
  datasources: { db: { url: process.env.CENTRAL_DATABASE_URL } }
});

async function getAllTenants() {
  const tenants = await centralPrisma.$queryRaw`
    SELECT id, subdomain, name, admin_email, db_mode, db_url, schema_name, local_db_type, postgres_user, postgres_password
    FROM tenants
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `;
  return tenants;
}

async function getTenantDb(tenant) {
  if (tenant.db_mode === 'external_postgres') {
    // External PostgreSQL
    const dbUrl = tenant.db_url;
    const db = new PrismaClient({
      datasources: { db: { url: dbUrl } }
    });
    return db;
  } else if (tenant.db_mode === 'managed_postgres') {
    // Managed PostgreSQL (via schema in central DB or separate RDS instance)
    const db = new PrismaClient({
      datasources: { db: { url: process.env.CENTRAL_DATABASE_URL } }
    });
    return db;
  }
  return null;
}

async function indexUsersFromTenant(tenant, db) {
  try {
    let users = [];

    if (tenant.db_mode === 'managed_postgres' && tenant.schema_name) {
      // Query specific schema
      users = await db.$queryRaw(`
        SELECT DISTINCT email, company_id 
        FROM ${db.$raw(`"${tenant.schema_name}"."users"`)}
        WHERE deleted_at IS NULL AND email IS NOT NULL
      `);
    } else {
      // External DB or default schema
      users = await db.$queryRaw`
        SELECT DISTINCT email, company_id 
        FROM users
        WHERE deleted_at IS NULL AND email IS NOT NULL
      `;
    }

    let indexed = 0;
    let skipped = 0;

    for (const user of users) {
      if (!user.email) continue;

      const normalizedEmail = user.email.toLowerCase().trim();
      const isAdmin = tenant.admin_email && normalizedEmail === tenant.admin_email.toLowerCase().trim();

      try {
        // Check if already exists
        const existing = await centralPrisma.$queryRaw`
          SELECT id FROM central_user_index
          WHERE email = ${normalizedEmail} AND company_id = ${tenant.id}::uuid
          LIMIT 1
        `;

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Insert
        await centralPrisma.$executeRaw`
          INSERT INTO central_user_index
            (id, email, subdomain, company_id, is_platform_admin, is_active, created_at)
          VALUES
            (gen_random_uuid(), ${normalizedEmail}, ${tenant.subdomain}, 
             ${tenant.id}::uuid, ${isAdmin}, true, NOW())
          ON CONFLICT (email, company_id) DO NOTHING
        `;

        indexed++;
      } catch (err) {
        console.warn(`  ⚠️  Could not index ${normalizedEmail}: ${err.message}`);
      }
    }

    return { indexed, skipped, total: users.length };

  } catch (err) {
    console.error(`  ❌ Error scanning ${tenant.subdomain}: ${err.message}`);
    return { indexed: 0, skipped: 0, total: 0, error: true };
  }
}

async function migrateUserIndex() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('  📊 MIGRATING USER INDEX TO CENTRAL_USER_INDEX');
    console.log('='.repeat(70) + '\n');

    const tenants = await getAllTenants();
    console.log(`📋 Found ${tenants.length} tenants to process\n`);

    if (tenants.length === 0) {
      console.log('⚠️  No tenants found!');
      process.exit(1);
    }

    let totalIndexed = 0;
    let totalSkipped = 0;

    for (const tenant of tenants) {
      console.log(`🔄 Processing: ${tenant.subdomain} (${tenant.name})`);
      console.log(`   Mode: ${tenant.db_mode}, Admin: ${tenant.admin_email}`);

      const db = await getTenantDb(tenant);
      if (!db) {
        console.log(`   ❌ Could not connect to tenant DB\n`);
        continue;
      }

      const result = await indexUsersFromTenant(tenant, db);
      
      if (result.error) {
        console.log(`   ❌ FAILED\n`);
      } else {
        console.log(`   ✅ Indexed: ${result.indexed} | Skipped: ${result.skipped} | Total: ${result.total}`);
        totalIndexed += result.indexed;
        totalSkipped += result.skipped;
      }

      try {
        await db.$disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`  📈 MIGRATION COMPLETE`);
    console.log('='.repeat(70));
    console.log(`   ✅ Users indexed: ${totalIndexed}`);
    console.log(`   ✓ Already indexed: ${totalSkipped}`);
    console.log(`   Total: ${totalIndexed + totalSkipped}\n`);

    if (totalIndexed > 0) {
      console.log('✨ Users can now login with email!\n');
    }

  } catch (err) {
    console.error('\n💥 FATAL ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await centralPrisma.$disconnect();
  }
}

migrateUserIndex().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
