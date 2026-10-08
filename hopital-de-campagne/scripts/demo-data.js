// Données fictives de démonstration (patients, notes, constantes, traitements, interventions). Ne contient aucune donnée réelle.
function buildSeed(day){
  function addD(k,n){var d=new Date(k+'T12:00:00');d.setDate(d.getDate()+n);var p=function(x){return String(x).padStart(2,'0')};return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}
  var T=function(h,off){return addD(day,off||0)+'T'+h};
  var V=function(h,fc,ta,spo2,temp,fr){return {ts:T(h),fc:fc,ta:ta,spo2:spo2,temp:temp,fr:fr}};
  var N=function(h,auteur,type,texte){return {ts:T(h),auteur:auteur,type:type,texte:texte}};
  var R=function(id,nom,dose,voie,freq,actif,h,off){return {id:id,nom:nom,dose:dose,voie:voie,freq:freq,actif:actif,debut:T(h,off)}};
  var base={notes:[],constantes:[],traitements:[],lit:'',allergies:'',antecedents:'',groupe:'Inconnu',provenance:'Auto-présenté'};
  function P(num,o){return Object.assign({},base,{numero:'HC-000'+num},o)}
  var patients={
    p101:P(101,{nom:'Benali',prenom:'Karim',naissance:'1992-03-14',sexe:'M',groupe:'O-',triage:'rouge',motif:'Plaie pénétrante de l\'abdomen par éclat. Choc hémorragique compensé.',provenance:'Évacuation sanitaire',allergies:'Pénicilline',antecedents:'Aucun connu.',statut:'admis',lit:'A1',arriveLe:T('10:40'),admisLe:T('10:55'),
      notes:[N('11:10','Dr Lambert','Observation médicale','Abdomen avec défense diffuse. FAST positif. Remplissage en cours, 2 culots transfusés. Indication de laparotomie.'),N('13:35','Inf. Roux','Soins infirmiers','Transfert au bloc 1. Check-list pré-opératoire complétée. Consentement impossible (urgence vitale).')],
      constantes:[V('10:45',128,'92/58',94,36.1,26),V('11:30',116,'102/64',96,36.4,22),V('13:30',108,'108/66',97,36.6,20)],
      traitements:[R('t1','Métronidazole','500 mg','IV','toutes les 8 h',true,'11:15'),R('t2','Paracétamol','1 g','IV','toutes les 6 h',true,'11:15'),R('t3','Acide tranexamique','1 g','IV','dose unique',false,'10:50')]}),
    p102:P(102,{nom:'Moreau',prenom:'Élise',naissance:'1978-11-02',sexe:'F',groupe:'A+',triage:'orange',motif:'Fracture ouverte du tibia (Gustilo II) après chute d\'un toit.',provenance:'Équipe de terrain',antecedents:'Asthme léger.',statut:'admis',lit:'B1',arriveLe:T('08:20'),admisLe:T('08:50'),
      notes:[N('09:05','Dr Mbaye','Observation médicale','Pouls distal présent. Lavage et immobilisation faits. Fixateur externe prévu cet après-midi.')],
      constantes:[V('08:30',96,'124/78',98,36.8,18),V('12:00',88,'120/74',99,37.0,16)],
      traitements:[R('t1','Céfazoline','2 g','IV','toutes les 8 h',true,'08:55'),R('t2','Tramadol','100 mg','PO','toutes les 6 h',true,'09:00')]}),
    p103:P(103,{nom:'Diallo',prenom:'Amadou',naissance:'2009-06-21',sexe:'M',groupe:'B+',triage:'jaune',motif:'Brûlures du 2e degré aux deux mains (environ 4 % de surface).',provenance:'Auto-présenté',statut:'admis',lit:'C3',arriveLe:T('07:40'),admisLe:T('08:10'),
      notes:[N('08:15','Inf. Roux','Soins infirmiers','Refroidissement, pansements gras. Douleur 5/10.')],constantes:[V('08:00',92,'110/68',99,36.9,18)],
      traitements:[R('t1','Paracétamol','500 mg','PO','toutes les 6 h',true,'08:20')]}),
    p104:P(104,{nom:'Haddad',prenom:'Samira',naissance:'1965-01-30',sexe:'F',groupe:'B+',triage:'jaune',motif:'Décompensation cardiaque avec œdèmes des membres inférieurs.',antecedents:'HTA, diabète de type 2, insuffisance cardiaque connue.',allergies:'Aspirine',statut:'admis',lit:'C1',arriveLe:T('06:50',-1),admisLe:T('07:30',-1),
      notes:[N('07:45','Dr Okonkwo','Évolution','Diurèse correcte sous furosémide. Dyspnée en amélioration, œdèmes stables.',)],
      constantes:[V('07:00',104,'148/90',92,36.7,24),V('13:00',92,'138/84',95,36.6,20)],
      traitements:[R('t1','Furosémide','40 mg','IV','2 fois par jour',true,'07:40',-1),R('t2','Metformine','850 mg','PO','2 fois par jour',false,'07:40')]}),
    p105:P(105,{nom:'Petit',prenom:'Lucas',naissance:'1999-08-09',sexe:'M',triage:'jaune',motif:'Plaie de jambe de 6 cm à suturer, tétanos à vérifier.',statut:'attente',arriveLe:T('13:50')}),
    p106:P(106,{nom:'Rossi',prenom:'Marco',naissance:'1988-04-17',sexe:'M',groupe:'A+',triage:'orange',motif:'Douleur de la fosse iliaque droite avec fièvre. Suspicion d\'appendicite.',statut:'attente',arriveLe:T('14:05'),
      constantes:[V('14:10',102,'126/80',98,38.4,18)]}),
    p107:P(107,{nom:'Nguyen',prenom:'Linh',naissance:'1950-09-12',sexe:'F',groupe:'O+',triage:'rouge',motif:'Détresse respiratoire sur BPCO. Oxygène 4 L/min.',antecedents:'BPCO, tabagisme sevré.',statut:'admis',lit:'A2',arriveLe:T('12:30'),admisLe:T('12:45'),
      notes:[N('13:00','Dr Okonkwo','Observation médicale','Sibilants diffus, tirage. Nébulisations et corticoïdes débutés. À surveiller toutes les 30 min.')],
      constantes:[V('12:40',118,'150/86',86,37.2,32),V('13:15',108,'146/84',90,37.1,28),V('14:10',100,'140/82',92,37.0,24)],
      traitements:[R('t1','Salbutamol','5 mg','Inhalation','toutes les 4 h',true,'12:50'),R('t2','Prednisolone','40 mg','PO','1 fois par jour',true,'12:55')]}),
    p108:P(108,{nom:'Kone',prenom:'Fatou',naissance:'1995-12-03',sexe:'F',groupe:'A-',triage:'orange',motif:'Grossesse à 36 semaines avec pré-éclampsie sévère. Césarienne indiquée.',antecedents:'Deuxième grossesse.',statut:'admis',lit:'A3',arriveLe:T('11:30'),admisLe:T('11:50'),
      notes:[N('12:10','Dr Okonkwo','Observation médicale','TA 168/108, protéinurie 3+. Sulfate de magnésium débuté. Rythme cardiaque fœtal rassurant.')],
      constantes:[V('11:45',96,'168/108',98,36.8,18),V('13:45',90,'154/98',98,36.9,18)],
      traitements:[R('t1','Sulfate de magnésium','4 g puis 1 g/h','IV','perfusion continue',true,'12:15'),R('t2','Labétalol','200 mg','PO','toutes les 8 h',true,'12:20')]}),
    p109:P(109,{nom:'Garcia',prenom:'Pablo',naissance:'1972-05-25',sexe:'M',triage:'vert',motif:'Plaie superficielle de la main, nettoyage et pansement.',statut:'attente',arriveLe:T('14:15')}),
    p110:P(110,{nom:'Lefèvre',prenom:'Camille',naissance:'2001-02-14',sexe:'F',triage:'vert',motif:'Gastro-entérite, déshydratation légère.',statut:'attente',arriveLe:T('13:20')}),
    p111:P(111,{nom:'Traoré',prenom:'Ibrahim',naissance:'1983-07-07',sexe:'M',groupe:'O+',triage:'jaune',motif:'Appendicite aiguë, opéré ce matin.',statut:'admis',lit:'B3',arriveLe:T('06:40'),admisLe:T('07:00'),
      notes:[N('09:45','Dr Lambert','Observation médicale','Appendicectomie sans complication. Réveil calme.'),N('13:00','Inf. Roux','Soins infirmiers','Reprise du transit en cours. Douleur 2/10. Premier lever fait.')],
      constantes:[V('10:00',84,'122/76',98,36.9,16),V('13:00',78,'118/74',99,37.1,15)],
      traitements:[R('t1','Paracétamol','1 g','PO','toutes les 6 h',true,'10:30')]}),
    p112:P(112,{nom:'Schmidt',prenom:'Hanna',naissance:'1958-10-19',sexe:'F',triage:'jaune',motif:'Pneumonie communautaire.',statut:'sorti',arriveLe:T('08:00',-3),admisLe:T('08:30',-3),sortieLe:T('09:30',-1),destination:'Retour à domicile',
      notes:[N('09:30','Dr Okonkwo','Évolution','Apyrétique depuis 48 h. Sortie avec amoxicilline et consignes de surveillance.')]}),
    p113:P(113,{nom:'Okafor',prenom:'Chidi',naissance:'1990-01-08',sexe:'M',groupe:'B-',triage:'orange',motif:'Fracture diaphysaire du fémur, accident de la route.',statut:'admis',lit:'B4',arriveLe:T('07:15'),admisLe:T('07:45'),
      notes:[N('12:45','Dr Mbaye','Observation médicale','Enclouage centromédullaire réalisé sans incident. Appui interdit 6 semaines.')],
      constantes:[V('12:50',88,'116/70',98,36.7,16)],
      traitements:[R('t1','Énoxaparine','40 mg','SC','1 fois par jour',true,'13:30'),R('t2','Paracétamol','1 g','PO','toutes les 6 h',true,'13:30')]}),
    p114:P(114,{nom:'Bernard',prenom:'Léa',naissance:'1946-04-02',sexe:'F',groupe:'AB+',triage:'jaune',motif:'Déshydratation avec confusion, surveillance et réhydratation.',antecedents:'Démence débutante, HTA.',statut:'admis',lit:'C2',arriveLe:T('09:10'),admisLe:T('09:40'),
      constantes:[V('09:30',98,'104/62',95,37.6,20),V('13:30',86,'118/70',97,37.2,18)],
      traitements:[R('t1','Sérum physiologique','1000 mL','IV','sur 8 h',true,'09:45')]})
  };
  var S=function(pid,bloc,off,h,duree,acte,chir,ana,urg,statut){return {patientId:pid,bloc:bloc,debut:T(h,off),duree:duree,acte:acte,chirurgien:chir,anesthesie:ana,urgence:urg,statut:statut,notes:''}};
  var surgeries={
    s101:S('p111','Bloc 1',0,'08:00',90,'Appendicectomie','Dr Lambert','Anesthésie générale',false,'terminee'),
    s102:S('p113','Bloc 1',0,'10:00',150,'Enclouage du fémur','Dr Mbaye','Anesthésie générale',false,'terminee'),
    s103:S('p101','Bloc 1',0,'13:40',170,'Laparotomie d\'hémostase','Dr Lambert','Anesthésie générale',true,'en_cours'),
    s104:S('p108','Bloc 1',0,'18:30',60,'Césarienne','Dr Okonkwo','Rachianesthésie',true,'planifiee'),
    s105:S('p103','Bloc 2',0,'09:30',60,'Pansement des brûlures sous sédation','Dr Sow','Sédation',false,'terminee'),
    s106:S('p102','Bloc 2',0,'15:30',120,'Fixateur externe du tibia','Dr Mbaye','Anesthésie générale',false,'planifiee'),
    s107:S('p106','Bloc 1',1,'08:00',90,'Appendicectomie','Dr Lambert','Anesthésie générale',false,'planifiee'),
    s108:S('p101','Bloc 2',1,'09:00',60,'Réintervention programmée (second look)','Dr Lambert','Anesthésie générale',false,'planifiee')
  };
  return {patients:patients,surgeries:surgeries};
}
module.exports = { buildSeed };
