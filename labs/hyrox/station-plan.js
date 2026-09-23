(function(){
'use strict';
function parse(v){if(typeof v!=='string'||!/^\d+:\d{2}(?::\d{2})?$/.test(v.trim()))return null;const p=v.trim().split(':').map(Number);if(p.at(-1)>59||(p.length===3&&p[1]>59))return null;const n=p.reduce((a,b)=>a*60+b,0);return Number.isSafeInteger(n)&&n>0?n:null;}
function compare(target,fresh){const t=parse(target),f=parse(fresh);return t===null||f===null?null:t-f;}
function total(values){const p=values.map(parse);return p.length===8&&p.every(x=>x!==null)?p.reduce((a,b)=>a+b,0):null;}
function fmt(n){if(n===null)return '—';const sign=n<0?'−':'';n=Math.abs(n);return sign+Math.floor(n/60)+':'+String(n%60).padStart(2,'0');}
if(typeof module!=='undefined'&&module.exports){module.exports={parse,compare,total};return;}
const $=id=>document.getElementById(id),names=['SkiErg','Sled push','Sled pull','Burpees','Row','Farmers carry','Lunges','Wall balls'];
function values(prefix){return names.map((_,i)=>$('plan-'+prefix+'-'+i).value);}
function render(){const targets=values('target'),fresh=values('fresh');targets.forEach((v,i)=>{const t=$('plan-target-'+i),f=$('plan-fresh-'+i);t.setAttribute('aria-invalid',String(parse(v)===null));f.setAttribute('aria-invalid',String(!!f.value.trim()&&parse(f.value)===null));$('plan-gap-'+i).textContent=fmt(compare(v,f.value));});const n=total(targets);$('plan-total').textContent=n===null?'Complete all eight valid race budgets to total them.':'Eight-station budget: '+fmt(n);return n;}
document.querySelectorAll('#station-plan input').forEach(e=>e.addEventListener('input',render));
$('plan-apply').addEventListener('click',()=>{const n=render();if(n===null){$('plan-status').textContent='Correct the race budgets first.';return;}$('budget-stations').value=fmt(n);$('budget-stations').dispatchEvent(new Event('input',{bubbles:true}));$('plan-status').textContent='Station total applied to the race budget above.';});
$('plan-record').addEventListener('click',()=>{if(render()===null||values('fresh').some(v=>v.trim()&&parse(v)===null)){$('plan-status').textContent='Correct the highlighted times first.';return;}const targets=values('target'),fresh=values('fresh'),lines=names.map((n,i)=>`${n}: race budget ${targets[i]}; fresh ${fresh[i]||'not entered'}; allowance ${fmt(compare(targets[i],fresh[i]))}.`);const note='Station budget · working comparison, not a prediction\n'+lines.join('\n')+'\nConfirm division, loads, distances, equipment, test date and breaks before comparing.';$('test').value=[$('test').value,note].filter(Boolean).join('\n\n');$('test').dispatchEvent(new Event('input',{bubbles:true}));$('plan-status').textContent='Added to Next test / workout. Save record or Export to keep it.';});render();
})();
