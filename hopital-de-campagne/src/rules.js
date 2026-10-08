'use strict';
// Règles métier pures (sans accès base) : validation, droits, créneaux de bloc.

const TURN = 20;      // minutes de nettoyage après chaque intervention
const H0 = 360;       // ouverture des blocs : 06:00
const H1 = 1440;      // fin de journée : 24:00

const TENTES = [{ k: 'A', c: 6 }, { k: 'B', c: 8 }, { k: 'C', c: 10 }];
const LITS = TENTES.flatMap(t => Array.from({ length: t.c }, (_, i) => t.k + (i + 1)));
const SALLES = ['Bloc 1', 'Bloc 2'];
const TRIAGES = ['rouge', 'orange', 'jaune', 'vert'];
const SEXES = ['F', 'M', 'X'];
const GROUPES = ['Inconnu', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const NOTE_TYPES = ['Évolution', 'Observation médicale', 'Soins infirmiers', 'Consigne'];
const VOIES = ['IV', 'PO', 'IM', 'SC', 'Inhalation', 'Topique'];
const ANESTHESIES = ['Anesthésie générale', 'Rachianesthésie', 'Locorégionale', 'Sédation', 'Anesthésie locale', 'Aucune'];
const STATUTS_INTERVENTION = ['planifiee', 'en_cours', 'terminee', 'annulee'];
const DESTINATIONS = ['Retour à domicile', 'Transfert vers l\'hôpital de référence', 'Évacuation sanitaire', 'Décès', 'Autre'];

const PERMS = {
  admin:    ['lire', 'admission', 'identite', 'sortie', 'note', 'constantes', 'prescrire', 'intervention', 'journal'],
  medecin:  ['lire', 'admission', 'identite', 'sortie', 'note', 'constantes', 'prescrire', 'intervention'],
  soignant: ['lire', 'admission', 'identite', 'note', 'constantes']
};

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = m => new HttpError(400, m);

/* ---------- texte ---------- */
function texte(v, label, { max = 255, requis = false } = {}) {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') throw bad(label + ' : texte attendu.');
  v = v.trim();
  if (requis && !v) throw bad(label + ' : champ obligatoire.');
  if (v.length > max) throw bad(label + ' : ' + max + ' caractères maximum.');
  return v;
}
function choix(v, liste, label) {
  if (!liste.includes(v)) throw bad(label + ' : valeur non autorisée.');
  return v;
}
function entier(v, label, { min, max, requis = false } = {}) {
  if (v === undefined || v === null || v === '') { if (requis) throw bad(label + ' : champ obligatoire.'); return null; }
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) throw bad(label + ' : nombre attendu.');
  if (min !== undefined && n < min || max !== undefined && n > max) throw bad(label + ' : valeur attendue entre ' + min + ' et ' + max + '.');
  return n;
}

/* ---------- dates : 'YYYY-MM-DDTHH:MM' (client) <-> 'YYYY-MM-DD HH:MM:SS' (MySQL) ---------- */
const RE_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
function dateValide(y, m, d) { const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; }
function parseLocal(s, label) {
  const m = RE_LOCAL.exec(String(s || ''));
  if (!m) throw bad(label + ' : date et heure invalides.');
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  if (!dateValide(y, mo, d) || h > 23 || mi > 59) throw bad(label + ' : date et heure invalides.');
  return { jour: m[1] + '-' + m[2] + '-' + m[3], min: h * 60 + mi };
}
function dateSeule(s, label) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m || !dateValide(+m[1], +m[2], +m[3])) throw bad(label + ' : date invalide.');
  return s;
}
const sqlDT = local => local.replace('T', ' ') + ':00';
const jsDT = sql => (sql ? String(sql).slice(0, 16).replace(' ', 'T') : null);
const pad = n => String(n).padStart(2, '0');
function hm(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
function addMin(local, n) { // 'YYYY-MM-DDTHH:MM' + n minutes, sans effet de fuseau
  const m = RE_LOCAL.exec(local);
  const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5] + n));
  return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()) + 'T' + pad(t.getUTCHours()) + ':' + pad(t.getUTCMinutes());
}
function maintenant() { // heure locale du site (processus lancé avec TZ)
  const d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}
function maintenantMs() { return maintenant() + '.' + String(new Date().getMilliseconds()).padStart(3, '0'); }

