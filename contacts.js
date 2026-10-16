// Workspace feature 2: Contacts and Follow-ups (API: see gareth-api-p1.md part 2).
(function(){'use strict';const W=window.WN,{S,api,esc,toast}=W;
const J=(m,b)=>({method:m,body:b?JSON.stringify(b):undefined});
const ref=()=>(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random());
const E=encodeURIComponent;
const API={c:{list:q=>api('/contacts'+(q?'?q='+E(q):'')),get:id=>api('/contacts/'+E(id)),add:(b,k)=>api('/contacts',J('POST',{...b,client_ref:k})),upd:(id,b)=>api('/contacts/'+E(id),J('PUT',b)),del:id=>api('/contacts/'+E(id),J('DELETE')),
 log:(id,b,k)=>api('/contacts/'+E(id)+'/interactions',J('POST',{...b,client_ref:k})),dlog:(id,i)=>api('/contacts/'+E(id)+'/interactions/'+E(i),J('DELETE'))},
 f:{list:q=>api('/followups'+(q?'?'+q:'')),add:(b,k)=>api('/followups',J('POST',{...b,client_ref:k})),upd:(id,b)=>api('/followups/'+E(id),J('PUT',b)),del:id=>api('/followups/'+E(id),J('DELETE')),
 done:id=>api('/followups/'+E(id)+'/complete',J('POST')),reopen:id=>api('/followups/'+E(id)+'/reopen',J('POST')),log:(id,b,k)=>api('/followups/'+E(id)+'/log',J('POST',{...b,client_ref:k}))}};
Object.assign(W.WS=W.WS||{},{CAPI:API});
const D={c:[],f:[],overdue:0,loaded:false,busy:false,q:'',ff:'open'};S.cf=D;
const arr=W.arr;
async function refresh(){if(!S.authed||D.busy)return;D.busy=true;
 const [c,f]=await Promise.all([API.c.list().catch(()=>null),API.f.list('status=open_all&sort=importance').catch(()=>null)]);
 const f2=await API.f.list('status=done').catch(()=>null);D.busy=false;
 if(c)D.c=arr(c);if(f){D.f=arr(f);D.overdue=f.overdue||D.f.filter(x=>x.overdue).length}if(f2)D.done=arr(f2);D.loaded=true;
 if(!document.querySelector('.modal'))W.render()}
W.onLoad(async()=>{if(!D.loaded)refresh()});
async function act(fn,msg){try{await fn();if(msg)toast(msg);D.busy=false;await refresh();return true}catch(e){toast(e.status==409?'That email is already saved for another contact.':'Could not save ('+(e.status||'offline')+'). Nothing was changed.');return false}}
const head=(t,s)=>`<h1>${t}</h1><p class="sub">${s}</p>${!S.authed?'<div class="notice">Sign in to use your workspace. <button class="btn sm" data-act="login">Sign in</button></div>':!S.online?'<div class="notice">'+esc(S.err)+'</div>':''}`;
const day=iso=>iso?W.dkey(iso):'';
const KIND={call:'Call',meeting:'Meeting',message:'Message',email:'Email',note:'Note',other:'Other'};
const kopt=s=>Object.keys(KIND).map(k=>`<option value="${k}" ${k==(s||'note')?'selected':''}>${KIND[k]}</option>`).join('');
const byId=(a,id)=>a.find(x=>String(x.id)==id);
// ---- Contacts ----
function cRow(c){return `<article class="card crow"><div class="tx"><h3>${esc(c.name)}</h3><div class="mut sm">${esc([c.role,c.org].filter(Boolean).join(' · '))}</div><div class="sm">${c.email?esc(c.email):''}${c.email&&c.phone?' · ':''}${c.phone?esc(c.phone):''}</div><div class="mut sm">Last contact: ${c.last_interaction_at?esc(W.ago(c.last_interaction_at)):'none logged'}</div></div><div class="row"><button class="btn alt sm" data-cf-copen="${esc(c.id)}">Open</button><button class="btn alt sm" data-cf-cedit="${esc(c.id)}">Edit</button><button class="btn alt sm" data-cf-cdel="${esc(c.id)}" aria-label="Delete contact">Delete</button></div></article>`}
function vContacts(){const q=D.q.toLowerCase(),L=D.c.filter(c=>!q||[c.name,c.org,c.email,c.phone,c.role,(c.tags||[]).join(' ')].join(' ').toLowerCase().includes(q));
 return head('Contacts','People you deal with, and when you last spoke.')+`<div class="row" style="margin-bottom:12px"><button class="btn" data-cf-cnew>+ Add contact</button><input id="cf-q" type="search" placeholder="Search contacts" aria-label="Search contacts" value="${esc(D.q)}" style="flex:1;min-width:160px"></div><div class="clist">${L.length?L.map(cRow).join(''):`<div class="card empty">${S.authed?(D.c.length?'No contacts match.':'No contacts yet. Add the first one.'):'Sign in to see contacts.'}</div>`}</div>`}
function cForm(c){c=c||{};return `<form id="cf-cform" data-id="${esc(c.id||'')}"><h2>${c.id?'Edit contact':'Add contact'}</h2><label>Name<input name="name" required maxlength="200" value="${esc(c.name)}"></label><label>Company<input name="org" maxlength="200" value="${esc(c.org)}"></label><label>Role<input name="role" maxlength="200" value="${esc(c.role)}"></label><label>Email<input name="email" type="email" maxlength="200" value="${esc(c.email)}"></label><label>Phone<input name="phone" maxlength="60" value="${esc(c.phone)}"></label><label>Tags (comma separated)<input name="tags" maxlength="200" value="${esc((c.tags||[]).join(', '))}"></label><label>Notes<textarea name="notes" rows="3" maxlength="4000">${esc(c.notes)}</textarea></label><div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-ws-x>Cancel</button></div></form>`}
function detail(c,full){const it=full.interactions||[],of=full.open_followups||[];
 return `<div class="cdet" data-id="${esc(c.id)}"><h2>${esc(c.name)}</h2><div class="mut sm">${esc([c.role,c.org].filter(Boolean).join(' · '))}</div><div class="sm">${c.email?esc(c.email):''}${c.email&&c.phone?' · ':''}${c.phone?esc(c.phone):''}</div>${c.notes?`<div class="why">${esc(c.notes)}</div>`:''}
 <h3 style="margin-top:14px">Log an interaction</h3><form id="cf-iform" data-id="${esc(c.id)}" class="addbar2"><select name="kind" aria-label="Type">${kopt()}</select><input name="summary" required maxlength="500" placeholder="What happened?" aria-label="Summary"><button class="btn">Log</button></form>
 <h3 style="margin-top:14px">History</h3>${it.length?it.map(i=>`<div class="item"><div class="t">${esc(KIND[i.kind]||i.kind||'Note')} · <span class="mut sm">${esc(W.dl(i.at))} ${esc(W.tm(i.at))}</span></div><div>${esc(i.summary)}</div><button class="btn alt sm" data-cf-idel="${esc(i.id)}" data-cid="${esc(c.id)}" aria-label="Delete entry">Delete</button></div>`).join(''):'<div class="empty">Nothing logged yet.</div>'}
 <h3 style="margin-top:14px">Open follow-ups</h3>${of.length?of.map(f=>`<div class="item"><div class="t">${esc(f.subject)}</div><div class="sm ${f.overdue?'late':'mut'}">${f.follow_up_date?(f.overdue?'Overdue · ':'')+'Due '+esc(day(f.follow_up_date)):'No date'}</div></div>`).join(''):'<div class="empty">None.</div>'}
 <div class="row" style="margin-top:12px"><button class="btn alt" data-cf-fnewc="${esc(c.id)}">+ Follow-up</button><button class="btn alt" data-ws-x>Close</button></div></div>`}
async function openDetail(id){let full;try{full=await API.c.get(id)}catch(e){return toast('Could not open contact')}
 const c=full.contact||full;document.querySelectorAll('.modal').forEach(m=>m.remove());W.modal(detail(c,full),'Contact')}
// ---- Follow-ups ----
const FF=[['overdue','Overdue'],['today','Today'],['open','All open'],['done','Done']];
function fList(){const t=W.todayK();
 if(D.ff=='done')return D.done||[];const o=D.f.filter(x=>x.status!='done');
 if(D.ff=='overdue')return o.filter(x=>x.overdue);if(D.ff=='today')return o.filter(x=>day(x.follow_up_date)==t);return o}
function fRow(f){const d=day(f.follow_up_date),done=f.status=='done';
 return `<div class="item trow"><input type="checkbox" data-cf-fdone="${esc(f.id)}" ${done?'checked':''} aria-label="Mark done"><div class="tx"><div class="t ${done?'done':''}">${esc(f.subject)}</div><div class="sm ${f.overdue?'late':'mut'}">${esc(f.person||'')}${d?' · '+(f.overdue?'Overdue · ':'')+'Due '+esc(d):''}${f.status&&f.status!='open'&&!done?' · '+esc(f.status):''}</div>${f.next_action?`<div class="why"><b>Next:</b> ${esc(f.next_action)}</div>`:''}<div class="mut sm">Last contact: ${f.last_interaction_at?esc(W.ago(f.last_interaction_at)):'none logged'}</div></div><div class="row"><button class="btn alt sm" data-cf-flog="${esc(f.id)}">Log</button><button class="btn alt sm" data-cf-fedit="${esc(f.id)}">Edit</button><button class="btn alt sm" data-cf-fdel="${esc(f.id)}" aria-label="Delete follow-up">Delete</button></div></div>`}
function vFollow(){const L=fList(),t=W.todayK(),td=D.f.filter(x=>x.status!='done'&&day(x.follow_up_date)==t).length;
 return head('Follow-ups','Who you owe a reply or a nudge, and by when.')+`<form class="card addbar3" id="cf-fform"><input name="subject" required maxlength="300" placeholder="Add a follow-up" aria-label="Follow-up"><select name="contact_id" aria-label="Contact"><option value="">Contact (optional)</option>${D.c.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select><input name="person" maxlength="200" placeholder="Or a name" aria-label="Person"><input name="date" type="date" aria-label="Follow up on"><button class="btn">Add</button></form>
 <div class="row seg">${FF.map(([k,l])=>`<button class="btn sm ${D.ff==k?'':'alt'}" data-cf-ff="${k}">${l}${k=='overdue'&&D.overdue?' ('+D.overdue+')':k=='today'&&td?' ('+td+')':''}</button>`).join('')}</div>
 <div class="card" id="cf-flist">${L.length?L.map(fRow).join(''):`<div class="empty">${S.authed?'Nothing here.':'Sign in to see follow-ups.'}</div>`}</div>`}
function fForm(f){return `<form id="cf-fedit" data-id="${esc(f.id)}"><h2>Edit follow-up</h2><label>Subject<input name="subject" required maxlength="300" value="${esc(f.subject)}"></label><label>Person<input name="person" maxlength="200" value="${esc(f.person)}"></label><label>Follow up on<input name="date" type="date" value="${esc(day(f.follow_up_date))}"></label><label>Next action<input name="next_action" maxlength="300" value="${esc(f.next_action)}"></label><label>Notes<textarea name="notes" rows="3" maxlength="2000">${esc(f.notes)}</textarea></label><div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-ws-x>Cancel</button></div></form>`}
function lForm(f){return `<form id="cf-flogf" data-id="${esc(f.id)}"><h2>Log: ${esc(f.subject)}</h2><label>Type<select name="kind">${kopt('message')}</select></label><label>What happened<textarea name="summary" rows="3" required maxlength="500"></textarea></label><label>Next action (optional)<input name="next_action" maxlength="300"></label><label>Next follow-up date (optional)<input name="date" type="date"></label><div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-ws-x>Cancel</button></div></form>`}
W.view('contacts','Contacts',vContacts,'overview');W.view('followups','Follow-ups',vFollow,'overview');
const dIso=v=>v?new Date(v+'T09:00:00+04:00').toISOString():null;
const FK={c:ref(),f:ref(),i:ref(),l:ref()};
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-cf-cnew],[data-cf-cedit],[data-cf-cdel],[data-cf-copen],[data-cf-idel],[data-cf-fnewc],[data-cf-ff],[data-cf-fedit],[data-cf-fdel],[data-cf-flog]');if(!b)return;const d=b.dataset;
 if('cfCnew' in d){if(!S.authed)return toast('Sign in first');FK.c=FK.c||ref();W.modal(cForm(),'Add contact')}
 if(d.cfCedit){const c=byId(D.c,d.cfCedit);c&&(document.querySelectorAll('.modal').forEach(m=>m.remove()),W.modal(cForm(c),'Edit contact'))}
 if(d.cfCopen)openDetail(d.cfCopen);
 if(d.cfCdel&&confirm('Delete this contact and its history? Follow-ups are kept.'))act(()=>API.c.del(d.cfCdel),'Contact deleted');
 if(d.cfIdel&&confirm('Delete this entry?')){try{await API.c.dlog(d.cid,d.cfIdel);toast('Entry deleted')}catch(e){toast('Could not delete')}D.busy=false;refresh();openDetail(d.cid)}
 if(d.cfFnewc){const c=byId(D.c,d.cfFnewc);document.querySelectorAll('.modal').forEach(m=>m.remove());location.hash='#/followups';setTimeout(()=>{const s=document.querySelector('#cf-fform select');if(s){s.value=d.cfFnewc;document.querySelector('#cf-fform input[name=subject]').focus()}},150)}
 if(d.cfFf){D.ff=d.cfFf;W.render()}
 if(d.cfFedit){const f=byId(D.f.concat(D.done||[]),d.cfFedit);f&&W.modal(fForm(f),'Edit follow-up')}
 if(d.cfFdel&&confirm('Delete this follow-up?'))act(()=>API.f.del(d.cfFdel),'Follow-up deleted');
 if(d.cfFlog){const f=byId(D.f,d.cfFlog);f&&W.modal(lForm(f),'Log')}});
