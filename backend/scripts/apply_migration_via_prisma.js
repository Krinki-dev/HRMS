const fs = require('fs');
const path = require('path');
// Load env from backend/.env and prefer CENTRAL_DIRECT_URL for migrations
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (process.env.CENTRAL_DIRECT_URL) process.env.CENTRAL_DATABASE_URL = process.env.CENTRAL_DIRECT_URL;
const { centralPrisma } = require('../shared/utils/centralPrisma');

async function run() {
  try {
    const file = path.join(__dirname, '..', 'db-migrations', '20260606_rls_and_function_fix.sql');
    const sql = fs.readFileSync(file, 'utf8');
    console.log('Applying migration via centralPrisma...');
    // Split SQL into statements while respecting dollar-quoted function bodies.
    const statements = splitSqlStatements(sql);
    for (let idx = 0; idx < statements.length; idx++) {
      const stmt = statements[idx];
      const s = stmt.trim();
      if (!s) continue;
      console.log(`Executing statement ${idx + 1}/${statements.length} (len=${s.length}) preview: ${s.slice(0,200).replace(/\n/g,' ')}...`);
      try {
        await centralPrisma.$executeRawUnsafe(s);
      } catch (e) {
        console.error(`Failed on statement ${idx + 1}:`, s.slice(0,1000));
        throw e;
      }
    }
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(2);
  } finally {
    try { await centralPrisma.$disconnect(); } catch {};
  }
}

run();

function splitSqlStatements(input) {
  const out = [];
  let i = 0;
  let cur = '';
  let dollarTag = null;
  let inSingle = false;
  let inDouble = false;

  while (i < input.length) {
    const ch = input[i];

    // Handle entering/exiting dollar-quote
    if (!inSingle && !inDouble && ch === '$') {
      // read tag
      const m = input.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (m) {
        const tag = m[0];
        if (!dollarTag) {
          // enter dollar quoted
          dollarTag = tag;
          cur += tag;
          i += tag.length;
          continue;
        } else if (dollarTag === tag) {
          // exit dollar quoted
          cur += tag;
          i += tag.length;
          dollarTag = null;
          continue;
        }
      }
    }

    if (!dollarTag) {
      if (ch === "'") {
        inSingle = !inSingle;
      } else if (ch === '"') {
        inDouble = !inDouble;
      }
    }

    if (!dollarTag && !inSingle && !inDouble && ch === ';') {
      out.push(cur + ';');
      cur = '';
      i++;
      continue;
    }

    cur += ch;
    i++;
  }

  if (cur.trim()) out.push(cur);
  return out;
}
