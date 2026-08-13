const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (process.env.CENTRAL_DIRECT_URL && !process.env.CI) {
  process.env.CENTRAL_DATABASE_URL = process.env.CENTRAL_DIRECT_URL;
}

const { centralPrisma } = require('../shared/utils/centralPrisma');

async function run() {
  const file = path.join(__dirname, '..', 'db-migrations', '20260813_gst_canonical_columns_and_backup_config.sql');
  const sql = fs.readFileSync(file, 'utf8');
  const statements = splitSqlStatements(sql).map(statement => statement.trim()).filter(Boolean);

  console.log(`[Migration] Applying canonical schema migration (${statements.length} statements)`);
  for (const statement of statements) {
    await centralPrisma.$executeRawUnsafe(statement);
  }
  console.log('[Migration] Canonical schema migration applied');
}

run()
  .catch((error) => {
    console.error('[Migration] Canonical schema migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await centralPrisma.$disconnect();
  });

function splitSqlStatements(input) {
  const statements = [];
  let current = '';
  let dollarTag = null;
  let inSingle = false;
  let inDouble = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (!inSingle && !inDouble && character === '$') {
      const match = input.slice(index).match(/^\$[A-Za-z0-9_]*\$/);
      if (match) {
        const tag = match[0];
        if (!dollarTag) dollarTag = tag;
        else if (dollarTag === tag) dollarTag = null;
        current += tag;
        index += tag.length - 1;
        continue;
      }
    }

    if (!dollarTag) {
      if (character === "'" && input[index - 1] !== '\\') inSingle = !inSingle;
      if (character === '"' && input[index - 1] !== '\\') inDouble = !inDouble;
    }

    current += character;
    if (!dollarTag && !inSingle && !inDouble && character === ';') {
      statements.push(current);
      current = '';
    }
  }

  if (current.trim()) statements.push(current);
  return statements;
}
