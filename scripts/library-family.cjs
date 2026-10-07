'use strict';
const families=require('../js/library-families.js');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={
 '/strength':'Strength for runners','/running-form-errors':'One useful form change','/library/physique-volume/':'How much work?','/library/why-phases/':'Why phases?',
 '/strength-activation':'Before you run','/strength-routine':'A strength session','/anti-rotation':'Trunk control','/mobility':'Mobility practice','/ghost/cues':'Running cues',
 '/mechanics-map':'Movement map','/ghost':'The six-week practice'
};
function render(key,current){const f=families[key];return `<section class="library-family" id="family" aria-labelledby="family-heading"><p class="lesson-label">Keep the pieces connected</p><h2 id="family-heading"><a class="section-link" href="#family">${esc(f.title)}</a></h2><p>Understand the idea, choose a practice, then check what helps your running.</p><nav aria-label="${esc(f.title)} learning path">${f.groups.map(g=>`<div><h3>${esc(g.title)}</h3><ul>${g.urls.map(url=>`<li><a href="${url}"${url===current?' aria-current="page"':''}>${esc(labels[url])}</a></li>`).join('')}</ul></div>`).join('')}</nav></section>`;}
module.exports={render,labels};
