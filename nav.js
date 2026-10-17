// Grouped navigation: short top bar on desktop, bottom bar + "More" sheet on mobile.
(function(){'use strict';const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PRIMARY=['home','tasks','calendar','contacts','followups','documents','projects','search'];
const MOBILE=['home','tasks','calendar','contacts'];
const GROUPS=[['Today',['home','overview','brief','focus','capture','activity']],['Work',['tasks','calendar','notes','projects','decisions','prep']],['People',['contacts','followups','vips','staff']],['Files and search',['documents','search','memory']],['Assistant',['arthur','connections']]];
let bar,pan;
function ensure(){if(bar)return;bar=document.createElement('div');bar.id='bbar';bar.setAttribute('role','navigation');bar.setAttribute('aria-label','Quick navigation');document.body.appendChild(bar);
 pan=document.createElement('div');pan.id='morep';pan.hidden=true;document.body.appendChild(pan);
 document.addEventListener('click',e=>{const m=e.target.closest('[data-nav-more]');if(m){pan.hidden=!pan.hidden;return}if(!pan.hidden&&(e.target.closest('#morep a')||!e.target.closest('#morep')))pan.hidden=true});
 document.addEventListener('keydown',e=>{if(e.key=='Escape')pan.hidden=true});addEventListener('hashchange',()=>{pan.hidden=true})}
window.WN_NAVR=function(NAV,cur){ensure();const V=(window.WN_CFG||{}).views;if(V)NAV=NAV.filter(n=>V.includes(n[0]));const by={};NAV.forEach(n=>by[n[0]]=n);
 const link=(id,cls)=>by[id]?`<a href="#/${id}" class="${cls||''} ${id==cur?'on':''}" ${id==cur?'aria-current="page"':''}>${esc(by[id][1])}</a>`:'';
 const inMore=!PRIMARY.includes(cur);
 bar.innerHTML=MOBILE.map(id=>link(id,'bb')).join('')+`<button class="bb ${!MOBILE.includes(cur)?'on':''}" data-nav-more aria-haspopup="true">More</button>`;
 const used=new Set();let h='';GROUPS.forEach(([t,ids])=>{const L=ids.filter(i=>by[i]);L.forEach(i=>used.add(i));if(L.length)h+=`<div class="mg"><h4>${esc(t)}</h4>${L.map(i=>link(i)).join('')}</div>`});
 const rest=NAV.filter(n=>!used.has(n[0]));if(rest.length)h+=`<div class="mg"><h4>Other</h4>${rest.map(n=>link(n[0])).join('')}</div>`;
 pan.innerHTML=h;
 return PRIMARY.map(id=>link(id)).join('')+`<button class="morebtn ${inMore?'on':''}" data-nav-more aria-haspopup="true">More ▾</button>`}
})();
