// Executive memory: manually maintained, searchable, editable, deletable. /memory, /memory/search, /export. No AI, nothing inferred.
(function(){'use strict';const W=window.WN,{S,api,esc,toast}=W;
S.mem=[];S.memQ='';S.memRes=null;S.memKind='';
const K={style:'Communication style',relationship:'Relationship',standing_instruction:'Standing instruction',decision_ref:'Past decision'};
W.onLoad(async soft=>{const r=await soft('/memory');if(r)S.mem=W.arr(r)});
const tags=m=>Array.isArray(m.tags)?m.tags:[];
function row(m){return `<div class="item"><div class="t"><span class="pill">${esc(K[m.kind]||m.kind)}</span>${esc(m.title)}</div>${m.body?`<div class="why" style="white-space:pre-wrap">${esc(m.body)}</div>`:''}${tags(m).length?`<div class="mut sm">${tags(m).map(t=>'#'+esc(t)).join(' ')}</div>`:''}<div class="mut sm">Updated ${esc(W.dl(m.updated_at||m.created_at))}</div>
 <div class="row" style="margin-top:6px"><button class="btn alt sm" data-mem-edit="${esc(m.id)}">Edit</button><button class="btn alt sm" data-mem-del="${esc(m.id)}" aria-label="Delete ${esc(m.title)}">Delete</button></div></div>`}
function form(m){m=m||{};return `<form id="memform" data-id="${esc(m.id||'')}"><h2>${m.id?'Edit memory':'New memory'}</h2>
<label>Type<select name="kind">${Object.keys(K).map(k=>`<option value="${k}" ${m.kind==k?'selected':''}>${K[k]}</option>`).join('')}</select></label>
<label>Title<input name="title" required maxlength="200" value="${esc(m.title)}"></label>
<label>Details<textarea name="body" rows="5" maxlength="4000">${esc(m.body)}</textarea></label>
<label>Tags (comma separated)<input name="tags" maxlength="200" value="${esc(tags(m).join(', '))}"></label>
<div class="row"><button class="btn">Save</button><button type="button" class="btn alt" data-mem-x>Cancel</button></div></form>`}
function view(){const list=S.memRes!==null?S.memRes:S.mem,L=list.filter(m=>!S.memKind||m.kind==S.memKind);
 return `<h1>Executive memory</h1><p class="sub">Your communication style, key relationships, standing instructions and past decisions. Written and kept up to date by you. Nothing is learned or inferred automatically.</p>${W.gate()}${W.needAuth()}
 <div class="row" style="margin-bottom:12px"><button class="btn" data-mem-new>+ New memory</button><form id="memsearch" class="row" style="flex:1;min-width:200px;flex-wrap:nowrap"><input name="q" type="search" placeholder="Search memory" aria-label="Search memory" value="${esc(S.memQ)}"><button class="btn alt sm">Search</button>${S.memRes!==null?'<button type="button" class="btn alt sm" data-mem-clear>Clear</button>':''}</form></div>
 <div class="row" style="margin-bottom:12px"><button class="btn sm ${S.memKind?'alt':''}" data-mem-k="">All</button>${Object.keys(K).map(k=>`<button class="btn sm ${S.memKind==k?'':'alt'}" data-mem-k="${k}">${K[k]}</button>`).join('')}</div>
 <div class="card"><h2>${S.memRes!==null?'Search results ('+L.length+')':'Memory ('+L.length+')'}</h2>${L.length?L.map(row).join(''):`<div class="empty">${S.authed?(S.memRes!==null?'Nothing matches.':'Nothing stored yet.'):'Sign in to see memory.'}</div>`}</div>
 <div class="card"><h2>Your data</h2><p class="mut sm">Everything here is stored on your private workspace server and can be exported or deleted at any time.</p><div class="row"><button class="btn alt" data-mem-export>Export all workspace data (JSON)</button><button class="btn alt" data-mem-wipe>Delete all memory…</button></div></div>`}
W.view('memory','Memory',view,'arthur');
const byId=id=>S.mem.find(m=>String(m.id)==id);
async function call(p,m,b,msg){try{await api(p,{method:m,body:b?JSON.stringify(b):undefined});toast(msg);await W.load();return true}catch(e){toast('Could not save ('+(e.status||'offline')+'). Nothing was changed.');return false}}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-mem-new],[data-mem-edit],[data-mem-del],[data-mem-k],[data-mem-x],[data-mem-clear],[data-mem-export],[data-mem-wipe]');if(!b)return;const D=b.dataset;
 if('memX' in D)b.closest('.modal').remove();
 if('memK' in D){S.memKind=D.memK;W.render()}
 if('memClear' in D){S.memQ='';S.memRes=null;W.render()}
 if('memNew' in D){if(!S.authed)return toast('Sign in first');W.modal(form(),'New memory')}
 if(D.memEdit){const m=byId(D.memEdit);m&&W.modal(form(m),'Edit memory')}
 if(D.memDel){const m=byId(D.memDel);if(m&&confirm('Delete this memory permanently?')){S.memRes=null;call('/memory/'+encodeURIComponent(m.id),'DELETE',null,'Deleted')}}
 if('memExport' in D){try{const r=await api('/export');const u=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download='winterhalter-workspace-export.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('Export downloaded')}catch(x){toast('Export failed ('+(x.status||'offline')+')')}}
 if('memWipe' in D){const t=prompt('This deletes ALL executive memory. Type DELETE to confirm.');if(t==='DELETE'){S.memRes=null;call('/memory?confirm=yes','DELETE',null,'All memory deleted')}}});
document.addEventListener('submit',async e=>{const f=e.target;
 if(f.id=='memsearch'){e.preventDefault();const q=f.q.value.trim();S.memQ=q;if(!q){S.memRes=null;return W.render()}try{S.memRes=W.arr(await api('/memory/search?q='+encodeURIComponent(q)))}catch(x){toast('Search failed ('+(x.status||'offline')+')')}W.render()}
 if(f.id=='memform'){e.preventDefault();const id=f.dataset.id,b={kind:f.kind.value,title:f.title.value.trim(),body:f.body.value.trim(),tags:f.tags.value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,10)};if(!b.title)return;
  f.closest('.modal').remove();S.memRes=null;await call(id?'/memory/'+encodeURIComponent(id):'/memory',id?'PUT':'POST',b,id?'Saved':'Memory added')}});
})();
