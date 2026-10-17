// Workspace feature 3: Documents and global Search (API: API part 3).
(function(){'use strict';const W=window.WN,{S,api,esc,toast}=W;
const E=encodeURIComponent,B=(window.WN_CFG||{}).apiBase||'';
const ref=()=>(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random());
const tok=()=>{try{return localStorage.getItem('wn-tok')||''}catch(e){return ''}};
const D={docs:[],loaded:false,busy:false,q:'',sq:'',res:null,sbusy:false};S.docs=D;
const arr=W.arr;
const size=n=>n>1048576?(n/1048576).toFixed(1)+' MB':n>1024?Math.round(n/1024)+' KB':n+' B';
async function refresh(){if(!S.authed||D.busy)return;D.busy=true;const r=await api('/documents'+(D.q?'?q='+E(D.q):'')).catch(()=>null);D.busy=false;if(r)D.docs=arr(r);D.loaded=true;if(!document.querySelector('.modal'))W.render()}
W.onLoad(async()=>{if(!D.loaded)refresh()});
const head=(t,s)=>`<h1>${t}</h1><p class="sub">${s}</p>${!S.authed?'<div class="notice">Sign in to use your workspace. <button class="btn sm" data-act="login">Sign in</button></div>':!S.online?'<div class="notice">'+esc(S.err)+'</div>':''}`;
const EXT=/\.(pdf|docx|xlsx|csv|txt|png|jpe?g|gif|webp)$/i,INL=/\.(pdf|png|jpe?g|gif|webp)$/i;
function dRow(d){return `<div class="item trow"><div class="tx"><div class="t" style="overflow-wrap:anywhere">${esc(d.filename)}</div><div class="mut sm">${esc(size(d.size||0))} · ${esc(W.dl(d.created_at))}${d.description?' · '+esc(d.description):''}</div></div><div class="row">${INL.test(d.filename)?`<button class="btn alt sm" data-dc-view="${esc(d.id)}">View</button>`:''}<button class="btn alt sm" data-dc-dl="${esc(d.id)}">Download</button><button class="btn alt sm" data-dc-ren="${esc(d.id)}">Rename</button><button class="btn alt sm" data-dc-del="${esc(d.id)}" aria-label="Delete document">Delete</button></div></div>`}
function vDocs(){return head('Documents','Upload files once, find them again by name or text.')+`<div class="card addbar4"><label class="btn" style="cursor:pointer;margin:0">+ Upload file<input id="dc-file" type="file" accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp" hidden></label><input id="dc-q" type="search" placeholder="Search documents" aria-label="Search documents" value="${esc(D.q)}"><span class="mut sm">PDF, Word, Excel, CSV, text and images, up to 10 MB.</span></div>
 <div class="card" id="dc-list">${D.docs.length?D.docs.map(dRow).join(''):`<div class="empty">${S.authed?(D.q?'No documents match.':'No documents yet.'):'Sign in to see documents.'}</div>`}</div>`}
// ---- search ----
const TY={task:['Tasks','tasks'],event:['Events','calendar'],note:['Notes','notes'],contact:['Contacts','contacts'],followup:['Follow-ups','followups'],document:['Documents','documents']};
function vSearch(){const r=D.res;let h=head('Search','One box for tasks, events, notes, contacts, follow-ups and documents.')+`<form class="card row" id="sr-form"><input id="sr-q" type="search" required minlength="2" placeholder="Search everything" aria-label="Search everything" value="${esc(D.sq)}" style="flex:1;min-width:160px"><button class="btn">Search</button></form>`;
 if(D.sbusy)h+='<div class="card empty">Searching…</div>';
 else if(!r&&(window.WN_CFG||{}).demo)h+='<div class="card"><h2>Try a search</h2><div class="row">'+['boiler','tenant','quote','inspection','compressor'].map(w=>`<button class="btn alt sm" data-sr-chip="${w}">${w}</button>`).join('')+'</div></div>';
 else if(r){const items=arr(r);h+=items.length?Object.keys(TY).filter(t=>items.some(i=>i.type==t)).map(t=>`<div class="card"><h2>${TY[t][0]}</h2>${items.filter(i=>i.type==t).map(i=>`<button class="item srhit" data-sr-open="${esc(t)}" data-sr-id="${esc(i.id)}"><div class="t">${esc(i.title||'(untitled)')}</div>${i.snippet?`<div class="mut sm">${esc(String(i.snippet).slice(0,160))}</div>`:''}</button>`).join('')}</div>`).join(''):`<div class="card empty">Nothing found for “${esc(r.query||D.sq)}”.</div>`}
 return h}
W.view('documents','Documents',vDocs,'overview');W.view('search','Search',vSearch,'overview');
async function blob(id,inline){const r=await fetch(B+'/documents/'+E(id)+'/download'+(inline?'?inline=1':''),{credentials:'include',headers:tok()?{Authorization:'Bearer '+tok()}:{}});if(!r.ok)throw new Error(r.status);return r.blob()}
const byId=id=>D.docs.find(x=>String(x.id)==id);
async function upload(file){if(!file)return;if(!EXT.test(file.name))return toast('That file type is not allowed.');if(file.size>10485760)return toast('That file is over 10 MB.');
 toast('Uploading…');try{const r=await fetch(B+'/documents?filename='+E(file.name)+'&client_ref='+E(ref()),{method:'POST',body:file,credentials:'include',headers:tok()?{Authorization:'Bearer '+tok()}:{}});if(!r.ok)throw new Error(r.status);toast('Uploaded')}catch(e){toast('Could not upload ('+e.message+'). Nothing was changed.')}D.busy=false;refresh()}
document.addEventListener('change',ev=>{if(ev.target.id=='dc-file'){const f=ev.target.files[0];ev.target.value='';upload(f)}});
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-dc-view],[data-dc-dl],[data-dc-ren],[data-dc-del]');if(!b)return;const d=b.dataset;
 if(d.dcView){const w=window.open('','_blank');try{const u=URL.createObjectURL(await blob(d.dcView,true));if(w)w.location=u;else location.href=u}catch(e){w&&w.close();toast('Could not open the file')}}
 if(d.dcDl){const x=byId(d.dcDl);try{const u=URL.createObjectURL(await blob(d.dcDl));const a=document.createElement('a');a.href=u;a.download=x?x.filename:'document';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4e4)}catch(e){toast('Could not download')}}
 if(d.dcRen){const x=byId(d.dcRen);if(!x)return;const m=x.filename.match(/(\.[^.]+)$/),ext=m?m[1]:'',base=x.filename.slice(0,x.filename.length-ext.length);const n=prompt('New name (the file type stays '+ext+')',base);if(!n||!n.trim())return;
  try{await api('/documents/'+E(x.id),{method:'PUT',body:JSON.stringify({filename:n.trim().replace(/[\\/]/g,'')+ext})});toast('Renamed')}catch(e){toast('Could not rename ('+(e.status||'offline')+')')}D.busy=false;refresh()}
 if(d.dcDel&&confirm('Delete this document? The file is removed.')){try{await api('/documents/'+E(d.dcDel),{method:'DELETE'});toast('Document deleted')}catch(e){toast('Could not delete')}D.busy=false;refresh()}});
