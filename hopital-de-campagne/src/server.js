'use strict';
const path = require('path');
const express = require('express');
const R = require('./rules');
const { pool } = require('./db');
const { secret } = require('./auth');
const routes = require('./routes');

secret(); // refuse de démarrer sans clé de session correcte

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1');

app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': [
      "default-src 'self'", "script-src 'self'", "style-src-elem 'self' https://fonts.googleapis.com", "style-src-attr 'unsafe-inline'",
      "font-src https://fonts.gstatic.com", "img-src 'self' data:", "connect-src 'self'", "frame-ancestors 'none'", "base-uri 'none'", "form-action 'self'"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY'
  });
  if (process.env.COOKIE_SECURE === '1') res.set('Strict-Transport-Security', 'max-age=31536000');
  next();
});

app.use('/api', express.json({ limit: '100kb' }), (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  // Protection CSRF en plus de SameSite=Strict : toute écriture doit porter cet en-tête, que les formulaires d'autres sites ne peuvent pas ajouter.
  if (!['GET', 'HEAD'].includes(req.method) && req.get('x-requested-with') !== 'hopital')
    return next(new R.HttpError(403, 'Requête refusée.'));
  next();
}, routes);

app.use('/api', (req, res) => res.status(404).json({ erreur: 'Route inconnue.' }));
app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' }));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err instanceof R.HttpError) return res.status(err.status).json({ erreur: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erreur: 'Corps de requête invalide.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ erreur: 'Requête trop volumineuse.' });
  if (err.code === 'ER_DUP_ENTRY' && /lit_actif/.test(err.sqlMessage || ''))
    return res.status(409).json({ erreur: 'Ce lit vient d\'être attribué à un autre patient. Choisissez un autre lit.' });
  if (err.code === 'ER_LOCK_DEADLOCK' || err.code === 'ER_LOCK_WAIT_TIMEOUT')
    return res.status(503).json({ erreur: 'Accès simultané en conflit. Réessayez.' });
  console.error(err);
  res.status(500).json({ erreur: 'Erreur interne du serveur.' });
});

const port = Number(process.env.PORT || 3000);
pool.query('SELECT 1').then(() => {
  app.listen(port, () => console.log('Hôpital de campagne : http://localhost:' + port));
}).catch(e => {
  console.error('Connexion MySQL impossible :', e.message);
  console.error('Vérifiez DB_HOST, DB_USER, DB_PASSWORD et DB_NAME dans .env, puis lancez « npm run db:init ».');
  process.exit(1);
});
