/* Public coaching homepage only. Never send intake answers or app records to Meta or GA4. */
(function (w, d) {
  'use strict';
  var production = /^(www\.)?speedandform\.com$/.test(w.location.hostname);
  var qa = /(?:^\?|&)form_qa=1(?:&|$)/.test(w.location.search || '');
  if ((!production && !qa) || w.__formCoachingMeasurementLoaded) return;
  w.__formCoachingMeasurementLoaded = true;
  var version = '20260920-intake-4step-1';
  var ga = 'G-HKG3MXM668';
  var pixel = '147659485878240';
  var leadSent = false;
  function privateVisit() {
    return !!(w.navigator.globalPrivacyControl || w.navigator.doNotTrack === '1' || w.doNotTrack === '1');
  }
  // Explicit QA is local-only: no collectors, no live relay, no persistent storage.
  if (qa) w.formCoachingQA = { version: version, mode: 'local-only', events: [] };

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
      if (qa) return Promise.reject(new Error('FORM QA blocks live inquiry delivery.'));
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

  /* Only fixed actions, step numbers and CTA locations enter the funnel. Never
     inspect field values, review text, mailto URLs, or the relay response here. */
  function emit(name, params) {
    if (privateVisit()) return;
    var fields = { form_id: 'coaching_inquiry', funnel_version: version };
    params = params || {};
    if (Number.isInteger(params.step_number) && params.step_number >= 1 && params.step_number <= 5) fields.step_number = params.step_number;
    if (['hero', 'header', 'coaching', 'footer', 'other'].indexOf(params.cta_location) !== -1) fields.cta_location = params.cta_location;
    if (name === 'generate_lead') fields.method = 'coaching_inquiry';
    if (qa) {
      if (w.formCoachingQA.events.length < 200) w.formCoachingQA.events.push({ event: name, parameters: fields });
      return;
    }
    fields.send_to = ga;
    try { if (w.gtag) w.gtag('event', name, fields); } catch (_) { /* Measurement must never block the inquiry. */ }
  }

  /* Preserve the existing, accepted-submission callback as the single lead source.
     The intake invokes this only after HTTP success AND relay success:true. */
  w.formTrackLead = function () {
    if (leadSent) return;
    leadSent = true;
    if (privateVisit()) return;
    if (!qa) {
      try { if (w.fbq) w.fbq('trackSingle', pixel, 'Lead'); } catch (_) { /* Never interrupt an accepted inquiry. */ }
    }
    emit('generate_lead');
  };

  if (privateVisit()) return;
  if (!qa) {
    /* GA4 retains its single automatic page_view. Do not add another arrival event
       or mark intermediate funnel actions as key events to inflate engagement. */
    w.dataLayer = w.dataLayer || [];
    w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
    try {
      w.gtag('js', new Date());
      w.gtag('config', ga, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
      var gaScript = d.createElement('script');
      gaScript.async = true;
      gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga);
      d.head.appendChild(gaScript);
    } catch (_) { /* The form works with a blocked or unavailable collector. */ }
    try {
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
    } catch (_) { /* The form works with a blocked or unavailable collector. */ }
  }

  var questionnaire = d.querySelector('#begin .questionnaire');
  if (!questionnaire) return;
  var seen = Object.create(null);
  var started = false;
  var previousStep = 0;
  var attempts = 0;
  var reportedFailure = 0;
  var scheduled = false;
  function once(name, params, key) {
    key = key || name;
    if (seen[key]) return;
    seen[key] = true;
    emit(name, params);
  }
  function visible(element) {
    if (!element || d.visibilityState === 'hidden' || !element.getClientRects().length) return false;
    var rect = element.getBoundingClientRect();
    var viewport = w.visualViewport;
    var top = viewport ? viewport.offsetTop : 0;
    var height = viewport ? viewport.height : w.innerHeight;
    return rect.bottom > top && rect.top < top + height;
  }
  function sync() {
    scheduled = false;
    var review = d.querySelector('#p-read.on');
    var question = d.querySelector('#p-ask.on .q.on');
    var step = question ? Number(question.getAttribute('data-q')) + 1 : 0;
    if (started && previousStep && ((step === previousStep + 1) || (review && previousStep === 5))) {
      once('coaching_step_complete', { step_number: previousStep }, 'complete-' + previousStep);
    }
    if (step) previousStep = step;
    if (question && visible(question)) {
      once('coaching_intake_view');
      once('coaching_step_view', { step_number: step }, 'view-' + step);
    }
    if (review && visible(review)) once('coaching_review_view');
    var error = d.getElementById('sendErr');
    if (error && !error.hidden && attempts > reportedFailure) {
      reportedFailure = attempts;
      emit('coaching_submit_error');
    }
  }
  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    w.requestAnimationFrame(sync);
  }
  // Capture before the intake disables Send or transitions away from a question.
  d.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target : null;
    if (!target) return;
    var link = target.closest('a[href="#begin"]');
    if (link) {
      var location = link.closest('.hero') ? 'hero' : link.closest('.header') ? 'header' : link.closest('.coaching-options') ? 'coaching' : link.closest('.footer') ? 'footer' : 'other';
      once('coaching_cta_click', { cta_location: location }, 'cta-' + location);
    }
    if (target.closest('#p-ask.on .q.on[data-q="0"] .opt') && !started) {
      sync(); // Record the visible first question before its delayed transition.
      started = true;
      once('coaching_intake_start');
    }
    var send = target.closest('#sendBtn');
    if (send && !send.disabled && !leadSent && d.querySelector('#p-read.on')) {
      attempts += 1;
      emit('coaching_submit_attempt');
    }
    var fallback = target.closest('#sendErr a');
    if (fallback) {
      // The mailto body contains private answers. Never copy its URL to analytics.
      once('coaching_email_fallback');
      if (qa) event.preventDefault();
    }
  }, true);
  if (w.MutationObserver) new MutationObserver(scheduleSync).observe(questionnaire, {
    subtree: true, attributes: true, attributeFilter: ['class', 'hidden']
  });
  if (w.IntersectionObserver) {
    var observer = new IntersectionObserver(scheduleSync, { threshold: [0, 0.1] });
    questionnaire.querySelectorAll('.q, #p-read').forEach(function (node) { observer.observe(node); });
  }
  w.addEventListener('scroll', scheduleSync, { passive: true });
  w.addEventListener('resize', scheduleSync, { passive: true });
  d.addEventListener('visibilitychange', scheduleSync);
  if (w.visualViewport) w.visualViewport.addEventListener('resize', scheduleSync, { passive: true });
  sync();
})(window, document);
