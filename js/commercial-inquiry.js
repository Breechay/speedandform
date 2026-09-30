/* Website inquiry v1. The database receipt, never a click, means received. */
(function(){
  'use strict';
  var api='https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/rpc/submit_website_inquiry';
  var key='sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj';
  var campaign=new URLSearchParams(window.location.search);
  var ids={};
  function id(offer){
    if(ids[offer])return ids[offer];
    var storageKey='sf-inquiry-v1:'+offer;
    try{ids[offer]=sessionStorage.getItem(storageKey);}catch(_){}
    if(!ids[offer]){
      ids[offer]=crypto.randomUUID();
      try{sessionStorage.setItem(storageKey,ids[offer]);}catch(_){}
    }
    return ids[offer];
  }
  function attribute(payload){
    payload.landing_path=window.location.pathname;
    ['utm_source','utm_medium','utm_campaign','utm_content'].forEach(function(k){
      var value=campaign.get(k);
      try{if(value)sessionStorage.setItem('sf-source:'+k,value.slice(0,120));else value=sessionStorage.getItem('sf-source:'+k);}catch(_){}
      payload[k]=(value||'').slice(0,120);
    });
    return payload;
  }
  // Keep attribution through an ordinary same-tab visit without storing contact data.
  attribute({});
  window.sfSubmitInquiry=async function(payload){
    if(campaign.get('form_qa')==='1')throw new Error('QA mode blocks live inquiry delivery');
    payload=attribute(Object.assign({},payload));
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},15000);
    try{
      var response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json',apikey:key},
        body:JSON.stringify({p_submission_id:id(payload.offer),p_payload:payload}),signal:controller.signal});
      var receipt=await response.json();
      if(!response.ok||receipt.accepted!==true)throw new Error('Inquiry was not accepted');
      return receipt;
    }finally{clearTimeout(timer);}
  };
  function recordLead(offer){
    if(navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1')return;
    if(typeof window.formTrackLead==='function')window.formTrackLead(offer);
    // A first-party event for the existing measurement layer. No contact details.
    window.dispatchEvent(new CustomEvent('sf:inquiry-received',{detail:{offer:offer}}));
  }
  document.querySelectorAll('[data-inquiry-form]').forEach(function(form){
    var sending=false,accepted=false;
    form.addEventListener('submit',async function(event){
      event.preventDefault();
      if(sending||accepted||!form.reportValidity())return;
      var fields=new FormData(form),offer=form.dataset.offer;
      if(offer==='run')offer=fields.get('program')||'run';
      if(offer==='strength'&&fields.get('program')==='first')offer='strength-first';
      var payload={offer:offer,name:fields.get('name'),email:fields.get('email'),location:fields.get('location'),
        message:fields.get('message'),company_website:fields.get('company_website')||''};
      var button=form.querySelector('[type="submit"]'),status=form.querySelector('.sf-form-status');
      sending=true;button.disabled=true;button.textContent='Sending…';status.textContent='';status.dataset.state='sending';
      try{
        await window.sfSubmitInquiry(payload);
        accepted=true;status.dataset.state='received';status.textContent='Received. It’s with Brice. I’ll reply by email to confirm the next step.';
        button.textContent='Inquiry received';recordLead(offer);status.focus({preventScroll:true});
      }catch(_){
        status.dataset.state='error';status.textContent='It did not go through. Your answers are still here. Try again, or ';
        var link=document.createElement('a');link.textContent='send these details by email';
        link.href='mailto:brice@speedandform.com?subject='+encodeURIComponent('Inquiry: '+offer)+'&body='+encodeURIComponent('Name: '+payload.name+'\nEmail: '+payload.email+'\nLocation: '+payload.location+'\n\n'+payload.message);
        status.appendChild(link);status.appendChild(document.createTextNode('.'));button.disabled=false;button.textContent='Try again';
      }finally{sending=false;}
    });
  });
}());
