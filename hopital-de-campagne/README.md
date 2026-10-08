# Hôpital de campagne

Application web de gestion d'un hôpital de campagne : admissions et file d'attente par triage,
dossiers médicaux (constantes, notes, prescriptions), planning de deux blocs opératoires.
Node.js (Express) + MySQL 8, interface en français, connexion par identifiant avec trois rôles.

> **Prototype.** Il n'a pas été audité. Avant de saisir de vraies données de patients, faites-le valider
> pour vos obligations légales (RGPD, hébergement de données de santé HDS en France, sauvegardes,
> chiffrement, politique de mots de passe). Servez-le uniquement en HTTPS (`COOKIE_SECURE=1`).

## Démarrage avec Docker (le plus simple)

```bash
cp .env.example .env
# Éditer .env : DB_PASSWORD, JWT_SECRET (voir la commande dans le fichier), COOKIE_SECURE
docker compose up -d --build
docker compose exec app node scripts/init-db.js
docker compose exec -e NEW_PASSWORD='un-mot-de-passe-de-12-caracteres-ou-plus' app \
  node scripts/add-user.js admin "Votre nom" admin
```

Ouvrir http://localhost:3000 et se connecter avec `admin`.

## Démarrage sans Docker

Prérequis : Node.js 20.6 ou plus récent, MySQL 8.0+ (MariaDB 10.5+ devrait convenir, non testé).

```sql
CREATE DATABASE hopital CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hopital'@'%' IDENTIFIED BY 'mot-de-passe';
GRANT ALL ON hopital.* TO 'hopital'@'%';
```

```bash
npm install
cp .env.example .env        # puis éditer .env
npm run db:init             # crée les tables
npm run user:add -- admin "Votre nom" admin    # mot de passe demandé en saisie masquée
npm start
```

## Données de démonstration (facultatif)

```bash
npm run db:seed             # 14 patients fictifs, 8 interventions, 3 comptes avec mots de passe aléatoires affichés une fois
```
Le script refuse de s'exécuter si la base contient déjà des patients. Supprimez ces comptes avant une mise en service réelle.

## Rôles

| Droit                                   | Soignant | Médecin | Admin |
|-----------------------------------------|:--------:|:-------:|:-----:|
| Lire tout, admettre, modifier l'identité | oui      | oui     | oui   |
| Notes de suivi, constantes              | oui      | oui     | oui   |
| Prescrire, arrêter un traitement        |          | oui     | oui   |
| Sortie d'un patient                     |          | oui     | oui   |
| Réserver, modifier, supprimer un bloc   |          | oui     | oui   |
| Consulter le journal d'audit            |          |         | oui   |

Créer un utilisateur : `npm run user:add -- <identifiant> "<Nom complet>" <admin|medecin|soignant>`.
Désactiver un compte : `UPDATE utilisateurs SET actif = 0 WHERE identifiant = '...';` (effet immédiat).

## Ce que la base garantit

- **Un lit, un patient** : index unique sur une colonne générée (`lit_actif`) ; deux admissions simultanées sur le même lit, une seule réussit.
- **Pas de double réservation de bloc** : chaque réservation verrouille la salle dans une transaction, vérifie le chevauchement
  (nettoyage de 20 min compris) et celui du patient. Le serveur propose le premier créneau libre en cas de conflit.
- **Journal d'audit** : connexions (réussies ou non), consultations de dossier à l'ouverture, admissions, sorties, notes,
  constantes, prescriptions, réservations. Écrit dans la même transaction que l'action.
- Les heures sont des heures locales du site (variable `TZ`), sans fuseau dans la base.

## Structure

```
sql/schema.sql        tables MySQL
src/rules.js          règles pures (validation, créneaux, droits) : testées avec `npm test`
src/routes.js         API REST (/api/...)
src/auth.js           connexion, session par cookie HttpOnly, limitation des essais
scripts/              init-db, add-user, seed-demo
public/               interface (index.html, app.js, style.css)
```

## Limites connues

- L'interface interroge le serveur toutes les 8 secondes ; ce n'est pas du temps réel instantané.
- Pas d'écran d'administration des utilisateurs (ligne de commande), pas de réinitialisation de mot de passe en self-service,
  pas d'authentification à deux facteurs.
- La liste des patients et des interventions est chargée en entier à chaque rafraîchissement : prévu pour quelques centaines
  de dossiers, pas pour des milliers.
- Les polices viennent de Google Fonts ; sans connexion Internet, des polices système s'affichent. Les héberger localement
  demande d'adapter `index.html` et l'en-tête CSP dans `src/server.js`.
- Le code n'a pas pu être exécuté contre un vrai MySQL au moment de sa rédaction : voir ci-dessous.

## Vérification

`npm test` exécute les tests des règles métier (validation, créneaux, droits) sans base de données.
Les requêtes SQL, les transactions et les contraintes (`lit_actif`, verrou de salle) doivent être essayées sur votre MySQL :
lancez `npm run db:init`, `npm run db:seed`, puis réservez deux fois le même créneau et admettez deux patients dans le même lit.
