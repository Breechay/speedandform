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
  const NAMES=[['Plan snapshot','Plan archivé'],['Longer repeats','Répétitions plus longues'],['Longer repeats','Répétitions plus longues'],['Lighter week','Semaine allégée'],['5K week','Semaine du 5 km']];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const secKm=s=>(Number(s)/MI).toFixed(6);
  const pToken=c=>c.pace_low_seconds==null?'':`{p:${secKm(c.pace_low_seconds)}${c.pace_high_seconds==null?'':'-'+secKm(c.pace_high_seconds)}}`;
  function validate(raw){
    if(!raw||raw.state!=='published'||raw.schema_version!==1||raw.distance_unit!=='km'||raw.pace_seconds_unit!=='mi') throw Error('Public plan is not approved/current');
    const p=raw.payload;
    if(!p||p.plan.slug!=='simon-ceiling-durability-01'||!Number.isInteger(p.version.number)||p.version.number<4||p.weeks.length!==5) throw Error('Unrecognized Study 003 publication');
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
  function currentCopy(raw){
    const p=validate(raw).payload;
    const work=(week,day)=>p.weeks[week-1].sessions.find(s=>s.day===day).components.find(c=>c.role==='work');
    const tue=work(2,'TUE'),thu=work(2,'THU'),lighter=work(4,'TUE'),easy=work(2,'MON');
    const t=pToken(tue),h=pToken(thu),l=pToken(lighter),e=pToken(easy);
    return {
      's2.en':p.version.summary,
      'tr1.p':[`Run the repeats at ${t}, starting at the slower end. Take ${tue.recovery_seconds/60} min very easy jogging between repeats. Week 4 is lighter, at ${l}.`,`Cours les répétitions à ${t}, en commençant du côté le plus lent. Prends ${tue.recovery_seconds/60} min de footing très facile entre les répétitions. La quatrième semaine est allégée, à ${l}.`],
      'tr2.p':[`Run the faster intervals at ${h}, with ${thu.recovery_seconds/60} min very easy jogging between them. If Tuesday, hard HYROX or leg training leaves you tired, run easy or rest instead.`,`Cours les intervalles rapides à ${h}, avec ${thu.recovery_seconds/60} min de footing très facile entre eux. Si mardi, HYROX ou une séance de jambes exigeante te laisse fatigué, cours facilement ou repose-toi à la place.`],
      'tr3.p':[`Run at ${e} or slower, guided by easy effort. Keep the whole long run easy. Shorten it if you have not recovered.`,`Cours à ${e} ou plus lentement, selon tes sensations. Garde toute la sortie longue facile. Raccourcis-la si tu n’as pas récupéré.`],
      'pace.easy':[e+' or slower',e+' ou plus lent'],
      'pace.tuesday':[t,t],
      'pace.thursday':[h,h]
    };
  }
  function renderWork(c,isEasy){
    const strides=c.repeat_count&&c.duration_seconds<=30&&c.duration_seconds!=null&&c.pace_low_seconds==null;
    let work=c.distance!=null?`{d:${c.distance}}`:c.duration_seconds<60?`${c.duration_seconds} sec`:`${c.duration_seconds/60} min`;
    if(c.repeat_count) work=`${c.repeat_count} × ${work}`;
    const pace=pToken(c),rec=c.recovery_seconds;
    const recovery=rec?{en:` · ${rec<60?rec+' sec':rec/60+' min'} very easy jog`,fr:` · ${rec<60?rec+' s':rec/60+' min'} de footing très facile`}:{en:'',fr:''};
    const en=strides?' relaxed strides':pace?' at '+pace+(isEasy&&c.pace_high_seconds==null?' or slower':''):' at race effort';
    const fr=strides?' d’accélérations souples':pace?' à '+pace+(isEasy&&c.pace_high_seconds==null?' ou plus lent':''):' en effort de course';
    return {en:work+en+recovery.en,fr:work+fr+recovery.fr};
  }
  function fromPublication(raw){
    const p=validate(raw).payload;
    return p.weeks.map((w,i)=>({name:{en:NAMES[i][0],fr:NAMES[i][1]},snapshot:i===0,gate:i===4,days:DAYS.map(day=>{
      const s=w.sessions.find(x=>x.day===day);
      if(!s||s.role==='rest') return {type:'off'};
      if(day==='SAT'){
        const pace=pToken(s.components.find(c=>c.role==='work'));
        let en=`Long run, easy at ${pace} or slower. Shorten if you have not recovered.`,fr=`Sortie longue facile à ${pace} ou plus lentement. Raccourcis-la si tu n’as pas récupéré.`;
        if(i===2){
          en=`Long run, easy at ${pace} or slower. Use {d:18} if you have not recovered well from last week’s long run or this week’s training.`;
          fr=`Sortie longue facile à ${pace} ou plus lentement. Garde {d:18} si tu n’as pas bien récupéré de la sortie longue précédente ou des séances de cette semaine.`;
        }
        if(i===4){
          en=`Only if recovered from the 5K. Keep the run easy at ${pace} or slower. Shorten to {d:8} to {d:10} or rest if needed.`;
          fr=`Seulement si tu as récupéré du 5 km. Garde la sortie facile à ${pace} ou plus lentement. Raccourcis à {d:8} à {d:10} ou repose-toi si besoin.`;
        }
        return {type:'sat',km:s.distance,en,fr};
      }
      const easy=s.role==='easy'||s.role==='support';
      const works=s.components.filter(x=>x.role==='work');
      if(!works.length) throw Error('Missing work component');
      const text=works.map(c=>renderWork(c,easy));
      const wu=s.components.find(x=>x.role==='warm_up'),cd=s.components.find(x=>x.role==='cool_down');
      const frame=wu&&cd?{en:`<small class="plan-frame">Warm-up ${wu.duration_seconds/60} min · Cooldown ${cd.duration_seconds/60} min</small>`,fr:`<small class="plan-frame">Échauffement ${wu.duration_seconds/60} min · Retour au calme ${cd.duration_seconds/60} min</small>`}:{en:'',fr:''};
      const note={en:'',fr:''};
      if(day==='THU'&&(i===1||i===2)){
        note.en='<small class="plan-note">If Tuesday, hard HYROX or leg training leaves you tired, run easy or rest instead.</small>';
        note.fr='<small class="plan-note">Si mardi, HYROX ou une séance de jambes exigeante te laisse fatigué, cours facilement ou repose-toi à la place.</small>';
      }
      if(day==='TUE'&&i===2){
        note.en='<small class="plan-note">Only if last week was controlled and recovery was normal. If the first repeat feels forced, stop after two repeats or repeat the previous workout with Brice.</small>';
        note.fr='<small class="plan-note">Seulement si la semaine précédente était maîtrisée et la récupération normale. Si la première répétition est forcée, arrête après deux répétitions ou reprends la séance précédente avec Brice.</small>';
      }
      if(day==='THU'&&i===3){
        note.en='<small class="plan-note">Keep HYROX and leg training light this week too.</small>';
        note.fr='<small class="plan-note">Garde aussi HYROX et le travail des jambes légers cette semaine.</small>';
      }
      if(day==='FRI'&&i===3){
        note.en='<small class="plan-note">Take the day off if your legs still feel heavy.</small>';
        note.fr='<small class="plan-note">Prends un jour de repos si tes jambes sont encore lourdes.</small>';
      }
      if(day==='FRI'&&i===4){
        note.en='<small class="plan-note">Take the day off if you have not recovered from the 5K.</small>';
        note.fr='<small class="plan-note">Prends un jour de repos si tu n’as pas récupéré du 5 km.</small>';
      }
      const type=easy?'easy':day==='THU'?'thu':'tue';
      const label=day==='THU'&&i===4?{en:'5K test',fr:'Test 5 km'}:easy&&works.length>1?{en:'Easy + strides',fr:'Facile + accélérations'}:null;
      return {type,label,km:s.distance,en:text.map(t=>t.en).join('<br>')+frame.en+note.en,fr:text.map(t=>t.fr).join('<br>')+frame.fr+note.fr};
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
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],types={easy:'Easy',tue:'Repeats',thu:'Intervals',sat:'Long run'};
    let h='<div class="gp-h" role="columnheader">Week</div>'+days.map(d=>`<div class="gp-h" role="columnheader">${d}</div>`).join('')+'<div class="gp-h r" role="columnheader">Total</div>';
    fromPublication(raw).forEach((w,i)=>{
      h+=`<div class="gp-row ${w.gate?'gate':''}" role="row"><div class="gp-wk" role="cell"><b>Wk 0${i+1}</b><strong>${esc(w.name.en)}</strong></div>`;
      w.days.forEach((d,k)=>{h+=d.type==='off'?`<div class="gp-d off" role="cell" data-day="${days[k]}"><span class="body">—</span></div>`:`<div class="gp-d ${d.type}" role="cell" data-day="${days[k]}"><span class="t">${esc(d.label?d.label.en:types[d.type])}</span><span class="body">${format(d.en)}</span><span class="km">${d.km} km</span></div>`;});
      h+=`<div class="gp-tot" role="cell">${w.days.reduce((n,d)=>n+(d.km||0),0)} km<small>planned estimate</small></div></div>`;
    });return h;
  }
  return {MI,validate,currentCopy,fromPublication,read,format,fallbackGrid};
});
