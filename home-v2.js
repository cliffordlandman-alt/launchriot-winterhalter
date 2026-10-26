// Home v2: the first screen. Live data from /home and /calendar/days. Work items only (server filters Personal). Message text is never shown.
(function(){'use strict';const W=window.WN,{S,esc}=W,arr=W.arr,TZ='Asia/Dubai';
const css=`.v2{margin:-8px 0 0}.v2 .hero{position:relative;overflow:hidden;color:#F3EEE6;background:radial-gradient(120% 90% at 100% 0%,#24606B 0%,transparent 55%),linear-gradient(165deg,#17414B,#0E262E 70%);padding:22px 22px 24px;border-radius:26px;box-shadow:0 18px 40px -20px rgba(14,38,46,.55)}
.v2 .arcs{position:absolute;right:-90px;top:-70px;width:300px;height:300px;opacity:.22;pointer-events:none}
.v2 .lslot{display:block;width:24px;height:24px}
.v2 .date{margin-top:22px;font:500 13px/1.3 Inter,system-ui,sans-serif;color:#D2A06A;letter-spacing:.04em}
.v2 h1{font-family:Fraunces,Georgia,serif;font-weight:400;font-size:38px;line-height:1.08;letter-spacing:-.015em;margin:6px 0 0;color:#F3EEE6}.v2 h1 em{font-style:normal;font-weight:600}
.v2 .line{margin:12px 0 0;font:16px/1.4 Inter,system-ui,sans-serif;color:rgba(243,238,230,.78);max-width:30ch}
.v2 .gl{display:grid;grid-template-columns:repeat(3,1fr);margin-top:22px;border-top:1px solid rgba(243,238,230,.14);padding-top:14px;font:12px/1.3 Inter,system-ui,sans-serif;color:rgba(243,238,230,.62)}
.v2 .gl b{display:block;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:28px;color:#F3EEE6;line-height:1.1}.v2 .gl div:first-child b{color:#D2A06A}
.v2 .lab{font:500 12px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.65;margin:22px 6px 12px}
.v2 .pc{display:flex;gap:14px;align-items:center;background:#fff;color:#1C2326;border-radius:20px;padding:16px;margin-bottom:12px;box-shadow:0 10px 24px -14px rgba(14,38,46,.35);text-decoration:none;min-height:80px;font-family:Inter,system-ui,sans-serif}
.v2 .av{flex:none;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-weight:600;font-size:16px;color:#fff;background:linear-gradient(145deg,#2F6B76,#0E262E)}.v2 .av.k{background:linear-gradient(145deg,#C8955B,#8A5E33)}.v2 .av.t{font-size:13px}
.v2 .v2who{flex:1;min-width:0}.v2 .v2who b{display:block;font-size:17px;font-weight:600}.v2 .tag{display:inline-block;font-size:11px;font-weight:500;color:#8A5E33;background:#F5E9DA;border-radius:6px;padding:2px 6px;margin-left:6px;vertical-align:2px}
.v2 .v2who>span{display:block;font-size:15px;color:#6B7478;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.v2 .act{flex:none;font-size:14px;font-weight:600;color:#0E262E;background:#E8EFEF;border-radius:999px;padding:10px 14px}
.v2 .calm{display:flex;gap:12px;align-items:center;margin:16px 0 0;padding:16px;border:1px dashed rgba(127,127,127,.45);border-radius:18px;font:15px/1.4 Inter,system-ui,sans-serif}.v2 .calm span{opacity:.8}
.v2 .calm i{flex:none;width:28px;height:28px;border-radius:50%;background:#E3ECE9;display:grid;place-items:center}.v2 .calm i:after{content:"";width:9px;height:5px;border-left:2px solid #2F6B76;border-bottom:2px solid #2F6B76;transform:rotate(-45deg) translate(1px,-1px)}
.v2 .ph{height:80px;border-radius:20px;background:rgba(127,127,127,.18);margin-bottom:12px}.v2 .ph.s{height:18px;width:60%;border-radius:6px;background:rgba(243,238,230,.16);margin:14px 0 0}
.v2rest .v2qn{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:22px 0 6px}.v2rest .v2qn a{display:block;padding:14px;border-radius:14px;background:rgba(127,127,127,.12);color:inherit;text-decoration:none;font:15px Inter,system-ui,sans-serif}
.v2a .v2 .s{opacity:0;animation:v2up .45s cubic-bezier(.2,.7,.2,1) forwards}.v2a .v2 .arcs{animation:v2sp 2.4s cubic-bezier(.2,.7,.2,1) both}.v2a .v2rest{opacity:0;animation:v2fd .3s ease-out 3s forwards}
@keyframes v2up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes v2sp{from{transform:rotate(-40deg);opacity:0}to{transform:none;opacity:.22}}@keyframes v2fd{to{opacity:1}}
.v2skip .v2 *,.v2skip .v2rest{animation-delay:0s!important;animation-duration:.01s!important}
@media(prefers-reduced-motion:reduce){.v2a .v2 *,.v2a .v2rest{animation:none!important;opacity:1!important;transform:none!important}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const fl=document.createElement('link');fl.rel='stylesheet';fl.href='https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap';document.head.appendChild(fl);
let animOn=!sessionStorage.getItem('wn-v2seen');sessionStorage.setItem('wn-v2seen','1');let retried=false,rTimer=null;
const stopAnim=()=>{if(animOn){animOn=false;setTimeout(()=>document.body.classList.remove('v2a'),3500)}};
addEventListener('pointerdown',()=>document.body.classList.add('v2skip'),{once:true});
const hasTok=()=>{try{return !!localStorage.getItem('wn-tok')}catch(e){return false}};
const k=s=>String(s||'').trim().toLowerCase();
const ini=n=>String(n||'?').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
const hm=iso=>new Date(iso).toLocaleTimeString('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit'});
const greet=()=>{const h=+new Date().toLocaleString('en-GB',{timeZone:TZ,hour:'2-digit',hour12:false});return h<12?'Good morning':h<17?'Good afternoon':'Good evening'};
const LINE='When a machine stops, a kitchen stops. Here’s who needs you today.';
const SVG='<svg class="arcs" viewBox="0 0 300 300" fill="none" stroke="#F3EEE6" stroke-width="1" aria-hidden="true"><circle cx="150" cy="150" r="140"/><circle cx="150" cy="150" r="112"/><circle cx="150" cy="150" r="84" stroke-dasharray="3 7"/><circle cx="150" cy="150" r="56"/><path d="M10 150h280M150 10v280" stroke-opacity=".5"/></svg>';
function hero(gl){const name=window.WN_NAME||'';const dt=new Date().toLocaleDateString('en-GB',{timeZone:TZ,weekday:'long',day:'numeric',month:'long'});
 return `<section class="hero">${SVG}<span class="lslot" aria-hidden="true"></span><div class="date s" style="animation-delay:.15s">${esc(dt)}</div><h1 class="s" style="animation-delay:.3s">${greet()}${name?',<br><em>'+esc(name)+'.</em>':'.'}</h1><p class="line s" style="animation-delay:.8s">${LINE}</p>${gl}</section>`}
// Safe one-line ask: never message text. Email subjects only (short), otherwise a count.
function ask(p){if(p.subject)return p.subject.length>60?p.subject.slice(0,57)+'…':p.subject;return p.n>1?p.n+' messages waiting':'Waiting for your reply'}
function people(h,days){const out=[],seen={};const add=o=>{if(out.length>=3||seen[o.key])return;seen[o.key]=1;out.push(o)};
 const now=Date.now(),mt=(days&&days[0]?arr(days[0].items):[]).filter(m=>m.starts_at).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));
 const nx=mt.find(m=>{const t=new Date(m.starts_at)-now;return t>-15*6e4&&t<4*36e5});
 if(nx)out.push({key:'meet:'+nx.id,meet:true,name:hm(nx.starts_at)+' · '+(nx.title||'Meeting'),line:nx.location&&!/^https?:/i.test(nx.location)?nx.location:'Coming up today',act:'Details',attr:`data-meet="${esc(nx.id)}"`,href:'#/calendar'});
 const vip={};arr(h.needs_attention).forEach(x=>{if(x.vip&&x.from)vip[k(x.from)]=1});
 const g={};arr(h.replies_waiting).forEach(r=>{const key=k(r.from);if(!key)return;const o=g[key]||(g[key]={key,name:r.from,n:0,old:r.received_at,ref:r.email_ref||r.id,email:r.source!=='whatsapp'});o.n++;if(r.received_at<o.old)o.old=r.received_at;if(r.received_at>=o.old)o.ref=r.email_ref||r.id;if(r.source!=='whatsapp'&&!o.subject)o.subject=r.subject});
 arr(h.needs_attention).filter(x=>x.type==='message'&&x.from).forEach(x=>{const key=k(x.from);if(!g[key])g[key]={key,name:x.from,n:1,old:'',ref:x.email_ref||x.id}});
 const L=Object.values(g).sort((a,b)=>(vip[b.key]?1:0)-(vip[a.key]?1:0)||String(a.old).localeCompare(String(b.old)));
 L.forEach(o=>add({key:o.key,name:o.name,vip:!!vip[o.key],line:ask(o),act:'Open',attr:`data-email="${esc(o.ref)}"`,href:'#/inbox'}));
 arr(h.needs_attention).filter(x=>x.type!=='message').forEach(x=>add({key:'na:'+x.id,name:x.title||'Item',line:x.from||'Needs you',act:'Open',attr:x.email_ref?`data-email="${esc(x.email_ref)}"`:'',href:'#/'+({task:'tasks',followup:'followups',event:'calendar'}[x.type]||'projects')}));
 return {L:out,mt,np:Object.keys(g).length}}
function card(p,i){return `<a class="pc s" href="${p.href}" ${p.attr} style="animation-delay:${(1.9+i*.18).toFixed(2)}s"><span class="av${p.vip?' k':''}${p.meet?' t':''}">${p.meet?'Now':esc(ini(p.name))}</span><span class="v2who"><b>${esc(p.name)}${p.vip?'<span class="tag">Key contact</span>':''}</b><span>${esc(p.line)}</span></span><span class="act">${esc(p.act)}</span></a>`}
window.WN_HOME2=function(D,X){
 document.body.classList.toggle('v2a',animOn);
 const qn='<nav class="v2qn"><a href="#/inbox">Inbox</a><a href="#/tasks">Tasks</a><a href="#/calendar">Calendar</a><a href="#/followups">Follow-ups</a></nav>';
 const pend=!D.home&&(!D.loaded||!S.loaded)&&(S.authed||hasTok());
 if(!S.authed&&!pend)return `<div class="v2">${hero('')}<div class="notice" style="margin-top:16px">Sign in to see your day. <button class="btn sm" data-act="login">Sign in</button></div></div>`;
 if(!D.home){
  if(D.loaded&&D.homeErr&&!retried&&!rTimer){rTimer=setTimeout(()=>{retried=true;rTimer=null;X.refresh()},10000)}
  const msg=D.loaded&&D.homeErr?'<div class="calm"><i></i><span>Today’s list will appear here shortly.</span></div>':'<div class="ph"></div><div class="ph"></div>';
  return `<div class="v2">${hero('<div class="ph s"></div>')}<div class="lab">Needs you</div>${msg}</div>`+qn}
 const h=D.home,c=h.counts||{},P=people(h,D.days),nm=arr(h.meetings_today).length||c.meetings_today||0,nw=arr(h.replies_waiting).length;
 const gl=`<div class="gl s" style="animation-delay:1.3s"><div><b>${P.np}</b>${P.np===1?'person needs':'people need'} you</div><div><b>${nm}</b>${nm===1?'meeting':'meetings'} today</div><div><b>${nw}</b>${nw===1?'message':'messages'} waiting</div></div>`;
 const other=(c.tasks_due_today||0)+(c.overdue_tasks||0)+(c.followups_due_today||0)+(c.overdue_followups||0)+(c.pending_decisions||0);
 const restP=P.np-P.L.filter(p=>!p.meet).length;
 let calm;
 if(!P.L.length&&!nm)calm='<b>All clear.</b> Nothing needs you right now.';
 else if(!P.L.length)calm='<b>Nothing’s waiting on you right now.</b>';
 else calm='<b>Everything else is handled.</b> '+(restP>0?restP+' more '+(restP===1?'person is':'people are')+' in your inbox. ':'Only '+(P.np===1?'this person needs':'these '+P.np+' need')+' you. ')+(other?other+' task'+(other===1?'':'s')+', follow-ups or decisions are due — they’re below.':'No tasks, follow-ups or decisions due.');
 if(!nm&&P.L.length)calm+=' No meetings, so the day’s yours.';
 const calmEl=`<div class="calm s" style="animation-delay:${(1.9+P.L.length*.18+.2).toFixed(2)}s"><i></i><span>${calm}</span></div>`;
 let below=X.meet3();
 const RW=arr(h.replies_waiting).filter(r=>r.source!=='whatsapp');below+=X.sect('Emails waiting for your reply',RW,r=>`<a class="item srhit" href="#/inbox" data-email="${esc(r.email_ref||r.id)}"><div class="t">${esc(r.subject||'(no subject)')}</div><div class="mut sm">${esc(r.from||'')} · ${esc(W.dl(r.received_at))}</div></a>`);
 below+=X.sect('Tasks due',arr(h.overdue_tasks).concat(arr(h.tasks_due_today)),t=>`<div class="item"><div class="t">${esc(t.title)}</div><div class="mut sm">Due ${esc(X.day(t.deadline))}</div></div>`);
 below+=X.sect('Follow-ups due',arr(h.overdue_followups).concat(arr(h.followups_due_today)),t=>`<div class="item"><div class="t">${esc(t.subject)}</div><div class="mut sm">${esc(t.person||'')} · ${esc(X.day(t.follow_up_date))}</div></div>`);
 below+=X.sect('Coming up this week',h.upcoming_meetings,m=>`<div class="item"><div class="t">${esc(W.dl(m.starts_at))} ${esc(W.tm(m.starts_at))} · ${esc(m.title||'(no title)')}</div></div>`);
 below+=X.sect('Decisions waiting',h.pending_decisions,t=>`<div class="item"><div class="t">${esc(t.title)}</div></div>`);
 below+=X.sect('Active projects',h.active_projects,p=>`<a class="item srhit" href="#/projects"><div class="t">${esc(p.name)}</div><div class="mut sm">${p.open_tasks||0} open tasks</div></a>`);
 const out=`<div class="v2">${hero(gl)}<div class="lab s" style="animation-delay:1.7s">Needs you</div>${P.L.map(card).join('')}${calmEl}</div><div class="v2rest">${qn}${below}</div>`;
 stopAnim();return out};
})();
