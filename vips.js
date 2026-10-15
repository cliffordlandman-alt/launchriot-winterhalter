// VIP relationship manager: /vips, /vips/:id/history, /vips/:id/notes. Follow-up reminders are captured tasks (/capture). Nothing is sent.
(function(){'use strict';const W=window.WN,{S,api,esc,toast}=W;
S.vips=[];S.vipSel=null;S.vipHist=null;
const KIND={client:'Client',supplier:'Supplier',colleague:'Colleague'};
W.onLoad(async soft=>{const r=await soft('/vips');if(r){S.vips=W.arr(r);if(S.vipSel){if(S.vips.some(v=>v.id==S.vipSel)){const h=await soft('/vips/'+encodeURIComponent(S.vipSel)+'/history');if(h)S.vipHist=h}else{S.vipSel=null;S.vipHist=null}}}});
const who=v=>v.email||(v.domain?'@'+String(v.domain).replace(/^@/,''):'');
function row(v){return `<div class="item"><div class="t">${esc(v.name)} <span class="pill">${esc(KIND[v.kind]||v.kind||'VIP')}</span></div><div class="mut sm">${esc(who(v))}${v.org?' · '+esc(v.org):''}</div>${v.note?`<div class="why">${esc(v.note)}</div>`:''}
 <div class="row" style="margin-top:6px"><button class="btn sm" data-vip-open="${esc(v.id)}">History &amp; notes</button><button class="btn alt sm" data-vip-edit="${esc(v.id)}">Edit</button><button class="btn alt sm" data-vip-del="${esc(v.id)}" aria-label="Remove VIP ${esc(v.name)}">Remove</button></div></div>`}
function form(v){v=v||{};const byDom=!v.email&&v.domain;return `<form id="vipform" data-id="${esc(v.id||'')}"><h2>${v.id?'Edit VIP':'Add VIP'}</h2>
<label>Name<input name="name" required maxlength="120" value="${esc(v.name)}"></label>
<label>Match by<select name="by"><option value="email" ${byDom?'':'selected'}>One email address</option><option value="domain" ${byDom?'selected':''}>Whole company domain</option></select></label>
<label>Email address or domain (e.g. name@firm.com or firm.com)<input name="addr" required maxlength="200" value="${esc(v.email||v.domain||'')}"></label>
<label>Organisation<input name="org" maxlength="120" value="${esc(v.org)}"></label>
<label>Type<select name="kind">${Object.keys(KIND).map(k=>`<option value="${k}" ${v.kind==k?'selected':''}>${KIND[k]}</option>`).join('')}</select></label>
<label>Relationship note<textarea name="note" rows="2" maxlength="500">${esc(v.note)}</textarea></label>
<p class="mut sm">Mail from this address is flagged VIP and ranked higher. This is a list you maintain by hand.</p>
<div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-vip-x>Cancel</button></div></form>`}
function thread(t){const a=t.from_name||(t.from&&typeof t.from=='object'?t.from.name||t.from.email:t.from)||'';const at=t.received_at||t.at;const l=(t.source||'gmail')=='gmail'&&t.thread_id?'https://mail.google.com/mail/u/0/#all/'+encodeURIComponent(t.thread_id):'';
 return `<div class="item"><div class="t">${esc(t.subject||'(no subject)')}</div><div class="mut sm">${esc(a)}${at?' · '+esc(W.dl(at))+' '+esc(W.tm(at)):''}</div>${l?`<a href="${esc(l)}" target="_blank" rel="noopener noreferrer">Open in Gmail ↗</a>`:''}</div>`}
function detail(){const v=S.vips.find(x=>x.id==S.vipSel);if(!v)return '';const h=S.vipHist&&S.vipHist.vip&&S.vipHist.vip.id==v.id?S.vipHist:null;
 if(!h)return `<div class="card"><h2>${esc(v.name)}</h2><div class="empty">Loading history…</div></div>`;
 const oc=h.open_commitments||{},dec=oc.decisions||[],tk=oc.captured_tasks||[],notes=h.notes||[],th=h.threads||[];
 return `<div class="card" id="vipdetail"><div class="row" style="justify-content:space-between"><h2 style="margin:0">${esc(v.name)} <span class="pill">${esc(KIND[v.kind]||'VIP')}</span></h2><button class="btn alt sm" data-vip-close>Close</button></div><div class="mut sm">${esc(who(v))}${v.org?' · '+esc(v.org):''}</div>
 <div class="grid2" style="margin-top:14px"><div><h3>Contact history (last ${th.length})</h3>${th.length?th.map(thread).join(''):'<div class="empty">No mail to or from this address in the synced window (last 14 days).</div>'}</div>
 <div><h3>Open commitments</h3>${dec.length||tk.length?dec.map(d=>`<div class="item"><span class="pill warn">Decision</span>${esc(d.title||'')}</div>`).join('')+tk.map(t=>`<div class="item"><span class="pill warn">Task</span>${esc(t.text||t.title||'')}${t.due?` <span class="mut sm">· due ${esc(String(t.due).slice(0,10))}</span>`:''}</div>`).join(''):'<div class="empty">None linked.</div>'}
 <h3 style="margin-top:16px">Follow-up reminder</h3><form id="vipfu" data-id="${esc(v.id)}" class="row"><input type="date" name="due" required aria-label="Follow-up date" style="width:auto"><button class="btn sm">Add reminder</button></form><div class="mut sm">Creates a task in Capture. Nothing is sent to ${esc(v.name)}.</div></div></div>
 <h3 style="margin-top:16px">Notes (${notes.length})</h3>${notes.length?notes.map(n=>`<div class="item row" style="justify-content:space-between;flex-wrap:nowrap"><div style="min-width:0;overflow-wrap:anywhere">${esc(n.text)}<div class="mut sm">${esc(W.dl(n.created_at))}</div></div><button class="btn alt sm" data-vip-ndel="${esc(n.id)}" aria-label="Delete note">Delete</button></div>`).join(''):'<div class="empty">No notes yet.</div>'}
 <form id="vipnote" data-id="${esc(v.id)}" class="row" style="margin-top:8px;flex-wrap:nowrap"><input name="text" required maxlength="500" placeholder="Add a note" aria-label="New note"><button class="btn sm">Add</button></form></div>`}
function view(){const vm=S.mail.filter(m=>m.vip);
 return `<h1>VIPs</h1><p class="sub">Your important clients, suppliers and colleagues. Their mail is flagged and ranked above ordinary correspondence.</p>${W.gate()}${W.needAuth()}
 <div class="row" style="margin-bottom:14px"><button class="btn" data-vip-new>+ Add VIP</button></div>${detail()}
 <div class="card"><h2>Your VIPs (${S.vips.length})</h2>${S.vips.length?S.vips.map(row).join(''):`<div class="empty">${S.authed?'No VIPs yet. Add the first one.':'Sign in to see VIPs.'}</div>`}</div>
 <div class="card"><h2>VIP mail right now (${vm.length})</h2>${vm.length?vm.slice(0,8).map(m=>`<div class="item"><div class="t"><span class="pill ok">VIP</span>${esc(m.subj)}</div><div class="mut sm">${esc(m.from)} · ${esc(W.dl(m.at))}</div><div class="why"><b>Why flagged:</b> ${esc(W.why(m))}</div></div>`).join(''):'<div class="empty">No VIP mail in the synced window.</div>'}</div>`}
W.view('vips','VIPs',view,'arthur');
const byId=id=>S.vips.find(v=>String(v.id)==id);
async function call(p,m,b,msg){try{const r=await api(p,{method:m,body:b?JSON.stringify(b):undefined});toast(msg);await W.load();return r||true}catch(e){toast('Could not save ('+(e.status||'offline')+'). Nothing was changed.');return false}}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-vip-new],[data-vip-edit],[data-vip-open],[data-vip-del],[data-vip-close],[data-vip-x],[data-vip-ndel]');if(!b)return;const D=b.dataset;
 if('vipX' in D)b.closest('.modal').remove();
 if('vipNew' in D){if(!S.authed)return toast('Sign in first');W.modal(form(),'Add VIP')}
 if(D.vipEdit){const v=byId(D.vipEdit);v&&W.modal(form(v),'Edit VIP')}
 if(D.vipOpen){S.vipSel=D.vipOpen;S.vipHist=null;W.render();await W.load();const d=document.getElementById('vipdetail');d&&d.scrollIntoView({block:'start'})}
 if('vipClose' in D){S.vipSel=null;S.vipHist=null;W.render()}
 if(D.vipDel){const v=byId(D.vipDel);if(v&&confirm('Remove '+v.name+' from VIPs? Their notes are deleted too.')){if(S.vipSel==v.id)S.vipSel=null;call('/vips/'+encodeURIComponent(v.id),'DELETE',null,'Removed')}}
 if(D.vipNdel&&S.vipSel)call('/vips/'+encodeURIComponent(S.vipSel)+'/notes/'+encodeURIComponent(D.vipNdel),'DELETE',null,'Note deleted')});
