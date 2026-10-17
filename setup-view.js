// Landing view: setup steps + assistant area (setup-embed.js) inside the workspace; global lock screen.
(function(){'use strict';const W=window.WN,C=window.WN_CFG||{},esc=W.esc;
const tok=()=>{try{return localStorage.getItem('wn-tok')||''}catch(e){return ''}};
W.view('setup','Assistant',()=>W.needAuth()||'<div id="setup-root"></div>','home');
window.WN_AFTER=function(id){if(id!=='setup'){window.LR_SETUP&&LR_SETUP.unmount();return}
 const r=document.getElementById('setup-root');if(r&&W.S.authed&&tok())LR_SETUP.mount(r,C.apiBase,tok())};
// same lock screen for every screen when access has ended (403 locked)
window.WN_LOCK=function(){if(document.getElementById('lr-lock'))return;const d=document.createElement('div');d.id='lr-lock';
 d.style.cssText='position:fixed;inset:0;z-index:200;background:#101216;display:grid;place-items:center;padding:24px;text-align:center';
 d.innerHTML='<div style="max-width:420px"><h1 style="color:#82e6ba;font-size:28px;margin:0 0 8px">Contact LaunchRiot to continue</h1><p style="color:#98a3a0">Your access has ended. Your information is safe and kept.</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px"><a class="btn" style="text-decoration:none" href="https://wa.me/971586444285">Book a demo on WhatsApp</a><a class="btn alt" style="text-decoration:none" href="mailto:hello@launchriot.online">hello@launchriot.online</a></div></div>';document.body.appendChild(d)};
})();
