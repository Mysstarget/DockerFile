(function(){
'use strict';
const $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const pad=n=>String(n).padStart(2,'0');
const dKey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const tKey=d=>dKey(d)+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
const minOf=s=>+s.slice(11,13)*60+ +s.slice(14,16);
const hm=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const addDays=(k,n)=>{const d=new Date(k+'T12:00:00');d.setDate(d.getDate()+n);return dKey(d)};
const fmtDay=k=>new Date(k+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const fmtDT=s=>{if(!s)return '';const t=s.slice(0,10)===dKey(new Date())?'':new Date(s.slice(0,10)+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' ';return t+s.slice(11,16)};
const ageOf=b=>{if(!b)return '';const n=new Date(),d=new Date(b+'T12:00:00');let a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--;return a<1?'< 1 an':a+' ans'};
const since=s=>{const m=Math.max(0,Math.round((Date.now()-new Date(s).getTime())/60000));if(m<60)return m+' min';if(m<1440)return Math.floor(m/60)+' h '+pad(m%60);return Math.floor(m/1440)+' j'};
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);

const TRI={rouge:{n:'T1 · Rouge',o:0,s:'T1'},orange:{n:'T2 · Orange',o:1,s:'T2'},jaune:{n:'T3 · Jaune',o:2,s:'T3'},vert:{n:'T4 · Vert',o:3,s:'T4'}};
const TENTS=[{k:'A',n:'Tente A',r:'Urgences et réanimation',c:6},{k:'B',n:'Tente B',r:'Chirurgie et post-opératoire',c:8},{k:'C',n:'Tente C',r:'Médecine et surveillance',c:10}];
const BEDS=TENTS.flatMap(t=>Array.from({length:t.c},(_,i)=>t.k+(i+1)));
const BLOCS=['Bloc 1','Bloc 2'];
const TURN=20,H0=360,H1=1440,PX=0.8;
const SST={planifiee:'Planifiée',en_cours:'En cours',terminee:'Terminée',annulee:'Annulée'};
const ANES=['Anesthésie générale','Rachianesthésie','Locorégionale','Sédation','Anesthésie locale','Aucune'];

const S={patients:{},surgeries:{},detail:null,journal:null,me:null,ready:false,online:true};
const ui={view:'tableau',q:'',filt:'tous',pid:null,dq:'',dfilt:'admis',day:dKey(new Date())};
const can=p=>!!(S.me&&S.me.perms.indexOf(p)>=0);

const plist=()=>Object.keys(S.patients).map(id=>Object.assign({id},S.patients[id]));
const slist=()=>Object.keys(S.surgeries).map(id=>Object.assign({id},S.surgeries[id]));
const pn=p=>p?esc(p.nom.toUpperCase())+' '+esc(p.prenom):'<span class="muted">Dossier supprimé</span>';
const byTri=(a,b)=>(TRI[a.triage].o-TRI[b.triage].o)||String(a.arriveLe).localeCompare(String(b.arriveLe));
const triPill=t=>'<span class="tri tri-'+t+'">'+TRI[t].n+'</span>';
const atBloc=pid=>slist().some(s=>s.patientId===pid&&s.statut==='en_cours');
const stPill=p=>atBloc(p.id)?'<span class="st live">Au bloc</span>':p.statut==='admis'?'<span class="st on">Admis</span>':p.statut==='attente'?'<span class="st">En attente</span>':'<span class="st">Sorti</span>';
const occupied=ex=>new Set(plist().filter(p=>p.statut==='admis'&&p.lit&&p.id!==ex).map(p=>p.lit));

/* ---------- API ---------- */
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2800)}
async function api(method,url,body){
  let r;
  try{r=await fetch(url,{method,credentials:'same-origin',headers:Object.assign({'X-Requested-With':'hopital'},body!==undefined?{'Content-Type':'application/json'}:{}),body:body!==undefined?JSON.stringify(body):undefined})}
  catch(e){S.online=false;schedule();const er=new Error('Serveur injoignable. Vérifiez le réseau.');er.status=0;throw er}
  S.online=true;
  let data=null;try{data=await r.json()}catch(e){}
  if(!r.ok){if(r.status===401&&url!=='/api/connexion')showLogin();const er=new Error((data&&data.erreur)||'Erreur '+r.status);er.status=r.status;throw er}
  return data;
}
let lastSig='';
// Recharge l'état depuis le serveur ; ne redessine que si quelque chose a changé.
async function refresh(force){
  if(!S.me)return;
  try{
    const st=await api('GET','/api/etat');
    S.patients=st.patients;S.surgeries=st.surgeries;
    if(ui.pid&&!S.patients[ui.pid]){ui.pid=null;S.detail=null}
    if(ui.pid&&ui.view==='dossiers')S.detail=await api('GET','/api/patients/'+ui.pid);
    S.ready=true;
  }catch(e){if(e.status===401)return;if(e.status!==0)toast(e.message)}
  const sig=JSON.stringify([S.patients,S.surgeries,S.detail,S.online]);
  if(force||sig!==lastSig){lastSig=sig;schedule()}
}
// Écriture puis rechargement immédiat.
async function act(method,url,body,msg){const r=await api(method,url,body);await refresh(true);if(msg)toast(msg);return r}
async function openDetail(pid){
  ui.pid=pid;S.detail=null;render();
  try{const d=await api('GET','/api/patients/'+pid+'?audit=1');if(ui.pid===pid){S.detail=d;lastSig='';schedule()}}catch(e){toast(e.message)}
}
const full=id=>Object.assign({},S.patients[id],S.detail&&S.detail.id===id?S.detail:{});
async function loadJournal(){
  S.journal=null;schedule();
  try{S.journal=await api('GET','/api/journal?limite=200')}catch(e){S.journal=[];toast(e.message)}
  schedule();
}

/* ---------- session ---------- */
const ROLES={admin:'Administrateur',medecin:'Médecin',soignant:'Soignant'};
function showLogin(){
  S.me=null;S.ready=false;S.patients={};S.surgeries={};S.detail=null;lastSig='';
  closeDrawer();$('#login').hidden=false;$('#userbox').innerHTML='';render();
  setTimeout(()=>{const i=$('#l_id');if(i)i.focus()},0);
}
function afterLogin(){
  $('#login').hidden=true;
  $('#userbox').innerHTML='<b>'+esc(S.me.nom)+'</b><span>'+esc(ROLES[S.me.role]||S.me.role)+'</span><button type="button" data-a="logout">Se déconnecter</button>';
  $('#navj').hidden=!can('journal');
  route();refresh(true);
}
async function init(){
  try{S.me=await api('GET','/api/moi');afterLogin()}catch(e){showLogin()}
}

/* ---------- rendu ---------- */
let rq=0;
function schedule(){cancelAnimationFrame(rq);rq=requestAnimationFrame(render)}
function render(){
  const a=document.activeElement,main=$('#main');
  const keep=a&&a.id&&main.contains(a)?{id:a.id,s:a.selectionStart,e:a.selectionEnd}:null;
  main.innerHTML=S.ready?VIEWS[ui.view]():'<p class="empty">Chargement des données…</p>';
  document.querySelectorAll('.nav a').forEach(l=>{if(l.dataset.v===ui.view)l.setAttribute('aria-current','page');else l.removeAttribute('aria-current')});
  const q=plist().filter(p=>p.statut==='attente').length,nb=$('#nbq');nb.hidden=!q;nb.textContent=q;
const sy=$('#sync');sy.className='sync '+(S.online?'on':'off');
  sy.textContent=S.online?'Synchronisé avec le serveur':'Serveur injoignable, nouvelle tentative…';
  $('#clock').textContent=new Date().toLocaleString('fr-FR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const bx=$('#bannerx');if(bx)bx.innerHTML='';
  if(keep){const el=document.getElementById(keep.id);if(el){el.focus();try{el.setSelectionRange(keep.s,keep.e)}catch(e){}}}
}

const head=(t,sub,tools)=>'<header class="pagehead"><div><h1>'+t+'</h1>'+(sub?'<p class="sub">'+sub+'</p>':'')+'</div><div class="tools">'+(tools||'')+'</div></header>';

function viewTableau(){
  const P=plist(),now=new Date(),today=dKey(now),nowM=now.getHours()*60+now.getMinutes();
  const adm=P.filter(p=>p.statut==='admis'&&p.lit),att=P.filter(p=>p.statut==='attente').sort(byTri);
  const occ=new Map(adm.map(p=>[p.lit,p]));
  const sg=slist().filter(s=>s.debut.slice(0,10)===today&&s.statut!=='annulee').sort((a,b)=>a.debut.localeCompare(b.debut));
  const live=BLOCS.map(b=>sg.find(s=>s.bloc===b&&s.statut==='en_cours'));
  const done=sg.filter(s=>s.statut==='terminee').length,todo=sg.filter(s=>s.statut==='planifiee').length;
  const cnt=t=>att.filter(p=>p.triage===t).length;
  const blocLines=BLOCS.map((b,i)=>{const r=live[i];if(r)return '<b>'+b+'</b> en cours jusqu\'à '+hm(minOf(r.debut)+r.duree);
    const n=sg.find(s=>s.bloc===b&&s.statut==='planifiee'&&minOf(s.debut)>=nowM);return '<b>'+b+'</b> libre'+(n?', prochaine à '+hm(minOf(n.debut)):'')}).join('<br>');
  const q=att.length?'<ul class="list">'+att.map(p=>'<li class="edge-'+p.triage+'"><div class="t">'+pn(p)+'</div><div class="m">'+esc(ageOf(p.naissance))+' · '+esc(p.motif)+'</div><div class="r">'+triPill(p.triage)+'<span class="m">depuis '+since(p.arriveLe)+'</span><button class="btn sm pri" data-a="admit" data-pid="'+p.id+'">Admettre</button></div></li>').join('')+'</ul>':'<p class="empty">Personne en attente.</p>';
  const ops=sg.length?'<ul class="list">'+sg.map(s=>{const p=S.patients[s.patientId];return '<li class="'+(s.urgence?'edge-rouge':'')+'"><div class="t"><span class="mono">'+hm(minOf(s.debut))+'–'+hm(minOf(s.debut)+s.duree)+'</span> '+esc(s.acte)+'</div><div class="m">'+esc(s.bloc)+' · '+pn(p)+' · '+esc(s.chirurgien)+'</div><div class="r"><span class="st '+(s.statut==='en_cours'?'live':s.statut==='planifiee'?'on':'')+'">'+SST[s.statut]+'</span></div></li>'}).join('')+'</ul>':'<p class="empty">Aucune intervention aujourd\'hui. <a href="#blocs">Ouvrir le planning</a></p>';
  const tents=TENTS.map(t=>'<div class="tent"><h3>'+t.n+'</h3><p>'+t.r+'</p><div class="beds">'+Array.from({length:t.c},(_,i)=>{const id=t.k+(i+1),p=occ.get(id);
    return p?'<button class="bed occ edge-'+p.triage+'" data-a="open" data-pid="'+p.id+'" title="'+esc(p.nom+' '+p.prenom)+'"><b>'+id+' · '+TRI[p.triage].s+'</b><span>'+esc(p.nom)+'</span></button>':'<div class="bed"><b>'+id+'</b><span>libre</span></div>'}).join('')+'</div></div>').join('');
  return head('Tableau de bord',esc(fmtDay(today)),'<a class="btn pri" href="#admissions" data-a="new-adm-go">Nouvelle admission</a>')+
  '<section class="kpis">'+
   '<div class="kpi"><div class="l">Lits occupés</div><div class="v">'+adm.length+' <small>/ '+BEDS.length+'</small></div><div class="bar"><i style="width:'+Math.round(adm.length/BEDS.length*100)+'%"></i></div></div>'+
   '<div class="kpi"><div class="l">En attente</div><div class="v">'+att.length+'</div><div class="s">T1 '+cnt('rouge')+' · T2 '+cnt('orange')+' · T3 '+cnt('jaune')+' · T4 '+cnt('vert')+'</div></div>'+
   '<div class="kpi"><div class="l">Blocs opératoires</div><div class="v">'+live.filter(Boolean).length+' <small>/ '+BLOCS.length+' en cours</small></div><div class="s">'+blocLines+'</div></div>'+
   '<div class="kpi"><div class="l">Interventions du jour</div><div class="v">'+done+' <small>/ '+(done+todo+live.filter(Boolean).length)+' faites</small></div><div class="s">'+todo+' à venir</div></div>'+
  '</section><div class="cols"><section class="panel"><h2>File d\'attente <small>par gravité puis par arrivée</small></h2>'+q+'</section><section class="panel"><h2>Programme du jour <small><a href="#blocs">Planning</a></small></h2>'+ops+'</section></div>'+
  '<section class="panel"><h2>Plan des lits <small>Touchez un lit pour ouvrir le dossier</small></h2><div class="tents">'+tents+'</div></section>';
}

function viewAdmissions(){
  const P=plist(),q=ui.q.trim().toLowerCase();
  const F=[['tous','Tous'],['attente','En attente'],['admis','Admis'],['sorti','Sortis']];
  let L=P.filter(p=>(ui.filt==='tous'||p.statut===ui.filt)&&(!q||(p.nom+' '+p.prenom+' '+p.motif+' '+(p.numero||'')).toLowerCase().includes(q)));
  const ord={attente:0,admis:1,sorti:2};
  L.sort((a,b)=>(ord[a.statut]-ord[b.statut])||byTri(a,b));
  const rows=L.map(p=>'<tr><td>'+triPill(p.triage)+'</td><td><b>'+pn(p)+'</b><br><span class="muted">'+esc(ageOf(p.naissance))+' · '+esc(p.sexe)+' · <span class="mono">'+esc(p.numero||'')+'</span></span></td><td>'+esc(p.motif)+'</td><td class="mono">'+esc(fmtDT(p.arriveLe))+(p.statut==='attente'?'<br><span class="muted">depuis '+since(p.arriveLe)+'</span>':'')+'</td><td>'+stPill(p)+(p.statut==='sorti'?'<br><span class="muted">'+esc(p.destination||'')+'</span>':'')+'</td><td class="mono">'+esc(p.lit||'—')+'</td><td><div class="acts">'+
    (p.statut==='attente'?'<button class="btn sm pri" data-a="admit" data-pid="'+p.id+'">Admettre</button>':'')+(p.statut==='admis'&&can('sortie')?'<button class="btn sm" data-a="discharge" data-pid="'+p.id+'">Sortie</button>':'')+'<button class="btn sm" data-a="open" data-pid="'+p.id+'">Dossier</button></div></td></tr>').join('');
  return head('Admissions',P.filter(p=>p.statut==='attente').length+' en attente · '+P.filter(p=>p.statut==='admis').length+' admis','<button class="btn pri" data-a="new-adm">Nouvelle admission</button>')+
  '<div class="tools" style="margin-bottom:12px"><input class="search" id="q" type="search" placeholder="Rechercher un nom, un motif, un n° de dossier" value="'+esc(ui.q)+'" aria-label="Rechercher"><div class="chips">'+F.map(f=>'<button class="chip" data-a="filt" data-v="'+f[0]+'" aria-pressed="'+(ui.filt===f[0])+'">'+f[1]+'</button>').join('')+'</div></div>'+
  (L.length?'<div class="tablewrap"><table><thead><tr><th>Triage</th><th>Patient</th><th>Motif</th><th>Arrivée</th><th>Statut</th><th>Lit</th><th>Actions</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p class="empty">Aucun patient ne correspond. Utilisez « Nouvelle admission » pour enregistrer une arrivée.</p>');
}

function spark(vals){
  if(vals.length<2)return '';
  const w=120,h=30,mn=Math.min(...vals),mx=Math.max(...vals),r=(mx-mn)||1;
  const pts=vals.map((v,i)=>[(i/(vals.length-1)*(w-8)+4).toFixed(1),(h-4-((v-mn)/r)*(h-8)).toFixed(1)]);
  return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true"><polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="currentColor" stroke-width="1.8" vector-effect="non-scaling-stroke"/><circle cx="'+pts[pts.length-1][0]+'" cy="'+pts[pts.length-1][1]+'" r="3" fill="currentColor"/></svg>';
}
function flag(v,lo,hi){if(v==null||v==='')return '';return v<lo?' bad':v>hi?' bad':''}
function mark(v,lo,hi){return v==null?'—':v<lo?v+' ▼':v>hi?v+' ▲':v}

function viewDossiers(){
  const P=plist(),q=ui.dq.trim().toLowerCase();
  const F=[['admis','Admis'],['attente','En attente'],['sorti','Sortis'],['tous','Tous']];
  const ord={admis:0,attente:1,sorti:2};
  const L=P.filter(p=>(ui.dfilt==='tous'||p.statut===ui.dfilt)&&(!q||(p.nom+' '+p.prenom+' '+(p.numero||'')).toLowerCase().includes(q))).sort((a,b)=>(ord[a.statut]-ord[b.statut])||byTri(a,b));
  const list='<div class="plist"><input class="search" style="max-width:none" id="dq" type="search" placeholder="Nom ou n° de dossier" value="'+esc(ui.dq)+'" aria-label="Rechercher un dossier"><div class="chips">'+F.map(f=>'<button class="chip" data-a="dfilt" data-v="'+f[0]+'" aria-pressed="'+(ui.dfilt===f[0])+'">'+f[1]+'</button>').join('')+'</div>'+
   (L.length?'<div class="pl">'+L.map(p=>'<button data-a="sel" data-pid="'+p.id+'" aria-current="'+(ui.pid===p.id)+'"><span class="tdot tri-'+p.triage+'">'+TRI[p.triage].s+'</span><span class="n">'+pn(p)+'</span><span class="d">'+(p.lit?esc(p.lit)+' · ':'')+esc(p.motif)+'</span></button>').join('')+'</div>':'<p class="empty">Aucun dossier dans cette liste.</p>')+'</div>';
  const p=ui.pid&&S.patients[ui.pid]?Object.assign({id:ui.pid},full(ui.pid)):null;
  return head('Dossiers médicaux',P.length+' dossiers')+'<div class="split'+(p?' has-sel':'')+'">'+list+'<div class="dossier">'+(p?dossier(p):'<div class="panel"><p class="empty">Choisissez un dossier dans la liste.</p></div>')+'</div></div>';
}
function dossier(p){
  const cs=(p.constantes||[]).slice(),ns=(p.notes||[]).slice().reverse(),rx=p.traitements||[];
  const last=cs[cs.length-1]||{};
  const col=k=>cs.map(c=>c[k]).filter(v=>typeof v==='number');
  const sx=slist().filter(s=>s.patientId===p.id).sort((a,b)=>a.debut.localeCompare(b.debut));
  const tr=cs.slice(-8).reverse().map(c=>'<tr><td class="mono">'+esc(fmtDT(c.ts))+'</td><td class="'+flag(c.fc,50,120)+'">'+mark(c.fc,50,120)+'</td><td>'+esc(c.ta||'—')+'</td><td class="'+flag(c.spo2,92,101)+'">'+mark(c.spo2,92,101)+'</td><td class="'+flag(c.temp,35.5,38.4)+'">'+(c.temp==null?'—':String(c.temp).replace('.',',')+(c.temp<35.5?' ▼':c.temp>38.4?' ▲':''))+'</td><td>'+(c.fr==null?'—':c.fr)+'</td></tr>').join('');
  return '<button class="btn back" data-a="back">← Liste des dossiers</button>'+
  '<div class="dhead"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">'+triPill(p.triage)+stPill(p)+(p.lit&&p.statut==='admis'?'<span class="st mono">Lit '+esc(p.lit)+'</span>':'')+'<span class="mono muted">'+esc(p.numero||'')+'</span></div>'+
  '<h2>'+esc(p.nom.toUpperCase())+' <span>'+esc(p.prenom)+'</span></h2>'+
  '<div class="facts"><span><b>'+esc(ageOf(p.naissance))+'</b> · né(e) le '+esc(new Date(p.naissance+'T12:00:00').toLocaleDateString('fr-FR'))+'</span><span>Sexe <b>'+esc(p.sexe)+'</b></span><span>Groupe <b>'+esc(p.groupe||'Inconnu')+'</b></span><span>Arrivée <b>'+esc(fmtDT(p.arriveLe))+'</b> ('+esc(p.provenance||'')+')</span></div>'+
  (p.allergies?'<div class="allergy">Allergies : '+esc(p.allergies)+'</div>':'')+
  '<div class="tools"><button class="btn sm" data-a="edit-id" data-pid="'+p.id+'">Modifier l\'identité</button>'+(p.statut==='attente'?'<button class="btn sm pri" data-a="admit" data-pid="'+p.id+'">Admettre</button>':'')+(p.statut==='admis'&&can('sortie')?'<button class="btn sm" data-a="discharge" data-pid="'+p.id+'">Sortie</button>':'')+(p.statut!=='sorti'&&can('intervention')?'<button class="btn sm" data-a="new-surg" data-pid="'+p.id+'">Programmer une intervention</button>':'')+'</div></div>'+
  '<div class="dgrid"><section class="panel"><h2>Motif et antécédents</h2><dl class="dl"><dt>Motif</dt><dd>'+esc(p.motif)+'</dd><dt>Antécédents</dt><dd>'+esc(p.antecedents||'Non renseignés')+'</dd>'+(p.statut==='sorti'?'<dt>Sortie</dt><dd>'+esc(fmtDT(p.sortieLe))+' · '+esc(p.destination||'')+'</dd>':'')+'</dl></section>'+
  '<section class="panel"><h2>Interventions <small>'+(sx.length?sx.length:'')+'</small></h2>'+(sx.length?'<ul class="list">'+sx.map(s=>'<li><div class="t">'+esc(s.acte)+'</div><div class="m"><span class="mono">'+esc(fmtDT(s.debut))+'</span> · '+esc(s.bloc)+' · '+esc(s.chirurgien)+'</div><div class="r"><span class="st '+(s.statut==='en_cours'?'live':s.statut==='planifiee'?'on':'')+'">'+SST[s.statut]+'</span></div></li>').join('')+'</ul>':'<p class="empty">Aucune intervention.</p>')+'</section>'+
  '<section class="panel wide"><h2>Constantes <small><button class="btn sm" data-a="vitals" data-pid="'+p.id+'">Nouveau relevé</button></small></h2>'+
  (cs.length?'<div class="trends"><div class="trend"><span>Fréquence cardiaque</span><b>'+(last.fc==null?'—':last.fc)+'</b>'+spark(col('fc'))+'</div><div class="trend"><span>SpO₂ %</span><b>'+(last.spo2==null?'—':last.spo2)+'</b>'+spark(col('spo2'))+'</div><div class="trend"><span>Température °C</span><b>'+(last.temp==null?'—':String(last.temp).replace('.',','))+'</b>'+spark(col('temp'))+'</div></div><div class="tablewrap"><table style="min-width:480px"><thead><tr><th>Heure</th><th>FC</th><th>TA</th><th>SpO₂</th><th>T°</th><th>FR</th></tr></thead><tbody>'+tr+'</tbody></table></div>':'<p class="empty">Aucun relevé. Saisissez les premières constantes.</p>')+'</section>'+
  '<section class="panel"><h2>Traitements <small>'+(can('prescrire')?'<button class="btn sm" data-a="rx" data-pid="'+p.id+'">Prescrire</button>':'')+'</small></h2>'+(rx.length?rx.map(r=>'<div class="rx'+(r.actif?'':' off')+'"><div><b>'+esc(r.nom)+'</b> '+esc(r.dose)+' · '+esc(r.voie)+' · '+esc(r.freq||'')+'<br><span class="muted mono">depuis '+esc(fmtDT(r.debut))+'</span></div>'+(r.actif&&!can('prescrire')?'':r.actif?'<button class="btn sm" data-a="rx-stop" data-pid="'+p.id+'" data-id="'+esc(r.id)+'">Arrêter</button>':'<span class="muted">Arrêté</span>')+'</div>').join(''):'<p class="empty">Aucune prescription.</p>')+'</section>'+
  '<section class="panel"><h2>Notes de suivi <small><button class="btn sm" data-a="note" data-pid="'+p.id+'">Ajouter une note</button></small></h2>'+(ns.length?'<ul class="tl">'+ns.map(n=>'<li><div class="h"><span class="mono">'+esc(fmtDT(n.ts))+'</span> · '+esc(n.auteur)+' · '+esc(n.type||'')+'</div><p>'+esc(n.texte)+'</p></li>').join('')+'</ul>':'<p class="empty">Aucune note.</p>')+'</section></div>';
}

function viewBlocs(){
  const day=ui.day,today=dKey(new Date()),L=slist().filter(s=>s.debut.slice(0,10)===day);
  const nowM=new Date().getHours()*60+new Date().getMinutes();
  const hours=Array.from({length:(H1-H0)/60},(_,i)=>H0/60+i);
  const axis='<div class="axis" style="height:'+((H1-H0)*PX)+'px;margin-top:28px">'+hours.map(h=>'<span style="top:'+((h*60-H0)*PX)+'px">'+pad(h)+':00</span>').join('')+'</div>';
  const cols=BLOCS.map(b=>{
    const own=L.filter(s=>s.bloc===b).sort((x,y)=>x.debut.localeCompare(y.debut));
    const act=own.filter(s=>s.statut!=='annulee'),tot=act.reduce((a,s)=>a+s.duree,0);
    const items=own.map(s=>{const st=minOf(s.debut),p=S.patients[s.patientId],h=Math.max(s.duree*PX,24);
      return (s.statut!=='annulee'?'<div class="turn" style="top:'+((st+s.duree-H0)*PX)+'px;height:'+(TURN*PX)+'px"></div>':'')+
      '<button class="sg '+s.statut+(s.urgence?' urg':'')+'" data-a="edit-surg" data-id="'+s.id+'" style="top:'+((st-H0)*PX)+'px;height:'+h+'px"><b>'+hm(st)+'–'+hm(st+s.duree)+(s.urgence?' · URGENCE':'')+'</b><span class="p">'+esc(s.acte)+'</span>'+(h>58?'<span class="p">'+(p?esc(p.nom.toUpperCase()+' '+p.prenom):'Dossier supprimé')+'</span>':'')+(h>74?'<span class="p">'+esc(s.chirurgien)+' · '+SST[s.statut]+'</span>':'')+'</button>'}).join('');
    const nowl=day===today&&nowM>=H0?'<div class="now" style="top:'+((nowM-H0)*PX)+'px"></div>':'';
    return '<div><div class="colhead">'+b+'<small>'+act.length+' intervention'+(act.length>1?'s':'')+' · '+Math.floor(tot/60)+' h '+pad(tot%60)+'</small></div><div class="col" data-a="col" data-bloc="'+b+'" style="height:'+((H1-H0)*PX)+'px" aria-label="'+b+', cliquer pour réserver un créneau">'+items+nowl+'</div></div>';
  }).join('');
  return head('Blocs opératoires',esc(fmtDay(day)),
   '<div class="tools"><button class="btn" data-a="day-prev" aria-label="Jour précédent">‹</button><input class="search" style="flex:none;width:auto" id="dayin" type="date" value="'+day+'" aria-label="Date"><button class="btn" data-a="day-next" aria-label="Jour suivant">›</button><button class="btn" data-a="day-today">Aujourd\'hui</button>'+(can('intervention')?'<button class="btn pri" data-a="new-surg">Réserver un bloc</button>':'')+'</div>')+
  '<div class="panel"><div class="day">'+axis+cols+'</div><div class="legend"><span><i></i>Planifiée</span><span><i style="background:var(--accent)"></i>En cours</span><span><i style="background:var(--t-rouge-bg);border-color:var(--t-rouge)"></i>Urgence</span><span><i style="background:var(--sunk);border-color:var(--muted)"></i>Terminée</span><span>Zone hachurée : nettoyage de salle, '+TURN+' min</span></div></div>';
}
function viewJournal(){
  const L=S.journal;
  const corps=L===null?'<p class="empty">Chargement du journal…</p>':L.length?'<div class="tablewrap"><table><thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Objet</th><th>Détail</th><th>Adresse IP</th></tr></thead><tbody>'+L.map(r=>'<tr><td class="mono">'+esc(r.ts.slice(0,10).split('-').reverse().join('/')+' '+r.ts.slice(11,19))+'</td><td>'+esc(r.utilisateur)+'</td><td>'+esc(r.action.replace(/_/g,' '))+'</td><td>'+esc(r.entite)+(r.entiteId?' <span class="mono">#'+esc(r.entiteId)+'</span>':'')+'</td><td class="mono" style="max-width:260px;overflow-wrap:anywhere">'+esc(r.detail)+'</td><td class="mono">'+esc(r.ip)+'</td></tr>').join('')+'</tbody></table></div>':'<p class="empty">Le journal est vide.</p>';
  return head('Journal d\'audit','Connexions, consultations de dossiers et modifications, les plus récentes en premier','<button class="btn" data-a="refresh-journal">Actualiser</button>')+corps;
}
const VIEWS={tableau:viewTableau,admissions:viewAdmissions,dossiers:viewDossiers,blocs:viewBlocs,journal:viewJournal};

/* ---------- formulaires ---------- */
let lastFocus=null,drawerState=null;
function fld(f){
  const id='f_'+f.name,v=f.value==null?'':f.value;let c;
  if(f.type==='select')c='<select id="'+id+'" name="'+f.name+'">'+groupOpts(f.options,v)+'</select>';
  else if(f.type==='textarea')c='<textarea id="'+id+'" name="'+f.name+'" rows="'+(f.rows||3)+'" placeholder="'+esc(f.ph||'')+'">'+esc(v)+'</textarea>';
  else if(f.type==='checkbox')return '<div class="fld chk"><input type="checkbox" id="'+id+'" name="'+f.name+'"'+(f.value?' checked':'')+'><label for="'+id+'">'+f.label+'</label></div>';
  else c='<input id="'+id+'" name="'+f.name+'" type="'+(f.type||'text')+'" value="'+esc(v)+'" placeholder="'+esc(f.ph||'')+'"'+(f.min!=null?' min="'+f.min+'"':'')+(f.max!=null?' max="'+f.max+'"':'')+(f.step?' step="'+f.step+'"':'')+(f.im?' inputmode="'+f.im+'"':'')+' autocomplete="off">';
  return '<div class="fld'+(f.half?' half':'')+'"><label for="'+id+'">'+f.label+(f.required?' *':'')+'</label>'+c+(f.hint?'<small>'+f.hint+'</small>':'')+'</div>';
}
function groupOpts(opts,v){
  let out='',g=null;
  opts.forEach(o=>{if(o.g!==g){if(g)out+='</optgroup>';if(o.g)out+='<optgroup label="'+esc(o.g)+'">';g=o.g}
    out+='<option value="'+esc(o.v)+'"'+(String(o.v)===String(v)?' selected':'')+'>'+esc(o.t)+'</option>'});
  if(g)out+='</optgroup>';return out;
}
function readForm(form,fields){
  const o={};fields.forEach(f=>{const el=form.elements[f.name];if(!el)return;o[f.name]=f.type==='checkbox'?el.checked:String(el.value).trim()});return o;
}
function openForm(cfg){
  lastFocus=document.activeElement;
  const d=$('#drawer');
  d.innerHTML='<div class="scrim" data-a="close"></div><aside class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(cfg.title)+'"><header><div><h2>'+esc(cfg.title)+'</h2>'+(cfg.sub?'<p>'+cfg.sub+'</p>':'')+'</div><button class="x" data-a="close" aria-label="Fermer">×</button></header><form id="dform" novalidate><div class="fgrid">'+cfg.fields.map(fld).join('')+'</div><p class="err" id="ferr" role="alert"></p><footer><div class="l">'+(cfg.extra||[]).map((x,i)=>'<button type="button" class="btn" data-x="'+i+'">'+x.label+'</button>').join('')+(cfg.danger?'<button type="button" class="btn danger" id="fdanger">'+cfg.danger.label+'</button>':'')+'</div><button type="button" class="btn" data-a="close">Annuler</button><button type="submit" class="btn pri" id="fsub">'+(cfg.submit||'Enregistrer')+'</button></footer></form></aside>';
  const form=$('#dform'),err=$('#ferr');
  const showErr=m=>{err.textContent=m;err.classList.add('on');err.scrollIntoView({block:'nearest'})};
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();err.classList.remove('on');
    const vals=readForm(form,cfg.fields);
    for(const f of cfg.fields){if(f.required&&!vals[f.name]){showErr('Renseignez le champ « '+f.label+' ».');form.elements[f.name].focus();return}}
    const bad=cfg.validate&&cfg.validate(vals);if(bad){showErr(bad);return}
    const b=$('#fsub');b.disabled=true;
    try{await cfg.onSubmit(vals);closeDrawer()}catch(e){b.disabled=false;showErr(e&&e.status?e.message:'Enregistrement impossible ('+(e&&e.message||'erreur')+').')}
  });
  form.addEventListener('click',async ev=>{
    const bx=ev.target.closest('[data-x]');if(bx){err.classList.remove('on');cfg.extra[+bx.dataset.x].fn(readForm(form,cfg.fields),form,showErr)}
    const dg=ev.target.closest('#fdanger');if(dg){if(!dg.classList.contains('armed')){dg.classList.add('armed');dg.textContent='Confirmer : '+cfg.danger.label.toLowerCase();return}
      try{await cfg.danger.fn();closeDrawer()}catch(e){showErr(e&&e.message||'Suppression impossible.')}}
  });
  const first=form.querySelector('input:not([type=checkbox]),select,textarea');if(first)first.focus();
}
function closeDrawer(){$('#drawer').innerHTML='';if(lastFocus&&document.contains(lastFocus))lastFocus.focus()}

