// config/db.js
const { MongoClient } = require('mongodb');
require('dotenv').config({ quiet: true });

let db;

async function connectDB(uri) {
  if (db) return db;

  const client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.DB_USER); // ⚠️ এখানে DB_USER না, আসল Database নাম দাও
  console.log('✅ MongoDB connected...');
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not connected!');
  return db;
}

module.exports = { connectDB, getDb };
