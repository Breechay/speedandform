(function(w,d){
  'use strict';
  var root=d.documentElement,resource=root.getAttribute('data-hm-resource'),unit='mi';
  // Events contain only this public resource's allowlisted identifiers. Existing
  // analytics, when present, owns collection; these resources load no new SDK.
  function track(name,extra){
    if(w.navigator.globalPrivacyControl||w.navigator.doNotTrack==='1'||w.doNotTrack==='1')return;
    var fields=Object.assign({page:resource,plan:resource==='plan'?'half-marathon-finish-12':'none',version:'2026-10-06.1'},extra||{});
    d.dispatchEvent(new CustomEvent('sf:hm-resource',{detail:{name:name,fields:fields}}));
    if(/^(www\.)?speedandform\.com$/.test(w.location.hostname)&&typeof w.gtag==='function')w.gtag('event',name,fields);
  }
  d.querySelectorAll('[data-hm-controls]').forEach(function(el){el.hidden=false;});
  function units(next){unit=next;
    d.querySelectorAll('[data-hm-miles]').forEach(function(el){var n=Number(el.dataset.hmMiles)*(unit==='km'?1.609344:1);el.textContent=n.toLocaleString('en-US',{maximumFractionDigits:1,minimumFractionDigits:unit==='km'?1:0})+(el.dataset.hmLabel==='yes'?' '+unit:'');});
    d.querySelectorAll('[data-hm-race]').forEach(function(el){el.textContent=unit==='km'?'21.0975 km':'13.1094 mi';});
    d.querySelectorAll('[data-hm-unit]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.hmUnit===unit));});
    track('hm_units_change',{unit:unit});
  }
  d.querySelectorAll('[data-hm-unit]').forEach(function(el){el.addEventListener('click',function(){units(el.dataset.hmUnit);});});
  function openWeek(){var match=w.location.hash.match(/^#week-([1-9]|1[0-2])$/);if(!match)return;var el=d.getElementById('week-'+match[1]);if(el){el.open=true;el.scrollIntoView({block:'start'});}}
  var select=d.getElementById('hm-week');if(select)select.addEventListener('change',function(){if(select.value){w.location.hash='week-'+select.value;openWeek();}});
  w.addEventListener('hashchange',openWeek);openWeek();
  d.querySelectorAll('.hm-week').forEach(function(el){el.addEventListener('toggle',function(){if(el.open)track('hm_week_open',{week:Number(el.id.split('-')[1]),unit:unit});});});
  d.querySelectorAll('[data-hm-print]').forEach(function(el){el.addEventListener('click',function(){track('hm_print_request',{unit:unit});w.print();});});
  d.querySelectorAll('[data-hm-destination]').forEach(function(el){el.addEventListener('click',function(){track('hm_next_step',{destination:el.dataset.hmDestination});});});
  track('hm_resource_view');
})(window,document);
