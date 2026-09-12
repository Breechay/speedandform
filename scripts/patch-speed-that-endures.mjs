import fs from 'node:fs';

const file = 'labs/speed-that-endures/index.html';
let html = fs.readFileSync(file, 'utf8');

function replaceExact(label, from, to, expected = 1) {
  const count = html.split(from).length - 1;
  if (count !== expected) {
    throw new Error(`${label}: expected ${expected} match(es), found ${count}`);
  }
  html = html.split(from).join(to);
}

replaceExact(
  'cost claim',
  '<h2 class="cost-claim display-claim" id="cost-h">The pace can stay the same while <em>the cost of running it changes.</em></h2>',
  '<h2 class="cost-claim display-claim" id="cost-h">THE PACE STAYS THE SAME.<br/><em>THE COST RISES.</em></h2>'
);

replaceExact(
  'cost lede',
  '<p class="lede measure">A pace is not just a number. It has a price. Early in a run, 6:35/mi can feel relaxed. Later, the watch can still say 6:35 while your body has to work much harder to keep it.</p>',
  '<p class="lede measure">6:35/mi on fresh legs can feel cheap. An hour later, the same 6:35 can be expensive.</p>'
);

replaceExact(
  'durability definition',
  'Durability is how long you can keep that price low.',
  'Durability is how long you can keep the same pace from getting expensive.',
  2
);

replaceExact(
  'output cost line',
  '<p class="small" style="margin-top:22px">The pace is external. The cost is individual.</p>',
  '<p class="small" style="margin-top:22px">The output is external. The cost is individual.</p>'
);

replaceExact(
  'kite body',
  '<p class="body">True adaptation isn\'t only registered in splits, heart rate or pace. At some point it becomes experiential: less internal friction, less resistance against the work, greater mechanical fluidity, and deeper reserve at the same output.</p>',
  '<p class="body">Fitness eventually becomes something you can feel: less resistance, smoother movement, more left at the same pace.</p>'
);

replaceExact(
  'method deck',
  '<p class="method-deck">This is not where you discover a brand-new pace. It is for the runner who can already reach the pace, already has endurance, and then loses the pace before the work is over.</p>',
  '<p class="method-deck">This is for a pace you can already hit, but cannot yet keep when the work gets long.</p>'
);

replaceExact(
  'progression copy',
  '<p class="scene-copy">Do not make every week faster. Keep coming back to the same pace. First use short recoveries so you can collect more time there. Then remove the breaks and stay there longer.</p>',
  '<p class="scene-copy">Start broken. Remove the breaks. Extend the continuous distance. Eventually ask for the pace on tired legs.</p>'
);

replaceExact(
  'mobile hero/header layout',
  '  .hero{min-height:auto;display:flex;flex-direction:column}\n  .hero-inner{display:contents}\n  .masthead,.hero-lede,.hero-foot{width:min(var(--rail),100% - var(--gutter)*2);margin-inline:auto}\n  .masthead{order:1;padding-top:26px}\n  .hero-lede{order:2}',
  '  .hero{min-height:auto;display:flex;flex-direction:column;padding-top:78px}\n  .hero-inner{display:contents}\n  .hero-lede,.hero-foot{width:min(var(--rail),100% - var(--gutter)*2);margin-inline:auto}\n  .masthead{width:100%;margin:0;height:62px;padding:0 22px}\n  .hero-lede{order:2}'
);

replaceExact(
  'article modified meta',
  '<meta content="2026-09-11" property="article:modified_time"/>',
  '<meta content="2026-09-12" property="article:modified_time"/>'
);

replaceExact(
  'json ld modified date',
  '"dateModified":"2026-09-11"',
  '"dateModified":"2026-09-12"'
);

fs.writeFileSync(file, html);
console.log(`Patched ${file}`);
