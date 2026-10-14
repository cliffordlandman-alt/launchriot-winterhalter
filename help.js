// "Ask Riot" floating helper: page tips, quick actions, scripted FAQ, support via WhatsApp/email.
(function(){
// Support webhook (optional). Leave empty to use WhatsApp / email only.
var SUPPORT_WEBHOOK_URL='';   // e.g. https://.../support
var SUPPORT_WEBHOOK_KEY='';   // sent as X-Webhook-Key
var WA='971586444285',MAIL='hello@launchriot.online';
var TIPS={dashboard:'Your morning brief fills in as you add jobs, deals, meetings and stock. Tap "Set" to enter this month\'s sales target.',
inbox:'Add an email with "+ Add" to track it. Once your LaunchRiot setup connects Gmail, Outlook or Zoho Mail, emails arrive here with AI summaries.',
whatsapp:'Log a WhatsApp message with "+ Add". When WhatsApp Business is connected, chats and suggested replies show up here.',
calendar:'Add meetings with "+ Add". Google and Outlook calendars appear here once your setup connects them.',
sales:'Add deals with "+ Add" and move them through the stages. "Sync from Zoho CRM" works once Zoho CRM is linked.',
customers:'Add hotels, restaurants and dealers with "+ Add". Zoho CRM customers sync in once connected.',
service:'Add a service job, assign a technician and update its status as the day goes.',
parts:'Add parts with a minimum level. Anything below minimum shows as Low stock and in your morning brief.',
contracts:'Add contracts with a renewal date. Due in 30 days shows "Due soon"; past dates show "Overdue".',
market:'Save tenders, competitor moves and trends here. The Research bot will add daily items once live.',
tasks:'Type a task and tap Add. Tick it off when done.',
ai:'Ask any bot a question. Answers use the data you\'ve entered, and every action waits for your approval.',
connections:'Connections go live once your LaunchRiot setup links your accounts. Nothing is imported until then.',
outbox:'Anything approved in the workspace is logged here.'};
var FAQ=[[/add|customer|deal|job|part|enter/,'Open the page (e.g. Customers & dealers), tap "+ Add", fill in the fields and tap Save. It\'s saved in this browser.'],
[/sync|zoho|connect|gmail|outlook|whatsapp/,'Sync pulls data from Zoho, email, calendar or WhatsApp. These aren\'t connected yet. Your LaunchRiot setup will connect them, then Sync imports automatically.'],
[/save|where|device|browser|lost|data/,'For now, everything you enter is saved in this browser on this device. After setup, your data lives in your connected systems.'],
[/clear|delete|reset/,'"Clear all data" at the top wipes everything saved in this browser. It asks you to confirm first.'],
[/target|sales/,'On the Dashboard, tap "Set" next to the target to enter this month\'s target and sales so far.'],
[/brief|morning/,'The morning brief summarises jobs, meetings, sales, approvals, low stock and renewals. It appears once you add data.'],
[/bot|ai|approve/,'The AI staff draft and suggest. Nothing is sent without your approval.'],
[/price|cost|plan/,'For plans and pricing, tap "Talk to LaunchRiot support".']];
var css=document.createElement('style');css.textContent=`
#riot{position:fixed;right:16px;bottom:16px;z-index:50;font-family:inherit}
#riot .rb{display:flex;align-items:center;gap:8px;background:#101216;color:#83e7bb;border:1.5px solid #83e7bb;border-radius:999px;padding:8px 14px 8px 10px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25)}
#riot .rb i{width:10px;height:10px;border-radius:50%;background:#83e7bb;box-shadow:0 0 0 0 rgba(131,231,187,.7);animation:rp 2.2s infinite}
@keyframes rp{0%{box-shadow:0 0 0 0 rgba(131,231,187,.7)}70%{box-shadow:0 0 0 10px rgba(131,231,187,0)}100%{box-shadow:0 0 0 0 rgba(131,231,187,0)}}
#riot .rp{display:none;position:absolute;right:0;bottom:48px;width:310px;max-width:calc(100vw - 32px);max-height:min(70vh,520px);overflow:auto;background:#101216;color:#e9ece9;border-radius:16px;border:1px solid #2a2f36;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:14px}
#riot.open .rp{display:block}
#riot .rh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}#riot .rh b{color:#83e7bb}
#riot .x{background:none;border:0;color:#9aa;font-size:20px;cursor:pointer;line-height:1}
#riot .tip{background:#1a1e23;border-left:3px solid #83e7bb;border-radius:8px;padding:9px 10px;font-size:13px;line-height:1.45}
#riot .qa{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
#riot .qa button{background:#1a1e23;color:#e9ece9;border:1px solid #2f353c;border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer}
#riot .qa button.sup{background:#83e7bb;color:#101713;border-color:#83e7bb;font-weight:700}
#riot .log{font-size:13px}#riot .log div{margin:6px 0;padding:7px 10px;border-radius:10px;max-width:88%}
#riot .log .u{background:#2a2f36;margin-left:auto}#riot .log .a{background:#1a1e23;border:1px solid #2f353c}
#riot form{display:flex;gap:6px;margin-top:8px}#riot input{flex:1;min-width:0;background:#1a1e23;border:1px solid #2f353c;color:#fff;border-radius:8px;padding:8px;font:inherit;font-size:13px}
#riot form button{background:#83e7bb;color:#101713;border:0;border-radius:8px;padding:0 12px;font-weight:800;cursor:pointer}
#riot .sp{display:none;gap:6px;margin-top:6px}#riot .sp.on{display:flex}#riot .sp a{flex:1;text-align:center;background:#83e7bb;color:#101713;border-radius:8px;padding:8px;font-weight:700;font-size:12px;text-decoration:none}#riot .sp a.m{background:#2a2f36;color:#fff}
#riot.min .rb span{display:none}#riot.min .rb{padding:10px}
.content{padding-bottom:80px}
@media(max-width:760px){#riot{right:12px;bottom:12px}#riot .rp{width:calc(100vw - 24px);bottom:46px}}`;
document.head.appendChild(css);
var el=document.createElement('div');el.id='riot';
el.innerHTML='<div class="rp" role="dialog" aria-label="Ask Riot help"><div class="rh"><b>⚡ Ask Riot</b><button class="x" aria-label="Close help">×</button></div><div class="tip" id="rtip"></div><div class="qa"><button data-q="How do I add a customer?">How do I add a customer?</button><button data-q="What does Sync do?">What does Sync do?</button><button class="sup" data-s="1">Talk to LaunchRiot support</button></div><div class="sp" id="rsp"><a id="rwa" target="_blank" rel="noopener">WhatsApp</a><a class="m" id="rml">Email</a><a id="rwh" href="#" style="display:none">Send here</a></div><div class="log" id="rlog"></div><form id="rf"><input id="rin" placeholder="Ask about the workspace…" autocomplete="off"><button aria-label="Ask">→</button></form></div><button class="rb" aria-expanded="false" aria-label="Open Ask Riot help"><i></i><span>Ask Riot</span></button>';
document.body.appendChild(el);
var page=function(){return (location.hash.split('/')[2]||'dashboard')};
var $=function(i){return document.getElementById(i)};
function tip(){$('rtip').textContent='💡 '+(TIPS[page()]||TIPS.dashboard)}
function sup(){var txt='Winterhalter workspace help: '+(($('rin').value||'').trim()||'(page: '+page()+') ');$('rwa').href='https://wa.me/'+WA+'?text='+encodeURIComponent(txt);$('rml').href='mailto:'+MAIL+'?subject='+encodeURIComponent('Winterhalter workspace help')+'&body='+encodeURIComponent(txt);$('rsp').classList.add('on');if(SUPPORT_WEBHOOK_URL){var w=$('rwh');w.style.display='';w.onclick=function(e){e.preventDefault();var m=($('rin').value||'').trim();if(!m){say('a','Type your question in the box below, then tap Send here.');return}fetch(SUPPORT_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json','X-Webhook-Key':SUPPORT_WEBHOOK_KEY},body:JSON.stringify({message:'Winterhalter workspace help: '+m,page:page(),at:new Date().toISOString()})}).then(function(r){if(!r.ok)throw 0;$('rin').value='';say('a','Sent. The LaunchRiot team will get back to you.')}).catch(function(){say('a','Could not send. Please use WhatsApp or Email.')})}}}
function say(c,t){var d=document.createElement('div');d.className=c;d.textContent=t;$('rlog').appendChild(d);d.scrollIntoView({block:'nearest'})}
function ask(q){say('u',q);var a=null;var l=q.toLowerCase();if(/support|human|talk|help me|call/.test(l)){sup();a='Tap WhatsApp or Email below to reach the LaunchRiot team.'}else{for(var i=0;i<FAQ.length;i++)if(FAQ[i][0].test(l)){a=FAQ[i][1];break}}
if(!a){a='I\'m not sure about that one yet. Tap "Talk to LaunchRiot support" and the team will help.';sup()}
var d=document.createElement('div');d.className='a';d.textContent='…';$('rlog').appendChild(d);setTimeout(function(){d.textContent=a;d.scrollIntoView({block:'nearest'})},450)}
el.querySelector('.rb').onclick=function(){var o=el.classList.toggle('open');this.setAttribute('aria-expanded',o);el.classList.remove('min');if(o)tip()};
el.querySelector('.x').onclick=function(){el.classList.remove('open');el.classList.add('min');sessionStorage.setItem('riotmin','1')};
el.querySelectorAll('.qa button').forEach(function(b){b.onclick=function(){if(b.dataset.s){sup();say('a','Tap WhatsApp or Email below to reach the LaunchRiot team.')}else ask(b.dataset.q)}});
$('rf').onsubmit=function(e){e.preventDefault();var v=$('rin').value.trim();if(v){ask(v);$('rin').value=''}};
addEventListener('hashchange',tip);if(sessionStorage.getItem('riotmin'))el.classList.add('min');tip();
})();
