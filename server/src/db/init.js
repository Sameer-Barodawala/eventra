const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  console.log('🔄 Initializing database schema...');
  try {
    const dbName = process.env.DB_NAME || 'eventra_db';

    // If using individual parameters locally, check and create database first
    if (!process.env.DATABASE_URL) {
      const tempConn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await tempConn.end();
      console.log(`✅ Database "${dbName}" checked/created.`);
    }

    // Now connect with pool to apply schema
    const db = require('../config/db');
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
