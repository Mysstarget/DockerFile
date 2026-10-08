'use strict';
const express = require('express');
const R = require('./rules');
const { pool, tx } = require('./db');
const { audit } = require('./audit');
const A = require('./auth');

const router = express.Router();
const h = fn => (req, res, next) => fn(req, res, next).catch(next);
const { HttpError } = R;

function idParam(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'Identifiant invalide.');
  return n;
}
const minSql = s => +String(s).slice(11, 13) * 60 + +String(s).slice(14, 16);

/* ---------- conversions base -> JSON ---------- */
const patientLeger = r => ({
  numero: r.numero, nom: r.nom, prenom: r.prenom, naissance: r.naissance, sexe: r.sexe, groupe: r.groupe_sanguin,
  allergies: r.allergies, triage: r.triage, motif: r.motif, provenance: r.provenance, statut: r.statut, lit: r.lit || '',
  arriveLe: R.jsDT(r.arrive_le), admisLe: R.jsDT(r.admis_le), sortieLe: R.jsDT(r.sortie_le), destination: r.destination || ''
});
const intervention = r => ({
  patientId: String(r.patient_id), bloc: r.salle, debut: R.jsDT(r.debut), duree: r.duree_min, acte: r.acte,
  chirurgien: r.chirurgien, anesthesie: r.anesthesie, urgence: !!r.urgence, statut: r.statut, notes: r.notes || ''
});
const COLS_PATIENT = 'id, numero, nom, prenom, naissance, sexe, groupe_sanguin, allergies, triage, motif, provenance, statut, lit, arrive_le, admis_le, sortie_le, destination';
const COLS_INTERV = 'id, patient_id, salle, debut, duree_min, acte, chirurgien, anesthesie, urgence, statut, notes';

/* ---------- utilitaires ---------- */
async function patientVerrou(c, id) {
  const [rows] = await c.query('SELECT * FROM patients WHERE id = ? FOR UPDATE', [id]);
  if (!rows.length) throw new HttpError(404, 'Dossier introuvable.');
  return rows[0];
}
async function ajouterNote(c, patientId, user, type, texte) {
  await c.query('INSERT INTO notes (patient_id, cree_le, auteur_id, auteur_nom, type, texte) VALUES (?,?,?,?,?,?)',
    [patientId, R.maintenant(), user.id, user.nom, type, texte]);
}

/* ---------- authentification ---------- */
router.post('/connexion', h(async (req, res) => { res.json(await A.connexion(req, res, audit)); }));
router.post('/deconnexion', h(async (req, res) => { A.deconnexion(res); res.json({ ok: true }); }));

router.use(A.authentifier);
router.get('/moi', (req, res) => res.json(A.profil(req.user)));

/* ---------- lecture ---------- */
// État global léger : patients (sans notes ni constantes) et interventions. Interrogé régulièrement par le navigateur.
router.get('/etat', A.besoin('lire'), h(async (req, res) => {
  const [pats] = await pool.query('SELECT ' + COLS_PATIENT + ' FROM patients ORDER BY id');
  const [ints] = await pool.query('SELECT ' + COLS_INTERV + ' FROM interventions ORDER BY debut, id');
  const patients = {}, surgeries = {};
  pats.forEach(r => { patients[r.id] = patientLeger(r); });
  ints.forEach(r => { surgeries[r.id] = intervention(r); });
  res.json({ patients, surgeries });
}));

// Dossier complet. ?audit=1 enregistre la consultation (à utiliser à l'ouverture, pas pour le rafraîchissement).
router.get('/patients/:id', A.besoin('lire'), h(async (req, res) => {
  const id = idParam(req.params.id);
  const [rows] = await pool.query('SELECT ' + COLS_PATIENT + ', antecedents FROM patients WHERE id = ?', [id]);
  if (!rows.length) throw new HttpError(404, 'Dossier introuvable.');
  const [notes] = await pool.query('SELECT cree_le, auteur_nom, type, texte FROM notes WHERE patient_id = ? ORDER BY cree_le, id', [id]);
  const [cs] = await pool.query('SELECT releve_le, fc, ta_sys, ta_dia, spo2, temperature, fr, auteur_nom FROM constantes WHERE patient_id = ? ORDER BY releve_le, id', [id]);
  const [trs] = await pool.query('SELECT id, nom, dose, voie, frequence, actif, debut FROM traitements WHERE patient_id = ? ORDER BY actif DESC, debut, id', [id]);
  if (req.query.audit === '1') await audit(pool, req, 'consultation', 'patient', id, null);
  res.json(Object.assign({ id: String(id) }, patientLeger(rows[0]), {
    antecedents: rows[0].antecedents || '',
    notes: notes.map(n => ({ ts: R.jsDT(n.cree_le), auteur: n.auteur_nom, type: n.type, texte: n.texte })),
    constantes: cs.map(c => ({
      ts: R.jsDT(c.releve_le), fc: c.fc, ta: c.ta_sys ? c.ta_sys + '/' + c.ta_dia : null, spo2: c.spo2, temp: c.temperature, fr: c.fr, auteur: c.auteur_nom
    })),
    traitements: trs.map(t => ({ id: String(t.id), nom: t.nom, dose: t.dose, voie: t.voie, freq: t.frequence, actif: !!t.actif, debut: R.jsDT(t.debut) }))
  }));
}));

