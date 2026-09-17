/* Five session explanations; progressive enhancement, never a plan generator. */
(function(){'use strict';
 const host=document.querySelector('.fl-explorer'),tabs=document.getElementById('session-tabs');
 if(!host||!tabs)return;
 const panels=Array.from(host.querySelectorAll('[data-session]'));
 if(panels.length!==5)return;
 const buttons=panels.map((panel,i)=>{
  const button=document.createElement('button');button.type='button';button.textContent=panel.dataset.session;
  button.id='tab-'+panel.id;button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);
  panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;
  tabs.appendChild(button);button.addEventListener('click',()=>select(i,false));
  button.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(i+1)%panels.length;else if(e.key==='ArrowLeft')next=(i+panels.length-1)%panels.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=panels.length-1;else return;e.preventDefault();select(next,true);});
  return button;
 });
 function select(index,focus){panels.forEach((panel,i)=>{panel.hidden=i!==index;buttons[i].setAttribute('aria-selected',String(i===index));buttons[i].tabIndex=i===index?0:-1;});if(focus)buttons[index].focus();}
 tabs.setAttribute('role','tablist');select(0,false);tabs.hidden=false;host.classList.add('fl-enhanced');
 // A direct link into one explanation opens that panel rather than a hidden destination.
 function openHash(){const index=panels.findIndex(p=>p.id===location.hash.slice(1));if(index>=0)select(index,false);}
 window.addEventListener('hashchange',openHash);openHash();
 // Preserve existing provider-agnostic click hooks. No provider, network or personal data added.
 document.addEventListener('click',e=>{const el=e.target.closest('[data-sf-event]');if(!el)return;const row={event:el.dataset.sfEvent,href:el.getAttribute('href')};if(typeof window.sfTrack==='function')window.sfTrack(row.event,{href:row.href});else{(window.sfEvents=window.sfEvents||[]).push(row);if(Array.isArray(window.dataLayer))window.dataLayer.push(row);}});
})();
