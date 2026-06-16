const { PrismaClient } = require('@prisma/client');
const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DEV_TENANT_DATABASE_URL;

if (!databaseUrl) {
  
  console.error(
    '[Prisma] FATAL: Neither DATABASE_URL nor DEV_TENANT_DATABASE_URL is set in .env.\n' +
    '         Copy .env.example → .env and fill in the database URLs.'
  );
  
  if (process.env.NODE_ENV === 'test') {
    module.exports = { prisma: null };
    return;
  }
}
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__hrms_prisma ?? new PrismaClient({
  datasources: databaseUrl
    ? { db: { url: databaseUrl } }
    : undefined, 
  log: process.env.NODE_ENV === 'development'
    ? ['warn', 'error']
    : ['error'],
});
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__hrms_prisma = prisma;
}
module.exports = { prisma };

