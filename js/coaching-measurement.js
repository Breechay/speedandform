/* Public coaching homepage only. Never send intake answers or app records to Meta or GA4. */
(function (w, d) {
  'use strict';
  if (!/^(www\.)?speedandform\.com$/.test(w.location.hostname)) return;

  /* Inquiry delivery is operational, not advertising measurement. Keep this active
     even when the visitor has opted out of analytics/tracking. */
  var FORM_INBOX = 'brice@speedandform.com';
  var sendButton = d.getElementById('sendBtn');
  var doneCopy = d.querySelector('#p-done .done-copy');
  if (sendButton) sendButton.setAttribute('data-send-to', FORM_INBOX);
  if (doneCopy) {
    doneCopy.textContent = 'He reads it himself, usually within a day, and replies with what he would do first. His reply comes from ' + FORM_INBOX + '.';
  }

  /* The homepage currently uses FormSubmit as the mail relay. Route every coaching
     inquiry to the FORM Workspace inbox and make the message easier to scan in Gmail.
     _replyto is still set by the intake code, so Reply addresses the athlete. */
  var nativeFetch = w.fetch.bind(w);
  w.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (/^https:\/\/formsubmit\.co\/ajax\//i.test(url)) {
      url = 'https://formsubmit.co/ajax/' + encodeURIComponent(FORM_INBOX);
      if (init && init.body && typeof FormData !== 'undefined' && init.body instanceof FormData) {
        var form = init.body;
        var name = String(form.get('Name') || 'New inquiry').trim();
        var offer = String(form.get('Offer shown') || 'Coaching').trim();
        form.set('_subject', 'New FORM inquiry · ' + name + ' · ' + offer);
        form.set('_template', 'box');
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
