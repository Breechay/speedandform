(function(){
'use strict';
function duration(s){if(typeof s!=='string'||!/^\d+:\d{2}(?::\d{2})?$/.test(s.trim()))return null;const p=s.trim().split(':').map(Number);if(p.at(-1)>59||(p.length===3&&p[1]>59))return null;const n=p.reduce((a,v)=>a*60+v,0);return Number.isSafeInteger(n)?n:null;}
function budget(pace,stations,rox,penalties){const v=[pace,stations,rox,penalties].map(duration);if(v.some(x=>x===null)||v[0]<=0||v[1]<=0)return null;const run=8*v[0],total=run+v[1]+v[2]+v[3];return {run,total,margin:3600-total};}
function fmt(n){n=Math.round(n);return n>=3600?Math.floor(n/3600)+':'+String(Math.floor(n/60)%60).padStart(2,'0')+':'+String(n%60).padStart(2,'0'):Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
if(typeof module!=='undefined'&&module.exports){module.exports={budget,duration};return;}
const inputs=['pace','stations','rox','penalties'].map(x=>document.getElementById('budget-'+x));
function render(){const b=budget(...inputs.map(e=>e.value));inputs.forEach((e,i)=>e.setAttribute('aria-invalid',String(duration(e.value)===null||(i<2&&duration(e.value)===0))));const out=document.getElementById('budget-result');out.replaceChildren();if(b){const total=document.createElement('strong'),margin=document.createElement('span'),context=document.createElement('small');total.textContent=fmt(b.total);margin.textContent=b.margin>0?fmt(b.margin)+' below 60:00':b.margin===0?'Exactly 60:00':fmt(-b.margin)+' above 60:00';context.textContent='Running '+fmt(b.run)+' · Full-race scenario, not a prediction';out.append(total,margin,context);}else{out.textContent='Enter all four times as m:ss or h:mm:ss. Use 0:00 for zero.'};}
inputs.forEach(e=>e.addEventListener('input',render));render();
const toggle=document.getElementById('split-detail-toggle'),table=document.getElementById('race-splits');toggle.addEventListener('click',()=>{const expanded=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(expanded));toggle.textContent=expanded?'Hide distances & notes':'Add distances & notes';table.classList.toggle('simple-splits',!expanded);});
})();