const GROUPES=['Inconnu','O+','O-','A+','A-','B+','B-','AB+','AB-'].map(v=>({v,t:v}));
const triOpts=[{v:'rouge',t:'T1 · Rouge, urgence absolue'},{v:'orange',t:'T2 · Orange, urgence relative'},{v:'jaune',t:'T3 · Jaune, différée'},{v:'vert',t:'T4 · Vert, non urgent'}];
function bedOpts(ex,withNone){
  const oc=occupied(ex),o=withNone?[{v:'',t:'Salle d\'attente (pas de lit)'}]:[];
  TENTS.forEach(t=>{for(let i=1;i<=t.c;i++){const id=t.k+i;if(!oc.has(id))o.push({v:id,t:id,g:t.n+' · '+t.r})}});return o;
}

function formAdmission(pid){
  if(pid&&!(S.detail&&S.detail.id===pid)){toast('Dossier en cours de chargement, réessayez.');return}
  const p=pid?full(pid):null;
  const f=[
    {name:'nom',label:'Nom',required:true,half:true,value:p&&p.nom},{name:'prenom',label:'Prénom',required:true,half:true,value:p&&p.prenom},
    {name:'naissance',label:'Date de naissance',type:'date',required:true,half:true,value:p&&p.naissance,max:dKey(new Date())},
    {name:'sexe',label:'Sexe',type:'select',half:true,value:p?p.sexe:'F',options:[{v:'F',t:'Féminin'},{v:'M',t:'Masculin'},{v:'X',t:'Autre'}]},
    {name:'groupe',label:'Groupe sanguin',type:'select',half:true,value:p?p.groupe:'Inconnu',options:GROUPES},
    {name:'triage',label:'Triage',type:'select',half:true,value:p?p.triage:'jaune',options:triOpts},
    {name:'provenance',label:'Provenance',type:'select',value:p?p.provenance:'Auto-présenté',options:['Auto-présenté','Évacuation sanitaire','Équipe de terrain','Transfert d\'un autre poste','Autre'].map(v=>({v,t:v}))},
    {name:'motif',label:'Motif d\'admission',type:'textarea',required:true,value:p&&p.motif},
    {name:'allergies',label:'Allergies connues',value:p&&p.allergies,ph:'Laisser vide si aucune connue'},
    {name:'antecedents',label:'Antécédents',type:'textarea',value:p&&p.antecedents}];
  if(!p)f.push({name:'lit',label:'Lit',type:'select',value:'',options:bedOpts(null,true),hint:'Sans lit, le patient rejoint la file d\'attente.'});
  openForm({title:p?'Identité et triage':'Nouvelle admission',fields:f,submit:p?'Enregistrer':'Enregistrer l\'arrivée',
    onSubmit:async v=>{
      const body={nom:v.nom,prenom:v.prenom,naissance:v.naissance,sexe:v.sexe,groupe:v.groupe,triage:v.triage,provenance:v.provenance,motif:v.motif,allergies:v.allergies,antecedents:v.antecedents};
      if(p)await act('PUT','/api/patients/'+pid,body,'Dossier mis à jour');
      else await act('POST','/api/patients',Object.assign(body,{lit:v.lit}),v.lit?'Patient admis au lit '+v.lit:'Patient ajouté à la file d\'attente');
    }});
}
function formAdmit(pid){
  const p=S.patients[pid],o=bedOpts(null,false);
  if(!o.length){toast('Aucun lit libre.');return}
  openForm({title:'Admettre un patient',sub:esc(p.nom.toUpperCase()+' '+p.prenom)+' · '+TRI[p.triage].n,submit:'Admettre',
    fields:[{name:'lit',label:'Lit',type:'select',value:p.triage==='rouge'?(o.find(x=>x.v[0]==='A')||o[0]).v:o[0].v,options:o,hint:'Tente A pour les urgences absolues.'}],
    onSubmit:async v=>{await act('POST','/api/patients/'+pid+'/admission',{lit:v.lit},'Admis au lit '+v.lit)}});
}
function formDischarge(pid){
  const p=S.patients[pid];
  openForm({title:'Sortie du patient',sub:esc(p.nom.toUpperCase()+' '+p.prenom)+(p.lit?' · lit '+esc(p.lit):''),submit:'Confirmer la sortie',
    fields:[{name:'destination',label:'Destination',type:'select',value:'Retour à domicile',options:['Retour à domicile','Transfert vers l\'hôpital de référence','Évacuation sanitaire','Décès','Autre'].map(v=>({v,t:v}))},{name:'resume',label:'Résumé de sortie',type:'textarea',required:true,ph:'Diagnostic, soins réalisés, consignes'}],
    validate:()=>{const s=slist().filter(x=>x.patientId===pid&&(x.statut==='planifiee'||x.statut==='en_cours'));return s.length?'Une intervention est encore '+(s[0].statut==='en_cours'?'en cours':'planifiée')+' pour ce patient ('+s[0].acte+'). Terminez-la ou annulez-la avant la sortie.':''},
    onSubmit:async v=>{await act('POST','/api/patients/'+pid+'/sortie',{destination:v.destination,resume:v.resume},'Sortie enregistrée')}});
}
function formNote(pid){
  openForm({title:'Nouvelle note de suivi',fields:[{name:'type',label:'Type',type:'select',value:'Évolution',options:['Évolution','Observation médicale','Soins infirmiers','Consigne'].map(v=>({v,t:v}))},{name:'texte',label:'Note',type:'textarea',rows:6,required:true}],
    onSubmit:async v=>{await act('POST','/api/patients/'+pid+'/notes',{type:v.type,texte:v.texte},'Note ajoutée')}});
}
function formVitals(pid){
  const n=(name,label,ph,hint)=>({name,label,half:true,im:'decimal',ph,hint});
  openForm({title:'Relevé de constantes',fields:[n('fc','Fréquence cardiaque','bpm'),{name:'ta',label:'Tension (mmHg)',half:true,ph:'120/80'},n('spo2','SpO₂','%'),n('temp','Température','°C'),n('fr','Fréquence respiratoire','/min')],
    validate:v=>{const num=k=>v[k]===''?null:Number(String(v[k]).replace(',','.'));
      if(!v.fc&&!v.ta&&!v.spo2&&!v.temp&&!v.fr)return 'Saisissez au moins une valeur.';
      const chk=[['fc',20,250,'Fréquence cardiaque'],['spo2',30,100,'SpO₂'],['temp',25,45,'Température'],['fr',3,80,'Fréquence respiratoire']];
      for(const c of chk){const x=num(c[0]);if(x!==null&&(isNaN(x)||x<c[1]||x>c[2]))return c[3]+' : valeur attendue entre '+c[1]+' et '+c[2]+'.'}
      if(v.ta&&!/^\d{2,3}\/\d{2,3}$/.test(v.ta))return 'Tension : format attendu 120/80.';return ''},
    onSubmit:async v=>{await act('POST','/api/patients/'+pid+'/constantes',{fc:v.fc,ta:v.ta,spo2:v.spo2,temp:v.temp,fr:v.fr},'Relevé enregistré')}});
}
function formRx(pid){
  const p=S.patients[pid];let warned=false;
  openForm({title:'Nouvelle prescription',sub:p.allergies?'<b>Allergies : '+esc(p.allergies)+'</b>':'',fields:[{name:'nom',label:'Médicament',required:true},{name:'dose',label:'Dose',required:true,half:true,ph:'500 mg'},{name:'voie',label:'Voie',type:'select',half:true,value:'IV',options:['IV','PO','IM','SC','Inhalation','Topique'].map(v=>({v,t:v}))},{name:'freq',label:'Fréquence',ph:'toutes les 8 h'}],
    validate:v=>{if(warned)return '';const toks=(p.allergies||'').toLowerCase().split(/[^a-zà-ÿ]+/).filter(t=>t.length>=4);const n=v.nom.toLowerCase();
      if(toks.some(t=>n.includes(t)||t.includes(n))){warned=true;return 'Allergie signalée : '+p.allergies+'. Validez une seconde fois pour confirmer la prescription.'}return ''},
    onSubmit:async v=>{await act('POST','/api/patients/'+pid+'/traitements',{nom:v.nom,dose:v.dose,voie:v.voie,freq:v.freq},'Prescription ajoutée')}});
}