/* ---------- admissions ---------- */
router.post('/patients', A.besoin('admission'), h(async (req, res) => {
  const p = R.validerPatient(req.body || {}, { creation: true });
  const now = R.maintenant();
  const id = await tx(async c => {
    const [ins] = await c.query(
      'INSERT INTO patients (nom, prenom, naissance, sexe, groupe_sanguin, allergies, antecedents, triage, motif, provenance, statut, lit, arrive_le, admis_le) VALUES (?)',
      [[p.nom, p.prenom, p.naissance, p.sexe, p.groupe, p.allergies, p.antecedents, p.triage, p.motif, p.provenance,
        p.lit ? 'admis' : 'attente', p.lit || null, now, p.lit ? now : null]]);
    const pid = ins.insertId;
    await c.query('UPDATE patients SET numero = ? WHERE id = ?', ['HC-' + String(pid).padStart(6, '0'), pid]);
    if (p.lit) await ajouterNote(c, pid, req.user, 'Évolution', 'Admis au lit ' + p.lit + '.');
    await audit(c, req, 'creation', 'patient', pid, { triage: p.triage, lit: p.lit || null });
    return pid;
  });
  res.status(201).json({ id: String(id) });
}));

router.put('/patients/:id', A.besoin('identite'), h(async (req, res) => {
  const id = idParam(req.params.id);
  const p = R.validerPatient(req.body || {}, { creation: false });
  await tx(async c => {
    await patientVerrou(c, id);
    await c.query(
      'UPDATE patients SET nom=?, prenom=?, naissance=?, sexe=?, groupe_sanguin=?, allergies=?, antecedents=?, triage=?, motif=?, provenance=? WHERE id=?',
      [p.nom, p.prenom, p.naissance, p.sexe, p.groupe, p.allergies, p.antecedents, p.triage, p.motif, p.provenance, id]);
    await audit(c, req, 'modification', 'patient', id, { triage: p.triage });
  });
  res.json({ ok: true });
}));

router.post('/patients/:id/admission', A.besoin('admission'), h(async (req, res) => {
  const id = idParam(req.params.id);
  const lit = R.choix((req.body || {}).lit, R.LITS, 'Lit');
  await tx(async c => {
    const p = await patientVerrou(c, id);
    if (p.statut !== 'attente') throw new HttpError(409, 'Ce patient n\'est pas dans la file d\'attente.');
    await c.query('UPDATE patients SET statut = \'admis\', lit = ?, admis_le = ? WHERE id = ?', [lit, R.maintenant(), id]);
    await ajouterNote(c, id, req.user, 'Évolution', 'Admis au lit ' + lit + '.');
    await audit(c, req, 'admission', 'patient', id, { lit });
  });
  res.json({ ok: true });
}));

router.post('/patients/:id/sortie', A.besoin('sortie'), h(async (req, res) => {
  const id = idParam(req.params.id);
  const b = req.body || {};
  const destination = R.choix(b.destination, R.DESTINATIONS, 'Destination');
  const resume = R.texte(b.resume, 'Résumé de sortie', { max: 2000, requis: true });
  await tx(async c => {
    const p = await patientVerrou(c, id);
    if (p.statut !== 'admis') throw new HttpError(409, 'Seul un patient admis peut sortir.');
    const [enCours] = await c.query('SELECT acte, statut FROM interventions WHERE patient_id = ? AND statut IN (\'planifiee\',\'en_cours\') LIMIT 1', [id]);
    if (enCours.length) throw new HttpError(409, 'Une intervention est encore ' + (enCours[0].statut === 'en_cours' ? 'en cours' : 'planifiée') + ' pour ce patient (' + enCours[0].acte + '). Terminez-la ou annulez-la avant la sortie.');
    await c.query('UPDATE patients SET statut = \'sorti\', lit = NULL, sortie_le = ?, destination = ? WHERE id = ?', [R.maintenant(), destination, id]);
    await ajouterNote(c, id, req.user, 'Évolution', 'Sortie (' + destination + (p.lit ? ', lit ' + p.lit + ' libéré' : '') + '). ' + resume);
    await audit(c, req, 'sortie', 'patient', id, { destination });
  });
  res.json({ ok: true });
}));

