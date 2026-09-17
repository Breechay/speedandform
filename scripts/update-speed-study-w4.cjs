'use strict';
/**
 * A scoped, reproducible static study update from the Sep 15 athlete evidence.
 * Run once to render and commit index.html; not a client script or build hook.
 * Historic W2/W3 entries, media, research, plans, pricing and athlete data stay intact.
 */
const fs = require('node:fs');
const path = require('node:path');
const data = require('../labs/speed-that-endures/evidence/2026-09-15-w4.json');
const MARK = '<!-- FORM STUDY W4 · 2026-09-15 · published 2026-09-17 -->';
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const note = {
  title: 'Sep 15 · W4 · 5 mi continuous · recorded',
  q: 'What changes when the recoveries disappear and each athlete carries their own band for five continuous miles?',
  pr: '5 mi continuous · José 6:30–6:45 /mi · Hope 6:45–7:00 /mi',
  prs: 'Work-segment results from Garmin, with Strava context and athlete/coach messages. Both athletes recorded approximately 20 minutes of warm-up and 20 minutes of cool-down; those are outside the five-mile work segment.',
  j: {out: '5.00 mi continuous · 33:40.8 · 6:44 /mi', outs: 'The five-mile average is inside his assigned band. The supplied Garmin summary does not include his individual mile splits.', cost: 'Hard. The finish took more work.', costs: 'José reported controlled breathing, tiring legs and more effort to maintain form late. These are his observations, not a measured change in running economy.', read: 'Five-mile execution, with rising reported cost.', reads: 'He kept the work continuous and chose not to chase sub-6:40. This is evidence at five miles, not proof that the pace is already inexpensive or available for 13.1.', next: '5 × 1 mi · 2 min floats · same band', nexts: 'Sep 22: broken race-pace work. Sep 24: 3 × 10 min threshold, as the coach confirmed. Do not turn race-pace work into a faster test.', effort: 'Hard · reported', limiter: 'Legs / holding form · reported', reserve: 'Not quantified'},
  h: {out: '5.00 mi continuous · 34:17.9 · 6:52 /mi', outs: 'Mile splits: 6:48.9 · 6:49.8 · 6:53.4 · 6:51.7 · 6:54.1. All five recorded miles are inside 6:45–7:00 /mi; the fastest-to-slowest spread is 5.2 seconds.', cost: 'No numeric effort rating recorded.', costs: 'The coach asked about 9/10 effort, but the supplied conversation does not contain a numeric athlete confirmation. Limiter and reserve are left unassigned.', read: 'Her revised band carried into continuous work.', reads: 'The final mile was 5.2 seconds slower than the first and remained inside her band. A single completion does not establish low cost or full-race readiness.', next: '5 × 1 mi · 2 min floats · about 6:50 /mi', nexts: 'Hope asked whether next week should be faster. Brice confirmed the same pace: make it familiar. The shared Week 5 threshold session remains 3 × 10 min.', effort: 'Not reported', limiter: 'Not isolated', reserve: 'Not reported'}
};
const css = `
/* Sep 15 paired continuous read: the existing study material, not a new dashboard. */
#w4-read{scroll-margin-top:88px}
#w4-read .w4-lede{font-size:clamp(19px,1.7vw,26px);line-height:1.5;max-width:64ch;color:var(--ink-2);margin:0 0 34px}
.w4-pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--line)}
.w4-athlete{min-width:0;padding:32px 32px 36px 0}
.w4-athlete+.w4-athlete{border-left:1px solid var(--line);padding-left:32px;padding-right:0}
.w4-athlete h4{font-size:13px;letter-spacing:.14em;margin:0 0 18px;color:var(--lime)}
.w4-pace{font-size:clamp(54px,5.5vw,84px);font-weight:600;line-height:1;letter-spacing:-.055em;font-variant-numeric:tabular-nums}
.w4-pace span{font-size:20px;font-weight:450;letter-spacing:-.01em;color:var(--muted);margin-left:7px}
.w4-measure{font-size:19px;color:var(--ink-2);margin:12px 0 10px;font-variant-numeric:tabular-nums}
.w4-band{font-size:14px;color:var(--muted);margin:0 0 24px}
.w4-athlete p.w4-read-text{font-size:17px;line-height:1.6;color:var(--ink-2);margin:20px 0 0}
.w4-athlete blockquote{margin:24px 0 0;border-left:2px solid var(--lime-dim);padding-left:18px;font-size:22px;line-height:1.35;color:var(--ink)}
.w4-athlete blockquote cite{display:block;font-style:normal;font-size:13px;color:var(--muted);margin-top:12px}
.w4-splits{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;list-style:none;padding:0;margin:24px 0}
.w4-splits li{min-width:0;border-top:1px solid var(--line);padding-top:12px}
.w4-splits small{display:block;font-size:11px;color:var(--muted);margin-bottom:7px}
.w4-splits b{font-size:clamp(14px,1.45vw,20px);font-weight:500;white-space:nowrap;font-variant-numeric:tabular-nums;letter-spacing:-.025em}
.w4-note{border-top:1px solid var(--line);padding:24px 0;font-size:16px;line-height:1.6;color:var(--ink-2)}
.w4-note p{margin:0 0 12px;max-width:82ch}.w4-note p:last-child{margin-bottom:0}
.w4-note strong{color:var(--ink)}
#w4-read .cr-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
#w4-read .w4-source{font-size:13px;line-height:1.6;color:var(--muted);margin:0;padding:22px 0}
#w4-read .w4-note-link{color:var(--lime);display:inline-block;text-underline-offset:5px;margin-top:12px;font-size:15px}
#inspect.open{max-height:none}
@media(max-width:900px){.w4-pair{grid-template-columns:1fr}.w4-athlete,.w4-athlete+.w4-athlete{border-left:0;padding:28px 0}.w4-athlete+.w4-athlete{border-top:1px solid var(--line)}#w4-read .cr-grid{grid-template-columns:1fr}#w4-read .cr-grid>div{border-right:0;border-top:1px solid var(--line);padding:22px 0}.w4-splits b{font-size:17px}}
@media(max-width:380px){.w4-splits{gap:5px}.w4-splits b{font-size:14px}}
`;
function currentRead() {
 return `${MARK}
<section class="current-read-v73" id="w4-read" aria-labelledby="w4-h" data-filed="2026-09-15">
  <div class="cr-head"><span>CURRENT READ · SEP 15 · W4</span><h3 id="w4-h">FIVE MILES.<br/><em>NO RESET.</em></h3></div>
  <p class="w4-lede">José ran five continuous miles at 6:44/mi. Hope ran them at 6:52/mi. Both averages are inside their own bands. The recovery is gone. The pace is still there.</p>
  <div class="w4-pair">
    <section class="w4-athlete" aria-label="José's five-mile result">
      <h4>JOSÉ</h4><div class="w4-pace">${data.jose.paceLabel}<span>/mi</span></div>
      <p class="w4-measure">${data.jose.timeLabel} · 5.00 mi continuous</p><p class="w4-band">Assigned band · ${data.jose.band} /mi</p>
      <p class="w4-read-text">The five-mile average held. José reported that his breathing felt controlled while his legs tired and keeping his form became harder near the end. He chose not to chase sub-6:40.</p>
      <blockquote>“${esc(data.jose.quote)}”<cite>José · athlete report after the run</cite></blockquote>
      <p class="w4-read-text">Completion and cost are different facts. He completed the distance; he did not describe it as easy. His individual mile splits are not part of this record.</p>
    </section>
    <section class="w4-athlete" aria-label="Hope's five-mile result">
      <h4>HOPE</h4><div class="w4-pace">${data.hope.paceLabel}<span>/mi</span></div>
      <p class="w4-measure">${data.hope.timeLabel} · 5.00 mi continuous</p><p class="w4-band">Assigned band · ${data.hope.band} /mi</p>
      <ol class="w4-splits" aria-label="Hope's recorded one-mile splits">${data.hope.mileSplitLabels.map((s,i)=>`<li><small>MILE ${i+1}</small><b>${s}</b></li>`).join('')}</ol>
      <p class="w4-read-text">All five recorded miles stayed inside her revised band. The first was 6:48.9; the last was 6:54.1. A 5.2-second spread, without leaving the band.</p>
      <p class="w4-read-text">She asked whether next week should be faster. The answer was no: keep it around 6:50.</p>
      <blockquote>“${esc(data.hope.coachInstruction)}”<cite>Brice · coaching instruction, not an athlete effort rating</cite></blockquote>
    </section>
  </div>
  <div class="w4-note"><p><strong>What this adds:</strong> five miles of continuous execution at each athlete’s race-pace average. W3’s eight broken miles and W4’s five continuous miles answer different questions; removing the recovery changed the task.</p><p><strong>What it does not establish:</strong> low cost, every instant inside the band, or readiness to hold it for 13.1 miles. José’s late effort is his report, not a measured change in mechanics. Hope’s effort was not numerically confirmed.</p><a class="w4-note-link" href="#note-w4">Read the output, cost and next step →</a></div>
  <div class="cr-grid">
    <div class="next"><small>SEP 22 · RACE-PACE SUPPORT</small><b>5 × 1 mi<br/>2 min floats</b><p>Keep each athlete’s band. Broken work between continuous asks, not a faster race-pace target.</p></div>
    <div><small>SEP 24 · CEILING WORK</small><b>3 × 10 min<br/>Threshold</b><p>The next threshold step remains separate from race-pace work, as confirmed in the coaching messages.</p></div>
    <div><small>SEP 29 · NEXT PLANNED ASK</small><b>6 mi continuous</b><p>The next continuous distance stays ahead, not already established. The athlete’s response still informs the next move.</p></div>
  </div>
  <p class="w4-source">Source: athlete-shared Garmin work-segment summaries and Strava screenshots, 15 September 2026; selected post-run coaching messages. These figures exclude warm-up and cool-down. Published 17 September. Earlier reads remain in Lab Notes.</p>
</section>`;
}
function replaceOne(html, pattern, replacement, name) {
 const re = pattern instanceof RegExp ? new RegExp(pattern.source, pattern.flags.replace(/g/g,'')) : pattern;
 const count = typeof re === 'string' ? html.split(re).length-1 : [...html.matchAll(new RegExp(re.source,re.flags+'g'))].length;
 if(count !== 1) throw new Error(`${name}: expected one target, found ${count}`);
 return html.replace(re, () => replacement);
}
function transform(html) {
 if(html.includes(MARK)) return html;
 const original = html;
 // Replace only the CURRENT summary; the historic W2 and W3 data objects remain byte-identical.
 html = replaceOne(html, /<div class="current-read-v73" aria-label="Current study read">[\s\S]*?(?=\n<\/div>\n<\/section>\n<!--[^\n]*05 · THE SEASON)/, currentRead(), 'current read');
 html = replaceOne(html, 'Sep 11 · Why Hope’s band changed &rarr;', 'Sep 15 · Five miles. No reset. &rarr;', 'hero update label');
 html = replaceOne(html, '<a class="plan-link" href="#note-w3">Sep 15', '<a class="plan-link" href="#w4-read">Sep 15', 'hero update target');
 html = replaceOne(html, /  w4:\{[\s\S]*?\n  \},(?=\n  w6:\{)/, '  w4:'+JSON.stringify(note,null,2)+',', 'W4 interactive record');
 html = replaceOne(html, /<button aria-controls="inspect" aria-expanded="false" class="entry" data-key="w4" id="note-w4">[\s\S]*?<\/button>/, `<button aria-controls="inspect" aria-expanded="false" class="entry" data-key="w4" data-state="filed" id="note-w4"><span class="d">Sep 15 · W4</span><span class="mk">5 mi</span><span class="q">Five continuous miles: José 6:44/mi · Hope 6:52/mi. What did holding the pace cost?</span><span class="st">Recorded</span></button>`, 'W4 row');
 html = replaceOne(html, /<div class="live" style="margin-top:104px">[\s\S]*?(?=\n<div class="grammar">)/, `<div class="live" style="margin-top:72px"><div class="d">Sep 15 · W4 · paired record</div><div><div class="k">Five continuous miles, at two individual paces.</div><p>José: 33:40.8 at 6:44/mi. Hope: 34:17.9 at 6:52/mi, with all five recorded mile splits inside her band. The work stayed continuous; its cost is read separately.</p></div><div class="st">Recorded</div></div>
<div class="synth"><div><div class="k">What W4 adds</div><b>The pace survived without the reset.</b><p>Five continuous miles now sit beside W3’s eight broken miles. This is a new condition, not less of the same session.</p></div><div><div class="k">What the athlete adds</div><b>The finish can cost more even when the pace holds.</b><p>José reported tiring legs and more effort to hold form late. Hope’s splits stayed inside her band; no numeric effort rating was confirmed.</p></div><div><div class="k">What changes next</div><b>Keep the pace. Change the session.</b><p>Sep 22: 5 × 1 mile with 2-minute floats. Sep 24: 3 × 10 minutes threshold. The next planned continuous ask is six miles on Sep 29.</p></div></div>`, 'Lab Notes current synthesis');
 html = replaceOne(html, '<div class="memory-step"><span>SEP 15 · W4</span><b>5 CONT.</b><small>FUTURE</small></div>', '<div class="memory-step filed"><span>SEP 15 · W4</span><b>5 CONT.</b><small>RECORDED</small></div>', 'timeline W4');
 html = replaceOne(html, /<div class="memory-athletes">[\s\S]*?(?=\n  <div class="memory-carry">)/, `<div class="memory-athletes"><section><header><b>JOSÉ</b><span>3 RACE-PACE READS</span></header><div class="memory-facts"><span><small>OUTPUT</small>5 mi continuous · 6:44/mi</span><span><small>EFFORT</small>Hard · reported</span><span><small>LIMITER</small>Legs / holding form · reported</span><span><small>RESERVE</small>Not quantified</span></div></section><section><header><b>HOPE</b><span>3 RACE-PACE READS</span></header><div class="memory-facts"><span><small>OUTPUT</small>5 mi continuous · 6:52/mi</span><span><small>EFFORT</small>Not reported</span><span><small>LIMITER</small>Not isolated</span><span><small>RESERVE</small>Not reported</span></div></section></div>`, 'current memory facts');
 html = replaceOne(html, '<div class="k">W4 · first continuous ask</div><div class="v">Remove the recovery.</div><div class="dt">Sep 15</div>', '<div class="k">W4 · first continuous ask · recorded</div><div class="v">José 6:44/mi · Hope 6:52/mi.</div><div class="dt">Sep 15 · 5 mi each</div>', 'continuous rung');
 html = replaceOne(html, '<b>5 mi continuous</b><small>First continuous ask.</small>', '<b>5 mi continuous · recorded</b><small>José 6:44/mi · Hope 6:52/mi. Work-segment averages.</small>', 'calendar result');
 html = replaceOne(html, '<span class="today-tag" style="left:calc(14.4% + 10px)">Sep 08 · W3</span>', '<span class="today-tag" style="left:calc(13.7% + 10px)">Sep 15 · W4</span>', 'season evidence coordinate');
 html = replaceOne(html, '<span aria-hidden="true" class="today" style="left:14.4%"></span>', '<span aria-hidden="true" class="today" style="left:13.7%"></span>', 'season marker');
 html = html.replace(/content="2026-09-12" (property="article:modified_time"|itemprop="dateModified")/g,'content="2026-09-17" $1').replace('"dateModified":"2026-09-12"','"dateModified":"2026-09-17"').replace('In progress · updated Sep 12','In progress · updated Sep 17').replace('In progress · last updated Sep 12 2026','In progress · last updated Sep 17 2026');
 // A publication date must not drift with deployment headers or UTC date parsing.
 html = replaceOne(html, /<script>\s*\/\* The status line writes itself\.[\s\S]*?<\/script>/, '<!-- The status states the publication date; session dates remain on their evidence. -->', 'status date');
 html = replaceOne(html, '</style>\n</head>', css+'\n</style>\n</head>', 'scoped style');
 // Protect all prior interactive evidence, every inline image and all external scripts.
 const historic = h => h.match(/const evidence\s*=\s*\{[\s\S]*?(?=  w4:\{)/)?.[0];
 if(!historic(original) || historic(original)!==historic(html)) throw new Error('Historical W2/W3 records changed');
 const media = h => h.match(/data:image[^"\)]+/g);
 if(JSON.stringify(media(original))!==JSON.stringify(media(html))) throw new Error('Existing media changed');
 return html;
}
function apply(root=path.resolve(__dirname,'..')) {
 const file=path.join(root,'labs/speed-that-endures/index.html');
 const before=fs.readFileSync(file,'utf8'); const after=transform(before);
 if(after!==before) fs.writeFileSync(file,after);
 console.log('Speed That Endures: September 15 paired evidence rendered; W2/W3 and existing media preserved.');
 return after;
}
if(require.main===module) apply();
module.exports={data,note,MARK,currentRead,css,transform,apply};
