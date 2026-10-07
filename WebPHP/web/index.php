<title>Hôpital de campagne Delta</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
/* Layout: poste de commandement. En-tête + onglets, puis quatre vues (tableau de bord, admissions, bloc, dossiers). Couleurs de tri NATO T1-T4 en sémantique. */
:root {
  --bg: #ECEFE8;
  --surface: #F8FAF5;
  --surface2: #E1E7DD;
  --fg: #17231E;
  --muted: #55645D;
  --line: #C6CFC1;
  --accent: #1D6A56;
  --accent-fg: #FFFFFF;
  --t1: #C42E2E;
  --t2: #C98200;
  --t3: #2C8A4D;
  --t4: #48545D;
  --info: #2A68B0;
  --font-display: 'Barlow Condensed', 'Arial Narrow', 'Helvetica Neue', sans-serif;
  --font-body: 'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0F1613; --surface: #17211D; --surface2: #202D28; --fg: #E5EDE8; --muted: #92A59B; --line: #2B3A34;
    --accent: #4DB896; --accent-fg: #06201A; --t1: #F06C6C; --t2: #EDB041; --t3: #5CC585; --t4: #9AA8B0; --info: #6CABE8;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0F1613; --surface: #17211D; --surface2: #202D28; --fg: #E5EDE8; --muted: #92A59B; --line: #2B3A34;
  --accent: #4DB896; --accent-fg: #06201A; --t1: #F06C6C; --t2: #EDB041; --t3: #5CC585; --t4: #9AA8B0; --info: #6CABE8;
  color-scheme: dark;
}

* { box-sizing: border-box; }
body { background: var(--bg); color: var(--fg); font-family: var(--font-body); font-size: 14px; line-height: 1.5; padding-inline: 16px; padding-block: 0 48px; }
h1, h2, h3, p { margin: 0; }
button, input, select, textarea { font: inherit; color: inherit; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.mono { font-family: var(--font-mono); }

.shell { max-width: 1240px; margin-inline: auto; }

/* En-tête */
.top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; padding-block: 20px 14px; }
.brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.tent { width: 40px; height: 34px; background: var(--accent); clip-path: polygon(50% 0, 100% 100%, 62% 100%, 50% 62%, 38% 100%, 0 100%); flex: none; }
h1 { font-family: var(--font-display); font-weight: 700; font-size: 30px; line-height: 1; letter-spacing: 0.02em; text-transform: uppercase; text-wrap: balance; }
.sub { color: var(--muted); font-size: 13px; margin-top: 4px; }
.clock { display: flex; flex-direction: column; align-items: flex-end; font-family: var(--font-mono); font-size: 12px; color: var(--muted); line-height: 1.3; }
.clock b { font-size: 20px; font-weight: 500; color: var(--fg); letter-spacing: 0.04em; }
.demo-note { font-size: 12px; color: var(--muted); border-top: 1px solid var(--line); padding-top: 8px; }

/* Onglets */
.tabs { display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid var(--line); margin-top: 10px; }
.tab { background: none; border: 0; border-bottom: 3px solid transparent; padding: 12px 14px 10px; cursor: pointer; font-family: var(--font-display); font-weight: 600; font-size: 18px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); white-space: nowrap; }
.tab:hover { color: var(--fg); }
.tab[aria-selected="true"] { color: var(--fg); border-bottom-color: var(--accent); }

main { padding-top: 22px; }
.view { display: flex; flex-direction: column; gap: 22px; }
h2 { font-family: var(--font-display); font-weight: 600; font-size: 24px; letter-spacing: 0.02em; text-transform: uppercase; text-wrap: balance; }
.lab { display: block; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
.section-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 16px; margin-bottom: 12px; }
.hint { color: var(--muted); font-size: 13px; }

.panel { background: var(--surface); border: 1px solid var(--line); border-radius: 4px; padding: 16px; min-width: 0; }

/* Bandeau de synthèse */
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); background: var(--surface); border: 1px solid var(--line); border-radius: 4px; }
.stat { padding: 14px 16px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); margin: 0 -1px -1px 0; }
.stat .v { font-family: var(--font-display); font-weight: 600; font-size: 38px; line-height: 1; font-variant-numeric: tabular-nums; }
.stat .v small { font-size: 20px; color: var(--muted); font-weight: 500; }
.stat .k { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-top: 6px; }

.cols { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 22px; align-items: start; }
.stack { display: flex; flex-direction: column; gap: 22px; min-width: 0; }

/* Triage */
.t1 { --c: var(--t1); } .t2 { --c: var(--t2); } .t3 { --c: var(--t3); } .t4 { --c: var(--t4); }
.badge { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono); font-size: 11px; line-height: 1.4; padding: 1px 7px; border-radius: 2px; border: 1px solid var(--c, var(--line)); background: color-mix(in srgb, var(--c, var(--muted)) 16%, var(--surface)); color: var(--fg); white-space: nowrap; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c); display: inline-block; flex: none; }

/* Plan des lits */
.zones { display: flex; flex-direction: column; gap: 16px; }
.zone-title { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 12px; color: var(--muted); margin-bottom: 6px; }
.beds { display: grid; grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); gap: 6px; }
.bed { display: flex; flex-direction: column; justify-content: space-between; height: 50px; padding: 4px 6px; border-radius: 3px; font-family: var(--font-mono); font-size: 11px; text-align: left; }
.bed.free { border: 1px dashed var(--line); color: var(--muted); background: transparent; }
.bed.occ { border: 1px solid var(--c); background: color-mix(in srgb, var(--c) 24%, var(--surface)); cursor: pointer; }
.bed.occ:hover { background: color-mix(in srgb, var(--c) 36%, var(--surface)); }
.bed .code { font-weight: 500; }

.tribar { display: flex; height: 14px; border-radius: 2px; overflow: hidden; background: var(--surface2); }
.tribar span { background: var(--c); min-width: 0; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font-size: 13px; }
.legend b { font-family: var(--font-mono); font-weight: 500; }

/* Listes */
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.list li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid var(--line); }
.list li:first-child { border-top: 0; padding-top: 0; }
.list .main { min-width: 0; }
.list .name { font-weight: 600; }
.list .meta { color: var(--muted); font-size: 13px; overflow-wrap: anywhere; }
.empty { color: var(--muted); padding: 8px 0; }

