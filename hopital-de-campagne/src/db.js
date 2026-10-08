'use strict';
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'hopital',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hopital',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,      // DATETIME renvoyés tels quels ('YYYY-MM-DD HH:MM:SS'), sans conversion de fuseau
  decimalNumbers: true    // DECIMAL renvoyés en nombres
});

// Exécute fn dans une transaction ; annule tout si une erreur est levée.
async function tx(fn) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const r = await fn(c);
    await c.commit();
    return r;
  } catch (e) {
    try { await c.rollback(); } catch (_) { /* connexion déjà perdue */ }
    throw e;
  } finally {
    c.release();
  }
}

module.exports = { pool, tx };
