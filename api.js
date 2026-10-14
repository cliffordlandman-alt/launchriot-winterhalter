// ===== Winterhalter workspace ⇄ LaunchRiot API =====
// Config: the API base URL. If the API is unreachable, the workspace stays in local mode (empty + Add forms).
const API_BASE='https://api-gareth.145-241-118-107.sslip.io';
const TOKEN_KEY='wh-api-token',REFRESH_MS=5*60*1000;
const API={online:false,authed:false,conns:[],sync:null,err:''};
const PROV={google:{n:'Google (Gmail & Calendar)',k:['gmail','gcal']},microsoft:{n:'Microsoft (Outlook & Calendar)',k:['outlook']},zoho:{n:'Zoho (CRM, Books, Mail)',k:['zcrm','zbooks','zmail']},whatsapp:{n:'WhatsApp Business',k:['wa']}};
const KEY2PROV={gmail:'google',gcal:'google',outlook:'microsoft',zcrm:'zoho',zbooks:'zoho',zmail:'zoho',wa:'whatsapp'};
const tok=()=>localStorage.getItem(TOKEN_KEY)||'';
async function api(path,opt={}){const r=await fetch(API_BASE+path,{...opt,headers:{'Content-Type':'application/json',...(tok()?{Authorization:'Bearer '+tok()}:{}),...(opt.headers||{})}});
 if(r.status==401){localStorage.removeItem(TOKEN_KEY);API.authed=false;showLogin();throw new Error('auth')}
 if(!r.ok)throw new Error('HTTP '+r.status);const ct=r.headers.get('content-type')||'';return ct.includes('json')?r.json():r.text()}
const arr=x=>Array.isArray(x)?x:(x&&(x.items||x.data||x.results))||[];
const pick=(o,...k)=>{for(const x of k)if(o&&o[x]!=null&&o[x]!=='')return o[x];return ''};
const isCon=p=>API.conns.some(c=>c.provider==p&&c.status=='connected');
function ago(t){if(!t)return 'never';const m=Math.round((Date.now()-new Date(t))/60000);return m<1?'just now':m<60?m+' min ago':Math.round(m/60)+' h ago'}
// ---- login screen ----
function showLogin(){if(document.getElementById('wh-login'))return;const d=document.createElement('div');d.id='wh-login';
 d.style.cssText='position:fixed;inset:0;z-index:60;background:rgba(16,18,22,.92);display:grid;place-items:center;padding:16px';
 d.innerHTML=`<form style="background:#fff;border-radius:16px;padding:22px;width:100%;max-width:340px;box-shadow:0 20px 60px rgba(0,0,0,.4)"><img src="winterhalter-logo.png" alt="Winterhalter" style="height:48px;width:auto"><h2 style="margin:10px 0 4px">Sign in</h2><p class="muted" style="margin:0 0 12px">Gareth's workspace</p><label class="muted">Email<input class="in" name="email" type="email" required autocomplete="username"></label><br><br><label class="muted">Password<input class="in" name="password" type="password" required autocomplete="current-password"></label><p id="wh-lerr" style="color:#b00;min-height:18px;font-size:13px"></p><button class="btn" style="width:100%">Sign in</button><p style="text-align:center;margin:12px 0 0"><a href="#" id="wh-skip" class="muted" style="font-size:13px">Continue offline (saved in this browser)</a></p></form>`;
 document.body.appendChild(d);
 d.querySelector('#wh-skip').onclick=e=>{e.preventDefault();d.remove()};
 d.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.target,er=d.querySelector('#wh-lerr');er.textContent='Signing in…';
  try{const r=await fetch(API_BASE+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.email.value.trim(),password:f.password.value})});
   if(!r.ok){er.textContent=r.status==401||r.status==400?'Wrong email or password.':'Sign-in failed ('+r.status+').';return}
   const j=await r.json();if(!j.token){er.textContent='Sign-in failed.';return}localStorage.setItem(TOKEN_KEY,j.token);API.authed=true;d.remove();refresh(true)}
  catch(x){er.textContent='Server not reachable. You can continue offline.'}}}
