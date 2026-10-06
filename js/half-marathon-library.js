(function(w,d){
  'use strict';
  var root=d.documentElement,resource=root.getAttribute('data-hm-resource'),unit='mi';
  // The resource collector owns delivery and validates the public event fields.
  function track(name,extra){
    if(w.navigator.globalPrivacyControl||w.navigator.doNotTrack==='1'||w.doNotTrack==='1')return;
    var fields=Object.assign({page:resource,plan:({plan:'half-marathon-finish-12',six:'half-marathon-six-week-prepared-base',eight:'half-marathon-finish-8',sixteen:'half-marathon-foundation-16'})[resource]||'none',version:'2026-10-06.1'},extra||{});
    d.dispatchEvent(new CustomEvent('sf:hm-resource',{detail:{name:name,fields:fields}}));
    if(typeof w.sfHmTrack==='function')w.sfHmTrack(name,fields);
  }
  d.querySelectorAll('[data-hm-controls]').forEach(function(el){el.hidden=false;});
  function units(next){unit=next;
    d.querySelectorAll('[data-hm-miles]').forEach(function(el){var n=Number(el.dataset.hmMiles)*(unit==='km'?1.609344:1);el.textContent=n.toLocaleString('en-US',{maximumFractionDigits:1,minimumFractionDigits:unit==='km'?1:0})+(el.dataset.hmLabel==='yes'?' '+unit:'');});
    d.querySelectorAll('[data-hm-race]').forEach(function(el){el.textContent=unit==='km'?'21.0975 km':'13.1094 mi';});
    d.querySelectorAll('[data-hm-unit]').forEach(function(el){el.setAttribute('aria-pressed',String(el.dataset.hmUnit===unit));});
    track('hm_units_change',{unit:unit});
  }
  d.querySelectorAll('[data-hm-unit]').forEach(function(el){el.addEventListener('click',function(){units(el.dataset.hmUnit);});});
  function openWeek(){var match=w.location.hash.match(/^#week-([1-9]|1[0-6])$/);if(!match)return;var el=d.getElementById('week-'+match[1]);if(el){el.open=true;el.scrollIntoView({block:'start'});}}
  var select=d.getElementById('hm-week');if(select)select.addEventListener('change',function(event){if(select.value){w.location.hash='week-'+select.value;openWeek();if(event.isTrusted&&/^([1-9]|1[0-6])$/.test(select.value))track('hm_week_open',{week:Number(select.value),unit:unit,interaction:'explicit'});}});
  d.querySelectorAll('a[href^="#week-"]').forEach(function(link){link.addEventListener('click',function(event){
    var match=link.getAttribute('href').match(/^#week-([1-9]|1[0-6])$/),el=match&&d.getElementById('week-'+match[1]);
    if(event.isTrusted&&el){el.open=true;track('hm_week_open',{week:Number(match[1]),unit:unit,interaction:'explicit'});}
  });});
  w.addEventListener('hashchange',openWeek);openWeek();
  d.querySelectorAll('.hm-week').forEach(function(el){
    var requested=false,summary=el.querySelector('summary');
    if(summary)summary.addEventListener('click',function(event){requested=event.isTrusted&&!el.open;});
    el.addEventListener('toggle',function(){if(el.open&&requested)track('hm_week_open',{week:Number(el.id.split('-')[1]),unit:unit,interaction:'explicit'});requested=false;});
  });
  d.querySelectorAll('[data-hm-print]').forEach(function(el){el.addEventListener('click',function(){track('hm_print_request',{unit:unit});w.print();});});
  d.querySelectorAll('[data-hm-destination]').forEach(function(el){el.addEventListener('click',function(){track('hm_next_step',{destination:el.dataset.hmDestination});});});
  track('hm_resource_view');
})(window,document);
