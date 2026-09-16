/* Public coaching homepage only. Never send intake answers or app records to Meta or GA4. */
(function (w, d) {
  'use strict';
  if (!/^(www\.)?speedandform\.com$/.test(w.location.hostname)) return;

  /* Inquiry delivery is operational, not advertising measurement. Keep this active
     even when the visitor has opted out of analytics/tracking. FormSubmit's opaque
     endpoint is the stable delivery route; the public reply address stays separate. */
  var FORM_REPLY_ADDRESS = 'brice@speedandform.com';
  var FORM_ENDPOINT = '33a5c7969281803124c58268d7ae6188';
  var sendButton = d.getElementById('sendBtn');
  var doneCopy = d.querySelector('#p-done .done-copy');
  if (sendButton) sendButton.setAttribute('data-send-to', FORM_ENDPOINT);
  if (doneCopy) {
    doneCopy.textContent = 'He reads it himself, usually within a day, and replies with what he would do first. His reply comes from ' + FORM_REPLY_ADDRESS + '.';
  }

  /* Evidence should read as evidence, not a sales headline. Lead with the verified
     result, make the goal secondary, and typeset pace as supporting data. This is
     intentionally scoped to Simon so the global coaching links keep their voice. */
  var simon = d.getElementById('simon');
  if (simon) {
    var grid = simon.querySelector('.result-grid');
    if (grid) {
      grid.innerHTML = '' +
        '<div>' +
          '<p class="eyebrow">Simon Robin · Key Biscayne Half · April 12, 2026</p>' +
          '<h2 id="simon-title">1:26.</h2>' +
          '<p class="result-goal">The goal was sub-1:30.</p>' +
          '<div class="result-metrics" aria-label="Verified average race pace">' +
            '<div class="result-metric"><span>Pace / mile</span><strong>6:35</strong></div>' +
            '<div class="result-metric"><span>Pace / km</span><strong>4:05</strong></div>' +
          '</div>' +
          '<p class="result-note">Moving time and average pace from Simon’s Strava activity.</p>' +
        '</div>' +
        '<div class="result-account">' +
          '<blockquote>“I managed to cut 5 min in just 3 months.”</blockquote>' +
          '<p class="result-attribution">Simon Robin · With FORM</p>' +
          '<a class="text-link" href="https://strava.app.link/2pHXuAvLq6b" target="_blank" rel="noopener noreferrer">View run on Strava ↗</a>' +
        '</div>';
    }

    var resultStyle = d.createElement('style');
    resultStyle.id = 'simon-result-polish';
    resultStyle.textContent = [
      '.result{padding:76px 0 82px;background:var(--paper2)}',
      '.result-grid{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(280px,.82fr);gap:clamp(52px,7vw,104px);align-items:end}',
      '.result h2{font-family:var(--serif);font-size:clamp(78px,9vw,132px);font-weight:400;line-height:.8;letter-spacing:-.065em;margin:24px 0 20px}',
      '.result-goal{font-size:18px;line-height:1.5;color:var(--body);margin:0}',
      '.result-metrics{display:flex;gap:48px;margin:38px 0 14px;padding-top:16px;border-top:1px solid var(--rule)}',
      '.result-metric{min-width:126px}',
      '.result-metric span{display:block;font-family:var(--mono);font-size:9px;line-height:1.4;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}',
      '.result-metric strong{display:block;font-family:var(--mono);font-size:23px;line-height:1;font-weight:500;letter-spacing:-.035em;font-variant-numeric:tabular-nums}',
      '.result-note{font-size:13px;line-height:1.55;color:var(--body);max-width:42ch;margin:0}',
      '.result-account{border-top:1px solid var(--rule);padding-top:25px}',
      '.result blockquote{margin:0;font-family:var(--serif);font-size:clamp(25px,2.35vw,34px);font-weight:400;line-height:1.22;max-width:21ch;letter-spacing:-.03em}',
      '.result-attribution{font-family:var(--mono);font-size:10px;line-height:1.5;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:19px 0 34px}',
      '.result .text-link{display:inline-block;padding:8px 0 4px;font-family:var(--mono);font-size:10px;letter-spacing:.11em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid currentColor;line-height:1.5}',
      '@media(max-width:760px){.result-grid{grid-template-columns:1fr;gap:42px}.result{padding:48px 0 56px}.result h2{font-size:clamp(72px,24vw,104px);margin:20px 0 18px}.result-goal{font-size:16px}.result-metrics{gap:28px;margin-top:30px}.result-metric{min-width:0}.result-metric strong{font-size:20px}.result blockquote{font-size:27px}.result-attribution{margin-bottom:24px}}'
    ].join('\n');
    d.head.appendChild(resultStyle);
  }

  /* FormSubmit is only the relay. Keep its opaque endpoint, but make the coach's
     notification behave like a lead card: compact enough to scan on one phone screen,
     subject carries the offer/rate, and Reply-To is explicitly the athlete. */
  var nativeFetch = w.fetch.bind(w);
  w.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (/^https:\/\/formsubmit\.co\/ajax\//i.test(url)) {
      url = 'https://formsubmit.co/ajax/' + encodeURIComponent(FORM_ENDPOINT);
      if (init && init.body && typeof FormData !== 'undefined' && init.body instanceof FormData) {
        var form = init.body;
        var read = function (key) { return String(form.get(key) || '').trim(); };
        var name = read('Name') || 'New inquiry';
        var email = read('Email') || read('_replyto');
        var location = read('Location');
        var goal = read('Goal');
        var days = read('Running days per week');
        var volume = read('Weekly running volume');
        var longest = read('Longest run');
        var other = read('Other training');
        var obstacle = read('Main obstacle');
        var offer = read('Offer shown') || 'Coaching';
        var price = read('Duration and fee shown');
        var source = [read('Source'), read('Medium')].filter(Boolean).join(' / ');
        var campaign = read('Campaign');
        var creative = read('Creative');
        var videoName = read('Video filename (attach separately by email)');
        var running = [
          days ? days + ' days/week' : '',
          volume ? volume + '/week' : '',
          longest ? 'longest ' + longest : ''
        ].filter(Boolean).join(' · ');
        var attribution = [source, campaign, creative].filter(Boolean).join(' · ');
        var keys = [];
        form.forEach(function (_, key) { if (keys.indexOf(key) === -1) keys.push(key); });
        keys.forEach(function (key) {
          if (key.charAt(0) !== '_' && key !== 'video') form.delete(key);
        });
        form.set('_subject', [offer, name, price].filter(Boolean).join(' · '));
        form.set('_template', 'table');
        form.set('_captcha', 'false');
        if (email) form.set('_replyto', email);
        [
          ['Name', name],
          ['Email', email],
          ['Location', location],
          ['Wants', goal],
          ['Running now', running],
          ['Other training', other],
          ['Obstacle', obstacle],
          ['Offer', [offer, price].filter(Boolean).join(' · ')],
          ['Source', attribution],
          ['Video', videoName]
        ].forEach(function (row) { if (row[1]) form.append(row[0], row[1]); });
      }
      return nativeFetch(url, init);
    }
    return nativeFetch(input, init);
  };

  if (w.navigator.globalPrivacyControl || w.navigator.doNotTrack === '1' || w.doNotTrack === '1') return;

  /* GA4: page/session attribution plus the accepted coaching inquiry. No intake
     answers are attached to analytics events. Ad-personalization signals stay off. */
  var ga = 'G-HKG3MXM668';
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  w.gtag('js', new Date());
  w.gtag('config', ga, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  var gaScript = d.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga);
  d.head.appendChild(gaScript);

  var pixel = '147659485878240';
  var leadSent = false;
  if (!w.fbq) {
    var n = w.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var script = d.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    d.head.appendChild(script);
  }
  // Explicit events only; no automatic form-field matching or inferred events.
  w.fbq('set', 'autoConfig', false, pixel);
  w.fbq('init', pixel);
  w.fbq('trackSingle', pixel, 'PageView');
  w.formTrackLead = function () {
    if (leadSent) return;
    leadSent = true;
    try { w.fbq('trackSingle', pixel, 'Lead'); } catch (_) { /* Never interrupt an accepted inquiry. */ }
    try { w.gtag('event', 'generate_lead', { method: 'coaching_inquiry' }); } catch (_) { /* Same rule for GA4. */ }
  };
})(window, document);
