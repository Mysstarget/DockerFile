'use strict';
const R = require('./rules');

// Écrit une ligne du journal d'audit. `c` est une connexion de transaction ou le pool :
// dans une transaction, l'audit est validé ou annulé avec la modification elle-même.
async function audit(c, req, action, entite, entiteId, detail, acteur) {
  const u = req.user || {};
  await c.query(
    'INSERT INTO journal_audit (horodatage, utilisateur_id, utilisateur, action, entite, entite_id, detail, ip) VALUES (?,?,?,?,?,?,?,?)',
    [R.maintenantMs(), u.id || null, (u.nom || acteur || 'inconnu').slice(0, 120), action, entite,
      entiteId === undefined || entiteId === null ? null : String(entiteId),
      detail ? JSON.stringify(detail) : null, (req.ip || '').slice(0, 45)]
  );
}
module.exports = { audit };