document.addEventListener('change',ev=>{const c=ev.target.closest('[data-cf-fdone]');if(c)act(()=>c.checked?API.f.done(c.dataset.cfFdone):API.f.reopen(c.dataset.cfFdone))});
document.addEventListener('input',ev=>{if(ev.target.id=='cf-q'){D.q=ev.target.value;const p=ev.target.selectionStart;W.render();const i=document.getElementById('cf-q');if(i){i.focus();i.setSelectionRange(p,p)}}});
const tg=v=>v.split(',').map(s=>s.trim()).filter(Boolean);
document.addEventListener('submit',async ev=>{const f=ev.target;
 if(f.id=='cf-cform'){ev.preventDefault();const id=f.dataset.id,b={name:f.name.value.trim(),org:f.org.value.trim(),role:f.role.value.trim(),email:f.email.value.trim(),phone:f.phone.value.trim(),tags:tg(f.tags.value),notes:f.notes.value.trim()},k=FK.c;if(!b.email)delete b.email;
  if(await act(()=>id?API.c.upd(id,b):API.c.add(b,k),'Contact saved')){FK.c=ref();f.closest('.modal')&&f.closest('.modal').remove();W.render()}}
 if(f.id=='cf-iform'){ev.preventDefault();const id=f.dataset.id,b={kind:f.kind.value,summary:f.summary.value.trim()};if(!b.summary)return;try{await API.c.log(id,b,FK.i);FK.i=ref();toast('Logged')}catch(e){return toast('Could not save ('+(e.status||'offline')+')')}D.busy=false;refresh();openDetail(id)}
 if(f.id=='cf-fform'){ev.preventDefault();const b={subject:f.subject.value.trim()};if(f.contact_id.value)b.contact_id=f.contact_id.value;if(f.person.value.trim())b.person=f.person.value.trim();if(f.date.value)b.follow_up_date=dIso(f.date.value);if(!b.subject)return;
  if(!b.contact_id&&!b.person)return toast('Pick a contact or type a name');if(await act(()=>API.f.add(b,FK.f),'Follow-up added')){f.reset();FK.f=ref()}}
 if(f.id=='cf-fedit'){ev.preventDefault();const id=f.dataset.id,b={subject:f.subject.value.trim(),person:f.person.value.trim(),follow_up_date:dIso(f.date.value),next_action:f.next_action.value.trim(),notes:f.notes.value.trim()};f.closest('.modal').remove();await act(()=>API.f.upd(id,b),'Saved')}
 if(f.id=='cf-flogf'){ev.preventDefault();const id=f.dataset.id,b={kind:f.kind.value,summary:f.summary.value.trim()};if(f.next_action.value.trim())b.next_action=f.next_action.value.trim();if(f.date.value)b.follow_up_date=dIso(f.date.value);const k=FK.l;f.closest('.modal').remove();if(await act(()=>API.f.log(id,b,k),'Logged'))FK.l=ref()}});
})();