window.logout=()=>{localStorage.removeItem(TOKEN_KEY);API.authed=false;API.conns=[];applyCons();render();showLogin()};
// ---- data load ----
function applyCons(){for(const k in KEY2PROV)D.con[k]=isCon(KEY2PROV[k])?1:0}
function setRemote(key,items){D[key]=D[key].filter(x=>!x.remote).concat(items.map(x=>({...x,remote:1})))}
async function loadData(){const jobs=[];const g=(p,f)=>jobs.push(api(p).then(f).catch(e=>{if(e.message=='auth')throw e}));
 if(isCon('google')||isCon('microsoft')){
  if(isCon('google'))g('/inbox?source=gmail',x=>D._gm=arr(x));if(isCon('microsoft'))g('/inbox?source=outlook',x=>D._ol=arr(x));
  const f=new Date(),t=new Date(Date.now()+7*DAY);g('/calendar?from='+f.toISOString()+'&to='+t.toISOString(),x=>setRemote('cal',arr(x).map((e,i)=>{const s=pick(e,'start','start_time','starts_at');return{id:'rc'+pick(e,'id')||i,src:e.provider=='microsoft'||e.source=='outlook'?'outlook':'gcal',title:pick(e,'title','summary','subject')||'(no title)',d:String(s).slice(0,10),t:String(s).slice(11,16)}})))}
 if(isCon('whatsapp'))g('/inbox?source=whatsapp',x=>setRemote('wa',arr(x).map((m,i)=>({id:'rw'+(pick(m,'id')||i),src:'wa',from:pick(m,'from','from_name','sender','contact'),msg:pick(m,'body','text','snippet','message'),reply:pick(m,'suggested_reply','draft'),st:'Pending'}))));
 if(isCon('zoho')){
  g('/crm/deals',x=>setRemote('deals',arr(x).map((d,i)=>({id:'rd'+(pick(d,'id')||i),co:pick(d,'account','account_name','company','contact_name'),title:pick(d,'name','deal_name','title'),val:+pick(d,'amount','value')||0,owner:pick(d,'owner','owner_name'),stage:STAGES.includes(d.stage)?d.stage:(pick(d,'stage')||'Lead')}))));
  g('/crm/contacts',x=>setRemote('cust',arr(x).map((c,i)=>({id:'rk'+(pick(c,'id')||i),name:pick(c,'name','full_name','account_name','company'),type:pick(c,'type','category')||'—',area:pick(c,'city','area','location')||'—',machines:pick(c,'machines')||'—',plan:pick(c,'plan')||'—'}))));
  g('/books/invoices',x=>setRemote('contracts',arr(x).map((v,i)=>{const due=String(pick(v,'due_date','due')).slice(0,10),st=String(pick(v,'status')).toLowerCase();return{id:'ri'+(pick(v,'id')||i),cust:pick(v,'customer_name','customer','contact'),plan:'Invoice '+pick(v,'number','invoice_number','id'),val:+pick(v,'total','amount','balance')||0,due:due||'—',st:st=='paid'?'Renewed':st=='overdue'?'Overdue':'Due soon'}})));}
 g('/drafts',x=>setRemote('approvals',arr(x).map((a,i)=>({id:'ra_'+(pick(a,'id')||i),rid:pick(a,'id'),bot:pick(a,'bot','agent','source')||'Assistant',text:pick(a,'summary','text','title','body'),st:({approved:'Approved',declined:'Declined'})[a.status]||'Pending'}))));
 g('/sync/status',x=>API.sync=x);
 await Promise.all(jobs);
 const mk=(L,src)=>(L||[]).map((m,i)=>({id:'rm'+src+(pick(m,'id')||i),src,from:pick(m,'from','from_name','sender'),subj:pick(m,'subject','title')||'(no subject)',sum:pick(m,'summary','ai_summary','snippet','body'),reply:pick(m,'suggested_reply','draft'),pri:m.priority=='high'||m.important?'High':'Normal',st:'Pending'}));
 if(D._gm||D._ol){setRemote('mail',mk(D._gm,'gmail').concat(mk(D._ol,'outlook')));delete D._gm;delete D._ol}}
async function refresh(force){try{
  if(!tok()){const r=await fetch(API_BASE+'/connections').catch(()=>null);API.online=!!r;if(r)showLogin();render();return}
  API.conns=arr(await api('/connections'));API.online=true;API.authed=true;applyCons();await loadData();save()}
 catch(e){if(e.message!='auth'){API.online=false;API.err=e.message}}render()}
