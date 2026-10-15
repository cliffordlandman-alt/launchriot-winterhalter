// LaunchRiot Executive: DEMO MODE. Everything here is FICTIONAL sample data served from memory.
// In demo mode window.fetch is replaced for the API host, so NO request ever reaches the API. Nothing is stored remotely or sent.
(function(){'use strict';
const API_HOST='api-gareth.145-241-118-107.sslip.io',KEY='wn-mode',REAL='wn-real';
const q=new URLSearchParams(location.search);
if(q.get('demo')==='1'){try{sessionStorage.setItem(KEY,'demo')}catch(e){}}
const isDemo=()=>{try{return sessionStorage.getItem(KEY)==='demo'}catch(e){return false}};
const DAY=864e5,H=36e5;
function seed(){
 const now=Date.now();
 const dk=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai'}).format(new Date());
 const mid=Date.parse(dk+'T00:00:00+04:00');
 const at=(d,h,m)=>new Date(mid+d*DAY+(h+(m||0)/60)*H).toISOString();
 const ago=h=>new Date(now-h*H).toISOString();
 const D={};
 D.vips=[
  {id:'v1',name:'Harriet Lowe',email:'harriet.lowe@meridian-sample.example',domain:null,org:'Meridian Test Co',kind:'client',note:'Largest sample client. Prefers a short call before any written proposal.'},
  {id:'v2',name:'Orion Parts (all contacts)',email:null,domain:'orion-sample.example',org:'Orion Parts Ltd',kind:'supplier',note:'Sample supplier. Contract renewal discussion due this month.'},
  {id:'v3',name:'Dana Reyes',email:'dana.reyes@northwind-demo.example',domain:null,org:'Northwind Demo Group',kind:'colleague',note:'Sample finance director. Weekly one-to-one on Thursdays.'}];
 D.vnotes={v1:[{id:'n1',text:'Agreed a 10% volume discount in principle (sample note).',created_at:ago(70)}],v2:[],v3:[]};
 D.mail=[
  {id:'m1',from:'harriet.lowe@meridian-sample.example',from_name:'Harriet Lowe',subject:'Renewal terms: need your answer by Friday',body_summary:'Sample: Meridian asks for confirmation of the renewal terms and delivery schedule.',priority:'high',importance:82,importance_reasons:['sender is a VIP','asks a direct question'],unread:true,flagged:true,replied:false,received_at:ago(2)},
  {id:'m2',from:'procurement@orion-sample.example',from_name:'Orion Parts Procurement',subject:'Updated price list for Q4',body_summary:'Sample: Orion sends revised prices and asks for sign-off.',priority:'high',importance:64,importance_reasons:['sender domain is a VIP'],unread:true,flagged:true,replied:false,received_at:ago(5)},
  {id:'m3',from:'dana.reyes@northwind-demo.example',from_name:'Dana Reyes',subject:'Budget variance: two items for your decision',body_summary:'Sample: Finance flags two overspends that need a ruling before month end.',priority:'high',importance:71,importance_reasons:['sender is a VIP'],unread:false,flagged:true,replied:false,received_at:ago(9)},
  {id:'m4',from:'priya.shah@northwind-demo.example',from_name:'Priya Shah',subject:'Warehouse rota change: approval needed',body_summary:'Sample: Operations requests approval for a rota change from next Monday.',priority:'normal',importance:48,importance_reasons:['staff request'],unread:true,flagged:true,replied:false,received_at:ago(12)},
  {id:'m5',from:'events@industry-sample.example',from_name:'Industry Forum',subject:'Speaker slot confirmation',body_summary:'Sample: Organisers ask whether you will speak on 12 November.',priority:'normal',importance:30,importance_reasons:[],unread:true,flagged:false,replied:false,received_at:ago(26)},
  {id:'m6',from:'lena.fischer@northwind-demo.example',from_name:'Lena Fischer',subject:'FYI: pipeline summary for the week',body_summary:'Sample: Sales summary, no action needed.',priority:'normal',importance:18,importance_reasons:[],unread:false,flagged:false,is_cc:true,replied:false,received_at:ago(30)},
  {id:'m7',from:'newsletter@trade-sample.example',from_name:'Trade Weekly',subject:'This week in logistics',body_summary:'Sample newsletter.',priority:'normal',importance:2,unread:false,flagged:false,replied:false,received_at:ago(40)}].map(m=>Object.assign({source:'demo',thread_id:''},m));
 D.cal=[
  {id:'e1',title:'Leadership stand-up',starts_at:at(0,9),ends_at:at(0,9,30),location:'Boardroom',description:'Weekly stand-up.\nAgenda: sales, operations, finance.',organizer:'Alex Morgan',attendees_detail:[{name:'Dana Reyes',email:'dana.reyes@northwind-demo.example',response:'accepted'},{name:'Priya Shah',email:'priya.shah@northwind-demo.example',response:'accepted'}]},
  {id:'e2',title:'Meridian renewal call',starts_at:at(0,14),ends_at:at(0,15),location:'Video call',description:'Agenda: renewal terms, delivery schedule, volume discount.',organizer:'Alex Morgan',attendees_detail:[{name:'Harriet Lowe',email:'harriet.lowe@meridian-sample.example',response:'accepted'}]},
  {id:'e3',title:'Budget review with finance',starts_at:at(0,16),ends_at:at(0,17),location:'Room 2',description:'Agenda: variance items, Q4 forecast.',organizer:'Dana Reyes',attendees_detail:[{name:'Dana Reyes',email:'dana.reyes@northwind-demo.example',response:'accepted'}]},
  {id:'e4',title:'Orion Parts contract renewal',starts_at:at(1,11),ends_at:at(1,12),location:'Video call',description:'Agenda: Q4 price list, contract term.',organizer:'Alex Morgan',attendees_detail:[{name:'Orion Parts Procurement',email:'procurement@orion-sample.example',response:'tentative'}]},
  {id:'e5',title:'Operations review',starts_at:at(2,10),ends_at:at(2,11,30),location:'Boardroom',description:'Agenda: rota change, warehouse KPIs.',organizer:'Priya Shah',attendees_detail:[{name:'Priya Shah',email:'priya.shah@northwind-demo.example',response:'accepted'}]},
  {id:'e6',title:'Industry Forum prep',starts_at:at(4,15),ends_at:at(4,16),location:'Office',description:'Prepare talking points.',organizer:'Alex Morgan',attendees_detail:[]}];
 D.tasks=[
  {id:'t1',title:'Rota change for warehouse team',owner:'Priya Shah',due:at(0,18),priority:'high',status:'awaiting_approval',follow_up_at:null,note:'Sample: needs your approval before Monday.',manual:true},
  {id:'t2',title:'Approve overtime budget for December',owner:'Dana Reyes',due:at(1,12),priority:'normal',status:'awaiting_approval',follow_up_at:null,note:'',manual:true},
  {id:'t3',title:'Supplier audit report',owner:'Tom Okafor',due:at(-2,12),priority:'high',status:'open',follow_up_at:at(0,12),note:'Sample: overdue, chase today.',manual:true},
  {id:'t4',title:'Customer onboarding checklist',owner:'Lena Fischer',due:at(3,12),priority:'normal',status:'open',follow_up_at:null,note:'',manual:true},
  {id:'t5',title:'Fleet maintenance schedule',owner:'Tom Okafor',due:at(5,12),priority:'low',status:'blocked',follow_up_at:at(1,9),note:'Sample: waiting on supplier quote.',manual:true},
  {id:'t6',title:'Q3 sales summary',owner:'Lena Fischer',due:at(-5,12),priority:'normal',status:'done',follow_up_at:null,note:'',manual:true},
  {id:'t7',title:'Update safety signage',owner:'Priya Shah',due:at(-1,12),priority:'normal',status:'open',follow_up_at:null,note:'',manual:true}];
 D.drafts=[
  {id:'d1',subject:'Reply to Harriet Lowe: renewal terms',body:'Sample draft: Thank you Harriet, we are happy to confirm the renewal on the terms discussed...',status:'pending',type:'reply'},
  {id:'d2',subject:'Reply to Orion Parts: Q4 price list',body:'Sample draft: Thanks for the update. We would like to review two line items before signing off...',status:'pending',type:'reply'}];
 D.decisions=[
  {id:'x1',title:'Approve Meridian renewal terms',context:'Sample: three-year term with a 10% volume discount.',owner:'Alex Morgan',due:at(2,12),status:'open',outcome:'',created_at:ago(50)},
  {id:'x2',title:'Choose supplier for packaging',context:'Sample: Orion Parts versus a second quote.',owner:'Dana Reyes',due:at(-1,12),status:'open',outcome:'',created_at:ago(120)},
  {id:'x3',title:'Hire a second operations coordinator?',context:'Sample: workload review says yes.',owner:'Priya Shah',due:at(7,12),status:'open',outcome:'',created_at:ago(30)},
  {id:'x4',title:'Move stand-up to 09:00',context:'',owner:'Alex Morgan',due:null,status:'decided',outcome:'Agreed. Starts next week.',decided_at:ago(100),created_at:ago(200)}];
 D.mem=[
  {id:'k1',kind:'style',title:'How I like to be addressed in writing',body:'Short, direct, first names. Lead with the decision needed.',tags:['writing'],created_at:ago(300),updated_at:ago(300)},
  {id:'k2',kind:'relationship',title:'Harriet Lowe at Meridian',body:'Sample: values a call before paperwork. Decision-maker for renewals.',tags:['client'],created_at:ago(280),updated_at:ago(100)},
  {id:'k3',kind:'standing_instruction',title:'Never commit to delivery dates on email',body:'Sample: always confirm with Operations first.',tags:['policy'],created_at:ago(260),updated_at:ago(260)},
  {id:'k4',kind:'decision_ref',title:'Why we moved to monthly supplier reviews',body:'Sample: after two late deliveries last spring.',tags:['suppliers'],created_at:ago(240),updated_at:ago(240)}];
 D.cap=[
  {id:'c1',type:'task',text:'Call Harriet before sending the written renewal',due:dk,done:false,created_at:ago(3)},
  {id:'c2',type:'idea',text:'Quarterly client roundtable (sample idea)',due:null,done:false,created_at:ago(60)},
  {id:'c3',type:'note',text:'Ask Dana for a one-page variance summary',due:null,done:false,created_at:ago(20)}];
 return D}
let D=null,n=100;const uid=p=>p+(++n);
const J=(b,s)=>new Response(JSON.stringify(b),{status:s||200,headers:{'Content-Type':'application/json'}});
const arr=x=>({items:x});
function vipFor(email){email=(email||'').toLowerCase();return D.vips.some(v=>(v.email&&v.email.toLowerCase()==email)||(v.domain&&email.endsWith('@'+v.domain.toLowerCase())))}
function summary(){const o={};D.tasks.forEach(t=>{const k=t.owner||'Unassigned';const r=o[k]=o[k]||{owner:k,opened:0,closed:0,overdue:0,open_now:0};r.opened++;if(t.status=='done')r.closed++;else{r.open_now++;if(t.due&&Date.parse(t.due)<Date.now())r.overdue++}});return Object.values(o)}
function route(path,method,body){
 const u=new URL('https://x'+path),p=u.pathname,sp=u.searchParams,seg=p.split('/').filter(Boolean);
 const crud=(list,pre,extra)=>{const id=seg[1];
  if(method=='GET'&&!id)return J(arr(list()));
  if(method=='POST'&&!id){const o=Object.assign({id:uid(pre),created_at:new Date().toISOString(),updated_at:new Date().toISOString()},body,extra||{});list().push(o);return J(o,201)}
  const i=list().findIndex(x=>String(x.id)==id);if(i<0)return J({error:'not found'},404);
  if(method=='PUT'){Object.assign(list()[i],body,{updated_at:new Date().toISOString()});if(body.status=='decided')list()[i].decided_at=new Date().toISOString();return J(list()[i])}
  if(method=='DELETE'){list().splice(i,1);return J({ok:true})}return J({error:'bad'},400)};
 if(p=='/auth/me')return J({user:{email:'demo@example.com'}});
 if(p=='/auth/logout')return J({ok:true});
 if(p=='/auth/login')return J({error:'demo'},400);
 if(p=='/status')return J({connections:[{provider:'google',state:'connected',last_sync:new Date(Date.now()-6*6e4).toISOString()}]});
 if(p=='/inbox')return J(arr(D.mail.map(m=>Object.assign({},m,{vip:vipFor(m.from)}))));
 if(p=='/calendar')return J(arr(D.cal));
 if(p=='/drafts')return J(arr(D.drafts));
 if(p=='/staff-tasks/summary')return J(arr(summary()));
 if(seg[0]=='staff-tasks'){if(method=='GET'&&!seg[1]&&sp.get('status')=='open')return J(arr(D.tasks.filter(t=>t.status=='open').map(t=>({id:t.id,subject:t.title,assigned_staff:[{name:t.owner}],received_at:t.due,source:'demo'}))));return crud(()=>D.tasks,'t')}
 if(seg[0]=='decisions')return crud(()=>D.decisions,'x',method=='POST'?{status:'open'}:null);
 if(seg[0]=='capture')return crud(()=>D.cap,'c');
 if(p=='/memory/search'){const s=(sp.get('q')||'').toLowerCase();return J(arr(D.mem.filter(m=>(m.title+' '+m.body+' '+(m.tags||[]).join(' ')).toLowerCase().includes(s))))}
 if(seg[0]=='memory'){if(method=='DELETE'&&!seg[1]){D.mem=[];return J({ok:true})}return crud(()=>D.mem,'k')}
 if(seg[0]=='vips'){
  if(seg[1]&&seg[2]=='history'){const v=D.vips.find(x=>x.id==seg[1]);if(!v)return J({error:'nf'},404);
   const th=D.mail.filter(m=>(v.email&&m.from==v.email)||(v.domain&&m.from.endsWith('@'+v.domain))).map(m=>({subject:m.subject,from_name:m.from_name,received_at:m.received_at,source:'demo'}));
   return J({vip:v,threads:th,open_commitments:{decisions:D.decisions.filter(d=>d.status!='decided'&&((v.org&&(d.title+d.context).includes(v.name.split(' ')[0]))||(v.org&&d.context.includes(v.org.split(' ')[0])))),captured_tasks:D.cap.filter(c=>!c.done&&c.type=='task'&&c.text.includes(v.name.split(' ')[0]))},notes:D.vnotes[v.id]||[]})}
  if(seg[1]&&seg[2]=='notes'){const L=D.vnotes[seg[1]]=D.vnotes[seg[1]]||[];if(method=='POST'){const o={id:uid('n'),text:body.text,created_at:new Date().toISOString()};L.push(o);return J(o,201)}if(method=='DELETE'){const i=L.findIndex(x=>x.id==seg[3]);if(i>=0)L.splice(i,1);return J({ok:true})}return J(arr(L))}
  if(method=='DELETE'&&seg[1])delete D.vnotes[seg[1]];
  return crud(()=>D.vips,'v')}
 if(p=='/export')return J({demo:true,note:'Fictional sample data. Nothing real.',decisions:D.decisions,vips:D.vips,memory:D.mem,capture:D.cap,staff_tasks:D.tasks});
 return J({error:'not available in demo'},404)}
function install(){
 D=seed();const real=window.fetch.bind(window);
 window.fetch=function(url,o){const s=String(url&&url.url||url);
  if(s.indexOf(API_HOST)>-1){let b=null;try{b=o&&o.body?JSON.parse(o.body):null}catch(e){}
   const path=s.slice(s.indexOf(API_HOST)+API_HOST.length);return Promise.resolve(route(path,((o&&o.method)||'GET').toUpperCase(),b||{}))}
  return real(url,o)};
 window.WN_DEMO=true;window.WN_NAME='Alex';
 document.title='LaunchRiot Executive · Demo (sample data)';
 const bn=document.createElement('div');bn.id='demobar';bn.setAttribute('role','status');
 bn.innerHTML='<b>DEMO DATA</b><span>Fictional sample data. Nothing is saved to a server or sent to anyone.</span><button type="button" id="demoexit">Exit demo</button>';
 document.body.prepend(bn);document.body.classList.add('is-demo');
 const img=document.querySelector('.brand img');if(img){img.src='launchriot-logo.png';img.alt='LaunchRiot'}
 const tg=document.querySelector('.tagp');if(tg)tg.textContent='Executive · demo';
 const f=document.querySelector('.foot span');if(f)f.textContent='Demo with fictional sample data. Nothing is sent from this workspace.';
 document.addEventListener('click',e=>{if(e.target.closest('#demoexit')||e.target.closest('[data-act=logout]')){e.stopImmediatePropagation();e.preventDefault();exitDemo()}},true)}
function exitDemo(){try{sessionStorage.removeItem(KEY);localStorage.removeItem(REAL)}catch(e){}location.href=location.pathname}
function landing(){return new Promise(res=>{
 const d=document.createElement('div');d.id='landing';
 d.innerHTML='<div class="lbox" role="dialog" aria-label="Welcome"><img src="launchriot-logo.png" alt="LaunchRiot" class="llogo"><h1>Executive Command Centre</h1><p>See what needs your attention, who needs a response, what your team is working on and what you can delegate.</p><button class="btn" id="ltry">Try demo, no login</button><p class="mut sm">Fictional sample data. Nothing is saved or sent.</p><button class="btn alt" id="lreal">Sign in to my workspace</button></div>';
 document.body.appendChild(d);
 d.querySelector('#ltry').onclick=()=>{try{sessionStorage.setItem(KEY,'demo')}catch(e){}d.remove();install();res()};
 d.querySelector('#lreal').onclick=()=>{try{localStorage.setItem(REAL,'1')}catch(e){}d.remove();res()}})}
window.WN_READY=new Promise(res=>{
 const go=()=>{let real=false;try{real=localStorage.getItem(REAL)==='1'}catch(e){}
  if(isDemo()){install();res()}else res()};
 if(document.readyState=='loading')addEventListener('DOMContentLoaded',go);else go()});
window.WN_TRYDEMO=()=>{try{sessionStorage.setItem(KEY,'demo')}catch(e){}location.href=location.pathname+'?demo=1'};
})();
