'use strict';
// Charge des patients fictifs et trois comptes de démonstration. Refuse de s'exécuter si la base contient déjà des patients.
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const R = require('../src/rules');
const { buildSeed } = require('./demo-data');

const num = k => parseInt(String(k).slice(1), 10);
const dt = s => (s ? R.sqlDT(s) : null);

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });
  const [[{ n }]] = await c.query('SELECT COUNT(*) AS n FROM patients');
  if (n > 0) { console.error('La base contient déjà des patients : abandon.'); process.exit(1); }
  const jour = R.maintenant().slice(0, 10);
  const sd = buildSeed(jour);
  const comptes = [['admin.demo', 'Administrateur (démo)', 'admin'], ['dr.lambert', 'Dr Lambert (démo)', 'medecin'], ['inf.roux', 'Inf. Roux (démo)', 'soignant']];
  const sortie = [];
  await c.beginTransaction();
  try {
    for (const [login, nom, role] of comptes) {
      const [ex] = await c.query('SELECT id FROM utilisateurs WHERE identifiant = ?', [login]);
      if (ex.length) continue;
      const mdp = crypto.randomBytes(12).toString('base64url');
      await c.query('INSERT INTO utilisateurs (identifiant, nom, role, mot_de_passe_hash, cree_le) VALUES (?,?,?,?,?)',
        [login, nom, role, await bcrypt.hash(mdp, 12), R.maintenant()]);
      sortie.push([login, role, mdp]);
    }
    for (const [key, p] of Object.entries(sd.patients)) {
      const id = num(key);
      await c.query('INSERT INTO patients (id, numero, nom, prenom, naissance, sexe, groupe_sanguin, allergies, antecedents, triage, motif, provenance, statut, lit, arrive_le, admis_le, sortie_le, destination) VALUES (?)',
        [[id, p.numero, p.nom, p.prenom, p.naissance, p.sexe, p.groupe || 'Inconnu', p.allergies || '', p.antecedents || '', p.triage, p.motif, p.provenance || '',
          p.statut, p.lit || null, dt(p.arriveLe), dt(p.admisLe), dt(p.sortieLe), p.destination || null]]);
      for (const x of p.notes || [])
        await c.query('INSERT INTO notes (patient_id, cree_le, auteur_id, auteur_nom, type, texte) VALUES (?)', [[id, dt(x.ts), null, x.auteur, x.type, x.texte]]);
      for (const x of p.constantes || []) {
        const ta = x.ta ? x.ta.split('/').map(Number) : [null, null];
        await c.query('INSERT INTO constantes (patient_id, releve_le, fc, ta_sys, ta_dia, spo2, temperature, fr, auteur_id, auteur_nom) VALUES (?)',
          [[id, dt(x.ts), x.fc, ta[0], ta[1], x.spo2, x.temp, x.fr, null, 'Équipe (démo)']]);
      }
      for (const x of p.traitements || [])
        await c.query('INSERT INTO traitements (patient_id, nom, dose, voie, frequence, actif, debut, arrete_le, prescripteur_id, prescripteur_nom) VALUES (?)',
          [[id, x.nom, x.dose, x.voie, x.freq, x.actif ? 1 : 0, dt(x.debut), x.actif ? null : dt(x.debut), null, 'Dr (démo)']]);
    }
    for (const [key, s] of Object.entries(sd.surgeries))
      await c.query('INSERT INTO interventions (id, patient_id, salle, debut, duree_min, acte, chirurgien, anesthesie, urgence, statut, notes, cree_par) VALUES (?)',
        [[num(key), num(s.patientId), s.bloc, dt(s.debut), s.duree, s.acte, s.chirurgien, s.anesthesie, s.urgence ? 1 : 0, s.statut, s.notes || null, null]]);
    await c.commit();
  } catch (e) { await c.rollback(); console.error('Échec, rien n\'a été enregistré :', e.message); process.exit(1); }
  console.log('Données de démonstration chargées (' + Object.keys(sd.patients).length + ' patients, ' + Object.keys(sd.surgeries).length + ' interventions).');
  if (sortie.length) {
    console.log('\nComptes créés. Notez ces mots de passe, ils ne seront plus affichés :');
    sortie.forEach(([l, r, m]) => console.log('  ' + l.padEnd(12) + r.padEnd(10) + m));
  }
  await c.end();
})();
