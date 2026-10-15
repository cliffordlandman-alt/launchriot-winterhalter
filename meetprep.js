// Meeting prep: attendees_detail + description from the calendar, matched to VIPs, mail, decisions, memory and captured tasks. Matching is by email address or title keywords only; nothing is invented.
(function(){'use strict';const W=window.WN,{S,esc}=W;
const RS={accepted:['ok','Accepted'],declined:['warn','Declined'],tentative:['warn','Maybe'],needsAction:['','No reply yet'],needs_action:['','No reply yet']};
const KW=t=>(String(t).toLowerCase().match(/[a-z0-9]{4,}/g)||[]).filter(x=>!['meeting','call','with','sync','weekly','review','catch','discussion'].includes(x));
function ctx(e){const w=KW(e.title),hit=s=>w.length&&w.some(x=>String(s).toLowerCase().includes(x));
 const em=e.att.map(a=>a.email.toLowerCase()).filter(Boolean),dom=em.map(x=>x.split('@')[1]);
 const vips=(S.vips||[]).filter(v=>(v.email&&em.includes(String(v.email).toLowerCase()))||(v.domain&&dom.includes(String(v.domain).replace(/^@/,'').toLowerCase())));
 const mail=S.mail.filter(m=>(m.fe&&em.includes(m.fe))||hit(m.subj)).slice(0,5);
 const decs=(S.decisions||[]).filter(d=>d.status!='decided'&&(hit(d.title+' '+(d.context||''))||(vips.some(v=>v.name&&(d.title+' '+(d.context||'')+' '+(d.owner||'')).toLowerCase().includes(String(v.name).toLowerCase()))))).slice(0,4);
 const mem=(S.mem||[]).filter(m=>hit(m.title+' '+(m.body||'')+' '+(m.tags||[]).join(' '))).slice(0,4);
 const caps=W.loadCap().filter(c=>!c.done&&hit(c.text)).slice(0,4);return{vips,mail,decs,mem,caps}}
const list=(a,f,empty)=>a.length?'<ul>'+a.map(x=>'<li>'+f(x)+'</li>').join('')+'</ul>':`<div class="mut sm">${empty}</div>`;
function prep(e){const c=ctx(e);const org=e.org?`<div class="mut sm">Organiser: ${esc(e.org)}</div>`:'';
 return `<div class="prep"><div class="t">${esc(W.tm(e.at))}${e.end?'–'+esc(W.tm(e.end)):''} · ${esc(e.title)}</div><div class="mut sm">${esc(W.dl(e.at))} (Dubai time)${e.loc?' · '+esc(e.loc):''}</div>${org}${e.url?`<a class="sm" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">Join link ↗</a>`:''}
 <h3 style="margin-top:10px">Attendees (${e.att.length})</h3>${list(e.att,a=>{const r=RS[a.resp]||['',a.resp||'No reply yet'];const v=c.vips.some(v=>(v.email&&String(v.email).toLowerCase()==a.email.toLowerCase())||(v.domain&&a.email.toLowerCase().endsWith('@'+String(v.domain).replace(/^@/,'').toLowerCase())));return esc(a.name||a.email)+(a.name&&a.email?' <span class="mut sm">'+esc(a.email)+'</span>':'')+` <span class="pill ${r[0]}">${esc(r[1])}</span>`+(v?'<span class="pill ok">VIP</span>':'')},'The calendar has no attendee list for this event.')}
 <h3 style="margin-top:10px">Agenda / description</h3>${e.desc?`<div class="why" style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(e.desc.length>800?e.desc.slice(0,800)+'…':e.desc)}</div>`:'<div class="mut sm">No description on the event.</div>'}
 <h3 style="margin-top:10px">VIPs in this meeting</h3>${list(c.vips,v=>esc(v.name)+(v.org?' · '+esc(v.org):'')+(v.note?` <span class="mut sm">${esc(v.note)}</span>`:''),'None of the attendees are in your VIP list.')}
 <h3 style="margin-top:10px">Related email</h3>${list(c.mail,m=>esc(m.subj)+' <span class="mut sm">· '+esc(m.from)+'</span>','No matching mail (matched by attendee address or title words).')}
 <h3 style="margin-top:10px">Open decisions</h3>${list(c.decs,d=>esc(d.title)+(d.owner?' <span class="mut sm">· '+esc(d.owner)+'</span>':''),'None matched.')}
 <h3 style="margin-top:10px">Memory &amp; notes</h3>${list(c.mem.map(m=>({t:m.title})).concat(c.caps.map(x=>({t:x.text}))),x=>esc(x.t),'None matched.')}
 <p class="mut sm">Matched by email address and title words only, so it can miss things.</p></div>`}
function view(){const L=W.meetWeek();return `<h1>Meeting prep</h1><p class="sub">For each meeting in the next 7 days: who is coming, the agenda, and what you already have on it.</p>${W.gate()}
 ${L.length?L.map(e=>`<div class="card">${prep(e)}</div>`).join(''):`<div class="card"><div class="empty">${S.authed?'No meetings in the next 7 days.':'Sign in to see meeting prep.'}</div></div>`}`}
W.prep=prep;W.view('prep','Meeting prep',view,'arthur');
})();
