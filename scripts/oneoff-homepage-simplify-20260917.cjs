'use strict';
const fs = require('node:fs');
const path = 'index.html';
let source = fs.readFileSync(path, 'utf8');
const transforms = [
  [
    '<div class="coach-copy">\n      <p>I watch you run, try a few cues and short efforts, and see how you respond. Then we put that into practice through your weekly training.</p>\n      <p>In Miami, we meet at the track. Training elsewhere? Your recent training, running video, and check-ins give us a place to start.</p>\n      <div class="form-principle"><p><span>Not everything needs fixing.</span><span>Some things just cost you more.</span></p><small>We change what matters, practice it, and see how you respond. The goal is better running, not a perfect-looking stride.</small></div>',
    '<div class="coach-copy">\n      <p>I watch you run, try a few cues, and build from what works.</p>\n      <div class="form-principle"><p><span>Not everything needs fixing.</span><span>Some things just cost you more.</span></p></div>'
  ],
  [
    '<div><a class="footer-mark" href="#top" aria-label="FORM, back to top">FORM<span>.</span></a><p class="footer-location">Running coaching with Brice.<br>Miami + Remote</p></div>',
    '<div><a class="footer-mark" href="#top" aria-label="FORM, back to top">FORM<span>.</span></a></div>'
  ],
  [
    '<p class="training-caption">One session belongs to a week. The week changes as you develop. This is an example, not a prescription for your running.</p>',
    '<p class="training-caption">One session belongs to a week.</p>'
  ]
];
for (const [from, to] of transforms) {
  if (!source.includes(from)) throw new Error('Missing expected source fragment: ' + from.slice(0, 120));
  source = source.replace(from, to);
}
fs.writeFileSync(path, source);
console.log('PASS: coaching, training caption and footer simplified');
