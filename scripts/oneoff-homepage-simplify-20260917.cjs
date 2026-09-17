'use strict';
const fs = require('node:fs');

function edit(path, transforms) {
  let source = fs.readFileSync(path, 'utf8');
  for (const [from, to] of transforms) {
    if (!source.includes(from)) throw new Error(`${path}: missing expected source fragment: ${from.slice(0,120)}`);
    source = source.replace(from, to);
  }
  fs.writeFileSync(path, source);
}

edit('index.html', [
  [
`    <div class="hero-kicker eyebrow">Running coaching with Brice · Miami + Remote</div>
    <h1>Run<br>Development</h1>
    <div class="hero-sub">
      <p><strong class="hero-benefit">Run better. Get faster. Run farther.</strong>I watch you run, build your plan, and coach you through it. Weekly track coaching in Miami, with adjustments as you develop.</p>
      <div class="offer">
        <small>Miami coaching</small><strong>8 weeks · $1,200</strong>
      </div>
    </div>
    <div class="hero-actions"><a href="#begin" class="begin">Work with Brice <span aria-hidden="true">→</span></a><span class="hero-reassurance" style="display:block;line-height:1.6">Your first Miami track assessment is complimentary.<br>Start with a conversation.</span></div>`,
`    <h1>Run<br>Development</h1>
    <div class="hero-sub">
      <p><strong class="hero-benefit">Run better.</strong></p>
      <div class="offer"><strong>8 weeks · $1,200</strong></div>
    </div>
    <div class="hero-actions"><a href="#begin" class="begin">Work with Brice <span aria-hidden="true">→</span></a></div>`
  ],
  [
`      <div class="analysis-screen"><video id="analysisVideo" data-src="/media/form-analysis-track-square.mp4" poster="/media/form-analysis-track-poster.jpg" width="512" height="512" preload="none" muted loop playsinline aria-label="A side-on running review with joint-angle overlays. A demonstration of observation, not a before-and-after comparison."></video></div>
      <figcaption class="analysis-caption"><div><span>FORM · Track review</span><small>Video analysis assisted by Ochy.</small></div><button class="film-control" id="analysisToggle" type="button" aria-controls="analysisVideo" aria-label="Play running review" hidden>Play</button></figcaption>`,
`      <div class="analysis-screen"><img src="/assets/home/practice/coaching-track.webp" loading="lazy" decoding="async" alt="Brice coaching at the track in Miami"></div>
      <figcaption class="analysis-caption"><div><span>FORM · Track practice · Miami</span></div></figcaption>`
  ],
  [
`        <dl class="scope-list"><div><dt>A plan</dt><dd>Your running week, built around your goal, fitness, and other training.</dd></div><div><dt>Practice</dt><dd>Weekly track coaching in Miami. Work on the things that matter to you.</dd></div><div><dt>Feedback</dt><dd>Check-ins and adjustments as we learn how you respond.</dd></div></dl>
      </article>
      <div class="first-step"><h3>Let’s start with your running.</h3><p>Tell me what you want to do and where you are now. I’ll reply personally to discuss the fit and a first assessment.</p><a class="button-link" href="#begin" data-coaching="run">Work with Brice <span aria-hidden="true">→</span></a><p class="assessment-note">Your first Miami track assessment is complimentary. Meet, run, and decide whether ongoing coaching is the right fit.</p></div>`,
`        <dl class="scope-list"><div><dt>Plan</dt><dd>Your week.</dd></div><div><dt>Practice</dt><dd>Weekly track.</dd></div><div><dt>Adjust</dt><dd>As you develop.</dd></div></dl>
      </article>
      <div class="first-step"><a class="button-link" href="#begin" data-coaching="run">Work with Brice <span aria-hidden="true">→</span></a></div>`
  ]
]);

