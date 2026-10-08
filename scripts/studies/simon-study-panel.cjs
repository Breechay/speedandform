'use strict';
// Shared by the study build and the earlier cross-study panel generator.
// Keep athlete copy in one bilingual source so either entry point stays plain.
const copy=require('./simon-study-copy.cjs');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports=()=>`<section class="form-observation-note" id="observation-led" aria-labelledby="observation-led-h">
<p class="obs-label" data-i="obs.label">${esc(copy['obs.label'][0])}</p>
<h2 id="observation-led-h" data-i="obs.h">${esc(copy['obs.h'][0])}</h2>
<p data-i="obs.p">${esc(copy['obs.p'][0])}</p>
<p><a href="/the-method#observation-led" data-i="obs.link">${esc(copy['obs.link'][0])}</a>.</p>
</section>`;
