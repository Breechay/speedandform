/* Progressive enhancement only. Reading and native disclosures work without JavaScript. */
(function(){
 'use strict';
 function revealHash(){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
  const target=document.getElementById(id);if(!target)return;
  let n=target;while(n){if(n.tagName==='DETAILS')n.open=true;n=n.parentElement;}
  if(id==='sources')target.querySelector('details').open=true;
  requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'auto'}));
 }
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.hash===location.hash)revealHash();});
 window.addEventListener('hashchange',revealHash);revealHash();
 // Preserve the old public disclosure helper for existing in-page references.
 window.openEntry=id=>{const t=document.getElementById(id);if(t){if(t.tagName==='DETAILS')t.open=true;location.hash=id;}};
 const field=document.getElementById('metro-bpm');if(!field)return;
 const start=document.getElementById('metro-start'),stop=document.getElementById('metro-stop'),status=document.getElementById('metro-status'),panel=document.getElementById('cadence-practice');
 let audio=null,timer=null,limit=null,session=0,next=0;const nodes=new Set();
 function end(message='Stopped.'){
  session++;clearInterval(timer);clearTimeout(limit);timer=null;limit=null;
  for(const node of nodes){try{node.stop();node.disconnect();}catch{}}
  nodes.clear();start.disabled=false;stop.disabled=true;field.removeAttribute('aria-invalid');status.textContent=message;
 }
 function beat(at){
  const osc=audio.createOscillator(),gain=audio.createGain();nodes.add(osc);
  osc.type='sine';osc.frequency.value=1000;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.06,at+.002);gain.gain.exponentialRampToValueAtTime(.0001,at+.035);
  osc.connect(gain);gain.connect(audio.destination);osc.onended=()=>{nodes.delete(osc);osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+.04);
 }
 async function begin(){
  end('');const bpm=Number(field.value);
  if(!field.value.trim()||!Number.isInteger(bpm)||bpm<100||bpm>220){field.setAttribute('aria-invalid','true');status.textContent='Enter a whole number from 100 to 220.';field.focus();return;}
  const current=session;start.disabled=true;stop.disabled=false;status.textContent='Starting…';
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('unavailable');
   if(!audio)audio=new Audio();if(audio.state==='suspended')await audio.resume();
   if(current!==session)return;if(audio.state!=='running')throw Error('unavailable');
   next=audio.currentTime+.04;
   const schedule=()=>{if(current!==session)return;while(next<audio.currentTime+.1){beat(next);next+=60/bpm;}};
   schedule();timer=setInterval(schedule,25);limit=setTimeout(()=>end('Practice complete.'),60000);
   status.textContent=`Playing at ${bpm} steps per minute.`;
  }catch{if(current===session)end('Audio could not start. Try again in a browser with sound enabled.');}
 }
 start.addEventListener('click',begin);stop.addEventListener('click',()=>end());field.addEventListener('input',()=>end('Ready. Press Start to practice.'));
 panel.addEventListener('toggle',()=>{if(!panel.open)end();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)end();});window.addEventListener('pagehide',()=>end());
 window.startMetronome=begin;window.stopMetronome=()=>end();window.selectBPM=bpm=>{field.value=String(bpm);end('Ready. Press Start to practice.');};
})();