/* ---------- patients ---------- */
function validerPatient(b, { creation }) {
  const p = {
    nom: texte(b.nom, 'Nom', { max: 80, requis: true }),
    prenom: texte(b.prenom, 'Prénom', { max: 80, requis: true }),
    naissance: dateSeule(b.naissance, 'Date de naissance'),
    sexe: choix(b.sexe, SEXES, 'Sexe'),
    groupe: choix(b.groupe || 'Inconnu', GROUPES, 'Groupe sanguin'),
    triage: choix(b.triage, TRIAGES, 'Triage'),
    provenance: texte(b.provenance, 'Provenance', { max: 60 }),
    motif: texte(b.motif, 'Motif', { max: 2000, requis: true }),
    allergies: texte(b.allergies, 'Allergies', { max: 500 }),
    antecedents: texte(b.antecedents, 'Antécédents', { max: 4000 })
  };
  if (new Date(p.naissance + 'T12:00:00Z') > new Date()) throw bad('Date de naissance : ne peut pas être dans le futur.');
  if (creation) p.lit = b.lit ? choix(b.lit, LITS, 'Lit') : '';
  return p;
}
function validerConstantes(b) {
  const c = {
    fc: entier(b.fc, 'Fréquence cardiaque', { min: 20, max: 250 }),
    spo2: entier(b.spo2, 'SpO₂', { min: 30, max: 100 }),
    temp: entier(b.temp, 'Température', { min: 25, max: 45 }),
    fr: entier(b.fr, 'Fréquence respiratoire', { min: 3, max: 80 }),
    sys: null, dia: null
  };
  const ta = texte(b.ta, 'Tension', { max: 7 });
  if (ta) {
    const m = /^(\d{2,3})\/(\d{2,3})$/.exec(ta);
    if (!m) throw bad('Tension : format attendu 120/80.');
    c.sys = +m[1]; c.dia = +m[2];
    if (c.sys < 40 || c.sys > 300 || c.dia < 20 || c.dia > 200 || c.dia >= c.sys) throw bad('Tension : valeurs incohérentes.');
  }
  if (c.fc === null && c.spo2 === null && c.temp === null && c.fr === null && c.sys === null) throw bad('Saisissez au moins une valeur.');
  if (c.temp !== null) c.temp = Math.round(c.temp * 10) / 10;
  return c;
}
function validerTraitement(b) {
  return {
    nom: texte(b.nom, 'Médicament', { max: 120, requis: true }),
    dose: texte(b.dose, 'Dose', { max: 60, requis: true }),
    voie: choix(b.voie, VOIES, 'Voie'),
    freq: texte(b.freq, 'Fréquence', { max: 80 })
  };
}

/* ---------- interventions ---------- */
function validerIntervention(b, { creation }) {
  const d = parseLocal(b.debut, 'Début');
  const duree = entier(b.duree, 'Durée', { min: 15, max: 720, requis: true });
  if (!Number.isInteger(duree)) throw bad('Durée : nombre entier de minutes attendu.');
  if (d.min < H0) throw bad('Les blocs ouvrent à ' + hm(H0) + '.');
  if (d.min + duree > H1) throw bad('L\'intervention dépasse minuit. Réduisez la durée ou avancez le début.');
  const i = {
    patientId: entier(b.patientId, 'Patient', { min: 1, requis: true }),
    bloc: choix(b.bloc, SALLES, 'Salle'),
    debut: b.debut, jour: d.jour, debutMin: d.min, duree,
    acte: texte(b.acte, 'Acte', { max: 200, requis: true }),
    chirurgien: texte(b.chirurgien, 'Chirurgien', { max: 120, requis: true }),
    anesthesie: choix(b.anesthesie, ANESTHESIES, 'Anesthésie'),
    urgence: b.urgence === true || b.urgence === 1,
    notes: texte(b.notes, 'Notes', { max: 2000 }),
    statut: creation ? 'planifiee' : choix(b.statut, STATUTS_INTERVENTION, 'Statut')
  };
  return i;
}
// Premier créneau libre à partir de `depuis` ; occ = [{a, b}] en minutes (début, fin) triés ou non.
function premierCreneau(occ, duree, depuis) {
  const liste = occ.slice().sort((x, y) => x.a - y.a);
  let t = Math.ceil(Math.max(depuis, H0) / 5) * 5;
  for (const o of liste) {
    if (t + duree + TURN <= o.a) break;
    t = Math.max(t, Math.ceil((o.b + TURN) / 5) * 5);
  }
  return t + duree <= H1 ? t : null;
}

function peut(role, perm) { return !!(PERMS[role] && PERMS[role].includes(perm)); }

module.exports = {
  TURN, H0, H1, LITS, SALLES, TRIAGES, NOTE_TYPES, DESTINATIONS, PERMS, HttpError, bad,
  texte, choix, entier, parseLocal, sqlDT, jsDT, hm, addMin, maintenant, maintenantMs,
  validerPatient, validerConstantes, validerTraitement, validerIntervention, premierCreneau, peut
};
