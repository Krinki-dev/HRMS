const logger = require('./logger');

function appendSchemaToUrl(dbUrl, schema) {
  if (!dbUrl) throw new Error('Database URL is required');
  if (!schema) throw new Error('Schema name is required');
  const url = new URL(dbUrl);
  url.searchParams.set('schema', schema);
  return url.toString();
}

// Clone sourceSchema into targetSchema (within the same database)
async function cloneSchema(dbUrl, sourceSchema, targetSchema) {
  const { PrismaClient } = require('@prisma/client');
  // A temporary client for the template schema – we'll use it to get table definitions
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: ['error'],
  });

  try {
    // Set search_path to source schema to inspect it
    await prisma.$executeRawUnsafe(`SET search_path TO "${sourceSchema}"`);

    // Get all physical tables and views in the source schema
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname = ${sourceSchema}
    `;

    // Create the target schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${targetSchema}"`);
    logger.info(`Creating schema "${targetSchema}"...`);

    // For each table, create a copy in target schema with the same structure
    for (const { tablename } of tables) {
      logger.debug(`Cloning table structure: ${tablename}`);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${targetSchema}"."${tablename}"
        (LIKE "${sourceSchema}"."${tablename}" INCLUDING ALL)
      `);
    }

    // Copy sequences (they are not included by LIKE)
    const sequences = await prisma.$queryRaw`
      SELECT sequence_name FROM information_schema.sequences
      WHERE sequence_schema = ${sourceSchema}
    `;
    for (const { sequence_name } of sequences) {
      await prisma.$executeRawUnsafe(`
        CREATE SEQUENCE IF NOT EXISTS "${targetSchema}"."${sequence_name}"
        START WITH 1
      `);
    }

    logger.info(`Schema "${targetSchema}" successfully cloned from "${sourceSchema}"`);
  } catch (err) {
    logger.error(`Failed to clone schema from ${sourceSchema} to ${targetSchema}:`, err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { appendSchemaToUrl, cloneSchema };