function findConflict(o){
  for(const s of slist()){
    if(s.id===o.id||s.statut==='annulee'||s.debut.slice(0,10)!==o.day)continue;
    const s0=minOf(s.debut),e0=s0+s.duree;
    if(s.bloc===o.bloc&&o.start<e0+TURN&&s0<o.start+o.dur+TURN)return {kind:'bloc',s,s0,e0};
    if(s.patientId===o.pid&&o.start<e0&&s0<o.start+o.dur)return {kind:'patient',s,s0,e0};
  }return null;
}
function findSlot(bloc,day,dur,ex,from){
  const occ=slist().filter(s=>s.id!==ex&&s.bloc===bloc&&s.statut!=='annulee'&&s.debut.slice(0,10)===day).map(s=>({a:minOf(s.debut),b:minOf(s.debut)+s.duree})).sort((x,y)=>x.a-y.a);
  let t=Math.ceil(Math.max(from,H0)/5)*5;
  for(const o of occ){if(t+dur+TURN<=o.a)break;t=Math.max(t,Math.ceil((o.b+TURN)/5)*5)}
  return t+dur<=H1?t:null;
}
function formSurgery(opt){
  opt=opt||{};const s=opt.id?S.surgeries[opt.id]:null;
  const pats=plist().filter(p=>p.statut!=='sorti'||(s&&s.patientId===p.id)).sort((a,b)=>byTri(a,b));
  const day=s?s.debut.slice(0,10):(opt.day||ui.day),time=s?s.debut.slice(11,16):(opt.time||'08:00');
  const f=[
    {name:'patientId',label:'Patient',type:'select',required:true,value:s?s.patientId:(opt.pid||''),options:[{v:'',t:'Choisir un patient'}].concat(pats.map(p=>({v:p.id,t:p.nom.toUpperCase()+' '+p.prenom+' · '+TRI[p.triage].s+(p.lit?' · lit '+p.lit:'')})))},
    {name:'bloc',label:'Salle',type:'select',half:true,value:s?s.bloc:(opt.bloc||BLOCS[0]),options:BLOCS.map(v=>({v,t:v}))},
    {name:'date',label:'Date',type:'date',half:true,required:true,value:day},
    {name:'heure',label:'Début',type:'time',half:true,required:true,value:time,step:300},
    {name:'duree',label:'Durée (minutes)',type:'number',half:true,required:true,value:s?s.duree:60,min:15,max:720,step:5,im:'numeric'},
    {name:'acte',label:'Acte prévu',required:true,value:s&&s.acte},
    {name:'chirurgien',label:'Chirurgien',required:true,half:true,value:s&&s.chirurgien},
    {name:'anesthesie',label:'Anesthésie',type:'select',half:true,value:s?s.anesthesie:ANES[0],options:ANES.map(v=>({v,t:v}))},
    {name:'urgence',label:'Intervention urgente',type:'checkbox',value:s&&s.urgence}];
  if(s)f.push({name:'statut',label:'Statut',type:'select',value:s.statut,options:Object.keys(SST).map(k=>({v:k,t:SST[k]}))});
  f.push({name:'notes',label:'Notes',type:'textarea',value:s&&s.notes,rows:2,ph:'Matériel, sang à prévoir, consignes'});
  openForm({title:s?'Intervention':'Réserver un bloc',sub:'Un nettoyage de '+TURN+' min est réservé après chaque intervention.',fields:f,submit:s?'Enregistrer':'Réserver',
    extra:[{label:'Proposer un créneau',fn:(v,form,err)=>{
      const dur=+v.duree;if(!v.date||!dur||dur<15){err('Indiquez la date et la durée.');return}
      const now=new Date(),from=v.date===dKey(now)?Math.ceil((now.getHours()*60+now.getMinutes())/15)*15:H0;
      const t=findSlot(v.bloc,v.date,dur,opt.id,from);
      if(t===null){err('Aucun créneau libre de '+dur+' min dans '+v.bloc+' ce jour-là. Essayez l\'autre salle ou un autre jour.');return}
      form.elements.heure.value=hm(t);toast('Premier créneau libre : '+hm(t))}}],
    danger:s?{label:'Supprimer',fn:async()=>{await act('DELETE','/api/interventions/'+opt.id,undefined,'Réservation supprimée')}}:null,
    validate:v=>{
      const dur=+v.duree,st=minOf(v.date+'T'+v.heure);
      if(!/^\d{2}:\d{2}$/.test(v.heure))return 'Heure de début invalide.';
      if(!(dur>=15))return 'La durée doit être d\'au moins 15 minutes.';
      if(st<H0)return 'Les blocs ouvrent à '+hm(H0)+'.';
      if(st+dur>H1)return 'L\'intervention dépasse minuit. Réduisez la durée ou avancez le début.';
      if(v.statut==='annulee')return '';
      const c=findConflict({id:opt.id,bloc:v.bloc,day:v.date,start:st,dur,pid:v.patientId});
      if(c){const t=c.kind==='bloc'?'Conflit avec « '+c.s.acte+' » dans '+c.s.bloc+', '+hm(c.s0)+'–'+hm(c.e0)+' (nettoyage jusqu\'à '+hm(c.e0+TURN)+').':'Ce patient est déjà au bloc sur ce créneau : « '+c.s.acte+' », '+c.s.bloc+', '+hm(c.s0)+'–'+hm(c.e0)+'.';
        const alt=c.kind==='bloc'?findSlot(v.bloc,v.date,dur,opt.id,st):null;return t+(alt!==null?' Premier créneau libre : '+hm(alt)+'.':'')}
      return ''},
    onSubmit:async v=>{
      const d={patientId:v.patientId,bloc:v.bloc,debut:v.date+'T'+v.heure,duree:+v.duree,acte:v.acte,chirurgien:v.chirurgien,anesthesie:v.anesthesie,urgence:!!v.urgence,statut:s?v.statut:'planifiee',notes:v.notes||''};
      if(s)await act('PUT','/api/interventions/'+opt.id,d,'Intervention mise à jour');
      else await act('POST','/api/interventions',d,'Bloc réservé : '+v.bloc+', '+v.heure);
      ui.day=v.date;schedule()}});
}

