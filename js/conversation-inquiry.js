(function(){
 'use strict';
 var forms=document.querySelectorAll('form[data-conversation-inquiry]');
 forms.forEach(function(form){
  var button=form.querySelector('button[type="submit"]'),status=form.querySelector('[data-inquiry-status],.status'),original=button&&button.textContent;
  if(!button||!status)return;
  function reset(){button.disabled=false;button.textContent=original;form.removeAttribute('aria-busy')}
  function fallback(){
   status.replaceChildren(document.createTextNode('I couldn’t confirm the send. Your note is still here. '));
   var link=document.createElement('a'),body=Array.from(new FormData(form)).filter(function(pair){return ['name','email','message'].includes(pair[0])&&typeof pair[1]==='string'}).map(function(pair){return pair[0]+': '+pair[1]}).join('\n\n');
   link.href='mailto:brice@speedandform.com?subject='+encodeURIComponent('Speed & Form · '+(form.dataset.inquiryLabel||'Conversation'))+'&body='+encodeURIComponent(body);link.textContent='Email Brice';status.appendChild(link);reset();
  }
  form.addEventListener('submit',async function(event){
   event.preventDefault();if(button.disabled)return;
   if(new URLSearchParams(location.search).has('form_qa')){status.textContent='Preview only. This form has not sent.';return}
   var honey=form.querySelector('[name="_honey"]');if(honey&&honey.value)return;
   if(!form.reportValidity())return;
   var email=form.querySelector('[name="email"]'),name=form.querySelector('[name="name"]');
   if(!email||!name||!name.value.trim()||!email.value.trim()){status.textContent='Add your name and a valid email.';return}
   var blank=Array.from(form.querySelectorAll('input[required],textarea[required]')).find(function(field){return typeof field.value==='string'&&!field.value.trim()});
   if(blank){status.textContent='Add a little detail so I know where to begin.';blank.focus();return}
   var fd=new FormData(form),label=form.dataset.inquiryLabel||'Conversation';
   fd.set('_replyto',email.value.trim());fd.set('_subject','Speed & Form · '+label+' · '+name.value.trim());fd.set('_template','table');fd.set('_captcha','false');fd.delete('_next');
   var from=new URLSearchParams(location.search);['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','gbraid','wbraid'].forEach(function(key){var value=from.get(key);if(!value){try{value=sessionStorage.getItem('sf-source:'+key)}catch(error){}}if(value)fd.set(key,value.slice(0,250))});fd.set('Page',location.origin+location.pathname);
   var destination=button.dataset.sendTo||'33a5c7969281803124c58268d7ae6188';
   button.disabled=true;button.textContent='Sending…';form.setAttribute('aria-busy','true');status.textContent='';
   var controller=new AbortController(),timer=setTimeout(function(){controller.abort()},12000);
   try{
    var response=await fetch('https://formsubmit.co/ajax/'+encodeURIComponent(destination),{method:'POST',body:fd,headers:{Accept:'application/json'},signal:controller.signal});
    var receipt=await response.json();if(!response.ok||String(receipt&&receipt.success)!=='true')throw new Error('Not accepted');
    var title=document.createElement('h2'),note=document.createElement('p'),done=document.createElement('div');done.className='done';done.setAttribute('role','status');done.tabIndex=-1;title.textContent=form.dataset.successTitle||'Thank you.';note.textContent='I’ll reply to '+email.value.trim()+'. We can arrange a call or a time to meet.';done.append(title,note);form.replaceChildren(done);form.removeAttribute('aria-busy');done.focus();
    if(!navigator.globalPrivacyControl&&navigator.doNotTrack!=='1'&&window.doNotTrack!=='1'&&Array.isArray(window.dataLayer))window.dataLayer.push({event:'generate_lead',service:label,form_id:form.id||'conversation',source_path:location.pathname});
   }catch(error){fallback()}finally{clearTimeout(timer)}
  });
  window.addEventListener('pageshow',reset);
 });
})();
