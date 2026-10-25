// Email reader: opens the full email behind any item marked data-email="<id>", plus an Inbox view.
(function(){'use strict';const W=window.WN;if(!W)return;const {S,api,esc,toast}=W;
const E=encodeURIComponent,P=(p)=>api(p,{method:'POST'});
const clean=t=>String(t||'').replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g,' ').replace(/[#.@]?[\w-]+(?:[\s,:>+~.#\w()-]*)\{[^{}]*\}/g,' ').replace(/[ \t]+/g,' ').trim();
const fd=v=>{if(!v)return '';const d=new Date(v);return isNaN(d)?'':d.toLocaleString([],{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})};
const kb=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
window.WN_clean=clean;
let cur=null;
function close(){document.querySelectorAll('.modal.mv').forEach(m=>m.remove());cur=null}
function frame(html){const doc='<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: cid:; style-src \'unsafe-inline\'; font-src data:"><base target="_blank"><style>body{font:15px/1.5 system-ui,sans-serif;color:#111;background:#fff;margin:12px;word-wrap:break-word}img{max-width:100%;height:auto}table{max-width:100%}</style></head><body>'+html+'</body></html>';
 const f=document.createElement('iframe');f.setAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox allow-same-origin');f.setAttribute('referrerpolicy','no-referrer');f.title='Email content';f.style.cssText='width:100%;min-height:340px;border:1px solid #ddd;border-radius:10px;background:#fff';f.srcdoc=doc;
 f.onload=()=>{try{f.style.height=Math.min(Math.max(f.contentDocument.documentElement.scrollHeight+20,200),4000)+'px'}catch(e){}};return f}
function body(m){const from=(m.from_name?esc(m.from_name)+' ':'')+(m.from_addr?'<span class="mut">&lt;'+esc(m.from_addr)+'&gt;</span>':'');
 const row=(k,v)=>v?'<div><span class="mut" style="display:inline-block;min-width:58px">'+k+'</span> '+v+'</div>':'';
 const att=(m.attachments||[]).length?'<div style="margin-top:10px"><b>Attachments</b><ul class="list">'+m.attachments.map(a=>'<li>📎 '+esc(a.name)+' <span class="mut">'+esc(a.type||'')+(a.size?' · '+kb(a.size):'')+'</span></li>').join('')+'</ul>'+(m.gmail_url?'<p class="mut sm">Open in Gmail to download attachments.</p>':'')+'</div>':'';
 const acts=[m.draft_id?'<a class="btn" href="#/setup" data-mv-x>Review draft reply</a>':(m.message_id?'<button class="btn" data-mv-draft>Draft reply</button>':''),m.message_id&&m.status!=='resolved'?'<button class="btn alt" data-mv-done>Mark done</button>':(m.status==='resolved'?'<span class="pill">Done</span>':''),m.gmail_url?'<a class="btn alt" target="_blank" rel="noopener noreferrer" href="'+esc(m.gmail_url)+'">Open in Gmail</a>':(m.from_addr&&m.source==='email'?'<a class="btn alt" href="mailto:'+esc(m.from_addr)+'?subject='+E(/^re:/i.test(m.subject||'')?m.subject:'Re: '+(m.subject||''))+'">Reply by email</a>':''),'<button class="btn alt" data-mv-x>Close</button>'].filter(Boolean).join(' ');
 return '<div class="box" style="max-width:820px;width:100%"><h2 style="margin-top:0">'+esc(m.subject||(m.source==='whatsapp'?'WhatsApp message':'(no subject)'))+'</h2>'+row('From',from)+row('To',esc((m.to||[]).join(', ')))+row('Cc',esc((m.cc||[]).join(', ')))+row('Date',esc(fd(m.date)))+((m.flag_reasons||[]).length&&m.status!=='resolved'?row('Why',esc(m.flag_reasons.join(', ').replace(/_/g,' '))):'')
  +'<div class="row" style="margin:12px 0;gap:8px;flex-wrap:wrap">'+acts+'</div>'+(m.note?'<p class="notice">'+esc(m.note)+'</p>':'')
  +(m.html?'<div data-mv-frame></div><details style="margin-top:8px"><summary class="mut sm">Show as plain text</summary><pre style="white-space:pre-wrap;font:inherit">'+esc(clean(m.text))+'</pre></details><p class="mut sm">Remote images are blocked for privacy.</p>':'<pre style="white-space:pre-wrap;font:inherit;margin:0">'+esc(clean(m.text)||'(This email has no text.)')+'</pre>')+att+'<div class="err" role="status" data-mv-msg></div></div>'}
async function open(ref){close();const w=document.createElement('div');w.className='modal mv';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.innerHTML='<div class="box" style="max-width:820px;width:100%"><p>Opening email…</p></div>';document.body.appendChild(w);
 try{const m=await api('/mail/message?ref='+E(ref));cur={ref,m};w.innerHTML=body(m);if(m.html){const h=w.querySelector('[data-mv-frame]');h&&h.appendChild(frame(m.html))}}
 catch(e){w.innerHTML='<div class="box"><p>'+esc((e&&e.message)||'Could not open this email.')+'</p><button class="btn alt" data-mv-x>Close</button></div>'}}
window.WN_openEmail=open;
document.addEventListener('click',async ev=>{const t=ev.target;
 const o=t.closest('[data-email]');if(o&&!t.closest('input,textarea,[data-act],[data-ws-tdone],[data-cf-fdone]')){ev.preventDefault();ev.stopPropagation();open(o.dataset.email);return}
 if(t.closest('[data-mv-x]')){close();return}
 if(t.classList&&t.classList.contains('mv')&&t.classList.contains('modal')){close();return}
 if(!cur)return;const msg=document.querySelector('[data-mv-msg]');
 if(t.closest('[data-mv-done]')){try{await P('/mail/message/done?ref='+E(cur.ref));toast&&toast('Marked done');close();W.render&&W.render();if(window.WN_inboxReload)window.WN_inboxReload()}catch(e){msg&&(msg.textContent=(e&&e.message)||'Could not update')}return}
 if(t.closest('[data-mv-draft]')){try{await P('/mail/message/draft?ref='+E(cur.ref));close();location.hash='#/setup';toast&&toast('Draft reply ready to edit')}catch(e){msg&&(msg.textContent=(e&&e.message)||'Could not start a reply')}return}
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&cur)close()});
// ---- Inbox view ----
const D={items:null,all:false,busy:false};
async function load(){if(D.busy||!S.authed)return;D.busy=true;try{const r=await api('/mail/items?limit=100'+(D.all?'&all=true':''));D.items=r.items||[]}catch(e){D.items=D.items||[]}D.busy=false;if((location.hash||'').startsWith('#/inbox'))W.render()}
window.WN_inboxReload=load;
function vInbox(){if(D.items===null)load();const L=D.items||[];
 return '<div class="vh"><h1>Inbox</h1><p class="mut">Recent emails. Click one to read it in full.</p></div><div class="row seg"><button class="btn sm '+(D.all?'alt':'')+'" data-mv-f="0">Important</button><button class="btn sm '+(D.all?'':'alt')+'" data-mv-f="1">All, including newsletters</button></div><div class="card">'
  +(!S.authed?'<div class="empty">Sign in to see your inbox.</div>':D.items===null?'<div class="empty">Loading…</div>':!L.length?'<div class="empty">No emails yet.</div>':L.map(m=>'<a class="item srhit" href="#/inbox" data-email="'+esc(m.ref)+'"><div class="t">'+(m.needs_owner&&m.status!=='resolved'?'● ':'')+esc(m.subject||'(no subject)')+'</div><div class="mut sm">'+esc(m.from_name||m.from_addr||'')+(m.from_name&&m.from_addr?' &lt;'+esc(m.from_addr)+'&gt;':'')+' · '+esc(fd(m.date))+(m.draft_id?' · reply drafted':'')+(m.status==='resolved'?' · done':'')+'</div><div class="sm">'+esc(clean(m.preview).slice(0,160))+'</div></a>').join(''))+'</div>'}
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-mv-f]');if(b){D.all=b.dataset.mvF==='1';D.items=null;W.render()}});
// ---- VIP senders editor ----
const V={v:null,busy:false,msg:''};
async function vload(){if(V.busy||!S.authed)return;V.busy=true;try{V.v=await api('/vip-senders')}catch(e){V.v=V.v||{names:[],addresses:[]}}V.busy=false;if((location.hash||'').startsWith('#/inbox'))W.render()}
function vipCard(){if(!S.authed)return'';if(V.v===null){vload();return''}
 return '<div class="card"><h3>VIP senders</h3><p class="mut sm">Mail from these first names (or addresses) is always marked Important, pinned on Home and gets a draft reply.</p><label class="sm">First names, comma separated<input data-vip-n value="'+esc((V.v.names||[]).join(', '))+'"></label><label class="sm">Addresses, comma separated<input data-vip-a value="'+esc((V.v.addresses||[]).join(', '))+'"></label><div class="row"><button class="btn sm" data-vip-save>Save VIP list</button><span class="mut sm">'+esc(V.msg)+'</span></div></div>'}
document.addEventListener('click',async ev=>{if(!ev.target.closest('[data-vip-save]'))return;const sp=x=>String(x||'').split(',').map(t=>t.trim()).filter(Boolean);
 const n=sp(document.querySelector('[data-vip-n]')?.value),a=sp(document.querySelector('[data-vip-a]')?.value);
 try{V.v=await api('/vip-senders',{method:'PUT',body:JSON.stringify({names:n,addresses:a})});V.msg='Saved'}catch(e){V.msg=(e&&e.message)||'Could not save'}W.render()});
// ---- deep link #/inbox/<ref> opens the email ----
function deep(){const m=(location.hash||'').match(/^#\/inbox\/([^?&]+)/);if(m&&window.WN_openEmail&&S.authed){const r=decodeURIComponent(m[1]);history.replaceState(null,'','#/inbox');W.render&&W.render();window.WN_openEmail(r)}else if(m&&!S.authed)setTimeout(deep,800)}
window.addEventListener('hashchange',deep);setTimeout(deep,600);
W.view('inbox','Inbox',()=>vInbox()+vipCard(),'tasks');
})();
