async function sharePlan(btn){
  const data={title:document.title,text:document.querySelector('h1')?.textContent?.trim()||'Adrian · Runner Mass',url:location.href};
  if(navigator.share){try{await navigator.share(data)}catch(e){}}
  else{try{await navigator.clipboard.writeText(location.href);const old=btn.textContent;btn.textContent='Copied';setTimeout(()=>btn.textContent=old,1200)}catch(e){}}
}

function cloneDays(program, week){
  if(Array.isArray(week.days)) return week.days;
  const source=program.weeks.find(w=>w.week===week.days_from_week);
  return source?.days||[];
}

function esc(value){
  return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

(async function(){
  const weekNumber=Number(document.body.dataset.week||1);
  const response=await fetch('/plans/adrian-runner-mass-phase-01/program.json',{cache:'no-store'});
  if(!response.ok) throw new Error('Program unavailable');
  const program=await response.json();
  const week=program.weeks.find(w=>w.week===weekNumber);
  if(!week) throw new Error('Week unavailable');
  const days=cloneDays(program,week);

  document.title=`Adrian — Runner Mass Week ${String(weekNumber).padStart(2,'0')} | FORM`;
  const eyebrow=document.getElementById('eyebrow');
  const title=document.getElementById('title');
  const sub=document.getElementById('sub');
  if(eyebrow) eyebrow.textContent=`Adrian · Week ${String(weekNumber).padStart(2,'0')}`;
  if(title) title.textContent=week.name+'.';
  if(sub) sub.textContent=week.intent;

  const nav=document.getElementById('navweeks');
  if(nav){
    nav.innerHTML=program.weeks.map(w=>{
      const href=w.week===1?'/plans/adrian-hypertrophy-week-01/':w.public_path;
      return `<a class="${w.week===weekNumber?'active':''}" href="${href}">Week ${String(w.week).padStart(2,'0')}</a>`;
    }).join('');
  }

  const host=document.getElementById('days');
  host.innerHTML=days.map(day=>`<section class="day">
    <div class="dayhead"><div><p class="daynum">${esc(day.weekday)} · Day ${String(day.day_index).padStart(2,'0')}</p><h2>${esc(day.title)}</h2></div><div class="focus">${esc(day.focus)}</div></div>
    ${day.exercises.map(x=>`<div class="exercise"><span class="name">${esc(x.name)}</span><span class="dose">${esc(x.sets)} × ${esc(x.reps)}</span></div>`).join('')}
  </section>`).join('');

  const note=document.getElementById('progression-note');
  if(note) note.textContent=week.progression_note||week.intent;

  const rules=document.getElementById('rules');
  rules.innerHTML=program.progression_rules.map((rule,i)=>`<div class="rule"><b>${String(i+1).padStart(2,'0')}</b><span>${esc(rule)}</span></div>`).join('');

  const foot=document.getElementById('foot-week');
  if(foot) foot.textContent=`Week ${String(weekNumber).padStart(2,'0')} · ${week.name}`;
})().catch(err=>{
  const host=document.getElementById('days');
  if(host) host.innerHTML='<section class="day"><p class="sub">Plan data could not load. Use the coach-supplied fallback.</p></section>';
  console.error(err);
});
