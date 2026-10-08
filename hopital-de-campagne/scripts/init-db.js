'use strict';
// Crée les tables (idempotent) et, si la base n'a encore aucun utilisateur et que ADMIN_PASSWORD est défini, le premier administrateur.
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const R = require('../src/rules');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    multipleStatements: true
  });
  await c.query(fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8'));
  console.log('Schéma créé ou déjà à jour.');
  const [[{ n }]] = await c.query('SELECT COUNT(*) AS n FROM utilisateurs');
  if (n === 0) {
    const mdp = process.env.ADMIN_PASSWORD;
    if (mdp && mdp.length >= 12) {
      const login = process.env.ADMIN_LOGIN || 'admin';
      await c.query('INSERT INTO utilisateurs (identifiant, nom, role, mot_de_passe_hash, cree_le) VALUES (?,?,?,?,?)',
        [login, 'Administrateur', 'admin', await bcrypt.hash(mdp, 12), R.maintenant()]);
      console.log('Administrateur « ' + login + ' » créé.');
    } else {
      console.log('Aucun utilisateur. Créez le premier administrateur :');
      console.log('  npm run user:add -- admin "Votre nom" admin');
    }
  }
  await c.end();
})().catch(e => { console.error('Échec :', e.message); process.exit(1); });
