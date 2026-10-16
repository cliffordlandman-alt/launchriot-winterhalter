// Workspace feature 1: Tasks, Calendar, Notes. API paths in the thin module below (see gareth-api-p1.md).
(function(){'use strict';const W=window.WN,{S,api,esc,toast}=W;
const J=(m,b,k)=>({method:m,body:b?JSON.stringify(b):undefined,headers:k?{'Idempotency-Key':k}:undefined});
const ref=()=>(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random());
const crud=base=>({list:q=>api(base+(q?'?'+q:'')),add:(b,k)=>api(base,J('POST',{...b,client_ref:k||ref()})),upd:(id,b)=>api(base+'/'+encodeURIComponent(id),J('PUT',b)),del:id=>api(base+'/'+encodeURIComponent(id),J('DELETE'))});
const API={tasks:{...crud('/tasks'),done:id=>api('/tasks/'+encodeURIComponent(id)+'/complete',J('POST')),reopen:id=>api('/tasks/'+encodeURIComponent(id)+'/reopen',J('POST'))},notes:crud('/notes'),events:crud('/events'),
 cal:()=>{const f=new Date(Date.now()-864e5).toISOString(),t=new Date(Date.now()+30*864e5).toISOString();return api('/calendar?from='+encodeURIComponent(f)+'&to='+encodeURIComponent(t))},
 evRange:()=>{const f=new Date(Date.now()-864e5).toISOString(),t=new Date(Date.now()+30*864e5).toISOString();return api('/events?from='+encodeURIComponent(f)+'&to='+encodeURIComponent(t))}};
window.WN.WS={API};
const D={tasks:[],notes:[],events:[],cal:[],loaded:false,tf:'open',nq:'',busy:false};S.ws=D;
const arr=W.arr;
const dueOf=t=>t.deadline?W.dkey(t.deadline):'';
async function refresh(){if(!S.authed||D.busy)return;D.busy=true;
 const [t,n,e,c]=await Promise.all([API.tasks.list().catch(x=>null),API.notes.list().catch(x=>null),API.evRange().catch(x=>null),API.cal().catch(x=>null)]);
 D.busy=false;if(t)D.tasks=arr(t);if(n)D.notes=arr(n);if(e)D.events=arr(e);if(c)D.cal=arr(c);D.loaded=true;
 if(!document.querySelector('.modal'))W.render()}
W.onLoad(async()=>{if(!D.loaded)refresh()});
async function act(fn,msg){try{await fn();if(msg)toast(msg);D.busy=false;await refresh();return true}catch(e){toast('Could not save ('+(e.status||'offline')+'). Nothing was changed.');return false}}
const head=(t,s)=>`<h1>${t}</h1><p class="sub">${s}</p>${!S.authed?'<div class="notice">Sign in to use your workspace. <button class="btn sm" data-act="login">Sign in</button></div>':!S.online?'<div class="notice">'+esc(S.err)+'</div>':''}`;
const PR={low:'Low',normal:'Normal',high:'High',urgent:'Urgent'};
// ---- Tasks ----
function taskRow(t){const d=dueOf(t),done=t.status=='done';
 return `<div class="item trow"><input type="checkbox" data-ws-tdone="${esc(t.id)}" ${done?'checked':''} aria-label="Mark done"><div class="tx"><div class="t ${done?'done':''}">${esc(t.title)}</div><div class="sm ${t.overdue?'late':'mut'}">${t.overdue?'Overdue · ':''}${d?'Due '+esc(d)+' · ':''}${esc(PR[t.priority]||'')}${t.status&&t.status!='open'&&!done?' · '+esc(t.status.replace('_',' ')):''}</div>${t.notes?`<div class="why">${esc(String(t.notes).slice(0,140))}</div>`:''}</div><div class="row"><button class="btn alt sm" data-ws-tedit="${esc(t.id)}">Edit</button><button class="btn alt sm" data-ws-tdel="${esc(t.id)}" aria-label="Delete task">Delete</button></div></div>`}
function vTasks(){const f=D.tf,L=D.tasks.filter(t=>f=='all'||(f=='done')==(t.status=='done'));
 return head('Tasks','What needs doing, in one list.')+`<form class="card addbar" id="ws-tform"><input name="title" required maxlength="300" placeholder="Add a task" aria-label="Task"><input name="deadline" type="date" aria-label="Due date"><select name="priority" aria-label="Priority">${Object.keys(PR).map(k=>`<option value="${k}" ${k=='normal'?'selected':''}>${PR[k]}</option>`).join('')}</select><button class="btn">Add</button></form>
 <div class="row seg">${[['open','Open'],['done','Done'],['all','All']].map(([k,l])=>`<button class="btn sm ${f==k?'':'alt'}" data-ws-tf="${k}">${l}</button>`).join('')}</div>
 <div class="card" id="ws-tlist">${L.length?L.map(taskRow).join(''):`<div class="empty">${S.authed?'No tasks here.':'Sign in to see tasks.'}</div>`}</div>`}
// ---- Notes ----
function vNotes(){const q=D.nq.toLowerCase(),L=D.notes.filter(n=>!q||((n.title||'')+' '+(n.body||'')).toLowerCase().includes(q));
 return head('Notes','Write things down. Search finds them again.')+`<div class="row" style="margin-bottom:12px"><button class="btn" data-ws-nnew>+ New note</button><input id="ws-nq" type="search" placeholder="Search notes" aria-label="Search notes" value="${esc(D.nq)}" style="flex:1;min-width:160px"></div>
 <div class="notes">${L.length?L.map(n=>`<article class="card note"><h3>${n.pinned?'📌 ':''}${esc(n.title||'Untitled')}</h3><p>${esc(String(n.body||'').slice(0,160))}</p><div class="mut sm">${esc(W.dl(n.updated_at||n.created_at))}</div><div class="row"><button class="btn alt sm" data-ws-nedit="${esc(n.id)}">Open</button><button class="btn alt sm" data-ws-ndel="${esc(n.id)}" aria-label="Delete note">Delete</button></div></article>`).join(''):`<div class="card empty">${S.authed?'No notes yet.':'Sign in to see notes.'}</div>`}</div>`}
// ---- Calendar (own events + synced items merged) ----
function evAll(){const m=D.events.filter(e=>e.status!='cancelled').map(e=>({id:e.id,own:true,title:e.title||'(no title)',at:e.starts_at,end:e.ends_at||'',loc:e.location||'',desc:e.details||'',rem:e.reminder_at}));
 const c=D.cal.map(e=>({id:e.id,own:false,title:e.title||'(no title)',at:e.starts_at,end:e.ends_at||'',loc:e.location||'',desc:e.description||''}));
 return m.concat(c).filter(e=>e.at).sort((a,b)=>new Date(a.at)-new Date(b.at))}
function vCal(){const L=evAll(),g={};L.forEach(e=>{(g[W.dkey(e.at)]=g[W.dkey(e.at)]||[]).push(e)});const ks=Object.keys(g).sort();
 return head('Calendar','Your next 30 days (Dubai time).')+`<div class="row" style="margin-bottom:12px"><button class="btn" data-ws-enew>+ New event</button></div>
 ${ks.length?ks.map(k=>`<div class="card"><h2>${esc(W.dl(g[k][0].at))}${k==W.todayK()?' · Today':''}</h2>${g[k].map(e=>`<div class="item"><div class="t">${esc(W.tm(e.at))}${e.end?'–'+esc(W.tm(e.end)):''} · ${esc(e.title)}</div>${e.loc?`<div class="mut sm">${esc(e.loc)}</div>`:''}${e.desc?`<div class="why">${esc(e.desc.slice(0,200))}</div>`:''}${e.own?`<div class="row" style="margin-top:6px"><button class="btn alt sm" data-ws-eedit="${esc(e.id)}">Edit</button><button class="btn alt sm" data-ws-edel="${esc(e.id)}" aria-label="Delete event">Delete</button></div>`:''}</div>`).join('')}</div>`).join(''):`<div class="card empty">${S.authed?'Nothing scheduled in the next 30 days.':'Sign in to see your calendar.'}</div>`}`}
W.view('tasks','Tasks',vTasks,'overview');W.view('calendar','Calendar',vCal,'overview');W.view('notes','Notes',vNotes,'overview');
// ---- forms ----
const loc=iso=>iso?new Intl.DateTimeFormat('sv-SE',{timeZone:W.TZ,dateStyle:'short',timeStyle:'short'}).format(new Date(iso)).replace(' ','T'):'';
const toIso=v=>v?new Date(v+':00+04:00').toISOString():'';
const byId=(a,id)=>a.find(x=>String(x.id)==id);
const FK={t:ref(),n:ref(),e:ref()};
function tForm(t){return `<form id="ws-tedit" data-id="${esc(t.id)}"><h2>Edit task</h2><label>Task<input name="title" required maxlength="300" value="${esc(t.title)}"></label><label>Due<input name="deadline" type="date" value="${esc(dueOf(t))}"></label><label>Priority<select name="priority">${Object.keys(PR).map(k=>`<option value="${k}" ${t.priority==k?'selected':''}>${PR[k]}</option>`).join('')}</select></label><label>Project<select name="related_project"><option value="">None</option>${((S.pj&&S.pj.p)||[]).map(p=>`<option value="${esc(p.name)}" ${t.related_project&&t.related_project.toLowerCase()==p.name.toLowerCase()?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>Notes<textarea name="notes" rows="3" maxlength="2000">${esc(t.notes)}</textarea></label><div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-ws-x>Cancel</button></div></form>`}
function nForm(n){n=n||{};return `<form id="ws-nform" data-id="${esc(n.id||'')}"><h2>${n.id?'Note':'New note'}</h2><label>Title<input name="title" required maxlength="200" value="${esc(n.title)}"></label><label>Note<textarea name="body" rows="9" required maxlength="8000">${esc(n.body)}</textarea></label><label class="row" style="color:var(--ink)"><input type="checkbox" name="pinned" ${n.pinned?'checked':''}> Pin to top</label><div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-ws-x>Cancel</button></div></form>`}
function eForm(e){e=e||{};return `<form id="ws-eform" data-id="${esc(e.id||'')}"><h2>${e.id?'Edit event':'New event'}</h2><label>Title<input name="title" required maxlength="200" value="${esc(e.title)}"></label><label>Starts (Dubai time)<input name="s" type="datetime-local" required value="${esc(loc(e.at))}"></label><label>Ends<input name="e" type="datetime-local" value="${esc(loc(e.end))}"></label><label>Where<input name="loc" maxlength="200" value="${esc(e.loc)}"></label><label>Details<textarea name="desc" rows="3" maxlength="2000">${esc(e.desc)}</textarea></label><div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-ws-x>Cancel</button></div></form>`}
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-ws-tf],[data-ws-tedit],[data-ws-tdel],[data-ws-nnew],[data-ws-nedit],[data-ws-ndel],[data-ws-enew],[data-ws-eedit],[data-ws-edel],[data-ws-x]');if(!b)return;const d=b.dataset;
 if('wsX' in d)b.closest('.modal').remove();
 if(d.wsTf){D.tf=d.wsTf;W.render()}
 if(d.wsTedit){const t=byId(D.tasks,d.wsTedit);t&&W.modal(tForm(t),'Edit task')}
 if(d.wsTdel&&confirm('Delete this task?'))act(()=>API.tasks.del(d.wsTdel),'Task deleted');
 if('wsNnew' in d){if(!S.authed)return toast('Sign in first');W.modal(nForm(),'New note')}
 if(d.wsNedit){const n=byId(D.notes,d.wsNedit);n&&W.modal(nForm(n),'Note')}
 if(d.wsNdel&&confirm('Delete this note?'))act(()=>API.notes.del(d.wsNdel),'Note deleted');
 if('wsEnew' in d){if(!S.authed)return toast('Sign in first');W.modal(eForm(),'New event')}
 if(d.wsEedit){const e=evAll().find(x=>String(x.id)==d.wsEedit&&x.own);e&&W.modal(eForm(e),'Edit event')}
 if(d.wsEdel&&confirm('Delete this event?'))act(()=>API.events.del(d.wsEdel),'Event deleted')});
document.addEventListener('change',ev=>{const c=ev.target.closest('[data-ws-tdone]');if(c)act(()=>c.checked?API.tasks.done(c.dataset.wsTdone):API.tasks.reopen(c.dataset.wsTdone))});
document.addEventListener('input',ev=>{if(ev.target.id=='ws-nq'){D.nq=ev.target.value;const p=ev.target.selectionStart;W.render();const i=document.getElementById('ws-nq');if(i){i.focus();i.setSelectionRange(p,p)}}});
document.addEventListener('submit',async ev=>{const f=ev.target;
 if(f.id=='ws-tform'){ev.preventDefault();const b={title:f.title.value.trim(),priority:f.priority.value};if(f.deadline.value)b.deadline=toIso(f.deadline.value+'T18:00');if(!b.title)return;if(await act(()=>API.tasks.add(b,FK.t),'Task added')){f.reset();FK.t=ref()}}
 if(f.id=='ws-tedit'){ev.preventDefault();const id=f.dataset.id,b={title:f.title.value.trim(),priority:f.priority.value,notes:f.notes.value.trim(),related_project:f.related_project.value||null,deadline:f.deadline.value?toIso(f.deadline.value+'T18:00'):null};f.closest('.modal').remove();await act(()=>API.tasks.upd(id,b),'Saved')}
 if(f.id=='ws-nform'){ev.preventDefault();const id=f.dataset.id,b={title:f.title.value.trim(),body:f.body.value.trim(),pinned:f.pinned.checked},k=FK.n;f.closest('.modal').remove();if(await act(()=>id?API.notes.upd(id,b):API.notes.add(b,k),'Note saved'))FK.n=ref()}
 if(f.id=='ws-eform'){ev.preventDefault();const id=f.dataset.id,b={title:f.title.value.trim(),starts_at:toIso(f.s.value)};if(f.e.value){let en=toIso(f.e.value);if(id){const o=evAll().find(x=>String(x.id)==id);if(o&&o.end&&o.at&&o.end==en||(new Date(en)<=new Date(b.starts_at))){const dur=o&&o.end&&o.at?Math.max(36e5,new Date(o.end)-new Date(o.at)):36e5;en=new Date(+new Date(b.starts_at)+dur).toISOString()}}else if(new Date(en)<=new Date(b.starts_at))en=new Date(+new Date(b.starts_at)+36e5).toISOString();b.ends_at=en}b.location=f.loc.value.trim();b.details=f.desc.value.trim();const k=FK.e;f.closest('.modal').remove();if(await act(()=>id?API.events.upd(id,b):API.events.add(b,k),'Event saved'))FK.e=ref()}});
})();