/* ---------- événements ---------- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]');if(!el)return;const a=el.dataset.a,pid=el.dataset.pid;
  switch(a){
    case 'close':closeDrawer();break;

    case 'new-adm':formAdmission();break;
    case 'new-adm-go':e.preventDefault();location.hash='admissions';ui.view='admissions';render();formAdmission();break;
    case 'edit-id':formAdmission(pid);break;
    case 'admit':formAdmit(pid);break;
    case 'discharge':formDischarge(pid);break;
    case 'note':formNote(pid);break;
    case 'vitals':formVitals(pid);break;
    case 'rx':formRx(pid);break;
    case 'rx-stop':if(can('prescrire'))act('POST','/api/traitements/'+el.dataset.id+'/arret',null,'Traitement arrêté').catch(x=>toast(x.message));break;
    case 'open':case 'sel':if(ui.view!=='dossiers'){location.hash='dossiers';ui.view='dossiers'}openDetail(pid);window.scrollTo(0,0);break;
    case 'logout':api('POST','/api/deconnexion').catch(()=>{}).then(showLogin);break;
    case 'refresh-journal':loadJournal();break;
    case 'back':ui.pid=null;render();break;
    case 'filt':ui.filt=el.dataset.v;render();break;
    case 'dfilt':ui.dfilt=el.dataset.v;render();break;
    case 'edit-surg':{const s=S.surgeries[el.dataset.id];if(!s)break;if(can('intervention'))formSurgery({id:el.dataset.id});else{const p=S.patients[s.patientId];toast(s.acte+' · '+s.bloc+' '+s.debut.slice(11)+' · '+SST[s.statut]+(p?' · '+p.nom.toUpperCase():'')+' (réservé aux médecins)')}break}
    case 'new-surg':if(can('intervention'))formSurgery({pid:pid});break;
    case 'day-prev':ui.day=addDays(ui.day,-1);render();break;
    case 'day-next':ui.day=addDays(ui.day,1);render();break;
    case 'day-today':ui.day=dKey(new Date());render();break;
    case 'col':{
      if(e.target.closest('.sg')||!can('intervention'))break;
      const r=el.getBoundingClientRect(),m=Math.min(H1-60,Math.max(H0,Math.round((H0+(e.clientY-r.top)/PX)/15)*15));
      formSurgery({bloc:el.dataset.bloc,day:ui.day,time:hm(m)});break}
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='q'){ui.q=e.target.value;render()}
  else if(e.target.id==='dq'){ui.dq=e.target.value;render()}
});
document.addEventListener('change',e=>{if(e.target.id==='dayin'&&e.target.value){ui.day=e.target.value;render()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#drawer').firstChild)closeDrawer()});
function route(){
  const h=location.hash.slice(1);ui.view=VIEWS[h]?h:'tableau';
  if(ui.view==='journal'&&!can('journal'))ui.view='tableau';
  render();window.scrollTo(0,0);
  if(S.me){if(ui.view==='journal')loadJournal();else refresh(true)}
}
window.addEventListener('hashchange',route);
document.addEventListener('submit',async e=>{
  if(e.target.id!=='loginform')return;
  e.preventDefault();
  const err=$('#l_err'),btn=$('#l_btn');err.classList.remove('on');btn.disabled=true;
  try{
    S.me=await api('POST','/api/connexion',{identifiant:$('#l_id').value.trim(),mot_de_passe:$('#l_pw').value});
    $('#l_pw').value='';afterLogin();
  }catch(ex){err.textContent=ex.message;err.classList.add('on')}
  btn.disabled=false;
});
setInterval(()=>{if(S.me&&!document.hidden&&!$('#drawer').firstChild)refresh()},8000);
setInterval(()=>{if(S.me&&S.ready&&!$('#drawer').firstChild)render()},60000);
route();init();
})();
