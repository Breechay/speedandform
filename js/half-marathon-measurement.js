/* Public half-marathon resource use only. No Meta, form values or training inputs. */
(function(w,d){
  'use strict';
  var resource=d.documentElement.getAttribute('data-hm-resource');
  var routes={plan:'/library/half-marathon-training-plan/',ready:'/library/how-long-to-train-for-a-half-marathon/',pace:'/library/half-marathon-pace-chart/',six:'/library/6-week-half-marathon-training-plan/',eight:'/library/8-week-half-marathon-training-plan/',sixteen:'/library/16-week-half-marathon-training-plan/',faster:'/library/how-to-run-a-faster-half-marathon/'};
  var planLimits={plan:12,six:6,eight:8,sixteen:16};
  var planIds={plan:'half-marathon-finish-12',six:'half-marathon-six-week-prepared-base',eight:'half-marathon-finish-8',sixteen:'half-marathon-foundation-16'};
  var current=new URL(w.location.href);
  if(!/^(www\.)?speedandform\.com$/.test(current.hostname)||routes[resource]!==current.pathname||w.sfHmTrack)return;
  var ga='G-HKG3MXM668',version='2026-10-06.1';
  var keys=['utm_source','utm_medium','utm_campaign','utm_content','ref'],source={};
  var privateKeys=['purchase_session','session_id','access_token','refresh_token','token','code'];
  var privateValue=/\bcs_[a-z0-9_]+/i;
  function privateUrl(url){
    var href=url.href,hash=url.hash;
    try{href=decodeURIComponent(href);hash=decodeURIComponent(hash);}catch(_){}
    return privateValue.test(href)||Array.from(url.searchParams.keys()).some(function(key){return privateKeys.indexOf(key.toLowerCase())!==-1;})||/(?:^#|[?&])(access_token|refresh_token|token|code|session_id|purchase_session)=/i.test(hash);
  }
  // A resource URL containing a private access reference never initializes an SDK
  // or forwards campaign labels. Measurement does not alter that URL.
  if(privateUrl(current))return;
  function label(value){
    value=String(value||'');
    return /^[a-z0-9][a-z0-9_.~-]{0,119}$/i.test(value)&&!privateValue.test(value)?value:'';
  }
  var shared=typeof w.sfCampaignSource==='function'?w.sfCampaignSource():{};
  keys.forEach(function(key){
    var value='';
    if(current.searchParams.has(key))value=label(current.searchParams.get(key));
    else{
      value=label(shared[key]);
      if(!value){try{value=label(w.sessionStorage.getItem('sf-source:'+key)||w.sessionStorage.getItem('rpd_'+key));}catch(_){}}
    }
    if(value){source[key]=value;try{w.sessionStorage.setItem('sf-source:'+key,value);}catch(_){}}
  });
  w.sfCampaignSource=function(){return Object.assign({},source);};
  // The existing first-party source-label contract continues through these fixed
  // public next steps, including when session storage is unavailable.
  d.querySelectorAll('a[data-hm-destination]').forEach(function(link){
    try{
      var target=new URL(link.href,current.href);
      if(target.origin!==current.origin||/^\/(coach|athlete|auth|private)(\/|$)/.test(target.pathname)||privateUrl(target))return;
      keys.forEach(function(key){if(source[key]&&!target.searchParams.has(key))target.searchParams.set(key,source[key]);});
      link.href=target.href;
    }catch(_){}
  });
  function privateVisit(){return !!(w.navigator.globalPrivacyControl||w.navigator.doNotTrack==='1'||w.doNotTrack==='1');}
  if(privateVisit())return;
  function pageParams(){
    var query=new URLSearchParams();
    keys.forEach(function(key){if(source[key])query.set(key,source[key]);});
    var referrer='';
    try{var ref=new URL(d.referrer);if(/^https?:$/.test(ref.protocol))referrer=ref.origin+'/';}catch(_){}
    return{page_location:current.origin+routes[resource]+(query.toString()?'?'+query.toString():''),page_referrer:referrer};
  }
  var seenView=false;
  w.dataLayer=w.dataLayer||[];
  w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
  w.gtag('js',new Date());
  w.gtag('config',ga,Object.assign({allow_google_signals:false,allow_ad_personalization_signals:false,send_page_view:false},pageParams()));
  if(!d.querySelector('script[data-hm-ga]')){
    var script=d.createElement('script');script.async=true;script.dataset.hmGa='true';
    script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ga);d.head.appendChild(script);
  }
  w.gtag('event','page_view',Object.assign({send_to:ga},pageParams()));
  w.sfHmTrack=function(name,params){
    if(privateVisit())return;
    params=params||{};
    var fields={page:resource,plan:planIds[resource]||'none',version:version,send_to:ga};
    if(name==='hm_resource_view'){if(seenView)return;seenView=true;}
    else if(name==='hm_week_open'){
      if(!planLimits[resource]||!Number.isInteger(params.week)||params.week<1||params.week>planLimits[resource]||params.interaction!=='explicit')return;
      fields.week=params.week;fields.interaction='explicit';
    }else if(name==='hm_print_request'){if(!planLimits[resource]&&resource!=='pace')return;}
    else if(name==='hm_units_change'){}
    else if(name==='hm_next_step'){
      if(['plan','ready','pace','six','eight','sixteen','faster','calculator','coaching','contact','plans'].indexOf(params.destination)===-1)return;
      fields.destination=params.destination;
    }else return;
    if(['hm_week_open','hm_print_request','hm_units_change'].indexOf(name)!==-1){
      if(params.unit!=='mi'&&params.unit!=='km')return;
      fields.unit=params.unit;
    }
    try{w.gtag('event',name,Object.assign(fields,pageParams()));}catch(_){}
  };
})(window,document);