edit('tests/coaching-copy.cjs', [
  [`const changes = [
  ['<body>', '<body data-coaching-copy="20260917-coaching-clarity">'],
  ['For your next race, stronger running for HYROX, or simply more ease and endurance. Individual coaching built around you.', 'I watch you run, build your plan, and coach you through it. Weekly track coaching in Miami, with adjustments as you develop.'],
  ['<span>Start with a conversation.</span>', '<span class="hero-reassurance" style="display:block;line-height:1.6">Your first Miami track assessment is complimentary.<br>Start with a conversation.</span>'],
  ['      <p>Tell me about your running and what you want to change. I read every inquiry myself.</p>', '      <p>Tell me about your running and what you want to change. I read every inquiry myself.</p>\\n      <p class="review-note" id="inquiry-reassurance">An inquiry only. No payment or booking yet.</p>']
];
for (const [, text] of changes) assert.equal(html.split(text).length, 2, 'Approved copy must occur once');`,
`const changes = [];
assert.equal((html.match(/<h1>Run<br>Development<\\/h1>/g) || []).length, 1);
assert.equal((html.match(/class="hero-benefit">Run better\.<\\/strong>/g) || []).length, 1);
assert.equal((html.match(/<strong>8 weeks · \\$1,200<\\/strong>/g) || []).length, 1);
assert.doesNotMatch(html, /hero-kicker/);
assert.doesNotMatch(html, /hero-reassurance/);
assert.doesNotMatch(html, /first Miami track assessment is complimentary/i);`],
  [`assert.match(html, /<h1>Run<br>Development<\\/h1>/);
assert.match(html, /class="hero-benefit">Run better\\. Get faster\\. Run farther\\./);
assert.match(html, /<small>Miami coaching<\\/small><strong>8 weeks · \\$1,200<\\/strong>/);
assert.match(html, /data-coaching="remote">Discuss remote coaching/);
assert.match(html, /class="hero-kicker eyebrow">Running coaching with Brice · Miami \\+ Remote/);`,
`assert.match(html, /<h1>Run<br>Development<\\/h1>/);
assert.match(html, /class="hero-benefit">Run better\\.<\\/strong>/);
assert.match(html, /<div class="offer"><strong>8 weeks · \\$1,200<\\/strong><\\/div>/);
assert.match(html, /<dt>Plan<\\/dt><dd>Your week\\.<\\/dd>/);
assert.match(html, /<dt>Practice<\\/dt><dd>Weekly track\\.<\\/dd>/);
assert.match(html, /<dt>Adjust<\\/dt><dd>As you develop\\.<\\/dd>/);
assert.match(html, /assets\\/home\\/practice\\/coaching-track\\.webp/);
assert.doesNotMatch(html, /id="analysisVideo"/);
assert.match(html, /data-coaching="remote">Discuss remote coaching/);`]
]);

edit('tests/coaching-copy-browser.py', [
  [`            assert page.locator('.hero-benefit').inner_text() == 'Run better. Get faster. Run farther.'
            assert 'I watch you run, build your plan, and coach you through it.' in page.locator('.hero-sub').inner_text()
            assert 'Weekly track coaching in Miami, with adjustments as you develop.' in page.locator('.hero-sub').inner_text()
            reassurance = page.locator('.hero-reassurance').inner_text()
            print('Reassurance',ENGINE,w,repr(reassurance),flush=True)
            # Exact HTML is asserted by coaching-copy.cjs. Browsers may expose
            # line breaks differently; verify both sentences remain authored.
            assert 'Your first Miami track assessment is complimentary.' in reassurance, repr(reassurance)
            assert 'Start with a conversation.' in reassurance, repr(reassurance)
            assert page.locator('.hero-actions .begin').get_attribute('href') == '#begin'

            if w <= 600:
                # Mobile first fold is deliberately only title, proposition,
                # fee and one action. Explanatory copy remains in the DOM and
                # appears again below the fold.
                assert not page.locator('.hero-kicker').is_visible()
                assert not page.locator('.hero-reassurance').is_visible()
                assert not page.locator('.offer small').is_visible()
                assert page.locator('.hero-benefit').is_visible()
                assert page.locator('.offer strong').is_visible()
                assert page.evaluate("getComputedStyle(document.querySelector('.hero-sub>p')).fontSize === '0px'")
            else:
                assert page.locator('.hero-kicker').is_visible()
                assert page.locator('.hero-reassurance').is_visible()
                assert page.locator('.offer small').is_visible()`,
`            assert page.locator('.hero-benefit').inner_text() == 'Run better.'
            assert page.locator('.hero-actions .begin').get_attribute('href') == '#begin'
            assert page.locator('.hero-benefit').is_visible()
            assert page.locator('.offer strong').is_visible()
            assert page.locator('.hero-kicker').count() == 0
            assert page.locator('.hero-reassurance').count() == 0
            assert page.locator('.offer small').count() == 0`],
  [`            report.append({'width':w,'height':h,'pass':True,'bounds':bounds,'reassurance':reassurance,'cta_in_initial_viewport':bounds['button']['bottom']<=h})`,
`            report.append({'width':w,'height':h,'pass':True,'bounds':bounds,'cta_in_initial_viewport':bounds['button']['bottom']<=h})`]
]);

