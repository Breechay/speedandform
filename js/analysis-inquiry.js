/* Native multipart delivery keeps the existing video attachment service intact.
   A provider redirect can acknowledge only this tab's recent submission. */
(function(){
  'use strict';
  var form=document.getElementById('analysis-form');
  if(!form)return;
  var file=document.getElementById('analysis-video'),list=document.getElementById('file-list');
  var status=document.getElementById('status'),button=document.getElementById('send');
  var email=document.getElementById('analysis-email'),name=document.getElementById('analysis-name'),message=document.getElementById('analysis-message'),params=new URLSearchParams(location.search);
  var pendingKey='sf-analysis-pending-v1',limit=10*1024*1024;
  var returning=params.get('sent')==='1',token=params.get('receipt'),pending=null;
  try{pending=JSON.parse(sessionStorage.getItem(pendingKey)||'null');}catch(_){}
  if(returning){
    var age=pending?Date.now()-pending.at:Infinity;
    var accepted=token&&pending&&token===pending.token&&age>=0&&age<=30*60*1000;
    params.delete('sent');params.delete('receipt');
    history.replaceState(null,'',location.pathname+(params.size?'?'+params.toString():'')+location.hash);
    if(accepted){
      try{sessionStorage.removeItem(pendingKey);}catch(_){}
      var done=document.createElement('div');done.className='done';
      var heading=document.createElement('h2');heading.textContent='Submitted.';heading.tabIndex=-1;
      var note=document.createElement('p');note.textContent='The form service accepted your inquiry. I’ll reply by email to confirm the next step.';
      var direct=document.createElement('p');direct.className='direct';
      var link=document.createElement('a');link.href='mailto:brice@speedandform.com?subject=FORM%20Analysis';link.textContent='Write to Brice directly';
      direct.appendChild(link);done.append(heading,note,direct);form.replaceChildren(done);
      heading.focus({preventScroll:true});return;
    }
  }
  if(pending&&Date.now()-pending.at>30*60*1000){try{sessionStorage.removeItem(pendingKey);}catch(_){}}
  function hidden(name,value){
    var input=form.querySelector('input[name="'+name+'"]');
    if(!input){input=document.createElement('input');input.type='hidden';input.name=name;form.appendChild(input);}
    input.value=value;
  }
  hidden('landing_path',location.pathname);
  ['utm_source','utm_medium','utm_campaign','utm_content'].forEach(function(name){
    var value=params.get(name);
    try{if(value)sessionStorage.setItem('sf-source:'+name,value.slice(0,120));else value=sessionStorage.getItem('sf-source:'+name);}catch(_){}
    if(value)hidden(name,value.slice(0,120));
  });
  function videos(){
    var files=Array.from(file.files||[]),total=files.reduce(function(n,f){return n+f.size;},0);
    var error=total>limit?'Video clips need to stay under 10 MB total. Paste a video link in your message instead.':
      files.some(function(f){return f.type&&!f.type.startsWith('video/');})?'Choose video files, or paste a video link in your message.':'';
    file.setCustomValidity(error);
    list.textContent=files.map(function(f){return f.name;}).join(' · ');
    return error;
  }
  file.addEventListener('change',function(){status.textContent=videos();});
  form.addEventListener('submit',function(event){
    if(!name.value.trim()||!email.value.trim()||!message.value.trim()){
      event.preventDefault();status.textContent='Add your name, a valid email and a message.';status.focus();return;
    }
    var error=videos();
    if(error){event.preventDefault();status.textContent=error;status.focus();return;}
    if(params.get('form_qa')==='1'){
      event.preventDefault();status.textContent='QA mode: this inquiry was not sent.';status.focus();return;
    }
    hidden('_replyto',email.value.trim());
    // No contact data is stored. If session storage is unavailable, use the
    // provider's own acknowledgement instead of an unverified branded return.
    try{
      var nextToken=crypto.randomUUID();
      sessionStorage.setItem(pendingKey,JSON.stringify({token:nextToken,at:Date.now()}));
      hidden('_next','https://speedandform.com/analysis/?sent=1&receipt='+encodeURIComponent(nextToken)+'#inquire');
    }catch(_){}
    button.disabled=true;button.textContent='Sending…';status.textContent='';
  });
  // Back navigation after a rejected native submission must leave a usable form.
  window.addEventListener('pageshow',function(){button.disabled=false;button.textContent='Send to Brice';});
})();
