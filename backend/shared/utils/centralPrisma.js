const { PrismaClient } = require('../generated/central-client');

const centralPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.CENTRAL_DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

process.on('beforeExit', async () => {
  await centralPrisma.$disconnect();
});

module.exports = { centralPrisma };