/* ---------- dossier médical ---------- */
router.post('/patients/:id/notes', A.besoin('note'), h(async (req, res) => {
  const id = idParam(req.params.id);
  const type = R.choix((req.body || {}).type, R.NOTE_TYPES, 'Type');
  const texte = R.texte((req.body || {}).texte, 'Note', { max: 4000, requis: true });
  await tx(async c => {
    await patientVerrou(c, id);
    await ajouterNote(c, id, req.user, type, texte);
    await audit(c, req, 'note', 'patient', id, { type });
  });
  res.status(201).json({ ok: true });
}));

router.post('/patients/:id/constantes', A.besoin('constantes'), h(async (req, res) => {
  const id = idParam(req.params.id);
  const k = R.validerConstantes(req.body || {});
  await tx(async c => {
    await patientVerrou(c, id);
    await c.query('INSERT INTO constantes (patient_id, releve_le, fc, ta_sys, ta_dia, spo2, temperature, fr, auteur_id, auteur_nom) VALUES (?)',
      [[id, R.maintenant(), k.fc, k.sys, k.dia, k.spo2, k.temp, k.fr, req.user.id, req.user.nom]]);
    await audit(c, req, 'constantes', 'patient', id, null);
  });
  res.status(201).json({ ok: true });
}));

router.post('/patients/:id/traitements', A.besoin('prescrire'), h(async (req, res) => {
  const id = idParam(req.params.id);
  const t = R.validerTraitement(req.body || {});
  await tx(async c => {
    await patientVerrou(c, id);
    await c.query('INSERT INTO traitements (patient_id, nom, dose, voie, frequence, actif, debut, prescripteur_id, prescripteur_nom) VALUES (?)',
      [[id, t.nom, t.dose, t.voie, t.freq, 1, R.maintenant(), req.user.id, req.user.nom]]);
    await ajouterNote(c, id, req.user, 'Consigne', 'Prescription : ' + t.nom + ' ' + t.dose + ' ' + t.voie + (t.freq ? ', ' + t.freq : ''));
    await audit(c, req, 'prescription', 'patient', id, { nom: t.nom, dose: t.dose });
  });
  res.status(201).json({ ok: true });
}));

router.post('/traitements/:id/arret', A.besoin('prescrire'), h(async (req, res) => {
  const id = idParam(req.params.id);
  await tx(async c => {
    const [rows] = await c.query('SELECT * FROM traitements WHERE id = ? FOR UPDATE', [id]);
    if (!rows.length) throw new HttpError(404, 'Prescription introuvable.');
    if (!rows[0].actif) throw new HttpError(409, 'Ce traitement est déjà arrêté.');
    await c.query('UPDATE traitements SET actif = 0, arrete_le = ? WHERE id = ?', [R.maintenant(), id]);
    await ajouterNote(c, rows[0].patient_id, req.user, 'Consigne', 'Traitement arrêté : ' + rows[0].nom);
    await audit(c, req, 'arret_traitement', 'patient', rows[0].patient_id, { traitement: rows[0].nom });
  });
  res.json({ ok: true });
}));

/* ---------- blocs opératoires ---------- */
// Vérifie qu'une intervention peut occuper le créneau. Le verrou sur la ligne de la salle
// sérialise les réservations simultanées : deux personnes ne peuvent pas prendre le même créneau.
async function controlerCreneau(c, i, exclureId) {
  await c.query('SELECT nom FROM salles WHERE nom = ? FOR UPDATE', [i.bloc]);
  const [pat] = await c.query('SELECT statut FROM patients WHERE id = ?', [i.patientId]);
  if (!pat.length) throw new HttpError(400, 'Patient : dossier introuvable.');
  if (i.statut === 'annulee') return;
  if (pat[0].statut === 'sorti' && (i.statut === 'planifiee' || i.statut === 'en_cours'))
    throw new HttpError(409, 'Ce patient est sorti : impossible de lui réserver un bloc.');
  const fin = R.addMin(i.debut, i.duree);
  const ex = exclureId || 0;
  const [sal] = await c.query(
    'SELECT acte, salle, debut, duree_min FROM interventions WHERE salle = ? AND statut <> \'annulee\' AND id <> ? AND debut < ? AND DATE_ADD(fin, INTERVAL ? MINUTE) > ? LIMIT 1',
    [i.bloc, ex, R.sqlDT(R.addMin(fin, R.TURN)), R.TURN, R.sqlDT(i.debut)]);
  if (sal.length) {
    const x = sal[0], a = minSql(x.debut), b = a + x.duree_min;
    const [jour] = await c.query('SELECT debut, duree_min FROM interventions WHERE salle = ? AND statut <> \'annulee\' AND id <> ? AND DATE(debut) = ?', [i.bloc, ex, i.jour]);
    const slot = R.premierCreneau(jour.map(o => ({ a: minSql(o.debut), b: minSql(o.debut) + o.duree_min })), i.duree, i.debutMin);
    throw new HttpError(409, 'Conflit avec « ' + x.acte + ' » dans ' + x.salle + ', ' + R.hm(a) + '–' + R.hm(b) +
      ' (nettoyage jusqu\'à ' + R.hm(b + R.TURN) + ').' + (slot !== null ? ' Premier créneau libre : ' + R.hm(slot) + '.' : ''));
  }
  const [pc] = await c.query(
    'SELECT acte, salle, debut, duree_min FROM interventions WHERE patient_id = ? AND statut <> \'annulee\' AND id <> ? AND debut < ? AND fin > ? LIMIT 1',
    [i.patientId, ex, R.sqlDT(fin), R.sqlDT(i.debut)]);
  if (pc.length) {
    const x = pc[0], a = minSql(x.debut);
    throw new HttpError(409, 'Ce patient est déjà au bloc sur ce créneau : « ' + x.acte + ' », ' + x.salle + ', ' + R.hm(a) + '–' + R.hm(a + x.duree_min) + '.');
  }
}

