'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const page='labs/speed-that-endures/index.html';
const projection='data/public-studies/speed-that-endures.json';
const stamp='<!-- FORM-JOSE-OCT13-20261013 -->';
const anchor='<!-- FORM-OBSERVATION-CONTINUITY-20261006 -->';
let html=fs.readFileSync(page,'utf8');
const src=JSON.parse(fs.readFileSync(projection,'utf8'));
if(!html.includes(stamp)){
  assert.equal(html.split(anchor).length,2,'Historical study anchor changed');
  const section=`<!-- FORM-JOSE-OCT13-20261013 -->
<section class="form-observation-note" id="oct13-jose" aria-labelledby="oct13-jose-h" data-filed="2026-10-13">
<p class="obs-label">OCTOBER 13 · JOSÉ · LATEST RECORDED SESSION</p>
<h2 id="oct13-jose-h">The speed is there.<br>Now make it last.</h2>
<p>After the demanding broken work on October 6, José and Brice exchanged Tuesday and Thursday. Tuesday became twenty continuous minutes of speed development, not five miles at half-marathon pace.</p>
<dl aria-label="José's Garmin result">
<dt>20:00</dt><dd><strong>3.28 miles at 6:06/mi</strong> average, uninterrupted.</dd>
<dt>18:56</dt><dd>New Garmin 5K best effort, down from 19:31. The 5K occurred inside the twenty-minute training segment, <strong>not in a separate race</strong>.</dd>
<dt>7.02 mi</dt><dd>Full activity: 20:00 warm-up (2.43 mi), 20:00 work (3.28 mi), 11:10.9 cooldown (1.32 mi). Total: 51:10.9.</dd>
</dl>
<p>José said he opened around 6:20/mi and accelerated as his rhythm settled. He reported controlled breathing midway and favorable cooler weather. Individual progression splits and next-day recovery are not yet verified.</p>
<p><strong>What it means:</strong> stronger demonstrated sustained speed. Not a measured threshold, not proof that any one change caused it. His previous four broken two-mile reps at 6:42–6:43/mi carried a reported 10/10 effort in different conditions. His established continuous half-marathon race-pace milestone remains six miles.</p>
<dl aria-label="Current approved week">
<dt>Oct 14</dt><dd>40 minutes easy or rest.</dd>
<dt>Oct 15</dt><dd>Five continuous miles at <strong>6:40–6:45/mi</strong>, with 20 minutes easy before and 10 after, <strong>only if recovered</strong>. Otherwise easy or rest. No fast finish.</dd>
<dt>Oct 16</dt><dd>40 minutes easy or rest.</dd>
<dt>Oct 17</dt><dd>Long run cancelled for the trip. Reduced-volume week; no makeup mileage.</dd>
<dt>Oct 20</dt><dd>Eight continuous miles remain a conditional checkpoint, not automatically earned by the faster twenty-minute effort.</dd>
</dl>
<p>Future tempo-development work may explore 5:50/mi without making it a current requirement. The October 6 decision below is retained as dated history.</p>
</section>
`;
  html=html.replace(anchor,section+anchor);
  html=html.replace('<meta content="2026-10-06" property="article:modified_time"/>','<meta content="2026-10-13" property="article:modified_time"/>');
  html=html.replace('"dateModified":"2026-10-02"','"dateModified":"2026-10-13"');
  html=html.replace('<p class="obs-label">OCTOBER 6 · CURRENT COACH DECISION</p>','<p class="obs-label">OCTOBER 6 · EARLIER COACH DECISION</p>');
  fs.writeFileSync(page,html);
}
if(!src.latest_support || src.latest_support.date!=='2026-10-13'){
  src.previous_support=src.latest_support;
  src.latest_support={
    date:'2026-10-13',label:'Oct 13',athlete:'José',
    prescription:'20 minutes continuous tempo development',
    work_distance_mi:3.28,work_time:'20:00',work_pace:'6:06/mi',
    garmin_5k_best_effort:'18:56',
    decision:'Garmin best effort occurred inside the workout. Thursday is now five continuous miles at 6:40–6:45/mi if recovered; Saturday long run removed for the down week.',
    next_test:'Oct 15 five controlled continuous miles; Oct 20 eight-mile checkpoint still conditional.'
  };
  src.latest_jose_result_url='/labs/speed-that-endures/#oct13-jose';
}
src.source_sha256=crypto.createHash('sha256').update(fs.readFileSync(page)).digest('hex');
fs.writeFileSync(projection,JSON.stringify(src,null,2)+'\n');
assert(html.includes('id="oct13-jose"'));
assert(html.includes('id="rhythm-read"'));
console.log('José Oct 13 study amended; historic sections intact; public projection checksum refreshed.');