document.addEventListener('submit',async e=>{const f=e.target;
 if(f.id=='vipform'){e.preventDefault();const id=f.dataset.id,a=f.addr.value.trim().toLowerCase();const b={name:f.name.value.trim(),org:f.org.value.trim(),kind:f.kind.value,note:f.note.value.trim()};
  if(f.by.value=='email'){if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a))return toast('Enter a valid email address');b.email=a;if(id)b.domain=null}else{b.domain=a.replace(/^@/,'');if(!/^[^@\s]+\.[^@\s]+$/.test(b.domain))return toast('Enter a domain like firm.com');if(id)b.email=null}
  f.closest('.modal').remove();await call(id?'/vips/'+encodeURIComponent(id):'/vips',id?'PUT':'POST',b,id?'Saved':'VIP added')}
 if(f.id=='vipnote'){e.preventDefault();const t=f.text.value.trim();if(!t)return;await call('/vips/'+encodeURIComponent(f.dataset.id)+'/notes','POST',{text:t},'Note added')}
 if(f.id=='vipfu'){e.preventDefault();const v=byId(f.dataset.id);if(!v)return;await call('/capture','POST',{type:'task',text:'Follow up with '+v.name+(v.org?' ('+v.org+')':''),due:f.due.value},'Follow-up added to Capture')}});
})();