router.post('/interventions', A.besoin('intervention'), h(async (req, res) => {
  const i = R.validerIntervention(req.body || {}, { creation: true });
  const id = await tx(async c => {
    await controlerCreneau(c, i, 0);
    const [ins] = await c.query(
      'INSERT INTO interventions (patient_id, salle, debut, duree_min, acte, chirurgien, anesthesie, urgence, statut, notes, cree_par) VALUES (?)',
      [[i.patientId, i.bloc, R.sqlDT(i.debut), i.duree, i.acte, i.chirurgien, i.anesthesie, i.urgence ? 1 : 0, i.statut, i.notes || null, req.user.id]]);
    await audit(c, req, 'creation', 'intervention', ins.insertId, { patient: i.patientId, bloc: i.bloc, debut: i.debut, urgence: i.urgence });
    return ins.insertId;
  });
  res.status(201).json({ id: String(id) });
}));

router.put('/interventions/:id', A.besoin('intervention'), h(async (req, res) => {
  const id = idParam(req.params.id);
  const i = R.validerIntervention(req.body || {}, { creation: false });
  await tx(async c => {
    const [cur] = await c.query('SELECT statut FROM interventions WHERE id = ? FOR UPDATE', [id]);
    if (!cur.length) throw new HttpError(404, 'Intervention introuvable.');
    await controlerCreneau(c, i, id);
    await c.query(
      'UPDATE interventions SET patient_id=?, salle=?, debut=?, duree_min=?, acte=?, chirurgien=?, anesthesie=?, urgence=?, statut=?, notes=? WHERE id=?',
      [i.patientId, i.bloc, R.sqlDT(i.debut), i.duree, i.acte, i.chirurgien, i.anesthesie, i.urgence ? 1 : 0, i.statut, i.notes || null, id]);
    await audit(c, req, 'modification', 'intervention', id, { de: cur[0].statut, vers: i.statut, bloc: i.bloc, debut: i.debut });
  });
  res.json({ ok: true });
}));

router.delete('/interventions/:id', A.besoin('intervention'), h(async (req, res) => {
  const id = idParam(req.params.id);
  await tx(async c => {
    const [cur] = await c.query('SELECT statut, acte FROM interventions WHERE id = ? FOR UPDATE', [id]);
    if (!cur.length) throw new HttpError(404, 'Intervention introuvable.');
    if (cur[0].statut === 'en_cours' || cur[0].statut === 'terminee')
      throw new HttpError(409, 'Une intervention commencée fait partie du dossier et ne peut pas être supprimée. Changez son statut si besoin.');
    await c.query('DELETE FROM interventions WHERE id = ?', [id]);
    await audit(c, req, 'suppression', 'intervention', id, { acte: cur[0].acte });
  });
  res.json({ ok: true });
}));

/* ---------- journal (administrateur) ---------- */
router.get('/journal', A.besoin('journal'), h(async (req, res) => {
  const lim = Math.min(500, Math.max(1, Number(req.query.limite) || 200));
  const [rows] = await pool.query('SELECT id, horodatage, utilisateur, action, entite, entite_id, detail, ip FROM journal_audit ORDER BY id DESC LIMIT ?', [lim]);
  res.json(rows.map(r => ({
    id: String(r.id), ts: String(r.horodatage).slice(0, 19).replace(' ', 'T'), utilisateur: r.utilisateur, action: r.action,
    entite: r.entite, entiteId: r.entite_id, detail: typeof r.detail === 'string' ? r.detail : (r.detail ? JSON.stringify(r.detail) : ''), ip: r.ip || ''
  })));
}));

module.exports = router;
