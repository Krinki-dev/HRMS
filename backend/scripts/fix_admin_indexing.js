/**
 * Fix Script: Index platform admins in central_user_index
 * This ensures is_platform_admin users are accessible for auth checks
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const centralPrisma = new PrismaClient({
  datasources: { db: { url: process.env.CENTRAL_DATABASE_URL } }
});

async function fixAdminIndexing() {
  try {
    console.log('🔧 Fixing admin user indexing...\n');

    // Find all platform admin users from environment or hardcoded list
    const KNOWN_ADMINS = [
      'hello@syntern.in',  // Primary platform owner
      // Add more admin emails here if there are multiple admins
    ];

    // Get the Syntern tenant
    const synternTenant = await centralPrisma.$queryRaw`
      SELECT id, subdomain FROM tenants WHERE subdomain = 'hrms' LIMIT 1
    `;

    if (!synternTenant || synternTenant.length === 0) {
      console.error('❌ Syntern tenant not found!');
      process.exit(1);
    }

    const tenantId = synternTenant[0].id;
    const subdomain = synternTenant[0].subdomain;

    console.log(`✅ Found Syntern tenant: ${subdomain}\n`);

    let updated = 0;
    let skipped = 0;

    for (const email of KNOWN_ADMINS) {
      const normalizedEmail = email.toLowerCase().trim();

      try {
        // Check if exists
        const existing = await centralPrisma.$queryRaw`
          SELECT id, is_platform_admin FROM central_user_index
          WHERE email = ${normalizedEmail} AND company_id = ${tenantId}::uuid
          LIMIT 1
        `;

        if (existing.length > 0) {
          if (existing[0].is_platform_admin) {
            console.log(`✓ Already admin: ${normalizedEmail}`);
            skipped++;
          } else {
            // Update to admin
            await centralPrisma.$executeRaw`
              UPDATE central_user_index
              SET is_platform_admin = true
              WHERE id = ${existing[0].id}::uuid
            `;
            console.log(`✅ Updated to admin: ${normalizedEmail}`);
            updated++;
          }
        } else {
          // Insert as admin
          await centralPrisma.$executeRaw`
            INSERT INTO central_user_index
              (id, email, subdomain, company_id, is_platform_admin, is_active, created_at)
            VALUES
              (${uuidv4()}::uuid, ${normalizedEmail}, ${subdomain}, 
               ${tenantId}::uuid, true, true, NOW())
            ON CONFLICT DO NOTHING
          `;
          console.log(`✨ Created admin index: ${normalizedEmail}`);
          updated++;
        }
      } catch (err) {
        console.error(`❌ Error for ${normalizedEmail}:`, err.message);
      }
    }

    console.log(`\n📈 Results:`);
    console.log(`   ✅ Updated/Created: ${updated}`);
    console.log(`   ✓ Already indexed: ${skipped}`);

    if (updated > 0) {
      console.log(`\n✨ Admin access should now work!`);
    }

  } catch (err) {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  } finally {
    await centralPrisma.$disconnect();
  }
}

fixAdminIndexing().then(() => {
  console.log('\n✅ Done.\n');
  process.exit(0);
});
