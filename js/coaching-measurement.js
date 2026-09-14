/* Public coaching homepage only. Never send intake answers or app records. */
(function (w, d) {
  'use strict';
  if (!/^(www\.)?speedandform\.com$/.test(w.location.hostname)) return;
  if (w.navigator.globalPrivacyControl || w.navigator.doNotTrack === '1' || w.doNotTrack === '1') return;
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
    try {
      w.fbq('trackSingle', pixel, 'Lead');
      leadSent = true;
    } catch (_) { /* Measurement must never interrupt an accepted inquiry. */ }
  };
})(window, document);
