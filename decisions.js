// Decision register. Stored on gareth-api /decisions. Status changes are inside LaunchRiot only; nothing is sent.
(function(){'use strict';const W=window.WN,{S,api,esc,toast}=W;
S.decisions=[];S.decFilter='open';S.decLoaded=false;
W.onLoad(async soft=>{const r=await soft('/decisions');if(r){S.decisions=W.arr(r);S.decLoaded=true}});
const f=(x,k)=>x[k]||'';
const dueTxt=d=>d.due?W.dl(d.due)+(d.status!='decided'&&W.dkey(d.due)<W.todayK()?' · OVERDUE':''):'no deadline';
function item(d){const ov=d.status!='decided'&&d.due&&W.dkey(d.due)<W.todayK();
 return `<div class="item"><div class="t">${esc(d.title)} <span class="pill ${d.status=='decided'?'ok':ov?'warn':''}">${d.status=='decided'?'Decided':'Open'}</span></div>
 <div class="mut sm">Owner: ${esc(d.owner||'unassigned')} · Due: ${esc(dueTxt(d))}${d.decided_at?' · decided '+esc(W.dl(d.decided_at)):''}</div>
 ${d.context?`<div class="why"><b>Context:</b> ${esc(d.context)}</div>`:''}${d.outcome?`<div class="why"><b>Outcome:</b> ${esc(d.outcome)}</div>`:''}
 <div class="row" style="margin-top:6px">${d.status!='decided'?`<button class="btn sm" data-dec-decide="${esc(d.id)}">Record decision</button>`:`<button class="btn alt sm" data-dec-reopen="${esc(d.id)}">Reopen</button>`}<button class="btn alt sm" data-dec-edit="${esc(d.id)}">Edit</button><button class="btn alt sm" data-dec-del="${esc(d.id)}" aria-label="Delete decision ${esc(d.title)}">Delete</button></div></div>`}
function form(d){d=d||{};return `<form id="decform" data-id="${esc(d.id||'')}"><h2>${d.id?'Edit decision':'New decision'}</h2>
<label>Decision needed<input name="title" required maxlength="200" value="${esc(d.title)}"></label>
<label>Context<textarea name="context" rows="3" maxlength="1000">${esc(d.context)}</textarea></label>
<label>Owner<input name="owner" maxlength="100" value="${esc(d.owner)}"></label>
<label>Deadline<input type="date" name="due" value="${esc(d.due?W.dkey(d.due):'')}"></label>
<div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-dec-x>Cancel</button></div></form>`}
function view(){const all=S.decisions,open=all.filter(d=>d.status!='decided'),dec=all.filter(d=>d.status=='decided');const show=S.decFilter=='decided'?dec:open;
 return `<h1>Decisions</h1><p class="sub">A register of decisions, owners and deadlines. Entered by you; saved to your private workspace server.</p>${W.gate()}${W.needAuth()}
 <div class="row" style="margin-bottom:14px"><button class="btn" data-dec-new>+ New decision</button><button class="btn ${S.decFilter=='open'?'':'alt'}" data-dec-f="open">Open (${open.length})</button><button class="btn ${S.decFilter=='decided'?'':'alt'}" data-dec-f="decided">Decided (${dec.length})</button></div>
 <div class="card">${show.length?show.sort((a,b)=>(a.due||'9')<(b.due||'9')?-1:1).map(item).join(''):`<div class="empty">${S.authed?'No '+S.decFilter+' decisions.':'Sign in to see decisions.'}</div>`}</div>
 <p class="mut sm">Recording a decision changes its status inside LaunchRiot only. Nothing is sent to anyone.</p>`}
W.view('decisions','Decisions',view,'arthur');
const byId=id=>S.decisions.find(d=>String(d.id)==id);
async function save(p,m,b,msg){try{await api(p,{method:m,body:b?JSON.stringify(b):undefined});toast(msg);await W.load()}catch(e){toast('Could not save ('+(e.status||'offline')+'). Nothing was changed.')}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-dec-new],[data-dec-edit],[data-dec-decide],[data-dec-reopen],[data-dec-del],[data-dec-f],[data-dec-x]');if(!b)return;const D=b.dataset;
 if('decF' in D){S.decFilter=D.decF;W.render()}
 if('decX' in D){b.closest('.modal').remove()}
 if('decNew' in D){if(!S.authed)return toast('Sign in first');W.modal(form(),'New decision')}
 if(D.decEdit){const d=byId(D.decEdit);d&&W.modal(form(d),'Edit decision')}
 if(D.decDecide){const d=byId(D.decDecide);if(!d)return;W.modal(`<form id="decdone" data-id="${esc(d.id)}"><h2>Record decision</h2><p class="mut sm">${esc(d.title)}</p><label>What was decided?<textarea name="outcome" rows="3" maxlength="1000" required></textarea></label><div class="row"><button class="btn">Mark decided</button><button type="button" class="btn alt" data-dec-x>Cancel</button></div></form>`,'Record decision')}
 if(D.decReopen)save('/decisions/'+encodeURIComponent(D.decReopen),'PUT',{status:'open'},'Reopened');
 if(D.decDel){const d=byId(D.decDel);if(d&&confirm('Delete this decision permanently?'))save('/decisions/'+encodeURIComponent(d.id),'DELETE',null,'Deleted')}});
document.addEventListener('submit',async e=>{const fm=e.target;
 if(fm.id=='decform'){e.preventDefault();const id=fm.dataset.id,b={title:fm.title.value.trim(),context:fm.context.value.trim(),owner:fm.owner.value.trim(),due:fm.due.value||null};if(!b.title)return;
  fm.closest('.modal').remove();await save(id?'/decisions/'+encodeURIComponent(id):'/decisions',id?'PUT':'POST',b,id?'Saved':'Decision added')}
 if(fm.id=='decdone'){e.preventDefault();const id=fm.dataset.id,o=fm.outcome.value.trim();fm.closest('.modal').remove();await save('/decisions/'+encodeURIComponent(id),'PUT',{status:'decided',outcome:o},'Decision recorded')}});
})();
