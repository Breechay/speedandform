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
    doneCopy.textContent = 'I’ll read it and reply personally from ' + FORM_REPLY_ADDRESS + '.';
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
