/* RPD funnel measurement. Checkout references never become analytics identifiers.
   External SDKs do not load while a private access reference remains in the URL. */
(function(w,d){
  'use strict';
  if(!/^(www\.)?speedandform\.com$/.test(w.location.hostname))return;
  var keys=['utm_source','utm_medium','utm_campaign','utm_content','ref'];
  var query=new URLSearchParams(w.location.search),source={};
  var privateValue=/\bcs_[a-z0-9_]+/i;
  function label(value){return privateValue.test(String(value||''))?'':String(value||'').slice(0,120);}
  var shared=typeof w.sfCampaignSource==='function'?w.sfCampaignSource():{};
  keys.forEach(function(key){
    var value=label(query.get(key)||shared[key]);
    if(!value){try{value=label(w.sessionStorage.getItem('sf-source:'+key)||w.sessionStorage.getItem('rpd_'+key));}catch(_){}}
    if(value){source[key]=value;try{w.sessionStorage.setItem('sf-source:'+key,value);}catch(_){}}
  });
  if(!source.ref&&d.referrer){try{var ref=new URL(d.referrer);if(ref.hostname&&!/^(www\.)?speedandform\.com$/.test(ref.hostname))source.ref=ref.hostname.slice(0,120);}catch(_){}}
  w.rpdSource=function(){return Object.assign({},source);};
  // DNT/GPC suppress external scripts and events, while explicit labels remain
  // available for the first-party checkout/entitlement reconciliation.
  if(w.navigator.globalPrivacyControl||w.navigator.doNotTrack==='1'||w.doNotTrack==='1')return;
  var GA_ID='G-HKG3MXM668',PIXEL_ID='147659485878240';
  var surface=d.body&&d.body.getAttribute('data-rpd-surface');
  var started=false,metaStarted=false,tracked=new Set();
  var privateKeys=['purchase_session','session_id','access_token','refresh_token','token','code'];
  function privateUrl(){
    var current=new URL(w.location.href);
    return privateKeys.some(function(key){return current.searchParams.has(key);})||privateValue.test(current.href);
  }
  function safeReferrer(){
    try{var ref=new URL(d.referrer);return ref.origin+(privateValue.test(ref.pathname)?'/':ref.pathname);}catch(_){return '';}
  }
  function pageParams(){
    var current=new URL(w.location.href),publicQuery=new URLSearchParams();
    keys.forEach(function(key){var value=label(current.searchParams.get(key));if(value)publicQuery.set(key,value);});
    var week=current.searchParams.get('week');if(/^([1-9]|1[0-5])$/.test(week||''))publicQuery.set('week',week);
    return{page_location:current.origin+current.pathname+(publicQuery.toString()?'?'+publicQuery.toString():''),page_referrer:safeReferrer()};
  }
  function sourceParams(){return{rpd_utm_source:source.utm_source||'',rpd_utm_medium:source.utm_medium||'',rpd_utm_campaign:source.utm_campaign||'',rpd_utm_content:source.utm_content||'',rpd_ref:source.ref||''};}
  function start(){
    if(privateUrl())return false;
    if(started)return true;
    started=true;
    w.dataLayer=w.dataLayer||[];
    w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
    w.gtag('js',new Date());
    w.gtag('config',GA_ID,Object.assign({allow_google_signals:false,allow_ad_personalization_signals:false,send_page_view:false},pageParams()));
    if(!d.querySelector('script[data-rpd-ga]')){var gaScript=d.createElement('script');gaScript.async=true;gaScript.dataset.rpdGa='true';gaScript.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA_ID);d.head.appendChild(gaScript);}
    w.gtag('event','page_view',pageParams());
    // Meta reads the document referrer itself. Omit its SDK if that referrer
    // contains a checkout bearer; Google receives only the sanitized override.
    if(!privateValue.test(d.referrer||'')){
      if(!w.fbq){var n=w.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments);};if(!w._fbq)w._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];var fbScript=d.createElement('script');fbScript.async=true;fbScript.src='https://connect.facebook.net/en_US/fbevents.js';d.head.appendChild(fbScript);}
      w.fbq('set','autoConfig',false,PIXEL_ID);w.fbq('init',PIXEL_ID);w.fbq('trackSingle',PIXEL_ID,'PageView');metaStarted=true;
    }
    return true;
  }
  function ga(name,params){if(!start())return;try{w.gtag('event',name,Object.assign({},params||{},pageParams()));}catch(_){}}
  function meta(name,params,options){if(!start()||!metaStarted)return;try{w.fbq('trackSingle',PIXEL_ID,name,params||{},options||{});}catch(_){}}
  w.rpdTrack={
    view:function(){ga('rpd_view',Object.assign({surface:surface||'unknown'},sourceParams()));meta('ViewContent',{content_name:'Race Pace Durability',content_type:'product',value:79,currency:'USD'});},
    preview:function(detail){ga('rpd_preview_open',Object.assign({detail:label(detail)||'preview'},sourceParams()));meta('CustomizeProduct',{content_name:'Race Pace Durability Preview'});},
    checkout:function(){ga('begin_checkout',{currency:'USD',value:79,items:[{item_id:'race-pace-durability',item_name:'Race Pace Durability',price:79,quantity:1}]});ga('rpd_checkout_start',Object.assign({value:79,currency:'USD'},sourceParams()));meta('InitiateCheckout',{content_name:'Race Pace Durability',value:79,currency:'USD',num_items:1});},
    purchase:function(transactionId){
      if(!transactionId||privateValue.test(String(transactionId))||!start())return;
      var key='rpd_purchase_tracked_'+transactionId;
      if(tracked.has(transactionId))return;
      try{if(w.localStorage.getItem(key))return;}catch(_){}
      tracked.add(transactionId);
      ga('purchase',{transaction_id:transactionId,currency:'USD',value:79,items:[{item_id:'race-pace-durability',item_name:'Race Pace Durability',price:79,quantity:1}]});
      ga('rpd_purchase',Object.assign({transaction_id:transactionId,value:79,currency:'USD'},sourceParams()));
      meta('Purchase',{content_name:'Race Pace Durability',value:79,currency:'USD'},{eventID:transactionId});
      try{w.localStorage.setItem(key,'1');}catch(_){}
    }
  };
  function pageReady(){if(surface==='preview'||surface==='offer')w.rpdTrack.view();}
  d.addEventListener('sf:analytics-safe',pageReady);
  pageReady();
})(window,document);
