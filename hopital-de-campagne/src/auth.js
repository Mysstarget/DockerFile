'use strict';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const R = require('./rules');
const { pool } = require('./db');

const COOKIE = 'hc_session';
const DUMMY_HASH = bcrypt.hashSync('mot-de-passe-factice', 10); // égalise le temps de réponse si l'identifiant n'existe pas

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error('JWT_SECRET manquant ou trop court (32 caractères minimum). Voir .env.example.');
  return s;
}
function heures() { return Math.max(1, Number(process.env.SESSION_HEURES || 12)); }
function cookies(req) {
  const o = {};
  String(req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return o;
}
const profil = u => ({ id: String(u.id), identifiant: u.identifiant, nom: u.nom, role: u.role, perms: R.PERMS[u.role] || [] });

// Limite les essais de connexion : 10 échecs par adresse IP et par quart d'heure.
const essais = new Map();
setInterval(() => { const t = Date.now(); for (const [k, v] of essais) if (v.fin < t) essais.delete(k); }, 60000).unref();
function compteur(ip) {
  const t = Date.now();
  let e = essais.get(ip);
  if (!e || e.fin < t) { e = { n: 0, fin: t + 15 * 60000 }; essais.set(ip, e); }
  return e;
}

async function authentifier(req, res, next) {
  try {
    const tok = cookies(req)[COOKIE];
    if (!tok) throw new R.HttpError(401, 'Connexion requise.');
    let pay;
    try { pay = jwt.verify(tok, secret(), { algorithms: ['HS256'] }); }
    catch (e) { throw new R.HttpError(401, 'Session expirée. Reconnectez-vous.'); }
    const [rows] = await pool.query('SELECT id, identifiant, nom, role, actif FROM utilisateurs WHERE id = ?', [pay.sub]);
    if (!rows.length || !rows[0].actif) throw new R.HttpError(401, 'Compte désactivé ou introuvable.');
    req.user = rows[0];
    next();
  } catch (e) { next(e); }
}

const besoin = perm => (req, res, next) =>
  R.peut(req.user && req.user.role, perm) ? next() : next(new R.HttpError(403, 'Action non autorisée pour votre rôle.'));

async function connexion(req, res, audit) {
  const e = compteur(req.ip);
  if (e.n >= 10) throw new R.HttpError(429, 'Trop de tentatives. Réessayez dans quelques minutes.');
  const { identifiant, mot_de_passe: mdp } = req.body || {};
  if (typeof identifiant !== 'string' || typeof mdp !== 'string' || !identifiant || !mdp || mdp.length > 200)
    throw new R.HttpError(400, 'Identifiant et mot de passe requis.');
  const [rows] = await pool.query('SELECT * FROM utilisateurs WHERE identifiant = ?', [identifiant.slice(0, 50)]);
  const u = rows[0];
  const ok = await bcrypt.compare(mdp, u ? u.mot_de_passe_hash : DUMMY_HASH);
  if (!u || !u.actif || !ok) {
    e.n++;
    await audit(pool, req, 'connexion_echec', 'utilisateur', u ? u.id : null, null, identifiant.slice(0, 50));
    throw new R.HttpError(401, 'Identifiant ou mot de passe incorrect.');
  }
  e.n = 0;
  const token = jwt.sign({ sub: u.id }, secret(), { algorithm: 'HS256', expiresIn: heures() + 'h' });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === '1', path: '/', maxAge: heures() * 3600 * 1000
  });
  await pool.query('UPDATE utilisateurs SET derniere_connexion = ? WHERE id = ?', [R.maintenant(), u.id]);
  req.user = u;
  await audit(pool, req, 'connexion', 'utilisateur', u.id, null);
  return profil(u);
}
function deconnexion(res) { res.clearCookie(COOKIE, { path: '/' }); }

module.exports = { authentifier, besoin, connexion, deconnexion, profil, secret };
