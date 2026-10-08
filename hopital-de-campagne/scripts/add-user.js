'use strict';
// Usage : npm run user:add -- <identifiant> "<Nom complet>" <admin|medecin|soignant>
// Le mot de passe (12 caractères minimum) est demandé en saisie masquée, ou lu dans NEW_PASSWORD.
const readline = require('readline');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const R = require('../src/rules');

function demander(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = s => { if (rl.masque && s !== question) rl.output.write('*'); else rl.output.write(s); };
    rl.masque = false;
    rl.question(question, rep => { rl.close(); process.stdout.write('\n'); resolve(rep); });
    rl.masque = true;
  });
}

(async () => {
  const [identifiant, nom, role] = process.argv.slice(2);
  if (!identifiant || !nom || !['admin', 'medecin', 'soignant'].includes(role)) {
    console.error('Usage : npm run user:add -- <identifiant> "<Nom complet>" <admin|medecin|soignant>');
    process.exit(1);
  }
  const mdp = process.env.NEW_PASSWORD || await demander('Mot de passe (12 caractères minimum) : ');
  if (mdp.length < 12) { console.error('Mot de passe trop court.'); process.exit(1); }
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });
  try {
    await c.query('INSERT INTO utilisateurs (identifiant, nom, role, mot_de_passe_hash, cree_le) VALUES (?,?,?,?,?)',
      [identifiant, nom, role, await bcrypt.hash(mdp, 12), R.maintenant()]);
    console.log('Utilisateur « ' + identifiant + ' » créé (' + role + ').');
  } catch (e) {
    console.error(e.code === 'ER_DUP_ENTRY' ? 'Cet identifiant existe déjà.' : 'Échec : ' + e.message);
    process.exitCode = 1;
  }
  await c.end();
})();
