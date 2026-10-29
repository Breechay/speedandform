(()=>{'use strict';
 document.querySelectorAll('.ar-collection-nav a').forEach(a=>{if(a.pathname===location.pathname)a.setAttribute('aria-current','page')});
 const details=document.querySelector('.ar-with-index details');
 if(details&&matchMedia('(max-width:760px)').matches)details.open=false;
 details?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{if(matchMedia('(max-width:760px)').matches)details.open=false}));
})();
