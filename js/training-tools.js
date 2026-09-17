/* Local arithmetic only. No accounts, storage, analytics, prescriptions or network requests. */
(function(root){
 'use strict';
 const rules={minutes:[15,360,'Run duration must be between 15 and 360 minutes.'],portion:[0,100,'Carbohydrate per portion must be between 0 and 100 g.'],count:[0,40,'Portions must be between 0 and 40.'],drink:[0,1000,'Carbohydrate across all drinks must be between 0 and 1,000 g.']};
 function calculate(values){
  const parsed={};
  for(const [key,[min,max,message]] of Object.entries(rules)){
   const raw=values[key],value=Number(raw);
   if(raw===null||raw===undefined||String(raw).trim()===''||!Number.isFinite(value)||value<min||value>max) return {error:message,field:key};
   parsed[key]=value;
  }
  const total=parsed.portion*parsed.count+parsed.drink;
  return {total,perHour:total/(parsed.minutes/60),minutes:parsed.minutes};
 }
 if(typeof module==='object'&&module.exports){module.exports={calculate};return;}
 const form=root.document.getElementById('fuel-form');if(!form)return;
 const fields=Object.fromEntries(Object.keys(rules).map(k=>[k,form.elements.namedItem(k)]));
 const result=root.document.getElementById('fuel-result'),error=root.document.getElementById('fuel-error');
 root.document.getElementById('fuel-calculator').hidden=false;
 const number=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
 function clear(){error.hidden=true;error.textContent='';for(const f of Object.values(fields)){f.removeAttribute('aria-invalid');f.removeAttribute('aria-describedby');}result.replaceChildren();}
 form.addEventListener('input',()=>{clear();const p=document.createElement('p');p.className='guide-small';p.textContent='Amounts changed. Calculate again.';result.append(p);});
 form.addEventListener('submit',event=>{
  event.preventDefault();clear();
  const value=calculate(Object.fromEntries(Object.entries(fields).map(([k,f])=>[k,f.value])));
  if(value.error){error.textContent=value.error;error.hidden=false;fields[value.field].setAttribute('aria-invalid','true');fields[value.field].setAttribute('aria-describedby','fuel-error');fields[value.field].focus();return;}
  const p=document.createElement('p'),strong=document.createElement('strong'),note=document.createElement('p');
  strong.textContent=`${number(value.total)} g total · ${number(value.perHour)} g per hour`;p.append(strong);note.className='guide-small';
  note.textContent=value.perHour>90?'That is above the common range described here. This calculation does not establish that the amount is appropriate or tolerable. Review the plan with a qualified sports dietitian.':value.total===0?'This plan contains no carbohydrate during the run. Whether that fits depends on the session and your needs.':'An average across the whole run, not a single dose. Practice the timing, water, and products you plan to use.';
  result.append(p,note);
 });
})(typeof window!=='undefined'?window:globalThis);
