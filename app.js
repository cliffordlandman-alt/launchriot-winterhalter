// Executive workspace template. Nothing is ever sent from here. No secrets in this file.
(function(){'use strict';
const CFG=window.WN_CFG||{},API_BASE=CFG.apiBase||'',TZ='Asia/Dubai',DAY=864e5,LS='wnext-capture-v1';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const HOOKS=[];const S={authed:false,online:true,loaded:false,err:'',conn:[],mail:[],cal:[],staff:[],drafts:[],user:null,syncedAt:null,ans:null};
const arr=x=>Array.isArray(x)?x:(x&&(x.items||x.data||x.connections))||[];
const TK='wn-tok',getTok=()=>{try{return localStorage.getItem(TK)||''}catch(e){return ''}},setTok=t=>{try{t?localStorage.setItem(TK,t):localStorage.removeItem(TK)}catch(e){}};
(function(){try{const m=/[#&?\/](?:t|s)=([A-Za-z0-9_-]{20,100})/.exec(location.hash||'');if(m){setTok(m[1]);history.replaceState(null,'',location.pathname+location.search)}}catch(e){}})();
async function api(p,o){o=o||{};const h=o.body?{'Content-Type':'application/json'}:{};const tk=getTok();if(tk)h.Authorization='Bearer '+tk;const r=await fetch(API_BASE+p,{...o,credentials:'include',headers:h});
 const ct=r.headers.get('content-type')||'',b=ct.includes('json')?await r.json().catch(()=>null):null;const e=new Error('HTTP '+r.status);e.status=r.status;
 if(!r.ok){if(r.status==401&&p!='/auth/login')setTok('');throw e}if(p=='/auth/login'&&b){const t=b.token||b.session_token||b.session_id||b.sid||b.session||(b.data&&b.data.token);if(typeof t=='string'&&t)setTok(t)}return b}
const fmt=(iso,k)=>iso?new Intl.DateTimeFormat('en-GB',{timeZone:TZ,...k}).format(new Date(iso)):'';
const dkey=iso=>iso?new Intl.DateTimeFormat('en-CA',{timeZone:TZ}).format(new Date(iso)):'';
const todayK=()=>dkey(new Date().toISOString());
const tm=iso=>fmt(iso,{hour:'2-digit',minute:'2-digit',hour12:false});
const dl=iso=>fmt(iso,{weekday:'short',day:'numeric',month:'short'});
const ago=t=>{if(!t)return 'never';const m=Math.round((Date.now()-new Date(t))/6e4);return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
const days=t=>Math.floor((Date.now()-new Date(t))/DAY);
const greet=()=>{const h=+fmt(new Date().toISOString(),{hour:'2-digit',hour12:false});return h<12?'Good morning':h<17?'Good afternoon':'Good evening'};
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',2800)}
function safeUrl(u){try{const x=new URL(u);return x.protocol=='https:'?x.href:''}catch(e){return ''}}
// ---- local capture (this device only) ----
const loadLocal=()=>{try{const a=JSON.parse(localStorage.getItem(LS)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}};
const saveLocal=a=>localStorage.setItem(LS,JSON.stringify(a));
S.cap=[];S.capOK=false;
const loadCap=()=>S.authed&&S.capOK?S.cap:loadLocal();
const mapCap=c=>({id:String(c.id),type:c.type||'note',text:String(c.text||''),due:c.due?(/^\d{4}-\d\d-\d\d/.test(c.due)?c.due.slice(0,10):dkey(c.due)):'',done:!!c.done,at:c.created_at?+new Date(c.created_at):0});
HOOKS.push(async soft=>{const r=await soft('/capture');if(r){S.cap=arr(r).map(mapCap);S.capOK=true}});
async function capCall(p,m,b){try{await api(p,{method:m,body:b?JSON.stringify(b):undefined});await load();return true}catch(e){toast('Could not save to the server ('+(e.status||'offline')+'). Nothing was changed.');return false}}
// ---- normalise ----
const nm=x=>x?(typeof x=='object'?(x.name||x.email||''):String(x)):'';
function mapMail(m){return{fe:String((m.from&&typeof m.from=='object'?m.from.email:m.from)||'').toLowerCase(),id:m.id,src:m.source||'mail',from:m.from_name||(typeof m.from=='object'?nm(m.from):m.from)||'Unknown sender',subj:m.subject||'(no subject)',sum:m.body_summary||m.snippet||'',pri:m.priority=='high',imp:+m.importance||0,vip:m.vip===true,reasons:Array.isArray(m.importance_reasons)?m.importance_reasons.map(String):[],unread:!!m.unread,flag:!!m.flagged,cc:!!m.is_cc,replied:m.replied===true,thread:m.thread_id||'',at:m.received_at}}
function mailLink(m){return m.src=='mail'&&m.thread?'https://mail.invalid/mail/u/0/#all/'+encodeURIComponent(m.thread):''}
function mapStaff(m){const a=(m.assigned_staff||[])[0]||m.staff_sender;return{id:m.id,who:nm(a)||'Unassigned',subj:m.subject||m.body_summary||m.snippet||'(no subject)',at:m.received_at,src:m.source||'mail',thread:m.thread_id||''}}
const isPriority=m=>!m.replied&&(m.pri||m.flag);
function why(m){const r=[];if(m.pri)r.push('marked high priority by LaunchRiot');if(m.flag)r.push('looks like it needs a reply');if(m.unread)r.push('unread');if(m.cc)r.push('you are on CC');m.reasons.slice(0,3).forEach(x=>r.push(x));return r.length?r.join('; '):'no flag recorded'}
// ---- load ----
async function load(){S.err='';try{
 const st=await api('/status').catch(e=>{if(e.status==404)return api('/auth/me').then(()=>({connections:[]}));throw e});S.conn=arr(st.connections?st:st);S.authed=true;
 const con=S.conn.filter(c=>c.state=='connected');
 const MS={provider_a:'mail',provider_b:'mail2',provider_c:'provider_c_mail'};
 const soft=p=>api(p).catch(e=>{if(e.status==401)throw e;S.err='Some data could not be loaded ('+(e.status||'offline')+').';return null});
 const f=new Date(Date.now()-DAY).toISOString(),t=new Date(Date.now()+14*DAY).toISOString();
 const [boxes,cals,op,dr]=await Promise.all([Promise.all(con.map(c=>soft('/inbox?source='+(MS[c.provider]||c.provider)+'&limit=100'))),Promise.all(con.map(c=>soft('/calendar?source='+c.provider+'&from='+encodeURIComponent(f)+'&to='+encodeURIComponent(t)))),soft('/staff-tasks?status=open'),soft('/drafts')]);
 S.mail=boxes.flatMap(b=>arr(b)).map(mapMail);
 S.cal=cals.flatMap(b=>arr(b)).map(e=>({id:e.id,title:e.title||'(no title)',at:e.starts_at,end:e.ends_at||'',loc:e.location||'',url:safeUrl(e.meeting_url||''),desc:String(e.description||''),att:Array.isArray(e.attendees_detail)?e.attendees_detail.map(a=>({email:String(a.email||''),name:String(a.name||''),resp:String(a.response||'')})):[],org:nm(e.organizer)})).filter(e=>e.at).sort((a,b)=>new Date(a.at)-new Date(b.at));
 S.staff=arr(op).map(mapStaff);
 S.drafts=arr(dr).filter(d=>!['approved','approved_held','declined'].includes(d.status)).map(d=>({id:d.id,subj:d.subject||'Draft',body:String(d.body||'').slice(0,200),type:d.type||''}));
 await Promise.all(HOOKS.map(h=>h(soft)));
 S.syncedAt=con.map(c=>c.last_sync).filter(Boolean).sort().pop()||null;S.loaded=true;S.online=true;
}catch(e){if(e.status==401){S.authed=false;S.loaded=false;S.capOK=false}else{S.online=false;S.err='Cannot reach the server from this browser.'}}

 const f=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#main')&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);if(!f)render()}
// ---- derived ----
const prio=()=>S.mail.filter(isPriority).sort((a,b)=>b.imp-a.imp||new Date(b.at)-new Date(a.at));
const meetToday=()=>S.cal.filter(e=>dkey(e.at)==todayK());
const meetWeek=()=>{const t=Date.now()-36e5,e=Date.now()+7*DAY;return S.cal.filter(x=>{const v=+new Date(x.at);return v>=t&&v<=e})};
const needsDecision=()=>S.drafts.concat((S.decisions||[]).filter(d=>d.status!='decided').map(d=>({id:d.id,subj:d.title,body:d.context||'Decision pending',type:'decision'}))).concat((S.tasks||[]).filter(t=>t.status=='awaiting_approval').map(t=>({id:t.id,subj:t.title||t.subject||'Staff request',body:'Staff request awaiting your approval (owner: '+(t.owner||'unassigned')+')',type:'approval'})));
const connected=()=>S.conn.some(c=>c.state=='connected');
function nextMeeting(){return S.cal.find(e=>new Date(e.end||e.at).getTime()>Date.now()-9e5&&dkey(e.at)>=todayK())}
function relatedTo(ev){const w=(ev.title.toLowerCase().match(/[a-z0-9]{4,}/g)||[]).filter(x=>!['meeting','call','with','sync','weekly','review','catch'].includes(x));if(!w.length)return{mail:[],notes:[]};
 const hit=s=>w.some(x=>s.toLowerCase().includes(x));
 return{mail:S.mail.filter(m=>hit(m.subj+' '+m.from)).slice(0,4),notes:loadCap().filter(c=>!c.done&&hit(c.text)).slice(0,4)}}
// ---- focus top 3 ----
function top3(){const c=[];const tk=todayK();
 meetToday().filter(e=>new Date(e.end||e.at)>new Date()).slice(0,2).forEach((e,i)=>c.push({s:90-i,t:e.title,why:'Meeting today at '+tm(e.at)+' (calendar)',kind:'Meeting'}));
 loadCap().filter(x=>!x.done&&x.type=='task'&&x.due&&x.due<=tk).forEach(x=>c.push({s:x.due<tk?95:85,t:x.text,why:(x.due<tk?'Overdue since ':'Due today: ')+x.due+' (your captured task)',kind:'Task'}));
 needsDecision().slice(0,2).forEach(d=>c.push({s:80,t:d.subj,why:d.type=='approval'?'Staff request awaiting your approval':d.type=='decision'?'Open decision in your register':'Draft waiting for your decision',kind:'Decision'}));
 prio().slice(0,3).forEach(m=>c.push({s:50+Math.min(m.imp,30),t:m.subj+' · '+m.from,why:why(m),kind:'Message',link:mailLink(m)}));
 return c.sort((a,b)=>b.s-a.s).slice(0,3)}
// ---- html helpers ----
const msgItem=m=>`<div class="item"><div class="t">${m.vip?'<span class="pill ok">VIP</span>':''}${esc(m.subj)}</div><div class="mut sm">${esc(m.from)} · ${esc(dl(m.at))} ${esc(tm(m.at))}</div><div class="why"><b>Why flagged:</b> ${esc(why(m))}</div>${mailLink(m)?`<a href="${esc(mailLink(m))}" target="_blank" rel="noopener noreferrer">Open original message ↗</a>`:`<span class="mut sm">Source: email</span>`}</div>`;
const calItem=e=>`<div class="item"><div class="t">${esc(tm(e.at))}${e.end?'–'+esc(tm(e.end)):''} · ${esc(e.title)}</div><div class="mut sm">${esc(dl(e.at))} (Dubai time)${e.loc?' · '+esc(e.loc):''}</div>${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">Join link ↗</a>`:''}<div class="why"><b>Source:</b> calendar</div></div>`;
const staffItem=s=>`<div class="item"><div class="t">${esc(s.subj)}</div><div class="mut sm">${esc(s.who)} · open ${days(s.at)} d</div><div class="why"><b>Why shown:</b> staff member copied on a thread that has no reply yet</div>${s.src=='mail'&&s.thread?`<a href="https://mail.invalid/mail/u/0/#all/${encodeURIComponent(s.thread)}" target="_blank" rel="noopener noreferrer">Open original message ↗</a>`:''}</div>`;
const draftItem=d=>`<div class="item"><div class="t">${esc(d.subj)}</div><div class="mut sm">${esc(d.body)}</div><div class="why"><b>Why shown:</b> ${d.type=='approval'?'staff task marked awaiting approval (approve in Staff; status only)':d.type=='decision'?'open decision in your register':'draft is pending; nothing is sent either way'}</div></div>`;
const capItem=x=>`<div class="item row" style="justify-content:space-between;flex-wrap:nowrap"><label class="row" style="margin:0;color:var(--ink);gap:10px;flex:1;min-width:0"><input type="checkbox" data-cap-done="${esc(x.id)}" ${x.done?'checked':''} style="width:20px;height:20px;flex:none"><span class="${x.done?'done':''}" style="overflow-wrap:anywhere"><span class="pill">${esc(x.type)}</span>${esc(x.text)}${x.due?` <span class="mut sm">· due ${esc(x.due)}</span>`:''}</span></label><button class="btn alt sm" data-cap-del="${esc(x.id)}" aria-label="Delete ${esc(x.type)}">Delete</button></div>`;
const sec=(t,items,empty)=>`<div class="card"><h2>${esc(t)}</h2>${items.length?items.join(''):`<div class="empty">${esc(empty)}</div>`}</div>`;
const gate=()=>!S.authed?`<div class="notice">You are not signed in, so live data isn’t shown. <button class="btn sm" data-act="login">Sign in</button> Quick capture still works on this device.</div>`:!S.online?`<div class="notice">${esc(S.err)}</div>`:!connected()?`<div class="notice">No mail or calendar account is connected yet, so these sections are empty. Nothing is estimated or made up. See <a href="#/connections">Connections</a>.</div>`:S.err?`<div class="notice">${esc(S.err)}</div>`:'';
// ---- views ----
function vOverview(){const p=prio(),mt=meetToday(),nd=needsDecision(),T=top3();
 const live=S.authed&&S.loaded,n=v=>live?v:'–';
 return `<h1>${greet()}, ${window.WN_NAME||'there'}.</h1><p class="sub">${esc(new Intl.DateTimeFormat('en-GB',{timeZone:TZ,weekday:'long',day:'numeric',month:'long'}).format(new Date()))} · Dubai time${S.syncedAt?' · last mail sync '+esc(ago(S.syncedAt)):''}</p>${gate()}
<div class="tiles"><a class="tile" href="#/brief"><b>${n(nd.length)}</b><span>Needs decision</span><small>Open decisions and drafts</small></a><a class="tile" href="#/brief"><b>${n(p.length)}</b><span>Priority messages</span><small>High priority or needs reply</small></a><a class="tile" href="#/brief"><b>${n(mt.length)}</b><span>Meetings today</span><small>From your calendar</small></a></div>
<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Your attention today</h2><a href="#/focus" class="btn alt sm" style="text-decoration:none">Focus mode</a></div>${T.length?T.map((x,i)=>`<div class="item"><div class="t">${i+1}. ${esc(x.t)}</div><div class="why"><b>Why:</b> ${esc(x.why)}</div></div>`).join(''):'<div class="empty">Nothing needs your attention based on connected data and your captured tasks.</div>'}</div>
<div class="card arthur"><h2>Ask Arthur</h2><p class="sub" style="margin-bottom:12px">Rule-based helper. Not an AI model.</p><a class="btn alt" style="text-decoration:none" href="#/arthur">Open Arthur</a></div>`}
function vBrief(){const p=prio().slice(0,6),mt=meetToday(),wk=meetWeek().filter(e=>dkey(e.at)!=todayK()),cap=loadCap().filter(x=>!x.done&&x.type=='task');
 return `<h1>Morning brief</h1><p class="sub">Built from your inbox, calendar and staff tasks. Each line shows why it is here.</p>${gate()}
${sec('Needs your attention',p.map(msgItem),'No priority messages.')}
${sec('Meetings today',mt.map(calItem),'No meetings today.')}
${sec('Decisions waiting',needsDecision().map(draftItem),'No drafts waiting.')}
${sec('What your staff have open',S.staff.slice(0,8).map(staffItem),'No open staff tasks.')}
${sec('Coming up this week',wk.slice(0,8).map(calItem),'Nothing else in the next 7 days.')}
${sec('Your captured tasks',cap.slice(0,6).map(capItem),'None captured.')}`}
function answer(k){const p=prio().slice(0,3),mt=meetToday(),nd=needsDecision();const li=a=>'<ol>'+a.map(x=>'<li>'+x+'</li>').join('')+'</ol>';
 if(!S.authed)return 'I can only read data after you sign in. <button class="btn sm" data-act="login">Sign in</button>';
 if(k=='prio'){const T=top3();return T.length?'These are the top items by my fixed rules (meetings, due tasks, decisions, then priority mail):'+li(T.map(x=>`<b>${esc(x.t)}</b><br><span class="mut sm">${esc(x.why)}</span>`)):'Nothing is flagged right now.'}
 if(k=='day'){const parts=[];parts.push(`<b>${mt.length}</b> meeting${mt.length==1?'':'s'} today`+(mt.length?': '+mt.slice(0,4).map(e=>esc(tm(e.at))+' '+esc(e.title)).join('; '):''));parts.push(`<b>${prio().length}</b> priority message${prio().length==1?'':'s'}`);parts.push(`<b>${nd.length}</b> draft${nd.length==1?'':'s'} awaiting your decision`);parts.push(`<b>${S.staff.length}</b> open staff task${S.staff.length==1?'':'s'}`);const d=loadCap().filter(x=>!x.done&&x.type=='task'&&x.due&&x.due<=todayK()).length;parts.push(`<b>${d}</b> captured task${d==1?'':'s'} due or overdue`);return 'Your day in numbers:'+li(parts)}
 if(k=='appr')return nd.length?`${nd.length} draft${nd.length==1?'':'s'} waiting. Decisions are recorded under Decisions and staff approvals under Staff; they change status inside LaunchRiot only and nothing is sent.`+li(nd.map(d=>`<b>${esc(d.subj)}</b><br><span class="mut sm">${esc(d.body)}</span>`)):'No drafts are waiting for a decision. The system has no other approval type yet.';
 if(k=='meet'){const e=nextMeeting();if(!e)return 'No upcoming meeting found in your calendar.';if(window.WN&&WN.prep)return 'Next meeting, prepared from your calendar, mail, VIPs, decisions and notes:'+WN.prep(e);const r=relatedTo(e);return `Next: <b>${esc(e.title)}</b> at ${esc(dl(e.at))} ${esc(tm(e.at))} (Dubai)${e.loc?' · '+esc(e.loc):''}.<br><span class="mut sm">Calendar data has no attendee list or agenda yet. Related items below are found by matching words in the title, so they may be incomplete.</span><div style="margin-top:8px"><b>Possibly related emails</b>${r.mail.length?'<ul>'+r.mail.map(m=>`<li>${esc(m.subj)} · ${esc(m.from)}</li>`).join('')+'</ul>':'<div class="mut sm">None found.</div>'}<b>Your notes that match</b>${r.notes.length?'<ul>'+r.notes.map(n=>`<li>${esc(n.text)}</li>`).join('')+'</ul>':'<div class="mut sm">None found.</div>'}</div>`}}
function vArthur(){return `<h1>Ask Arthur</h1><p class="sub">Your assistant for the morning.</p><div class="notice"><b>Arthur is rule-based.</b> He reads the data on this page with fixed rules. He is not an AI model and cannot understand free text yet. He never sends anything.</div>${gate()}
<div class="card arthur"><div class="row"><button class="btn alt" data-ask="prio">My priorities</button><button class="btn alt" data-ask="day">Prepare my day</button><button class="btn alt" data-ask="appr">Pending approvals</button><button class="btn alt" data-ask="meet">Prepare my meeting</button></div><div id="ans" aria-live="polite">${S.ans?`<div class="bubble">${S.ans}</div>`:'<div class="bubble mut">Choose a button above.</div>'}</div></div>`}
function vFocus(){const T=top3();return `<h1>Focus</h1><p class="sub">Today’s top three. Everything else is hidden.</p>${gate()}<div class="focus">${T.length?T.map((x,i)=>`<div class="card"><div class="n">${i+1}</div><div><span class="pill">${esc(x.kind)}</span><h3 style="display:inline">${esc(x.t)}</h3><div class="why"><b>Why:</b> ${esc(x.why)}</div>${x.link?`<a class="sm" href="${esc(x.link)}" target="_blank" rel="noopener noreferrer" style="color:#0070a8">Open original message ↗</a>`:''}</div></div>`).join(''):'<div class="card empty">Nothing to focus on right now. Use Quick capture to add a task.</div>'}</div><p class="mut sm">Ranking rules: overdue or due-today captured tasks, today’s meetings, pending decisions, then priority mail by LaunchRiot importance.</p>`}
function vCapture(){const a=loadCap().sort((x,y)=>y.at-x.at);return `<h1>Quick capture</h1><p class="sub">Add a task, note or idea in seconds.</p><div class="notice">${capWhere()}</div>${capMigrate()}${capForm()}<div class="card"><h2>Captured (${a.length})</h2>${a.length?a.map(capItem).join(''):'<div class="empty">Nothing captured yet.</div>'}</div>`}
const capWhere=()=>S.authed&&S.capOK?'Saved to your private workspace server, so it syncs across your devices.':'Not signed in: saved on this device only. Sign in to sync across devices.';
const capMigrate=()=>{const n=S.authed&&S.capOK?loadLocal().length:0;return n?`<div class="notice">${n} item(s) were captured earlier on this device only. <button class="btn sm" data-act="capmigrate">Upload to my workspace</button></div>`:''};
function capForm(){return `<form class="card" id="capform"><label>Type<select name="type"><option value="task">Task</option><option value="note">Note</option><option value="idea">Idea</option></select></label><label>What<textarea name="text" rows="3" maxlength="500" required></textarea></label><label>Due date (tasks, optional)<input type="date" name="due"></label><button class="btn">Save</button></form>`}
function vConn(){return `<h1>Connections</h1><p class="sub">Read-only. Outbound sending is off.</p>${gate()}<div class="card">${S.conn.length?S.conn.map(c=>`<div class="item"><div class="t">${esc({provider_a:'Account A (mail and calendar)',provider_b:'Account B (mail and calendar)',provider_c:'Other mail account'}[c.provider]||c.provider)} <span class="pill ${c.state=='connected'?'ok':'warn'}">${esc(({connected:'Connected',not_connected:'Not connected yet',not_configured:'Not set up yet',error:'Error'})[c.state]||c.state)}</span></div><div class="mut sm">Last sync: ${esc(ago(c.last_sync))}</div>${c.last_error?`<div class="why"><b>Problem:</b> this connection could not sync. LaunchRiot will retry; reconnect it if this stays.</div>`:''}</div>`).join(''):'<div class="empty">Sign in to see connection status.</div>'}</div>${S.authed?`<button class="btn alt" data-act="logout">Sign out</button>`:`<button class="btn" data-act="login">Sign in</button>`}`}
const NAV=[['overview','Overview',vOverview],['brief','Morning brief',vBrief],['arthur','Ask Arthur',vArthur],['focus','Focus',vFocus],['capture','Capture',vCapture],['connections','Connections',vConn]];
function render(){const NV=CFG.views?NAV.filter(n=>CFG.views.includes(n[0])):NAV,t=(location.hash.replace(/^#\/?/,'').split('/')[0])||'home',v=NV.find(n=>n[0]==t)||NV[0];
 $('#nav').innerHTML=window.WN_NAVR?window.WN_NAVR(NV,v[0]):NV.map(n=>`<a href="#/${n[0]}" class="${n[0]==v[0]?'on':''}" ${n[0]==v[0]?'aria-current="page"':''}>${esc(n[1])}</a>`).join('');
 $('#who').innerHTML=CFG.demo?'<span class="pill">'+esc(CFG.label||'Example')+'</span> <a class="btn sm" style="text-decoration:none" href="'+esc(CFG.bookUrl)+'" target="_blank" rel="noopener">Book a demo</a>':S.authed?`Signed in${S.user?' · '+esc(S.user):''}`:`<button class="btn alt sm" data-act="login">Sign in</button>`;
 $('#main').innerHTML=v[2]()}
function login(note){if($('#lg'))return;const d=document.createElement('div');d.className='modal';d.id='lg';
 d.innerHTML=`<form role="dialog" aria-label="Sign in"><h2 style="margin-top:12px">Sign in</h2><label>Email<input name="email" type="email" required autocomplete="username"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><p id="lerr" class="sm" style="color:#b00;min-height:18px">${esc(note||'')}</p><div class="row"><button class="btn">Sign in</button><button type="button" class="btn alt" id="lx">Not now</button></div></form>`;
 document.body.appendChild(d);d.querySelector('input').focus();d.querySelector('#lx').onclick=()=>d.remove();
 d.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.target,er=d.querySelector('#lerr');er.textContent='Signing in…';
  try{await api('/auth/login',{method:'POST',body:JSON.stringify({email:f.email.value.trim(),password:f.password.value})});const me=await api('/auth/me').catch(()=>null);S.user=me&&me.user&&me.user.email||'';d.remove();await load()}
  catch(x){er.textContent=x.status==429?'Too many attempts. Wait 15 minutes.':x.status==401||x.status==400?'Wrong email or password.':'Could not reach the server.'}}}
// ---- events ----
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act],[data-ask],[data-cap-del],#qc-fab');if(!b)return;
 if(b.id=='qc-fab'){qc();return}
 if(b.dataset.act=='login')login();
 if(b.dataset.act=='logout'){try{await api('/auth/logout',{method:'POST'})}catch(x){}setTok('');Object.assign(S,{cap:[],capOK:false,decisions:[],authed:false,loaded:false,mail:[],cal:[],staff:[],drafts:[],conn:[],user:null,ans:null});render()}
 if(b.dataset.ask){S.ans=answer(b.dataset.ask);render();const a=$('#ans');a&&a.scrollIntoView({block:'nearest'})}
 if(b.dataset.capDel){if(S.authed&&S.capOK){await capCall('/capture/'+encodeURIComponent(b.dataset.capDel),'DELETE')}else{saveLocal(loadLocal().filter(x=>x.id!=b.dataset.capDel));render()}}
 if(b.dataset.act=='capmigrate'){const L=loadLocal();let ok=0;for(const x of L){try{await api('/capture',{method:'POST',body:JSON.stringify({type:x.type,text:x.text,due:x.due||undefined,done:x.done})});ok++}catch(e){break}}
  if(ok==L.length){saveLocal([]);toast('Uploaded '+ok+' item(s)')}else toast('Uploaded '+ok+' of '+L.length+'; the rest stay on this device');await load()}});
document.addEventListener('change',e=>{const i=e.target.closest('[data-cap-done]');if(!i)return;if(S.authed&&S.capOK){capCall('/capture/'+encodeURIComponent(i.dataset.capDone),'PUT',{done:i.checked});return}const a=loadLocal();const x=a.find(y=>y.id==i.dataset.capDone);if(x){x.done=i.checked;saveLocal(a);render()}});
async function addCap(f){const text=f.text.value.trim();if(!text)return false;const type=f.type.value,due=type=='task'?f.due.value:'';if(S.authed&&S.capOK)return capCall('/capture','POST',{type,text:text.slice(0,500),due:due||undefined});const a=loadLocal();a.push({id:'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),type:f.type.value,text:text.slice(0,500),due:f.type.value=='task'?f.due.value:'',done:false,at:Date.now()});saveLocal(a);render();return true}
document.addEventListener('submit',async e=>{if(e.target.id=='capform'){e.preventDefault();const fm=e.target,srv=S.authed&&S.capOK;if(await addCap(fm)){const m=fm.closest('.modal');if(m)m.remove();fm.reset();toast(srv?'Saved to your workspace (syncs across devices)':'Saved on this device')}}});
function qc(){if($('#qcm'))return;const d=document.createElement('div');d.className='modal';d.id='qcm';d.innerHTML=`<div class="box" role="dialog" aria-label="Quick capture"><h2>Quick capture</h2><p class="mut sm">${capWhere()}</p>${capForm().replace('class="card"','')}<button class="btn alt" id="qx" style="margin-top:10px">Cancel</button></div>`;document.body.appendChild(d);d.querySelector('textarea').focus();d.querySelector('#qx').onclick=()=>d.remove();d.addEventListener('click',e=>{if(e.target==d)d.remove()})}
document.addEventListener('keydown',e=>{if(e.key=='Escape'){document.querySelectorAll('.modal').forEach(m=>m.remove())}});
addEventListener('hashchange',()=>{render();$('#main').focus({preventScroll:true});scrollTo(0,0)});
function start(){render();(async()=>{try{const me=await api('/auth/me');S.user=me&&me.user&&me.user.email||''}catch(e){}await load();if(!S.authed&&S.online&&!sessionStorage.getItem('wn-asked')){sessionStorage.setItem('wn-asked','1');login()}})();}
setInterval(()=>{if(S.authed)load()},5*60*1000);
(window.WN_READY||Promise.resolve()).then(()=>{if(document.readyState=='loading')addEventListener('DOMContentLoaded',start);else start()});
// ---- extension API for feature modules (decisions.js, staff.js, ...) ----
window.WN={greet,nextMeeting,relatedTo,meetToday,meetWeek,loadCap,S,api,setTok,esc,fmt,dl,tm,dkey,todayK,days,ago,toast,render,load,gate,sec,safeUrl,mailLink,why,arr,TZ,
 view(id,label,fn,before){const i=before?NAV.findIndex(n=>n[0]==before):-1;const e=[id,label,fn];if(i<0)NAV.push(e);else NAV.splice(i,0,e)},
 onLoad(h){HOOKS.push(h)},
 modal(html,label){const d=document.createElement('div');d.className='modal';d.innerHTML='<div class="box" role="dialog" aria-label="'+esc(label)+'">'+html+'</div>';document.body.appendChild(d);d.addEventListener('click',e=>{if(e.target==d)d.remove()});const f=d.querySelector('input,textarea,select');f&&f.focus();return d},
 needAuth(){return S.authed?'':'<div class="notice">Sign in to use this section. <button class="btn sm" data-act="login">Sign in</button></div>'}};
})();
