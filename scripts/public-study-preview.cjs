/* Approved public projection only. Never read private athlete records here. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const snapshot=JSON.parse(fs.readFileSync(path.join(root,'data/public-studies/speed-that-endures.json'),'utf8'));
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function coachingExample(){const x=snapshot.latest_completed;return `They can hit their pace. The question is how far they can hold it. On ${x.label}, both completed ${x.distance_mi} continuous miles inside their own pace ranges. ${x.decision.replace(/^Both completed[^.]+\. /,'')} I coach their pacing, approach and progression remotely, using training updates and video.`;}
function renderHomeStudy(){const x=snapshot.latest_completed;return `<section class="home-study" id="study-preview" aria-labelledby="home-study-title">
<div class="wrap">
<div class="study-top"><p class="study-label">FORM LABS · HOPE + JOSÉ</p><p class="study-label study-date">Latest milestone · ${e(x.label)}, 2026</p></div>
<div class="study-main"><div class="study-intro"><h2 id="home-study-title">SPEED THAT<br>EN&shy;DURES.</h2><p>You can hit the pace.<br>Can you hold it?</p><p class="study-summary">For half-marathon runners who can hit their target pace in shorter efforts, but lose it as the miles add up. Follow Hope and José as they practice holding theirs for longer.</p><a class="study-link" href="/labs/speed-that-endures/">Follow the study <span aria-hidden="true">↗</span></a></div>
<div class="study-distance"><div class="distance-ring"><p class="study-label">${e(x.label)} · RECORDED</p><p class="distance-number">${x.distance_mi}<span>mi</span></p><p class="distance-caption">Continuous.<br>No resets.</p></div></div></div>
<div class="study-baseline"><p class="study-label">APRIL RACE → ${e(x.label).toUpperCase()} TRAINING</p><h3>From 13.1 at 7:39/mi<br>to 6 continuous miles faster.</h3><p class="study-baseline-intro">Same two runners. The training milestone is shorter than a half marathon. This is progress in training, not a race prediction.</p><div class="study-table-wrap"><table><caption>April half marathon compared with the latest continuous training milestone</caption><thead><tr><th scope="col">Runner</th><th scope="col">April · 13.1 mi</th><th scope="col">${e(x.label)} · ${x.distance_mi} mi continuous</th></tr></thead><tbody>${snapshot.athletes.map(a=>`<tr><th scope="row">${e(a.name)}</th><td><strong>${e(a.previous_half_pace)}<em>/mi</em></strong><small>${e(a.previous_half_net_time)} race</small></td><td><strong>${e(a.work_pace)}<em>/mi</em></strong><small>${e(a.work_time)}</small></td></tr>`).join('')}</tbody></table></div></div><div class="study-ladder" aria-label="Race pace durability progression"><p class="study-label">THE BUILD · WEEK 6 OF 15</p><div class="study-ladder-track"><span class="done"><b>2</b><small>mi</small></span><i></i><span class="done"><b>5</b><small>mi</small></span><i></i><span class="current"><b>6</b><small>mi now</small></span><i></i><span><b>8</b><small>mi</small></span><i></i><span><b>12</b><small>late in 16</small></span><i></i><span class="race"><b>13.1</b><small>race</small></span></div><p class="study-ladder-note">Make race pace last farther, one completed distance at a time.</p></div>
<div class="study-foot"><a href="/plans/race-pace-durability/">Try the plan <span aria-hidden="true">↗</span><small>Weeks 1–4 free · Full plan $79</small></a></div>
</div></section>`;}
function renderHomeEvidence(){const x=snapshot.latest_completed;return `<section class="home-evidence" aria-labelledby="home-evidence-title">
  <div class="wrap home-evidence-grid">
    <div class="home-evidence-question">
      <p class="eyebrow">From the practice</p>
      <h2 id="home-evidence-title">You can hit the pace.<br>Can you hold it?</h2>
    </div>
    <div class="home-evidence-result">
      <p>Hope and José are working on that question.</p>
      <dl>
        <div><dt>${x.distance_mi} miles</dt><dd>Continuous. No resets.</dd></div>
        <div><dt>${e(x.label)}</dt><dd>A training milestone. Not a race prediction.</dd></div>
      </dl>
      <a class="text-link" href="/labs/speed-that-endures/">Follow the study <span aria-hidden="true">↗</span></a>
    </div>
  </div>
</section>`;}
function syncHomeStudy(){const source=fs.readFileSync(path.join(root,snapshot.source_path));if(require('node:crypto').createHash('sha256').update(source).digest('hex')!==snapshot.source_sha256)throw Error('Study changed: review and refresh the approved homepage/running projection before publishing');const p=path.join(root,'index.html'),html=fs.readFileSync(p,'utf8');const current=/<section class="home-evidence"[\s\S]*?<\/section>/;const legacy=/<section class="home-study"[\s\S]*?<\/div><\/section>/;if(current.test(html))fs.writeFileSync(p,html.replace(current,renderHomeEvidence()));else if(legacy.test(html))fs.writeFileSync(p,html.replace(legacy,renderHomeStudy()));else throw Error('Homepage evidence projection is missing');}
module.exports={snapshot,renderHomeStudy,renderHomeEvidence,syncHomeStudy,coachingExample};