// ---- UI overrides ----
const _view=view;
view=function(t){
 if(t=='connections'&&API.authed){const card=p=>{const c=API.conns.find(x=>x.provider==p)||{status:'not_configured'},s=c.status;
   const lab={connected:'Connected',not_connected:'Not connected yet',not_configured:'Not set up yet',error:'Error'}[s]||s;
   return `<div class="card"><b>${PROV[p].n}</b><p>${pill(lab)}</p>${c.account?`<div class="muted">${esc(c.account)}</div>`:''}<div class="muted">Last synced: ${ago(c.last_synced_at)}</div><div class="toolbar" style="margin-top:8px">${s=='connected'?`<button class="btn sm" onclick="sync('${PROV[p].k[0]}')">🔄 Sync now</button><button class="btn sm dark" onclick="apiDisconnect('${p}')">Disconnect</button>`:p=='whatsapp'?'':s=='not_configured'?`<span class="muted">Your LaunchRiot setup will enable this.</span>`:`<button class="btn sm" onclick="apiConnect('${p}')">Connect</button>`}</div>
   ${p=='whatsapp'&&s!='connected'?`<details style="margin-top:8px"><summary><b>Connect WhatsApp Business</b></summary><input class="in" id="wa-pn" placeholder="Phone number ID"><br><input class="in" id="wa-waba" placeholder="WABA ID" style="margin-top:6px"><br><input class="in" id="wa-tok" type="password" placeholder="Access token" style="margin-top:6px"><br><button class="btn sm" style="margin-top:8px" onclick="apiWA()">Save</button></details>`:''}</div>`};
  return `<h2>Connections</h2><p class="muted">${syncLine()}</p><div class="grid">${Object.keys(PROV).map(card).join('')}</div><p><a href="#" onclick="logout();return false" class="muted">Sign out</a></p>`}
 return _view(t)};
function syncLine(){const s=API.sync||{};const t=pick(s,'last_synced_at','last_run_at','finished_at');return API.authed?('Last synced '+ago(t)+(s.status=='running'?' · syncing…':'')):''}
window.apiConnect=p=>{location.href=API_BASE+'/oauth/'+p+'/start?token='+encodeURIComponent(tok())};
window.apiDisconnect=async p=>{if(!confirm('Disconnect '+PROV[p].n+'?'))return;try{await api('/connections/'+p,{method:'DELETE'});toast('Disconnected');refresh()}catch(e){toast('Could not disconnect: '+e.message)}};
window.apiWA=async()=>{const v=i=>document.getElementById(i).value.trim();if(!v('wa-pn')||!v('wa-waba')||!v('wa-tok')){toast('Fill in all three fields');return}
 try{await api('/connections/whatsapp',{method:'POST',body:JSON.stringify({phone_number_id:v('wa-pn'),waba_id:v('wa-waba'),access_token:v('wa-tok')})});toast('WhatsApp connected');refresh()}catch(e){toast('Could not connect WhatsApp: '+e.message)}};
const _sync=window.sync;
window.sync=async k=>{const p=KEY2PROV[k];if(!API.authed||!isCon(p))return _sync(k);toast('Syncing '+SRC[k]+'…');try{await api('/sync/run',{method:'POST',body:JSON.stringify({provider:p})});await refresh();toast('Synced '+SRC[k])}catch(e){toast('Sync failed: '+e.message)}};
const _appr=window.appr;
window.appr=async(id,s)=>{const a=D.approvals.find(a=>a.id==id);if(a&&a.remote&&a.rid!==''){try{await api('/drafts/'+a.rid+'/'+(s=='Approved'?'approve':'decline'),{method:'POST'});a.st=s;save();render();toast(s=='Approved'?'Approved':'Declined')}catch(e){toast('Could not update: '+e.message)}}else _appr(id,s)};
// remote ids are strings: patch inline handlers that pass ids unquoted
const _apprTbl=apprTbl;apprTbl=function(){return _apprTbl().replace(/appr\((ra_[^,]+),/g,"appr('$1',")};
// status tag in toolbar
const _render=render;render=function(){_render();const tg=document.querySelector('.content .toolbar .tag');if(tg)tg.textContent=API.authed?('● Live · '+syncLine()):API.online?'Not signed in · saved in this browser':'Offline · saved in this browser'};
// OAuth return: #/app/connections?connected=X
(function(){const h=location.hash,i=h.indexOf('?');if(i>-1){const q=new URLSearchParams(h.slice(i+1));history.replaceState(null,'',location.pathname+location.search+h.slice(0,i));const c=q.get('connected'),er=q.get('error');setTimeout(()=>toast(c?(PROV[c]?PROV[c].n:c)+' connected':er?'Connection failed: '+er:''),300)}})();
removeEventListener('hashchange',_render);addEventListener('hashchange',()=>render());
render();refresh();setInterval(refresh,REFRESH_MS);
