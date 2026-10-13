'use strict';
/* The Running page (form/index.html). Shared checks: tests/app-pages-house.cjs. */
const {check}=require('./app-pages-house.cjs');
const {h,js}=check('form/index.html',{name:'Speed & Form: Running',store:'https://apps.apple.com/us/app/form-running-plans/id6761313085',css:'css/form-landing.css',js:'js/form-landing.js',
  fragments:require('../scripts/form-landing-state.cjs').manifest.retainedFragments,minStoreLinks:4,
  stray:/\bFORM app\b|View FORM|Inside FORM|Breechay Sculpt/,
  mustSay:['From the app','Example week','A session as the app lays it out.','The app is free to download.'],
  retired:/Your Village|free forever|free for life|automatically improves|AI coach|is a current-release screenshot|Plenty of runners|Half marathon, marathon and HYROX programs/,
  contrast:[['f2f4ef','07110f'],['a4afa9','07110f'],['c9ff36','07110f'],['4b554e','efede7'],['4f5952','efede7']]});
const assert=require('node:assert/strict');
assert.ok(js.includes('ArrowRight')&&js.includes('ArrowLeft')&&js.includes('Home')&&js.includes('End'),'Session tabs keep keyboard support');
assert.ok(h.includes('id="session-tabs"'),'Session tabs present');
assert.ok(/<svg class="fl-bend"[^>]*preserveAspectRatio="xMidYMax slice"/.test(h)&&h.includes('<!-- sf-bend-run -->'),'Close carries the generated bend');
console.log('PASS: Running page: structure, fragments, links, metadata, structured data, contrast, honest preview labels, keyboard tabs and house identity.');
