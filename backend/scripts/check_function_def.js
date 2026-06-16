const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (process.env.CENTRAL_DIRECT_URL) process.env.CENTRAL_DATABASE_URL = process.env.CENTRAL_DIRECT_URL;
const { centralPrisma } = require('../shared/utils/centralPrisma');

(async () => {
  try {
    const res = await centralPrisma.$queryRawUnsafe(`
      SELECT p.proname, pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
    `);
    console.log(res);
  } catch (e) {
    console.error('Query failed:', e.message);
  } finally {
    await centralPrisma.$disconnect();
  }
})();
