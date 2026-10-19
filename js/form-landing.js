/* Running landing: preserve provider-neutral store click attribution. No tracking or storage until host explicitly supplies it. */
(function(){'use strict';
document.addEventListener('click',function(event){
 const link=event.target.closest('[data-sf-event]');
 if(!link)return;
 const row={event:link.dataset.sfEvent,href:link.getAttribute('href')};
 if(typeof window.sfTrack==='function')window.sfTrack(row.event,{href:row.href});
 else{(window.sfEvents=window.sfEvents||[]).push(row);if(Array.isArray(window.dataLayer))window.dataLayer.push(row);}
});
})();