let t;document.addEventListener('input',ev=>{if(ev.target.id=='dc-q'){D.q=ev.target.value;clearTimeout(t);t=setTimeout(async()=>{D.busy=false;await refresh();const i=document.getElementById('dc-q');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},300)}});
document.addEventListener('click',ev=>{const c=ev.target.closest('[data-sr-chip]');if(!c)return;D.sq=c.dataset.srChip;const i=document.getElementById('sr-q');i.value=D.sq;document.getElementById('sr-form').requestSubmit()});
document.addEventListener('submit',async ev=>{if(ev.target.id!='sr-form')return;ev.preventDefault();const q=document.getElementById('sr-q').value.trim();if(q.length<2)return;D.sq=q;D.sbusy=true;W.render();
 try{D.res=await api('/search?q='+E(q)+'&limit=10')}catch(e){D.res=null;toast('Search failed ('+(e.status||'offline')+')')}D.sbusy=false;W.render()});

// open the exact item a search hit points at
const OPEN={task:['data-ws-tedit','/tasks/'],note:['data-ws-nedit','/notes/'],contact:['data-cf-copen','/contacts/'],followup:['data-cf-fedit','/followups/'],document:['data-dc-view','/documents/']};
function fake(attr,id){const b=document.createElement('button');b.setAttribute(attr,id);b.style.display='none';document.body.appendChild(b);b.click();b.remove()}
function generic(type,x){const f=(l,v)=>v?`<div class="sm"><span class="mut">${l}:</span> ${esc(v)}</div>`:'';const when=x.starts_at||x.deadline||x.follow_up_date;
 W.modal(`<div class="cdet"><h2>${esc(x.title||x.name||x.subject||x.filename||'Item')}</h2>${f('Type',TY[type][0].replace(/s$/,''))}${f('When',when?W.dl(when)+' '+W.tm(when):'')}${f('Where',x.location)}${f('Details',x.details||x.notes||x.body||x.description)}${f('Status',x.status)}<div class="row" style="margin-top:12px"><a class="btn alt" href="#/${TY[type][1]}" data-ws-x style="text-decoration:none">Open ${esc(TY[type][0])}</a><button class="btn alt" data-ws-x>Close</button></div></div>`,'Item')}
document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-sr-open]');if(!b)return;const type=b.dataset.srOpen,id=b.dataset.srId;
 const base={task:'/tasks/',event:'/events/',note:'/notes/',contact:'/contacts/',followup:'/followups/',document:'/documents/'}[type];let x=null;try{x=await api(base+E(id))}catch(e){return toast('That item no longer exists')}
 x=x.contact||x.item||x;
 if(type=='document'){D.docs.find(d=>String(d.id)==String(id))||D.docs.push(x)}
 const o=OPEN[type];
 if(o){if(type=='task'&&!(S.ws&&S.ws.tasks.some(t=>String(t.id)==String(id))))S.ws&&S.ws.tasks.push(x);if(type=='note'&&!(S.ws&&S.ws.notes.some(t=>String(t.id)==String(id))))S.ws&&S.ws.notes.push(x);if(type=='followup'){const L=(S.cf&&S.cf.f)||[];if(!L.some(t=>String(t.id)==String(id)))L.push(x)}
  if(type=='document'){generic(type,x);const m=document.querySelector('.modal .row');if(m&&/\.(pdf|png|jpe?g|gif|webp)$/i.test(x.filename))m.insertAdjacentHTML('afterbegin',`<button class="btn" data-dc-view="${esc(id)}">View</button>`);m&&m.insertAdjacentHTML('afterbegin',`<button class="btn alt" data-dc-dl="${esc(id)}">Download</button>`);return}
  fake(o[0],id);if(document.querySelector('.modal'))return}
 generic(type,x)});
})();
