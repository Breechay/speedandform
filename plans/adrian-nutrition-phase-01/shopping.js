/* Adrian nutrition · shopping v1.5. Grocery checks only: saved in this browser, nothing sent to Brice or Forge. */
(function(){'use strict';
var root=document.querySelector('.shop');if(!root)return;
var inputs=Array.from(root.querySelectorAll('input[data-shop-key]'));
var status=root.querySelector('#shop-status'),note=root.querySelector('#shop-storage-note');
var key='form.adrian.nutrition.1.4.shopping',available=true; /* same key as v1.4 so existing checks carry over */
function count(){return inputs.filter(function(i){return i.checked;}).length;}
function update(){var n=count(),t=inputs.length;
  status.textContent=n===t?'All '+t+' checked. You\u2019re set.':n+' of '+t+' checked';
  root.style.setProperty('--shop-done',(t?Math.round(n/t*100):0)+'%');}
function off(){available=false;if(note)note.textContent='This browser isn\u2019t saving checks. The list still works.';}
function save(){if(!available)return;try{localStorage.setItem(key,JSON.stringify(inputs.filter(function(i){return i.checked;}).map(function(i){return i.dataset.shopKey;})));}catch(e){off();}}
try{var s=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(s))inputs.forEach(function(i){i.checked=s.indexOf(i.dataset.shopKey)!==-1;});}catch(e){off();}
inputs.forEach(function(i){i.addEventListener('change',function(){update();save();});});
root.querySelector('#shop-clear').addEventListener('click',function(){inputs.forEach(function(i){i.checked=false;});if(available){try{localStorage.removeItem(key);}catch(e){off();}}update();});
update();})();
