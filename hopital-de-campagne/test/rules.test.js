'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const r = require('../src/rules');

test('dates locales', () => {
  assert.equal(r.sqlDT('2026-10-08T14:05'), '2026-10-08 14:05:00');
  assert.equal(r.jsDT('2026-10-08 14:05:33'), '2026-10-08T14:05');
  assert.equal(r.addMin('2026-10-08T23:50', 20), '2026-10-09T00:10');
  assert.throws(() => r.parseLocal('2026-02-30T10:00', 'x'), /invalides/);
  assert.throws(() => r.parseLocal('2026-10-08T25:00', 'x'), /invalides/);
});

test('intervention : horaires et durée', () => {
  const ok = { patientId: 5, bloc: 'Bloc 1', debut: '2026-10-08T08:00', duree: 90, acte: 'Appendicectomie', chirurgien: 'Dr L', anesthesie: 'Aucune' };
  assert.equal(r.validerIntervention(ok, { creation: true }).statut, 'planifiee');
  assert.throws(() => r.validerIntervention({ ...ok, debut: '2026-10-08T05:00' }, { creation: true }), /ouvrent/);
  assert.throws(() => r.validerIntervention({ ...ok, debut: '2026-10-08T23:00', duree: 90 }, { creation: true }), /minuit/);
  assert.throws(() => r.validerIntervention({ ...ok, duree: 10 }, { creation: true }), /entre 15 et 720/);
  assert.throws(() => r.validerIntervention({ ...ok, bloc: 'Bloc 9' }, { creation: true }), /Salle/);
});

test('premier créneau libre avec nettoyage', () => {
  const occ = [{ a: 480, b: 570 }, { a: 600, b: 750 }]; // 08:00-09:30 et 10:00-12:30
  assert.equal(r.premierCreneau([], 60, 0), 360);
  assert.equal(r.premierCreneau(occ, 60, 360), 360);          // 06:00 -> fin 07:00 + 20 <= 08:00
  assert.equal(r.premierCreneau(occ, 120, 360), 770);         // après 12:30 + 20 = 12:50
  assert.equal(r.premierCreneau(occ, 60, 480), 770);          // 09:50 + 60 + 20 > 10:00
  assert.equal(r.premierCreneau([{ a: 400, b: 1430 }], 60, 360), null);
});

test('constantes', () => {
  const c = r.validerConstantes({ fc: '88', ta: '120/80', spo2: '97', temp: '37,5' });
  assert.deepEqual([c.fc, c.sys, c.dia, c.spo2, c.temp], [88, 120, 80, 97, 37.5]);
  assert.throws(() => r.validerConstantes({}), /au moins une valeur/);
  assert.throws(() => r.validerConstantes({ spo2: '120' }), /entre 30 et 100/);
  assert.throws(() => r.validerConstantes({ ta: '80/120' }), /incohérentes/);
});

test('patient', () => {
  const b = { nom: ' Durand ', prenom: 'Léa', naissance: '1990-01-01', sexe: 'F', triage: 'vert', motif: 'Toux', lit: 'A1' };
  const p = r.validerPatient(b, { creation: true });
  assert.equal(p.nom, 'Durand'); assert.equal(p.groupe, 'Inconnu'); assert.equal(p.lit, 'A1');
  assert.throws(() => r.validerPatient({ ...b, lit: 'Z9' }, { creation: true }), /Lit/);
  assert.throws(() => r.validerPatient({ ...b, naissance: '2999-01-01' }, { creation: true }), /futur/);
  assert.throws(() => r.validerPatient({ ...b, triage: 'bleu' }, { creation: true }), /Triage/);
});

test('droits', () => {
  assert.ok(r.peut('medecin', 'prescrire'));
  assert.ok(!r.peut('soignant', 'prescrire'));
  assert.ok(!r.peut('soignant', 'intervention'));
  assert.ok(r.peut('admin', 'journal') && !r.peut('medecin', 'journal'));
});
