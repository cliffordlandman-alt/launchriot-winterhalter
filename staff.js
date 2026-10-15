// Staff accountability centre: /staff-tasks (email-derived + manual) and /staff-tasks/summary. Approve/decline change status inside LaunchRiot only.
(function(){'use strict';const W=window.WN,{S,api,esc,toast}=W;
S.tasks=[];S.tsum=[];S.tFilter='all';S.tOwner='';
const ST={open:'Open',blocked:'Blocked',awaiting_approval:'Awaiting approval',done:'Done'};
W.onLoad(async soft=>{const [a,b]=await Promise.all([soft('/staff-tasks'),soft('/staff-tasks/summary')]);if(a)S.tasks=W.arr(a);if(b)S.tsum=W.arr(b)});
const title=t=>t.title||t.subject||t.body_summary||t.snippet||'(untitled)';
const st=t=>ST[t.status]?t.status:(t.task_status=='closed'?'done':'open');
const dueK=t=>t.due?W.dkey(t.due):'';
const overdue=t=>st(t)!='done'&&dueK(t)&&dueK(t)<W.todayK();
const owner=t=>t.owner||(t.assigned_staff&&t.assigned_staff[0]&&(t.assigned_staff[0].name||t.assigned_staff[0].email))||'Unassigned';
const PR={high:'warn',normal:'',low:''};
function row(t){const s=st(t),ov=overdue(t),lk=!t.manual&&(t.source||'gmail')=='gmail'&&t.thread_id?'https://mail.google.com/mail/u/0/#all/'+encodeURIComponent(t.thread_id):'';
 return `<div class="item"><div class="t">${esc(title(t))}</div>
 <div class="mut sm"><span class="pill ${s=='done'?'ok':s=='open'?'':'warn'}">${esc(ST[s])}</span>${ov?'<span class="pill warn">OVERDUE</span>':''}<span class="pill ${PR[t.priority]||''}">${esc(t.priority||'normal')} priority</span>Owner: ${esc(owner(t))} · Due: ${esc(t.due?W.dl(t.due):'none')}${t.follow_up_at?' · follow up '+esc(W.dl(t.follow_up_at)):''}${t.manual?' · added by you':' · from email'}</div>
 ${t.note?`<div class="why"><b>Note:</b> ${esc(t.note)}</div>`:''}
 <div class="row" style="margin-top:6px">${s=='awaiting_approval'?`<button class="btn sm" data-st-approve="${esc(t.id)}">Approve</button><button class="btn alt sm" data-st-decline="${esc(t.id)}">Decline</button>`:''}${s!='done'?`<button class="btn alt sm" data-st-done="${esc(t.id)}">Mark done</button>`:`<button class="btn alt sm" data-st-reopen="${esc(t.id)}">Reopen</button>`}<button class="btn alt sm" data-st-edit="${esc(t.id)}">Edit</button>${lk?`<a href="${esc(lk)}" target="_blank" rel="noopener noreferrer">Open in Gmail ↗</a>`:''}${t.manual?`<button class="btn alt sm" data-st-del="${esc(t.id)}" aria-label="Delete task">Delete</button>`:''}</div></div>`}
function form(t){t=t||{};const man=!t.id||t.manual;return `<form id="stform" data-id="${esc(t.id||'')}"><h2>${t.id?'Edit task':'New staff task'}</h2>
${man?`<label>Task<input name="title" required maxlength="200" value="${esc(t.title)}"></label>`:`<p class="mut sm">${esc(title(t))}</p>`}
<label>Owner<input name="owner" maxlength="100" value="${esc(t.owner||'')}"></label>
<label>Due<input type="date" name="due" value="${esc(t.due?W.dkey(t.due):'')}"></label>
<label>Priority<select name="priority">${['low','normal','high'].map(p=>`<option ${((t.priority||'normal')==p)?'selected':''}>${p}</option>`).join('')}</select></label>
<label>Status<select name="status">${Object.keys(ST).map(k=>`<option value="${k}" ${st(t)==k||(!t.id&&k=='open')?'selected':''}>${ST[k]}</option>`).join('')}</select></label>
<label>Follow-up date<input type="date" name="fu" value="${esc(t.follow_up_at?W.dkey(t.follow_up_at):'')}"></label>
<label>Note<textarea name="note" rows="2" maxlength="500">${esc(t.note||'')}</textarea></label>
<div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-st-x>Cancel</button></div></form>`}
function view(){const T=S.tasks,cnt={all:T.length,open:T.filter(t=>st(t)=='open').length,overdue:T.filter(overdue).length,blocked:T.filter(t=>st(t)=='blocked').length,awaiting_approval:T.filter(t=>st(t)=='awaiting_approval').length,done:T.filter(t=>st(t)=='done').length};
 const owners=[...new Set(T.map(owner))].sort();let L=T.filter(t=>(!S.tOwner||owner(t)==S.tOwner)&&(S.tFilter=='all'||(S.tFilter=='overdue'?overdue(t):st(t)==S.tFilter)));
 L=L.sort((a,b)=>(overdue(b)-overdue(a))||((dueK(a)||'9')<(dueK(b)||'9')?-1:1));
 const chips=[['all','All'],['open','Open'],['overdue','Overdue'],['blocked','Blocked'],['awaiting_approval','Awaiting approval'],['done','Done']];
 return `<h1>Staff</h1><p class="sub">What your team is working on: owners, deadlines and status. Email-derived tasks come from threads where staff are copied; the rest you add by hand.</p>${W.gate()}${W.needAuth()}
 <div class="tiles" style="grid-template-columns:repeat(4,1fr)"><div class="tile"><b>${cnt.open}</b><span>Open</span></div><div class="tile"><b>${cnt.overdue}</b><span>Overdue</span></div><div class="tile"><b>${cnt.blocked}</b><span>Blocked</span></div><div class="tile"><b>${cnt.awaiting_approval}</b><span>Awaiting approval</span></div></div>
 <div class="row" style="margin-bottom:12px"><button class="btn" data-st-new>+ New task</button>${chips.map(c=>`<button class="btn sm ${S.tFilter==c[0]?'':'alt'}" data-st-f="${c[0]}">${c[1]} (${cnt[c[0]]})</button>`).join('')}<select id="stowner" aria-label="Filter by owner" style="width:auto"><option value="">All owners</option>${owners.map(o=>`<option ${S.tOwner==o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>
 <div class="card">${L.length?L.map(row).join(''):`<div class="empty">${S.authed?'No tasks match. Staff tasks appear once mail is connected and staff are set up, or add one by hand.':'Sign in to see staff tasks.'}</div>`}</div>
 <div class="card"><h2>Staff summary (last 30 days, from recorded tasks only)</h2>${S.tsum.length?`<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Owner</th><th>Opened</th><th>Closed</th><th>Overdue</th><th>Open now</th></tr></thead><tbody>${S.tsum.map(r=>`<tr><td>${esc(r.owner||'Unassigned')}</td><td>${+r.opened||0}</td><td>${+r.closed||0}</td><td>${+r.overdue||0}</td><td>${+r.open_now||0}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No recorded tasks in the last 30 days.</div>'}<p class="mut sm">Counts reflect only tasks recorded here or detected from email. They are not a performance rating.</p></div>
 <p class="mut sm">Approve/Decline change a task’s status inside LaunchRiot only. Nothing is sent to staff.</p>`}
W.view('staff','Staff',view,'arthur');
const byId=id=>S.tasks.find(t=>String(t.id)==id);
async function call(p,m,b,msg){try{await api(p,{method:m,body:b?JSON.stringify(b):undefined});toast(msg);await W.load();return true}catch(e){toast('Could not save ('+(e.status||'offline')+'). Nothing was changed.');return false}}
const put=(id,b,msg)=>call('/staff-tasks/'+encodeURIComponent(id),'PUT',b,msg);
const stamp=(t,txt)=>((t.note?t.note+' · ':'')+txt+' '+W.todayK()).slice(0,500);
document.addEventListener('click',e=>{const b=e.target.closest('[data-st-new],[data-st-edit],[data-st-done],[data-st-reopen],[data-st-approve],[data-st-decline],[data-st-del],[data-st-f],[data-st-x]');if(!b)return;const D=b.dataset,t=byId(D.stEdit||D.stDone||D.stReopen||D.stApprove||D.stDecline||D.stDel);
 if('stX' in D)b.closest('.modal').remove();
 if('stF' in D){S.tFilter=D.stF;W.render()}
 if('stNew' in D){if(!S.authed)return toast('Sign in first');W.modal(form(),'New staff task')}
 if(!t)return;
 if(D.stEdit)W.modal(form(t),'Edit task');
 if(D.stDone)put(t.id,{status:'done'},'Marked done');
 if(D.stReopen)put(t.id,{status:'open'},'Reopened');
 if(D.stApprove)put(t.id,{status:'open',note:stamp(t,'Approved in LaunchRiot')},'Approved (status only, nothing sent)');
 if(D.stDecline)put(t.id,{status:'blocked',note:stamp(t,'Declined in LaunchRiot')},'Declined (status only, nothing sent)');
 if(D.stDel&&confirm('Delete this task permanently?'))call('/staff-tasks/'+encodeURIComponent(t.id),'DELETE',null,'Deleted')});
document.addEventListener('change',e=>{if(e.target.id=='stowner'){S.tOwner=e.target.value;W.render()}});
document.addEventListener('submit',async e=>{const f=e.target;if(f.id!='stform')return;e.preventDefault();const id=f.dataset.id,t=id?byId(id):null;
 const b={owner:f.owner.value.trim(),due:f.due.value||null,priority:f.priority.value,status:f.status.value,follow_up_at:f.fu.value||null,note:f.note.value.trim()};
 if(f.title)b.title=f.title.value.trim();if(!id&&!b.title)return;
 if(id&&t&&!t.manual)delete b.title;
 f.closest('.modal').remove();if(id)await put(id,b,'Saved');else await call('/staff-tasks','POST',b,'Task added')});
})();
