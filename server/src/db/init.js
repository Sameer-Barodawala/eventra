const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function initDB() {
  console.log('🔄 Initializing database schema...');
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await db.query(stmt);
    }

    console.log('✅ Tables created successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
  } finally {
    process.exit(0);
  }
}

initDB();