/* Boutons et champs */
.btn { border: 1px solid var(--accent); background: var(--accent); color: var(--accent-fg); padding: 8px 14px; border-radius: 3px; cursor: pointer; font-weight: 500; }
.btn:hover { filter: brightness(1.08); }
.btn.ghost { background: transparent; color: var(--fg); border-color: var(--line); }
.btn.ghost:hover { border-color: var(--accent); }
.btn.small { padding: 4px 10px; font-size: 13px; }
.btn.danger { background: var(--t1); border-color: var(--t1); color: #fff; }
input, select, textarea { width: 100%; padding: 8px 10px; border: 1px solid var(--line); border-radius: 3px; background: var(--bg); min-width: 0; }
textarea { resize: vertical; min-height: 64px; }
input[type="radio"] { width: auto; }
.fgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
.fgrid .wide { grid-column: 1 / -1; }
form { display: flex; flex-direction: column; gap: 12px; }
fieldset { border: 0; padding: 0; margin: 0; min-width: 0; }
.tri-pick { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
.tri-pick label { position: relative; }
.tri-pick input { position: absolute; opacity: 0; inset: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
.tri-pick span { display: block; padding: 8px 10px; border: 1px solid var(--line); border-radius: 3px; background: var(--bg); font-size: 13px; }
.tri-pick input:checked + span { border-color: var(--c); background: color-mix(in srgb, var(--c) 22%, var(--surface)); font-weight: 600; }
.tri-pick input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }
.msg { font-size: 13px; min-height: 20px; }
.msg.err { color: var(--t1); font-weight: 500; }
.msg.ok { color: var(--t3); }

/* Tableaux */
.tscroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 640px; }
th { text-align: left; font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); padding: 6px 8px; border-bottom: 1px solid var(--line); white-space: nowrap; }
td { padding: 9px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
td.num, th.num { font-variant-numeric: tabular-nums; font-family: var(--font-mono); font-size: 13px; }
.flag { color: var(--t1); font-weight: 600; }
.link { background: none; border: 0; padding: 0; cursor: pointer; font-weight: 600; text-align: left; text-decoration: underline; text-decoration-color: var(--line); text-underline-offset: 3px; }
.link:hover { text-decoration-color: var(--accent); }
td select { padding: 4px 6px; width: auto; }

.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { border: 1px solid var(--line); background: transparent; padding: 4px 12px; border-radius: 99px; cursor: pointer; font-size: 13px; }
.chip[aria-pressed="true"] { background: var(--fg); color: var(--bg); border-color: var(--fg); }

/* Bloc opératoire */
.bloc-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 22px; align-items: start; }
.daynav { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.daynav .date { font-family: var(--font-display); font-size: 22px; font-weight: 600; min-width: 190px; text-align: center; text-transform: capitalize; }
.tl-scroll { overflow-x: auto; }
.tl { min-width: 760px; padding-right: 18px; }
.tl-row { display: grid; grid-template-columns: 72px minmax(0, 1fr); align-items: stretch; }
.tl-hours { position: relative; height: 22px; font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
.tl-hours span { position: absolute; transform: translateX(-50%); }
.tl-room { font-family: var(--font-display); font-weight: 600; font-size: 17px; letter-spacing: 0.04em; text-transform: uppercase; display: flex; align-items: center; border-top: 1px solid var(--line); }
.tl-track { position: relative; height: 64px; border-top: 1px solid var(--line); border-right: 1px solid var(--line); background-image: linear-gradient(to right, var(--line) 1px, transparent 1px); background-size: calc(100% / 12) 100%; }
.tl-body { position: relative; }
.tl-body .tl-row:last-child .tl-room, .tl-body .tl-row:last-child .tl-track { border-bottom: 1px solid var(--line); }
.now { position: absolute; top: 0; bottom: 0; width: 2px; background: var(--t1); z-index: 2; pointer-events: none; }
.op { position: absolute; top: 6px; bottom: 6px; padding: 3px 6px; text-align: left; overflow: hidden; border: 1px solid var(--c); border-radius: 2px; background: color-mix(in srgb, var(--c) 22%, var(--surface)); cursor: pointer; font-size: 12px; line-height: 1.3; z-index: 1; }
.op:hover { background: color-mix(in srgb, var(--c) 34%, var(--surface)); }
.op.prog { --c: var(--info); }
.op b { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.op i { display: block; font-style: normal; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.keys { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: var(--muted); margin-top: 10px; }
.keys span::before { content: ''; display: inline-block; width: 10px; height: 10px; margin-right: 6px; border: 1px solid var(--c); background: color-mix(in srgb, var(--c) 30%, var(--surface)); vertical-align: -1px; }
.keys .k1 { --c: var(--t1); } .keys .k2 { --c: var(--info); }

/* Dossiers */
.dossier-grid { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 22px; align-items: start; }
.plist { display: flex; flex-direction: column; margin-top: 12px; max-height: 640px; overflow-y: auto; }
.pitem { display: flex; flex-direction: column; gap: 3px; text-align: left; padding: 10px 8px; border: 0; border-top: 1px solid var(--line); background: none; cursor: pointer; width: 100%; }
.pitem:hover { background: var(--surface2); }
.pitem[aria-current="true"] { background: var(--surface2); box-shadow: inset 3px 0 0 var(--c); }
.pitem .row1 { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
.pitem .nm { font-weight: 600; }
.pitem .mt { color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
.dhead { display: flex; flex-direction: column; gap: 8px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
.dhead h2 { font-size: 30px; }
.dmeta { display: flex; flex-wrap: wrap; gap: 4px 16px; color: var(--muted); font-size: 13px; }
.allergy { padding: 8px 12px; border: 1px solid var(--t1); border-radius: 3px; background: color-mix(in srgb, var(--t1) 12%, var(--surface)); font-size: 13px; }
.allergy.none { border-color: var(--line); background: transparent; color: var(--muted); }
.dsec { padding-top: 18px; display: flex; flex-direction: column; gap: 10px; }
.dsec h3 { font-family: var(--font-display); font-weight: 600; font-size: 19px; letter-spacing: 0.04em; text-transform: uppercase; }
.notes { display: flex; flex-direction: column; gap: 8px; }
.note { border-top: 1px solid var(--line); padding-top: 8px; }
.note .by { font-family: var(--font-mono); font-size: 11px; color: var(--muted); }
.note p { overflow-wrap: anywhere; white-space: pre-wrap; }
.inline-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; align-items: end; }
.inline-form .btn { align-self: end; }
.state-row { display: flex; flex-wrap: wrap; gap: 12px; }
.state-row > div { flex: 1 1 180px; min-width: 0; }

.toast { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); background: var(--fg); color: var(--bg); padding: 10px 16px; border-radius: 3px; font-size: 13px; max-width: calc(100% - 32px); z-index: 10; }
.foot { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; margin-top: 36px; padding-top: 14px; border-top: 1px solid var(--line); color: var(--muted); font-size: 12px; }

@media (max-width: 980px) {
  .cols, .bloc-grid, .dossier-grid { grid-template-columns: minmax(0, 1fr); }
  .plist { max-height: 320px; }
}
@media (max-width: 520px) {
  h1 { font-size: 24px; }
  .clock { align-items: flex-start; }
  .daynav .date { min-width: 0; flex: 1 1 100%; order: -1; text-align: left; }
}
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
</style>

<div class="shell">
  <header class="top">
    <div class="brand">
      <div class="tent" aria-hidden="true"></div>
      <div>
        <h1>Hôpital de campagne Delta</h1>
        <p class="sub">Admissions, bloc opératoire et dossiers patients</p>
      </div>
    </div>
    <div class="clock" aria-label="Date et heure"><span id="clock-date"></span><b id="clock-time"></b></div>
  </header>
  <p class="demo-note">Démonstration : patients, noms et chiffres sont fictifs. Les données restent dans ce navigateur. Ne saisissez aucune donnée de santé réelle.</p>

  <nav class="tabs" role="tablist" aria-label="Sections">
    <button class="tab" role="tab" id="tab-dashboard" aria-controls="view-dashboard" data-action="tab" data-view="dashboard">Tableau de bord</button>
    <button class="tab" role="tab" id="tab-admissions" aria-controls="view-admissions" data-action="tab" data-view="admissions">Admissions</button>
    <button class="tab" role="tab" id="tab-bloc" aria-controls="view-bloc" data-action="tab" data-view="bloc">Bloc opératoire</button>
    <button class="tab" role="tab" id="tab-dossiers" aria-controls="view-dossiers" data-action="tab" data-view="dossiers">Dossiers patients</button>
  </nav>

  <main>
    <!-- TABLEAU DE BORD -->
    <section class="view" id="view-dashboard" role="tabpanel" aria-labelledby="tab-dashboard">
      <div class="stats" id="stats"></div>
      <div class="cols">
        <div class="stack">
          <div class="panel">
            <div class="section-head"><h2>Plan des lits</h2><span class="hint">Cliquer sur un lit occupé ouvre le dossier</span></div>
            <div class="zones" id="bedmap"></div>
          </div>
        </div>
        <div class="stack">
          <div class="panel">
            <div class="section-head"><h2>File d'attente</h2><span class="hint">Triée par catégorie de tri</span></div>
            <ul class="list" id="queue"></ul>
          </div>
          <div class="panel">
            <div class="section-head"><h2>Prochaines interventions</h2></div>
            <ul class="list" id="nextops"></ul>
          </div>
          <div class="panel">
            <div class="section-head"><h2>Répartition du tri</h2></div>
            <div id="tridist"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ADMISSIONS -->
    <section class="view" id="view-admissions" role="tabpanel" aria-labelledby="tab-admissions" hidden>
      <div class="cols">
        <div class="panel">
          <div class="section-head"><h2>Registre des patients</h2><div class="chips" id="adm-filters"></div></div>
          <div class="tscroll" id="adm-table"></div>
        </div>
        <div class="panel">
          <div class="section-head"><h2>Nouvelle admission</h2></div>
          <form id="form-adm" data-form="admission" autocomplete="off">
            <div class="fgrid">
              <div><label class="lab" for="adm-nom">Nom</label><input id="adm-nom" name="nom" required></div>
              <div><label class="lab" for="adm-prenom">Prénom</label><input id="adm-prenom" name="prenom" required></div>
              <div><label class="lab" for="adm-naissance">Date de naissance</label><input id="adm-naissance" name="naissance" type="date" required></div>
              <div><label class="lab" for="adm-sexe">Sexe</label><select id="adm-sexe" name="sexe"><option value="F">Femme</option><option value="M">Homme</option></select></div>
              <div><label class="lab" for="adm-groupe">Groupe sanguin</label>
                <select id="adm-groupe" name="groupe"><option value="">Inconnu</option><option>O-</option><option>O+</option><option>A-</option><option>A+</option><option>B-</option><option>B+</option><option>AB-</option><option>AB+</option></select></div>
              <div><label class="lab" for="adm-zone">Zone d'accueil</label><select id="adm-zone" name="zone"></select></div>
              <div class="wide"><label class="lab" for="adm-allergies">Allergies connues</label><input id="adm-allergies" name="allergies" placeholder="Laisser vide si aucune"></div>
            </div>
            <fieldset>
              <legend class="lab">Catégorie de tri</legend>
              <div class="tri-pick">
                <label class="t1"><input type="radio" name="triage" value="1" required><span>T1 · Immédiat</span></label>
                <label class="t2"><input type="radio" name="triage" value="2"><span>T2 · Différé</span></label>
                <label class="t3"><input type="radio" name="triage" value="3"><span>T3 · Mineur</span></label>
                <label class="t4"><input type="radio" name="triage" value="4"><span>T4 · Expectant</span></label>
              </div>
            </fieldset>
            <div><label class="lab" for="adm-motif">Motif d'admission</label><textarea id="adm-motif" name="motif" required></textarea></div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn" type="submit">Admettre le patient</button><span class="msg" id="adm-msg" role="alert"></span></div>
          </form>
        </div>
      </div>
    </section>

    <!-- BLOC OPERATOIRE -->
    <section class="view" id="view-bloc" role="tabpanel" aria-labelledby="tab-bloc" hidden>
      <div class="bloc-grid">
        <div class="stack">
          <div class="panel">
            <div class="section-head">
              <div class="daynav">
                <button class="btn ghost small" data-action="day-prev" aria-label="Jour précédent">Précédent</button>
                <h2 class="date" id="bloc-date"></h2>
                <button class="btn ghost small" data-action="day-next" aria-label="Jour suivant">Suivant</button>
                <button class="btn ghost small" data-action="day-today">Aujourd'hui</button>
              </div>
              <span class="hint" id="bloc-sum"></span>
            </div>
            <div class="tl-scroll"><div class="tl" id="timeline"></div></div>
            <div class="keys"><span class="k1">Urgence</span><span class="k2">Programmée</span><span>Trait rouge : heure actuelle</span></div>
          </div>
          <div class="panel">
            <div class="section-head"><h2>Interventions du jour</h2></div>
            <div class="tscroll" id="ops-table"></div>
          </div>
        </div>
        <div class="panel">
          <div class="section-head"><h2>Réserver une salle</h2></div>
          <form id="form-op" data-form="op" autocomplete="off">
            <div><label class="lab" for="op-patient">Patient</label><select id="op-patient" name="patient" required></select></div>
            <div class="fgrid">
              <div><label class="lab" for="op-salle">Salle</label><select id="op-salle" name="salle"></select></div>
              <div><label class="lab" for="op-prio">Priorité</label><select id="op-prio" name="prio"><option value="programmee">Programmée</option><option value="urgence">Urgence</option></select></div>
              <div><label class="lab" for="op-date">Date</label><input id="op-date" name="date" type="date" required></div>
              <div><label class="lab" for="op-start">Début</label><input id="op-start" name="start" type="time" min="07:00" max="19:00" value="08:00" required></div>
              <div class="wide"><label class="lab" for="op-duree">Durée prévue</label>
                <select id="op-duree" name="duree"><option value="30">30 min</option><option value="45">45 min</option><option value="60" selected>1 h</option><option value="90">1 h 30</option><option value="120">2 h</option><option value="150">2 h 30</option><option value="180">3 h</option><option value="240">4 h</option></select></div>
            </div>
            <div><label class="lab" for="op-type">Intervention</label><input id="op-type" name="type" list="dl-types" required placeholder="Ex. Appendicectomie"></div>
            <div><label class="lab" for="op-chir">Chirurgien</label><input id="op-chir" name="chir" list="dl-chir" required placeholder="Ex. Dr Lefèvre"></div>
            <datalist id="dl-types"><option>Appendicectomie</option><option>Parage de plaie</option><option>Laparotomie exploratrice</option><option>Ostéosynthèse</option><option>Amputation</option><option>Drainage thoracique</option><option>Césarienne</option><option>Réduction de fracture</option><option>Greffe cutanée</option></datalist>
            <datalist id="dl-chir"><option>Dr Lefèvre</option><option>Dr Okafor</option><option>Dr Marchand</option><option>Dr Vidal</option></datalist>
            <div class="hint">Plage du planning : 07:00 à 19:00. Un délai de 15 min de nettoyage est réservé entre deux interventions dans la même salle.</div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="btn" type="submit">Réserver</button></div>
            <p class="msg" id="op-msg" role="alert"></p>
          </form>
        </div>
      </div>
    </section>

    <!-- DOSSIERS -->
    <section class="view" id="view-dossiers" role="tabpanel" aria-labelledby="tab-dossiers" hidden>
      <div class="dossier-grid">
        <div class="panel">
          <label class="lab" for="dossier-search">Rechercher</label>
          <input id="dossier-search" type="search" placeholder="Nom, lit, motif">
          <div class="plist" id="plist"></div>
        </div>
        <div class="panel" id="dossier"></div>
      </div>
    </section>
  </main>

  <div class="foot">
    <span>Les modifications sont conservées dans ce navigateur uniquement.</span>
    <button class="btn ghost small" data-action="reset">Réinitialiser la démo</button>
  </div>
</div>
<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>

<script>
(function () {
  'use strict';
  var KEY = 'hdc-delta-demo-v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var ZONES = [
    { id: 'U', nom: 'Urgences et tri', n: 8 },
    { id: 'P', nom: 'Réveil post-opératoire', n: 6 },
    { id: 'H', nom: 'Hospitalisation', n: 10 }
  ];
  var SALLES = ['Bloc 1', 'Bloc 2', 'Bloc 3'];
  var TRIAGE = { 1: { code: 'T1', label: 'Immédiat' }, 2: { code: 'T2', label: 'Différé' }, 3: { code: 'T3', label: 'Mineur' }, 4: { code: 'T4', label: 'Expectant' } };
  var STATUTS = { attente: 'En attente', admis: 'Admis', bloc: 'Au bloc', postop: 'Post-op', sorti: 'Sorti' };
  var START = 420, END = 1140, SPAN = END - START, BUF = 15;

  /* Dates */
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayISO() { return iso(new Date()); }
  function addDays(s, n) { var d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); }
  function fmtDate(s) { return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function mm(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function toMin(t) { var p = t.split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
  function nowMin() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function fmtTs(ms) { var d = new Date(ms); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  function since(ms) { var m = Math.max(0, Math.round((Date.now() - ms) / 60000)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + pad(m % 60); }
  function age(s) { var b = new Date(s + 'T12:00:00'), n = new Date(); var a = n.getFullYear() - b.getFullYear(); var m = n.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--; return a; }
  function dur(m) { return m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + pad(m % 60) : '') : m + ' min'; }

  /* Données de démonstration */
  function seed() {
    var now = Date.now(), M = 60000, today = todayISO(), tomorrow = addDays(today, 1);
    function P(id, nom, prenom, naiss, sexe, groupe, all, tri, motif, statut, lit, ago, vitals, notes, trait) {
      return {
        id: id, nom: nom, prenom: prenom, naissance: naiss, sexe: sexe, groupe: groupe, allergies: all, triage: tri, motif: motif, statut: statut, lit: lit, admisLe: now - ago * M,
        vitals: vitals.map(function (v) { return { t: now - v[0] * M, fc: v[1], ta: v[2], spo2: v[3], temp: v[4] }; }),
        notes: notes.map(function (n) { return { t: now - n[0] * M, auteur: n[1], texte: n[2] }; }),
        traitements: trait.map(function (t) { return { t: now - t[0] * M, nom: t[1], dose: t[2], voie: t[3] }; })
      };
    }
    var patients = [
      P('p1', 'Moreau', 'Étienne', '1991-03-14', 'M', 'O-', 'Latex', 1, 'Plaie abdominale par éclat, instabilité hémodynamique', 'bloc', 'U1', 95,
        [[90, 128, '90/55', 93, 36.1], [40, 118, '100/60', 95, 36.4]],
        [[88, 'Dr Lefèvre', 'Triage T1. Abdomen distendu, FAST positif. Transfusion de 2 culots O- avant transfert au bloc.']],
        [[85, 'Acide tranexamique', '1 g', 'IV'], [80, 'Ceftriaxone', '2 g', 'IV']]),
      P('p2', 'Benali', 'Samir', '1984-11-02', 'M', 'A+', '', 2, 'Fracture ouverte du tibia droit', 'admis', 'U2', 210,
        [[200, 96, '125/80', 98, 36.8], [60, 92, '120/78', 98, 37.0]],
        [[195, 'Dr Vidal', 'Fracture ouverte Gustilo II. Parage à prévoir, fixateur externe.']],
        [[190, 'Amoxicilline-acide clavulanique', '2 g', 'IV'], [190, 'Paracétamol', '1 g', 'IV']]),
      P('p3', 'Laurent', 'Chloé', '1998-07-21', 'F', 'B+', '', 2, 'Brûlures du 2e degré, avant-bras gauche (8 % de la surface corporelle)', 'admis', 'H1', 400,
        [[380, 88, '118/72', 99, 36.9]], [[370, 'Dr Marchand', 'Pansements gras. Greffe cutanée à planifier.']], [[360, 'Morphine', '5 mg', 'SC']]),
      P('p4', 'Diallo', 'Awa', '1976-01-30', 'F', 'O+', 'Aspirine', 3, 'Entorse sévère de cheville, suspicion de fracture', 'attente', null, 25, [], [], []),
      P('p5', 'Petit', 'Julien', '2003-05-09', 'M', 'AB+', '', 3, 'Plaie profonde de la cuisse à suturer', 'attente', null, 40, [[35, 84, '124/76', 99, 36.7]], [], []),
      P('p6', 'Rossi', 'Marco', '1969-09-17', 'M', 'A-', 'Iode', 1, 'Pneumothorax suffocant, détresse respiratoire', 'admis', 'U3', 30,
        [[28, 124, '105/65', 89, 36.5], [10, 112, '110/70', 92, 36.5]],
        [[27, 'Dr Okafor', 'Silence auscultatoire à droite. Drainage thoracique programmé en urgence.']], [[25, 'Oxygène', '10 L/min', 'Masque']]),
      P('p7', 'Haddad', 'Nadia', '1990-12-05', 'F', 'O+', '', 2, 'Appendicite aiguë, défense en fosse iliaque droite', 'admis', 'H2', 300,
        [[290, 96, '122/74', 98, 38.6]], [[280, 'Dr Marchand', 'Apyrexie non obtenue. Appendicectomie programmée.']], [[270, 'Ceftriaxone', '2 g', 'IV']]),
      P('p8', 'Girard', 'Paul', '1958-04-26', 'M', 'B-', 'Morphine (nausées)', 2, 'Amputation traumatique de jambe, suites opératoires J0', 'postop', 'P1', 600,
        [[120, 82, '128/76', 97, 36.6]], [[110, 'Dr Okafor', 'Réveil calme. Douleur contrôlée.']], [[100, 'Paracétamol', '1 g', 'IV']]),
      P('p9', 'Nguyen', 'Linh', '2011-08-12', 'F', 'A+', '', 3, 'Fracture de l\'avant-bras, réduction à effectuer', 'admis', 'H3', 180, [[170, 92, '105/65', 99, 36.8]], [], []),
      P('p10', 'Fabre', 'Océane', '1994-02-03', 'F', 'O-', '', 2, 'Laparotomie d\'hémostase, suites opératoires J1', 'postop', 'P2', 1500,
        [[60, 108, '98/60', 96, 37.4]], [[55, 'Dr Lefèvre', 'Surveillance du drain. Hémoglobine de contrôle à 10 h.']], [[50, 'Cefazoline', '2 g', 'IV']]),
      P('p11', 'Traoré', 'Ibrahim', '1987-06-18', 'M', 'B+', '', 4, 'Traumatisme crânien grave, Glasgow 4', 'admis', 'U4', 70, [[65, 140, '80/40', 85, 35.0]], [[60, 'Dr Lefèvre', 'Catégorie expectant. Soins de confort.']], [])
    ];
    function O(id, p, salle, date, start, duree, type, chir, prio) { return { id: id, patientId: p, salle: salle, date: date, start: start, duree: duree, type: type, chir: chir, prio: prio }; }
    var ops = [
      O('o1', 'p8', 'Bloc 1', today, 480, 120, 'Révision de moignon', 'Dr Okafor', 'programmee'),
      O('o2', 'p1', 'Bloc 1', today, 690, 150, 'Laparotomie exploratrice', 'Dr Lefèvre', 'urgence'),
      O('o3', 'p7', 'Bloc 2', today, 540, 60, 'Appendicectomie', 'Dr Marchand', 'programmee'),
      O('o4', 'p2', 'Bloc 2', today, 780, 120, 'Ostéosynthèse (fixateur externe)', 'Dr Vidal', 'programmee'),
      O('o5', 'p6', 'Bloc 3', today, 630, 45, 'Drainage thoracique', 'Dr Okafor', 'urgence'),
      O('o6', 'p3', 'Bloc 3', today, 900, 60, 'Parage et greffe cutanée', 'Dr Marchand', 'programmee'),
      O('o7', 'p9', 'Bloc 2', tomorrow, 510, 45, 'Réduction de fracture', 'Dr Vidal', 'programmee')
    ];
    return { patients: patients, ops: ops, seq: 100 };
  }

  var state;
  function load() {
    try {
      var r = localStorage.getItem(KEY);
      if (r) { var s = JSON.parse(r); if (s && Array.isArray(s.patients) && Array.isArray(s.ops)) { return s; } }
    } catch (e) { /* stockage indisponible */ }
    return seed();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignoré */ } }
  state = load();

  var ui = { view: 'dashboard', filter: 'actifs', blocDate: todayISO(), dossierId: null, search: '', auteur: '' };

  /* Aides */
  function pat(id) { return state.patients.find(function (p) { return p.id === id; }); }
  function patName(id) { var p = pat(id); return p ? p.nom.toUpperCase() + ' ' + p.prenom : 'Patient inconnu'; }
  function active() { return state.patients.filter(function (p) { return p.statut !== 'sorti'; }); }
  function bedsOf(z) { var a = []; for (var i = 1; i <= z.n; i++) { a.push(z.id + i); } return a; }
  function occupant(b) { return state.patients.find(function (p) { return p.lit === b && p.statut !== 'sorti'; }); }
  function freeBeds(zid) { var z = ZONES.find(function (x) { return x.id === zid; }); return bedsOf(z).filter(function (b) { return !occupant(b); }); }
  function autoBed(p) {
    var order = p.statut === 'postop' ? ['P', 'H', 'U'] : ['U', 'H', 'P'];
    for (var i = 0; i < order.length; i++) { var f = freeBeds(order[i]); if (f.length) { return f[0]; } }
    return null;
  }
  function triBadge(t) { return '<span class="badge t' + t + '"><span class="dot"></span>' + TRIAGE[t].code + ' ' + TRIAGE[t].label + '</span>'; }
  function byStart(a, b) { return a.start - b.start; }
  function byTriage(a, b) { return a.triage - b.triage || a.admisLe - b.admisLe; }
  function nextId(prefix) { state.seq += 1; return prefix + state.seq; }

  var toastTimer;
  function toast(msg) { var el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 3500); }
  function confirmClick(btn, label, fn) {
    if (btn.dataset.armed) { fn(); return; }
    btn.dataset.armed = '1';
    var old = btn.textContent;
    btn.textContent = label;
    btn.classList.add('danger');
    setTimeout(function () { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = old; btn.classList.remove('danger'); } }, 3000);
  }

  /* Tableau de bord */
  function renderDashboard() {
    var act = active();
    var occ = act.filter(function (p) { return p.lit; }).length;
    var total = ZONES.reduce(function (s, z) { return s + z.n; }, 0);
    var waiting = act.filter(function (p) { return p.statut === 'attente'; }).sort(byTriage);
    var today = todayISO(), nm = nowMin();
    var opsT = state.ops.filter(function (o) { return o.date === today; }).sort(byStart);
    var busy = SALLES.filter(function (s) { return opsT.some(function (o) { return o.salle === s && o.start <= nm && nm < o.start + o.duree; }); }).length;
    var t1 = act.filter(function (p) { return p.triage === 1; }).length;
    $('#stats').innerHTML =
      '<div class="stat"><div class="v">' + occ + '<small> / ' + total + '</small></div><div class="k">Lits occupés</div></div>' +
      '<div class="stat"><div class="v">' + waiting.length + '</div><div class="k">En attente de prise en charge</div></div>' +
      '<div class="stat"><div class="v">' + t1 + '</div><div class="k">Patients T1 actifs</div></div>' +
      '<div class="stat"><div class="v">' + opsT.length + '</div><div class="k">Interventions aujourd\'hui</div></div>' +
      '<div class="stat"><div class="v">' + (SALLES.length - busy) + '<small> / ' + SALLES.length + '</small></div><div class="k">Salles libres à cette heure</div></div>';

    $('#bedmap').innerHTML = ZONES.map(function (z) {
      var beds = bedsOf(z), used = beds.filter(function (b) { return occupant(b); }).length;
      return '<div><div class="zone-title"><span>' + esc(z.nom) + '</span><span>' + used + ' / ' + z.n + '</span></div><div class="beds">' +
        beds.map(function (b) {
          var p = occupant(b);
          if (!p) { return '<div class="bed free" aria-label="Lit ' + b + ' libre"><span class="code">' + b + '</span><span>libre</span></div>'; }
          return '<button type="button" class="bed occ t' + p.triage + '" data-action="open-dossier" data-id="' + p.id + '" title="' + esc(p.nom + ' ' + p.prenom) + '"><span class="code">' + b + '</span><span>' + TRIAGE[p.triage].code + ' ' + esc(p.nom.slice(0, 6)) + '</span></button>';
        }).join('') + '</div></div>';
    }).join('');

    $('#queue').innerHTML = waiting.length ? waiting.map(function (p) {
      return '<li><div class="main"><div class="name">' + esc(p.nom.toUpperCase() + ' ' + p.prenom) + ' ' + triBadge(p.triage) + '</div><div class="meta">' + esc(p.motif) + ' · depuis ' + since(p.admisLe) + '</div></div><button class="btn ghost small" data-action="open-dossier" data-id="' + p.id + '">Ouvrir</button></li>';
    }).join('') : '<li class="empty">Aucun patient en attente.</li>';

    var upcoming = opsT.filter(function (o) { return o.start + o.duree > nm; }).slice(0, 4);
    $('#nextops').innerHTML = upcoming.length ? upcoming.map(function (o) {
      var running = o.start <= nm;
      return '<li><div class="main"><div class="name">' + mm(o.start) + ' · ' + esc(o.salle) + (running ? ' <span class="badge t3"><span class="dot"></span>En cours</span>' : '') + '</div><div class="meta">' + esc(patName(o.patientId)) + ' · ' + esc(o.type) + ' · ' + esc(o.chir) + '</div></div></li>';
    }).join('') : '<li class="empty">Plus d\'intervention prévue aujourd\'hui.</li>';

    var counts = [1, 2, 3, 4].map(function (t) { return act.filter(function (p) { return p.triage === t; }).length; });
    var sum = counts.reduce(function (a, b) { return a + b; }, 0);
    $('#tridist').innerHTML = sum ?
      '<div class="tribar" role="img" aria-label="Répartition du tri">' + counts.map(function (c, i) { return c ? '<span class="t' + (i + 1) + '" style="flex:' + c + '"></span>' : ''; }).join('') + '</div>' +
      '<div class="legend">' + counts.map(function (c, i) { return '<span class="t' + (i + 1) + '"><span class="dot"></span> <b>' + c + '</b> ' + TRIAGE[i + 1].code + ' ' + TRIAGE[i + 1].label + '</span>'; }).join('') + '</div>' : '<p class="empty">Aucun patient actif.</p>';
  }

  /* Admissions */
  function renderAdmissions() {
    var filters = [['actifs', 'Actifs'], ['attente', 'En attente'], ['admis', 'Admis'], ['bloc', 'Au bloc'], ['postop', 'Post-op'], ['sorti', 'Sortis'], ['tous', 'Tous']];
    $('#adm-filters').innerHTML = filters.map(function (f) { return '<button type="button" class="chip" aria-pressed="' + (ui.filter === f[0]) + '" data-action="filter" data-value="' + f[0] + '">' + f[1] + '</button>'; }).join('');
    var rows = state.patients.filter(function (p) {
      if (ui.filter === 'tous') { return true; }
      if (ui.filter === 'actifs') { return p.statut !== 'sorti'; }
      return p.statut === ui.filter;
    }).sort(byTriage);
    $('#adm-table').innerHTML = rows.length ? '<table><thead><tr><th>Patient</th><th>Tri</th><th>Motif</th><th>Lit</th><th>Arrivée</th><th>Statut</th></tr></thead><tbody>' +
      rows.map(function (p) {
        return '<tr><td><button type="button" class="link" data-action="open-dossier" data-id="' + p.id + '">' + esc(p.nom.toUpperCase() + ' ' + p.prenom) + '</button><div class="hint">' + age(p.naissance) + ' ans · ' + (p.sexe === 'F' ? 'F' : 'H') + '</div></td>' +
          '<td>' + triBadge(p.triage) + '</td><td>' + esc(p.motif) + '</td><td class="num">' + (p.lit || '—') + '</td><td class="num">' + fmtTs(p.admisLe) + '</td>' +
          '<td><select data-change="statut" data-id="' + p.id + '" aria-label="Statut de ' + esc(p.nom) + '">' + Object.keys(STATUTS).map(function (k) { return '<option value="' + k + '"' + (p.statut === k ? ' selected' : '') + '>' + STATUTS[k] + '</option>'; }).join('') + '</select></td></tr>';
      }).join('') + '</tbody></table>' : '<p class="empty">Aucun patient dans cette catégorie.</p>';

    var zsel = $('#adm-zone'), cur = zsel.value;
    zsel.innerHTML = ZONES.map(function (z) { return '<option value="' + z.id + '">' + esc(z.nom) + ' (' + freeBeds(z.id).length + ' libres)</option>'; }).join('');
    if (cur) { zsel.value = cur; }
    $('#adm-naissance').max = todayISO();
  }

  function submitAdmission(f) {
    var msg = $('#adm-msg'); msg.className = 'msg';
    var d = new FormData(f);
    var nom = String(d.get('nom') || '').trim(), prenom = String(d.get('prenom') || '').trim(), motif = String(d.get('motif') || '').trim();
    var naissance = String(d.get('naissance') || ''), tri = parseInt(d.get('triage'), 10);
    if (!nom || !prenom || !motif || !naissance || !tri) { msg.className = 'msg err'; msg.textContent = 'Renseignez le nom, le prénom, la date de naissance, le tri et le motif.'; return; }
    if (naissance > todayISO()) { msg.className = 'msg err'; msg.textContent = 'La date de naissance ne peut pas être dans le futur.'; return; }
    var free = freeBeds(String(d.get('zone')));
    var lit = free.length ? free[0] : null;
    var p = {
      id: nextId('p'), nom: nom, prenom: prenom, naissance: naissance, sexe: String(d.get('sexe')), groupe: String(d.get('groupe') || ''), allergies: String(d.get('allergies') || '').trim(),
      triage: tri, motif: motif, statut: lit ? 'admis' : 'attente', lit: lit, admisLe: Date.now(), vitals: [], notes: [], traitements: []
    };
    state.patients.push(p);
    save(); renderAll();
    f.reset();
    msg.className = 'msg ok';
    msg.textContent = lit ? prenom + ' ' + nom + ' admis(e), lit ' + lit + '.' : 'Aucun lit libre dans cette zone. ' + prenom + ' ' + nom + ' est en file d\'attente.';
    toast(msg.textContent);
  }

  /* Bloc opératoire */
  function renderBloc() {
    var day = ui.blocDate;
    var ops = state.ops.filter(function (o) { return o.date === day; }).sort(byStart);
    $('#bloc-date').textContent = fmtDate(day);
    var minutes = ops.reduce(function (s, o) { return s + o.duree; }, 0);
    $('#bloc-sum').textContent = ops.length + ' intervention' + (ops.length > 1 ? 's' : '') + ' · ' + dur(minutes) + ' de bloc';

    var hours = '';
    for (var i = 0; i <= 12; i++) { hours += '<span style="left:' + (i / 12 * 100) + '%">' + pad(7 + i) + 'h</span>'; }
    var rows = SALLES.map(function (s) {
      var blocks = ops.filter(function (o) { return o.salle === s; }).map(function (o) {
        var left = (o.start - START) / SPAN * 100, w = o.duree / SPAN * 100;
        var title = mm(o.start) + '–' + mm(o.start + o.duree) + ' · ' + patName(o.patientId) + ' · ' + o.type + ' · ' + o.chir;
        return '<button type="button" class="op ' + (o.prio === 'urgence' ? 't1' : 'prog') + '" style="left:' + left + '%;width:' + w + '%" data-action="open-dossier" data-id="' + o.patientId + '" title="' + esc(title) + '"><b>' + mm(o.start) + ' ' + esc(patName(o.patientId)) + '</b><i>' + esc(o.type) + '</i></button>';
      }).join('');
      return '<div class="tl-row"><div class="tl-room">' + esc(s) + '</div><div class="tl-track">' + blocks + '</div></div>';
    }).join('');
    var nm = nowMin(), nowLine = '';
    if (day === todayISO() && nm >= START && nm <= END) { nowLine = '<div class="now" style="left:calc(72px + (100% - 72px) * ' + ((nm - START) / SPAN) + ')"></div>'; }
    $('#timeline').innerHTML = '<div class="tl-row"><div></div><div class="tl-hours">' + hours + '</div></div><div class="tl-body">' + rows + nowLine + '</div>';

    $('#ops-table').innerHTML = ops.length ? '<table><thead><tr><th>Horaire</th><th>Salle</th><th>Patient</th><th>Intervention</th><th>Chirurgien</th><th>Priorité</th><th></th></tr></thead><tbody>' +
      ops.map(function (o) {
        return '<tr><td class="num">' + mm(o.start) + '–' + mm(o.start + o.duree) + '</td><td>' + esc(o.salle) + '</td>' +
          '<td><button type="button" class="link" data-action="open-dossier" data-id="' + o.patientId + '">' + esc(patName(o.patientId)) + '</button></td>' +
          '<td>' + esc(o.type) + '</td><td>' + esc(o.chir) + '</td>' +
          '<td>' + (o.prio === 'urgence' ? '<span class="badge t1"><span class="dot"></span>Urgence</span>' : '<span class="badge" style="--c:var(--info)"><span class="dot"></span>Programmée</span>') + '</td>' +
          '<td><button type="button" class="btn ghost small" data-action="cancel-op" data-id="' + o.id + '">Annuler</button></td></tr>';
      }).join('') + '</tbody></table>' : '<p class="empty">Aucune intervention réservée ce jour.</p>';

    var sel = $('#op-patient'), cur = sel.value;
    var cands = active().sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); });
    sel.innerHTML = '<option value="">Choisir un patient</option>' + cands.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nom.toUpperCase() + ' ' + p.prenom) + ' (' + TRIAGE[p.triage].code + ')</option>'; }).join('');
    if (cur) { sel.value = cur; }
    var ss = $('#op-salle');
    if (!ss.options.length) { ss.innerHTML = SALLES.map(function (s) { return '<option>' + s + '</option>'; }).join(''); }
    $('#op-date').min = todayISO();
  }

  function opConflict(op) {
    for (var i = 0; i < state.ops.length; i++) {
      var o = state.ops[i];
      if (o.date !== op.date) { continue; }
      var strict = op.start < o.start + o.duree && o.start < op.start + op.duree;
      var buffered = op.start < o.start + o.duree + BUF && o.start < op.start + op.duree + BUF;
      var when = mm(o.start) + ' à ' + mm(o.start + o.duree);
      if (o.salle === op.salle && buffered) { return o.salle + ' est occupé de ' + when + ' (' + patName(o.patientId) + '). Un délai de ' + BUF + ' min est réservé pour le nettoyage.'; }
      if (strict && o.patientId === op.patientId) { return patName(op.patientId) + ' est déjà au bloc de ' + when + ' (' + o.salle + ').'; }
      if (strict && o.chir.trim().toLowerCase() === op.chir.trim().toLowerCase()) { return op.chir + ' opère déjà en ' + o.salle + ' de ' + when + '.'; }
    }
    return null;
  }

  function submitOp(f) {
    var msg = $('#op-msg'); msg.className = 'msg err';
    var d = new FormData(f);
    var op = {
      id: '', patientId: String(d.get('patient') || ''), salle: String(d.get('salle')), date: String(d.get('date') || ''),
      start: d.get('start') ? toMin(String(d.get('start'))) : NaN, duree: parseInt(d.get('duree'), 10),
      type: String(d.get('type') || '').trim(), chir: String(d.get('chir') || '').trim(), prio: String(d.get('prio'))
    };
    if (!op.patientId || !pat(op.patientId)) { msg.textContent = 'Choisissez un patient.'; return; }
    if (!op.date || !op.type || !op.chir || isNaN(op.start)) { msg.textContent = 'Renseignez la date, l\'heure, l\'intervention et le chirurgien.'; return; }
    if (op.date < todayISO()) { msg.textContent = 'Cette date est passée.'; return; }
    if (op.start < START || op.start + op.duree > END) { msg.textContent = 'L\'intervention doit tenir entre 07:00 et 19:00. Fin calculée : ' + mm(op.start + op.duree) + '.'; return; }
    var c = opConflict(op);
    if (c) { msg.textContent = c; return; }
    op.id = nextId('o');
    state.ops.push(op);
    ui.blocDate = op.date;
    save(); renderAll();
    msg.className = 'msg ok';
    msg.textContent = op.salle + ' réservé le ' + fmtDate(op.date) + ' de ' + mm(op.start) + ' à ' + mm(op.start + op.duree) + '.';
    toast('Salle réservée.');
  }

  /* Dossiers */
  function vitalFlags(v) {
    var f = {};
    if (v.spo2 != null && v.spo2 < 92) { f.spo2 = 1; }
    if (v.fc != null && (v.fc > 120 || v.fc < 50)) { f.fc = 1; }
    if (v.temp != null && (v.temp >= 38.5 || v.temp <= 35)) { f.temp = 1; }
    var s = parseInt(String(v.ta || '').split('/')[0], 10);
    if (!isNaN(s) && s < 90) { f.ta = 1; }
    return f;
  }
  function cell(val, flag, unit) { if (val == null || val === '') { return '<td class="num">—</td>'; } return '<td class="num' + (flag ? ' flag' : '') + '">' + esc(val) + (unit || '') + (flag ? ' !' : '') + '</td>'; }

  function renderDossiers() {
    var q = ui.search.trim().toLowerCase();
    var list = state.patients.filter(function (p) { return !q || (p.nom + ' ' + p.prenom + ' ' + (p.lit || '') + ' ' + p.motif).toLowerCase().indexOf(q) !== -1; })
      .sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); });
    if (!ui.dossierId || !pat(ui.dossierId)) { var first = state.patients.slice().sort(byTriage)[0]; ui.dossierId = first ? first.id : null; }
    $('#plist').innerHTML = list.length ? list.map(function (p) {
      return '<button type="button" class="pitem t' + p.triage + '" data-action="pick-dossier" data-id="' + p.id + '" aria-current="' + (p.id === ui.dossierId) + '"><div class="row1"><span class="nm">' + esc(p.nom.toUpperCase() + ' ' + p.prenom) + '</span>' + triBadge(p.triage) + '</div><div class="mt">' + STATUTS[p.statut] + (p.lit ? ' · lit ' + p.lit : '') + ' · ' + esc(p.motif) + '</div></button>';
    }).join('') : '<p class="empty">Aucun résultat.</p>';

    var p = pat(ui.dossierId), box = $('#dossier');
    if (!p) { box.innerHTML = '<p class="empty">Aucun patient enregistré.</p>'; return; }

    var litOpts = '<option value="">Sans lit</option>' + ZONES.map(function (z) {
      var opts = bedsOf(z).filter(function (b) { return b === p.lit || !occupant(b); });
      return opts.length ? '<optgroup label="' + esc(z.nom) + '">' + opts.map(function (b) { return '<option value="' + b + '"' + (b === p.lit ? ' selected' : '') + '>' + b + '</option>'; }).join('') + '</optgroup>' : '';
    }).join('');
    var vitals = p.vitals.slice().sort(function (a, b) { return b.t - a.t; });
    var notes = p.notes.slice().sort(function (a, b) { return b.t - a.t; });
    var trait = p.traitements.slice().sort(function (a, b) { return b.t - a.t; });
    var pops = state.ops.filter(function (o) { return o.patientId === p.id; }).sort(function (a, b) { return a.date.localeCompare(b.date) || a.start - b.start; });

    box.innerHTML =
      '<div class="dhead"><h2>' + esc(p.nom.toUpperCase() + ' ' + p.prenom) + '</h2>' +
      '<div class="dmeta"><span>' + age(p.naissance) + ' ans</span><span>' + (p.sexe === 'F' ? 'Femme' : 'Homme') + '</span><span>Né(e) le ' + new Date(p.naissance + 'T12:00:00').toLocaleDateString('fr-FR') + '</span><span>Groupe ' + (p.groupe ? esc(p.groupe) : 'inconnu') + '</span><span>Arrivé(e) le ' + fmtTs(p.admisLe) + '</span></div>' +
      '<div>' + triBadge(p.triage) + '</div>' +
      (p.allergies ? '<div class="allergy"><b>Allergies :</b> ' + esc(p.allergies) + '</div>' : '<div class="allergy none">Aucune allergie connue</div>') + '</div>' +

      '<div class="dsec"><h3>Prise en charge</h3><p>' + esc(p.motif) + '</p>' +
      '<div class="state-row"><div><label class="lab" for="d-statut">Statut</label><select id="d-statut" data-change="statut" data-id="' + p.id + '">' + Object.keys(STATUTS).map(function (k) { return '<option value="' + k + '"' + (p.statut === k ? ' selected' : '') + '>' + STATUTS[k] + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="lab" for="d-lit">Lit</label><select id="d-lit" data-change="lit" data-id="' + p.id + '">' + litOpts + '</select></div></div></div>' +

      '<div class="dsec"><h3>Constantes</h3>' +
      (vitals.length ? '<div class="tscroll"><table style="min-width:480px"><thead><tr><th>Heure</th><th class="num">FC</th><th class="num">TA</th><th class="num">SpO₂</th><th class="num">T °C</th></tr></thead><tbody>' +
        vitals.map(function (v) { var fl = vitalFlags(v); return '<tr><td class="num">' + fmtTs(v.t) + '</td>' + cell(v.fc, fl.fc, '') + cell(v.ta, fl.ta, '') + cell(v.spo2, fl.spo2, ' %') + cell(v.temp, fl.temp, '') + '</tr>'; }).join('') + '</tbody></table></div>' : '<p class="empty">Aucune constante enregistrée.</p>') +
      '<form class="inline-form" data-form="vitals" data-id="' + p.id + '" style="flex-direction:row"><div><label class="lab" for="v-fc">FC /min</label><input id="v-fc" name="fc" type="number" min="0" max="300"></div><div><label class="lab" for="v-ta">TA</label><input id="v-ta" name="ta" placeholder="120/80"></div><div><label class="lab" for="v-spo2">SpO₂ %</label><input id="v-spo2" name="spo2" type="number" min="0" max="100"></div><div><label class="lab" for="v-temp">T °C</label><input id="v-temp" name="temp" type="number" step="0.1" min="25" max="45"></div><button class="btn" type="submit">Ajouter</button></form>' +
      '<p class="hint">Un point d\'exclamation signale une valeur à surveiller : SpO₂ sous 92 %, FC hors 50–120, TA systolique sous 90, température hors 35–38,5.</p></div>' +

      '<div class="dsec"><h3>Traitements</h3>' +
      (trait.length ? '<div class="tscroll"><table style="min-width:420px"><thead><tr><th>Heure</th><th>Médicament</th><th>Dose</th><th>Voie</th></tr></thead><tbody>' + trait.map(function (t) { return '<tr><td class="num">' + fmtTs(t.t) + '</td><td>' + esc(t.nom) + '</td><td>' + esc(t.dose) + '</td><td>' + esc(t.voie) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="empty">Aucun traitement administré.</p>') +
      '<form class="inline-form" data-form="trait" data-id="' + p.id + '" style="flex-direction:row"><div><label class="lab" for="t-nom">Médicament</label><input id="t-nom" name="nom" required></div><div><label class="lab" for="t-dose">Dose</label><input id="t-dose" name="dose" required placeholder="1 g"></div><div><label class="lab" for="t-voie">Voie</label><select id="t-voie" name="voie"><option>IV</option><option>PO</option><option>SC</option><option>IM</option><option>Inhalée</option><option>Masque</option></select></div><button class="btn" type="submit">Noter</button></form></div>' +

      '<div class="dsec"><h3>Interventions</h3>' +
      (pops.length ? '<ul class="list">' + pops.map(function (o) { return '<li><div class="main"><div class="name">' + esc(o.type) + (o.prio === 'urgence' ? ' ' + '<span class="badge t1"><span class="dot"></span>Urgence</span>' : '') + '</div><div class="meta">' + esc(fmtDate(o.date)) + ' · ' + mm(o.start) + '–' + mm(o.start + o.duree) + ' · ' + esc(o.salle) + ' · ' + esc(o.chir) + '</div></div></li>'; }).join('') + '</ul>' : '<p class="empty">Aucune intervention réservée. Utilisez l\'onglet Bloc opératoire.</p>') + '</div>' +

      '<div class="dsec"><h3>Notes cliniques</h3>' +
      '<form data-form="note" data-id="' + p.id + '"><div class="fgrid"><div><label class="lab" for="n-auteur">Auteur</label><input id="n-auteur" name="auteur" required value="' + esc(ui.auteur) + '" placeholder="Dr Lefèvre"></div></div><div><label class="lab" for="n-texte">Observation</label><textarea id="n-texte" name="texte" required></textarea></div><div><button class="btn" type="submit">Ajouter la note</button></div></form>' +
      '<div class="notes">' + (notes.length ? notes.map(function (n) { return '<div class="note"><div class="by">' + fmtTs(n.t) + ' · ' + esc(n.auteur) + '</div><p>' + esc(n.texte) + '</p></div>'; }).join('') : '<p class="empty">Aucune note.</p>') + '</div></div>';
  }

  function submitVitals(f) {
    var p = pat(f.dataset.id); if (!p) { return; }
    var d = new FormData(f);
    function num(k) { var v = String(d.get(k) || '').trim(); if (v === '') { return null; } var n = parseFloat(v.replace(',', '.')); return isNaN(n) ? null : n; }
    var v = { t: Date.now(), fc: num('fc'), ta: String(d.get('ta') || '').trim() || null, spo2: num('spo2'), temp: num('temp') };
    if (v.fc == null && !v.ta && v.spo2 == null && v.temp == null) { toast('Saisissez au moins une constante.'); return; }
    p.vitals.push(v); save(); renderAll(); toast('Constantes enregistrées.');
  }
  function submitTrait(f) {
    var p = pat(f.dataset.id); if (!p) { return; }
    var d = new FormData(f);
    var nom = String(d.get('nom') || '').trim(), dose = String(d.get('dose') || '').trim();
    if (!nom || !dose) { return; }
    p.traitements.push({ t: Date.now(), nom: nom, dose: dose, voie: String(d.get('voie')) }); save(); renderAll(); toast('Traitement noté.');
  }
  function submitNote(f) {
    var p = pat(f.dataset.id); if (!p) { return; }
    var d = new FormData(f);
    var auteur = String(d.get('auteur') || '').trim(), texte = String(d.get('texte') || '').trim();
    if (!auteur || !texte) { return; }
    ui.auteur = auteur;
    p.notes.push({ t: Date.now(), auteur: auteur, texte: texte }); save(); renderAll(); toast('Note ajoutée.');
  }

  function setStatut(p, v) {
    p.statut = v;
    if (v === 'sorti') { p.lit = null; }
    else if (!p.lit && v !== 'attente') {
      var b = autoBed(p);
      if (b) { p.lit = b; } else { toast('Aucun lit libre : le patient reste sans lit.'); }
    }
    save(); renderAll();
  }

  /* Navigation et rendu */
  function renderAll() { renderDashboard(); renderAdmissions(); renderBloc(); renderDossiers(); }
  function setView(v) {
    ui.view = v;
    ['dashboard', 'admissions', 'bloc', 'dossiers'].forEach(function (k) {
      $('#view-' + k).hidden = k !== v;
      $('#tab-' + k).setAttribute('aria-selected', k === v ? 'true' : 'false');
    });
    renderAll();
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]'); if (!b) { return; }
    var a = b.dataset.action, id = b.dataset.id;
    if (a === 'tab') { setView(b.dataset.view); }
    else if (a === 'open-dossier') { ui.dossierId = id; ui.search = ''; $('#dossier-search').value = ''; setView('dossiers'); }
    else if (a === 'pick-dossier') { ui.dossierId = id; renderDossiers(); }
    else if (a === 'filter') { ui.filter = b.dataset.value; renderAdmissions(); }
    else if (a === 'day-prev' || a === 'day-next' || a === 'day-today') {
      ui.blocDate = a === 'day-today' ? todayISO() : addDays(ui.blocDate, a === 'day-prev' ? -1 : 1);
      var dd = $('#op-date'); if (ui.blocDate >= todayISO()) { dd.value = ui.blocDate; }
      renderBloc();
    }
    else if (a === 'cancel-op') { confirmClick(b, 'Confirmer ?', function () { state.ops = state.ops.filter(function (o) { return o.id !== id; }); save(); renderAll(); toast('Réservation annulée.'); }); }
    else if (a === 'reset') { confirmClick(b, 'Confirmer la remise à zéro', function () { state = seed(); save(); ui.dossierId = null; ui.blocDate = todayISO(); $('#op-date').value = todayISO(); renderAll(); toast('Données de démonstration rétablies.'); }); }
  });

  document.addEventListener('change', function (e) {
    var t = e.target, c = t.dataset && t.dataset.change; if (!c) { return; }
    var p = pat(t.dataset.id); if (!p) { return; }
    if (c === 'statut') { setStatut(p, t.value); }
    else if (c === 'lit') { p.lit = t.value || null; save(); renderAll(); }
  });

  document.addEventListener('submit', function (e) {
    var f = e.target, k = f.dataset && f.dataset.form; if (!k) { return; }
    e.preventDefault();
    if (k === 'admission') { submitAdmission(f); }
    else if (k === 'op') { submitOp(f); }
    else if (k === 'vitals') { submitVitals(f); }
    else if (k === 'trait') { submitTrait(f); }
    else if (k === 'note') { submitNote(f); }
  });

  $('#dossier-search').addEventListener('input', function (e) { ui.search = e.target.value; renderDossiers(); });

  function tick() {
    var d = new Date();
    $('#clock-date').textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('#clock-time').textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  tick(); setInterval(tick, 30000);

  $('#op-date').value = todayISO();
  var h = (location.hash || '').replace('#', '');
  setView(['dashboard', 'admissions', 'bloc', 'dossiers'].indexOf(h) !== -1 ? h : 'dashboard');
})();
</script>
