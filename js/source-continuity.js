/* First-party campaign labels only. No analytics, identity or checkout credentials. */
(function(w,d){
  'use strict';
  if(w.sfCampaignSource)return;
  var keys=['utm_source','utm_medium','utm_campaign','utm_content','ref'];
  var query=new URLSearchParams(w.location.search),source={};
  var privateValue=/\bcs_[a-z0-9_]+/i;
  function label(value){return privateValue.test(String(value||''))?'':String(value||'').slice(0,120);}
  keys.forEach(function(key){
    var value=label(query.get(key));
    if(!value){try{value=label(w.sessionStorage.getItem('sf-source:'+key)||w.sessionStorage.getItem('rpd_'+key));}catch(_){}}
    if(value){source[key]=value;try{w.sessionStorage.setItem('sf-source:'+key,value);}catch(_){}}
  });
  w.sfCampaignSource=function(){return Object.assign({},source);};
  function carry(event){
    var link=event.target.closest&&event.target.closest('a[href]');
    if(!link||link.hasAttribute('download'))return;
    var raw=link.getAttribute('href');
    if(!raw||raw.charAt(0)==='#')return;
    try{
      var target=new URL(link.href,w.location.href);
      if(target.origin!==w.location.origin||/^\/(coach|athlete|auth|private)(\/|$)/.test(target.pathname))return;
      if(['purchase_session','session_id','access_token','refresh_token','token','code'].some(function(key){return target.searchParams.has(key);}))return;
      keys.forEach(function(key){if(source[key]&&!target.searchParams.has(key))target.searchParams.set(key,source[key]);});
      link.href=target.toString();
    }catch(_){}
  }
  ['pointerdown','click','auxclick','contextmenu'].forEach(function(type){d.addEventListener(type,carry,true);});
})(window,document);
