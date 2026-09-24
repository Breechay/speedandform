/* Study 003 projection. Numbers come from the approved FORM publication.
   RPC pace seconds are per mile; distances and the athlete's native UI are km.
   This module never reads private athlete records or accepts an arbitrary slug. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.FORMSimonPlan=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MI=1.609344;
  const URL='https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/rpc/study_003_plan';
  const KEY='sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj'; // Public publishable key, not a service credential.
  const DAYS=['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const NAMES=[['Open both curves','Ouvrir les deux courbes'],['Extend and repeat','Allonger et répéter'],['Longer pieces','Des blocs plus longs'],['Keep the control','Garder le contrôle'],['Gate 01: 5K read','Porte 01 : lecture sur 5 km']];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const secKm=s=>(Number(s)/MI).toFixed(6);
  const pToken=c=>c.pace_low_seconds==null?'':`{p:${secKm(c.pace_low_seconds)}${c.pace_high_seconds==null?'':'-'+secKm(c.pace_high_seconds)}}`;
  function validate(raw){
    if(!raw||raw.state!=='published'||raw.schema_version!==1||raw.distance_unit!=='km'||raw.pace_seconds_unit!=='mi') throw Error('Public plan is not approved/current');
    const p=raw.payload;
    if(!p||p.plan.slug!=='simon-ceiling-durability-01'||!Number.isInteger(p.version.number)||p.version.number<2||p.weeks.length!==5) throw Error('Unrecognized Study 003 publication');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(p.running.starts_on)) throw Error('Missing calendar anchor');
    p.weeks.forEach((w,i)=>{
      if(w.week_number!==i+1) throw Error('Noncontiguous weeks');
      const unique=new Set();let sum=0;
      w.sessions.forEach(s=>{
        if(!DAYS.includes(s.day)||unique.has(s.day)||!Number.isFinite(s.distance)||s.distance<0||!Array.isArray(s.components)) throw Error('Invalid session');
        unique.add(s.day);sum+=s.distance;
        s.components.forEach(c=>{
          if(c.distance!=null&&c.distance_unit!=='km') throw Error('Native distance must be km');
          for(const k of ['distance','duration_seconds','repeat_count','pace_low_seconds','pace_high_seconds','recovery_seconds']) if(c[k]!=null&&(!Number.isFinite(c[k])||c[k]<=0)) throw Error('Invalid component '+k);
        });
      });
      if(Math.abs(sum-w.total_distance)>.001) throw Error('Week total does not equal sessions');
    });return raw;
  }
  function fromPublication(raw){
    const p=validate(raw).payload;
    return p.weeks.map((w,i)=>({name:{en:NAMES[i][0],fr:NAMES[i][1]},gate:i===4,days:DAYS.map(day=>{
      const s=w.sessions.find(x=>x.day===day);
      if(!s||s.role==='rest') return {type:'off'};
      if(s.role==='easy') return {type:'easy',km:s.distance,lbl:{en:day==='TUE'&&i===4?'Easy. Protect the 5K read.':'Easy',fr:day==='TUE'&&i===4?'Facile. Préserver le test de 5 km.':'Facile'}};
      if(day==='SAT') return {type:'sat',km:s.distance,en:'Long run, easy. Shorten if recovery is not normal.',fr:'Sortie longue facile. Raccourcir si la récupération est inhabituelle.'};
      const c=s.components.find(x=>x.role==='work');
      if(!c) throw Error('Missing work component');
      let work=c.distance!=null?`{d:${c.distance}}`:`${c.duration_seconds/60} min`;
      if(c.repeat_count) work=`${c.repeat_count} × ${work}`;
      const pace=pToken(c),rec=c.recovery_seconds?c.recovery_seconds/60:null;
      const wu=s.components.find(x=>x.role==='warm_up'),cd=s.components.find(x=>x.role==='cool_down');
      const recovery=rec?{en:` · ${rec} min very easy jog`,fr:` · ${rec} min de footing très facile`}:{en:'',fr:''};
      const frame=wu&&cd?{en:`<small class="plan-frame">Warm-up ${wu.duration_seconds/60} min · Cooldown ${cd.duration_seconds/60} min</small>`,fr:`<small class="plan-frame">Échauffement ${wu.duration_seconds/60} min · Retour au calme ${cd.duration_seconds/60} min</small>`}:{en:'',fr:''};
      return {type:day==='THU'?'thu':'tue',km:s.distance,en:work+(pace?' at '+pace:' effort · no set pace')+recovery.en+frame.en,fr:work+(pace?' à '+pace:' en effort de course · allure libre')+recovery.fr+frame.fr};
    })}));
  }
  async function read(signal){
    const r=await fetch(URL,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:'{}',cache:'no-store',signal});
    if(!r.ok) throw Error('Study publication HTTP '+r.status);
    const j=await r.json();return validate(j);
  }
  const clock=s=>{s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
  function format(str,unit='km'){
    const pace=s=>clock(unit==='km'?s:s*MI);
    return str.replace(/\{p:([\d.]+)(?:-([\d.]+))?\}/g,(_,a,b)=>`<span class="u">${pace(+a)}${b?'–'+pace(+b):''}/${unit}</span>`).replace(/\{d:([\d.]+)\}/g,(_,a)=>unit==='km'?`${+a} km`:`${(+a/MI).toFixed(2)} mi`);
  }
  function fallbackGrid(raw){
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],types={easy:'Easy',tue:'Hold',thu:'Ceiling',sat:'Long'};
    let h='<div class="gp-h" role="columnheader">Week</div>'+days.map(d=>`<div class="gp-h" role="columnheader">${d}</div>`).join('')+'<div class="gp-h r" role="columnheader">Total</div>';
    fromPublication(raw).forEach((w,i)=>{
      h+=`<div class="gp-row ${w.gate?'gate':''}" role="row"><div class="gp-wk"><b>Wk 0${i+1}</b><strong>${esc(w.name.en)}</strong></div>`;
      w.days.forEach((d,k)=>{h+=d.type==='off'?`<div class="gp-d off" data-day="${days[k]}"><span class="body">—</span></div>`:`<div class="gp-d ${d.type}" data-day="${days[k]}"><span class="t">${types[d.type]}</span><span class="body">${d.type==='easy'?esc(d.lbl.en):format(d.en)}</span><span class="km">${d.km} km</span></div>`;});
      h+=`<div class="gp-tot">${w.days.reduce((n,d)=>n+(d.km||0),0)} km<small>planned estimate</small></div></div>`;
    });return h;
  }
  return {MI,validate,fromPublication,read,format,fallbackGrid};
});