edit('tests/meta-landing-browser.py', [
  [`                # .eyebrow intentionally renders uppercase; textContent verifies the authored copy.
                assert page.locator('.hero-kicker').text_content() == 'Run Development · Brice · Miami'
                assert page.locator('.hero h1').inner_text() == 'Run better.\\nGet faster.\\nRun farther.'
                assert page.locator('.hero-sub > p').inner_text() == 'Individual running coaching built around how you run now and where you want to go.'
                assert page.locator('.offer strong').inner_text() == '8 weeks · $1,200'
                cta = ' '.join(page.locator('.hero-actions .begin').text_content().split())
                assert cta == 'Tell me about your running →', repr(cta)
                assert page.locator('.hero-actions .begin').get_attribute('href') == '#begin'
                reassurance = page.locator('.hero-reassurance').inner_text()
                assert 'First Miami track assessment complimentary.' in reassurance
                assert 'An inquiry only. No payment or booking yet.' in reassurance

                if w <= 600:
                    assert not page.locator('.hero-kicker').is_visible()
                    assert not page.locator('.hero-sub > p').is_visible()
                    assert not page.locator('.offer small').is_visible()
                    assert not page.locator('.hero-reassurance').is_visible()
                else:
                    assert page.locator('.hero-kicker').is_visible()
                    assert page.locator('.hero-sub > p').is_visible()
                    assert page.locator('.offer small').is_visible()
                    assert page.locator('.hero-reassurance').is_visible()`,
`                assert page.locator('.hero h1').inner_text() == 'Run\\nDevelopment'
                assert page.locator('.hero-benefit').inner_text() == 'Run better.'
                assert page.locator('.offer strong').inner_text() == '8 weeks · $1,200'
                cta = ' '.join(page.locator('.hero-actions .begin').text_content().split())
                assert cta == 'Work with Brice →', repr(cta)
                assert page.locator('.hero-actions .begin').get_attribute('href') == '#begin'
                assert page.locator('.hero-kicker').count() == 0
                assert page.locator('.hero-reassurance').count() == 0
                assert page.locator('.offer small').count() == 0`]
]);

edit('tests/homepage-browser.py', [
  [` pg=load(b,videos=True,motion='reduce');pg.locator('#analysisToggle').scroll_into_view_if_needed();pg.wait_for_timeout(100)
 assert pg.evaluate('document.querySelector("#analysisVideo").paused')
 pg.locator('#analysisToggle').click();pg.wait_for_timeout(1000)
 v=pg.evaluate('({time:analysisVideo.currentTime,paused:analysisVideo.paused,width:analysisVideo.videoWidth,height:analysisVideo.videoHeight})');assert v['time']>0 and not v['paused'] and v['width']==512
 pg.locator('#analysisToggle').click();t=pg.evaluate('analysisVideo.currentTime');pg.wait_for_timeout(300);assert pg.evaluate('analysisVideo.paused')`,
` pg=load(b,videos=True,motion='reduce');pg.locator('.analysis-screen img').scroll_into_view_if_needed();pg.wait_for_timeout(100)
 assert pg.locator('.analysis-screen img').is_visible()
 assert '/assets/home/practice/coaching-track.webp' in (pg.locator('.analysis-screen img').get_attribute('src') or '')
 assert pg.locator('#analysisVideo').count()==0 and pg.locator('#analysisToggle').count()==0`]
]);

console.log('PASS: one-off homepage simplification applied');
