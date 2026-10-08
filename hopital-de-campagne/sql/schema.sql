-- Hôpital de campagne : schéma MySQL 8.0+ (InnoDB, utf8mb4)
-- Toutes les heures sont des heures locales du site, sans fuseau (DATETIME).

CREATE TABLE IF NOT EXISTS utilisateurs (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  identifiant        VARCHAR(50)  NOT NULL,
  nom                VARCHAR(120) NOT NULL,
  role               ENUM('admin','medecin','soignant') NOT NULL,
  mot_de_passe_hash  VARCHAR(100) NOT NULL,
  actif              TINYINT(1)   NOT NULL DEFAULT 1,
  cree_le            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  derniere_connexion DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_utilisateurs_identifiant (identifiant)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lits (
  code  VARCHAR(4) NOT NULL,
  tente CHAR(1)    NOT NULL,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS salles (
  nom VARCHAR(20) NOT NULL,
  PRIMARY KEY (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patients (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  numero         VARCHAR(20)  NULL,
  nom            VARCHAR(80)  NOT NULL,
  prenom         VARCHAR(80)  NOT NULL,
  naissance      DATE         NOT NULL,
  sexe           ENUM('F','M','X') NOT NULL,
  groupe_sanguin ENUM('Inconnu','O+','O-','A+','A-','B+','B-','AB+','AB-') NOT NULL DEFAULT 'Inconnu',
  allergies      VARCHAR(500) NOT NULL DEFAULT '',
  antecedents    TEXT         NULL,
  triage         ENUM('rouge','orange','jaune','vert') NOT NULL,
  motif          TEXT         NOT NULL,
  provenance     VARCHAR(60)  NOT NULL DEFAULT '',
  statut         ENUM('attente','admis','sorti') NOT NULL DEFAULT 'attente',
  lit            VARCHAR(4)   NULL,
  arrive_le      DATETIME     NOT NULL,
  admis_le       DATETIME     NULL,
  sortie_le      DATETIME     NULL,
  destination    VARCHAR(80)  NULL,
  -- Un lit ne peut porter qu'un seul patient admis : garanti par la base, même en cas d'accès simultanés.
  lit_actif      VARCHAR(4) GENERATED ALWAYS AS (IF(statut = 'admis', lit, NULL)) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patients_numero (numero),
  UNIQUE KEY uq_patients_lit_actif (lit_actif),
  KEY idx_patients_statut (statut, triage, arrive_le),
  KEY idx_patients_nom (nom, prenom),
  CONSTRAINT fk_patients_lit FOREIGN KEY (lit) REFERENCES lits (code),
  CONSTRAINT ck_patients_admis_lit CHECK (statut <> 'admis' OR lit IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_id  INT UNSIGNED NOT NULL,
  cree_le     DATETIME     NOT NULL,
  auteur_id   INT UNSIGNED NULL,
  auteur_nom  VARCHAR(120) NOT NULL,
  type        ENUM('Évolution','Observation médicale','Soins infirmiers','Consigne') NOT NULL,
  texte       TEXT         NOT NULL,
  PRIMARY KEY (id),
  KEY idx_notes_patient (patient_id, cree_le),
  CONSTRAINT fk_notes_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
  CONSTRAINT fk_notes_auteur FOREIGN KEY (auteur_id) REFERENCES utilisateurs (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS constantes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_id  INT UNSIGNED NOT NULL,
  releve_le   DATETIME     NOT NULL,
  fc          SMALLINT UNSIGNED NULL,
  ta_sys      SMALLINT UNSIGNED NULL,
  ta_dia      SMALLINT UNSIGNED NULL,
  spo2        TINYINT UNSIGNED NULL,
  temperature DECIMAL(3,1) NULL,
  fr          TINYINT UNSIGNED NULL,
  auteur_id   INT UNSIGNED NULL,
  auteur_nom  VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_constantes_patient (patient_id, releve_le),
  CONSTRAINT fk_constantes_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
  CONSTRAINT fk_constantes_auteur FOREIGN KEY (auteur_id) REFERENCES utilisateurs (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS traitements (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_id    INT UNSIGNED NOT NULL,
  nom           VARCHAR(120) NOT NULL,
  dose          VARCHAR(60)  NOT NULL,
  voie          ENUM('IV','PO','IM','SC','Inhalation','Topique') NOT NULL,
  frequence     VARCHAR(80)  NOT NULL DEFAULT '',
  actif         TINYINT(1)   NOT NULL DEFAULT 1,
  debut         DATETIME     NOT NULL,
  arrete_le     DATETIME     NULL,
  prescripteur_id  INT UNSIGNED NULL,
  prescripteur_nom VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_traitements_patient (patient_id, actif),
  CONSTRAINT fk_traitements_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
  CONSTRAINT fk_traitements_prescripteur FOREIGN KEY (prescripteur_id) REFERENCES utilisateurs (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS interventions (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_id  INT UNSIGNED NOT NULL,
  salle       VARCHAR(20)  NOT NULL,
  debut       DATETIME     NOT NULL,
  duree_min   SMALLINT UNSIGNED NOT NULL,
  fin         DATETIME GENERATED ALWAYS AS (debut + INTERVAL duree_min MINUTE) STORED,
  acte        VARCHAR(200) NOT NULL,
  chirurgien  VARCHAR(120) NOT NULL,
  anesthesie  VARCHAR(40)  NOT NULL,
  urgence     TINYINT(1)   NOT NULL DEFAULT 0,
  statut      ENUM('planifiee','en_cours','terminee','annulee') NOT NULL DEFAULT 'planifiee',
  notes       TEXT         NULL,
  cree_par    INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_interventions_salle (salle, debut),
  KEY idx_interventions_patient (patient_id, debut),
  CONSTRAINT fk_interventions_patient FOREIGN KEY (patient_id) REFERENCES patients (id),
  CONSTRAINT fk_interventions_salle FOREIGN KEY (salle) REFERENCES salles (nom),
  CONSTRAINT fk_interventions_user FOREIGN KEY (cree_par) REFERENCES utilisateurs (id),
  CONSTRAINT ck_interventions_duree CHECK (duree_min BETWEEN 15 AND 720)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Journal d'audit : qui a fait ou consulté quoi, et quand. Ne jamais supprimer ni modifier ces lignes.
CREATE TABLE IF NOT EXISTS journal_audit (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  horodatage     DATETIME(3)  NOT NULL,
  utilisateur_id INT UNSIGNED NULL,
  utilisateur    VARCHAR(120) NOT NULL,
  action         VARCHAR(40)  NOT NULL,
  entite         VARCHAR(30)  NOT NULL,
  entite_id      VARCHAR(30)  NULL,
  detail         JSON         NULL,
  ip             VARCHAR(45)  NULL,
  PRIMARY KEY (id),
  KEY idx_audit_date (horodatage),
  KEY idx_audit_entite (entite, entite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO salles (nom) VALUES ('Bloc 1'), ('Bloc 2');
INSERT IGNORE INTO lits (code, tente) VALUES
  ('A1','A'),('A2','A'),('A3','A'),('A4','A'),('A5','A'),('A6','A'),
  ('B1','B'),('B2','B'),('B3','B'),('B4','B'),('B5','B'),('B6','B'),('B7','B'),('B8','B'),
  ('C1','C'),('C2','C'),('C3','C'),('C4','C'),('C5','C'),('C6','C'),('C7','C'),('C8','C'),('C9','C'),('C10','C');
