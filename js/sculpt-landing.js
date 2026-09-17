/* Ephemeral website example. No athlete data, account, storage or network. */
(function(root){'use strict';
 function validate(weight,reps){
  if(weight==null||typeof weight==='boolean'||String(weight).trim()===''||!Number.isFinite(Number(weight))||Number(weight)<0||Number(weight)>500||Number(weight)*2!==Math.round(Number(weight)*2))return {field:'weight',message:'Enter a weight from 0 to 500 lb, in half-pound steps.'};
  if(reps==null||typeof reps==='boolean'||String(reps).trim()===''||!Number.isFinite(Number(reps))||!Number.isInteger(Number(reps))||Number(reps)<1||Number(reps)>100)return {field:'reps',message:'Enter a whole number of repetitions from 1 to 100.'};
  return {weight:Number(weight),reps:Number(reps)};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={validate};
 if(!root.document)return;
 const host=root.document.getElementById('forgePlate');if(!host)return;
 const ui=host.querySelector('.bs-demo-interactive'),receipt=host.querySelector('.bs-receipt'),weight=host.querySelector('#sculpt-weight'),reps=host.querySelector('#sculpt-reps'),error=host.querySelector('#demo-error');
 if(!ui||!receipt||!weight||!reps||!error)return;
 const inputs={weight,reps};
 function clear(){error.textContent='';weight.removeAttribute('aria-invalid');reps.removeAttribute('aria-invalid');}
 function boundaries(){for(const b of host.querySelectorAll('[data-adjust]')){const [key,amount]=b.dataset.adjust.split(':');const el=inputs[key],v=Number(el.value);b.disabled=el.value!==''&&Number.isFinite(v)&&(Number(amount)>0?v>=Number(el.max):v<=Number(el.min));}}
 for(const el of [weight,reps])el.addEventListener('input',()=>{clear();boundaries();});
 host.querySelectorAll('[data-adjust]').forEach(b=>b.addEventListener('click',()=>{const [key,amount]=b.dataset.adjust.split(':');const el=inputs[key],base=el.value!==''&&Number.isFinite(Number(el.value))?Number(el.value):Number(el.min);el.value=String(Math.min(Number(el.max),Math.max(Number(el.min),base+Number(amount))));clear();boundaries();}));
 host.querySelector('.bs-complete').addEventListener('click',()=>{clear();const row=validate(weight.value,reps.value);if(row.field){error.textContent=row.message;inputs[row.field].setAttribute('aria-invalid','true');inputs[row.field].focus();return;}host.querySelector('.bs-receipt-value').textContent=row.weight+' lb × '+row.reps+' reps';ui.hidden=true;receipt.hidden=false;receipt.focus();});
 host.querySelector('.bs-reset').addEventListener('click',()=>{receipt.hidden=true;ui.hidden=false;host.querySelector('.bs-receipt-value').textContent='';weight.value='25';reps.value='15';clear();boundaries();weight.focus();});
 host.querySelector('.bs-demo-fallback').hidden=true;ui.hidden=false;boundaries();
})(typeof window!=='undefined'?window:globalThis);
