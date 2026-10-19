'use strict';
/* The Strength page (forge-sculpt/index.html). Shared checks: tests/app-pages-house.cjs. */
const assert=require('node:assert/strict'),{check}=require('./app-pages-house.cjs');
const {h}=check('forge-sculpt/index.html',{name:'Speed & Form: Strength',store:'https://apps.apple.com/us/app/breechay/id6790569283',css:'css/sculpt-landing.css',js:'js/sculpt-landing.js',
  fragments:require('../scripts/sculpt-landing-state.cjs').manifest.retainedFragments,minStoreLinks:4,
  stray:/\bBreechay(?! Sculpt)\b|FORM running app|BREECHAY/,
  mustSay:['$199.99','Auto-renews annually','at least 24 hours before renewal','Week one free','App illustration · sample training','>SCULPT<span>','Breechay Sculpt','/coaching/strength/'],
  retired:/Notify me|Get notified at launch|by Sunday|four-phase|267 sessions|49 training weeks|you cannot browse|If you could build it yourself|data-netlify|<form[ >]|—/,
  contrast:[['f0ece3','090908'],['b7b1a5','090908'],['c9b285','090908'],['24221d','efebe2'],['5f584c','efebe2'],['685430','efebe2'],['b7b1a5','0d0d0c'],['c9b285','0d0d0c'],['f0ece3','0d0d0c']]});

assert.ok(!h.includes('store-20260917/today.jpg')&&!h.includes('The next session waits for you'),'No stale capture or unverified scheduling promise');
assert.ok(h.includes('class="bs-set-record"')&&h.includes('Set 1 recorded'),'Sample set record present');
for(const n of ['Build the Upper Frame','Reveal the Depth','Reveal the Complete Shape'])assert.ok(h.includes(n),'Twelve phases keep their names: '+n);
const {validate}=require('../js/sculpt-landing.js');
assert.deepEqual(validate('25','15'),{weight:25,reps:15});assert.deepEqual(validate('12.5','1'),{weight:12.5,reps:1});assert.deepEqual(validate('0','100'),{weight:0,reps:100});
for(const x of ['',null,undefined,NaN,Infinity,true,-1,501,.25,'<script>'])assert.equal(validate(x,15).field,'weight');
for(const x of ['',null,undefined,NaN,Infinity,true,0,101,1.5,'<script>'])assert.equal(validate(25,x).field,'reps');
assert.ok(require('node:fs').readFileSync('css/sculpt-landing.css','utf8').includes('@container sculpt-page'),'Container layout kept');
console.log('PASS: Strength page: structure, fragments, links, metadata, structured data, billing language, twelve phases, contrast, sample validation and house identity.');
