/* Race Pace Durability public funnel measurement.
   No training inputs, checkout email, or private athlete data are sent to Meta/GA4. */
(function (w, d) {
  'use strict';
  if (!/^(www\.)?speedandform\.com$/.test(w.location.hostname)) return;

  var sourceKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'ref'];
  var query = new URLSearchParams(w.location.search);
  var source = {};

  // First-party campaign continuity must still work when analytics is disabled.
  // We preserve only explicit campaign/referrer labels used to reconcile the
  // checkout and entitlement. DNT/GPC still prevents GA/Meta scripts/events below.
  sourceKeys.forEach(function (key) {
    var value = query.get(key);
    if (value) {
      source[key] = value.slice(0, 240);
      try { w.sessionStorage.setItem('rpd_' + key, source[key]); } catch (_) {}
      return;
    }
    try {
      var stored = w.sessionStorage.getItem('rpd_' + key);
      if (stored) source[key] = stored;
    } catch (_) {}
  });
  if (!source.ref && d.referrer) {
    try {
      var ref = new URL(d.referrer);
      if (ref.hostname && !/^(www\.)?speedandform\.com$/.test(ref.hostname)) source.ref = ref.hostname.slice(0, 240);
    } catch (_) {}
  }
  w.rpdSource = function () { return Object.assign({}, source); };

  if (w.navigator.globalPrivacyControl || w.navigator.doNotTrack === '1' || w.doNotTrack === '1') return;

  var GA_ID = 'G-HKG3MXM668';
  var PIXEL_ID = '147659485878240';
  var surface = d.body && d.body.getAttribute('data-rpd-surface');

  function sourceParams() {
    return {
      rpd_utm_source: source.utm_source || '',
      rpd_utm_medium: source.utm_medium || '',
      rpd_utm_campaign: source.utm_campaign || '',
      rpd_utm_content: source.utm_content || '',
      rpd_ref: source.ref || ''
    };
  }

  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || function () { w.dataLayer.push(arguments); };
  w.gtag('js', new Date());
  w.gtag('config', GA_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  if (!d.querySelector('script[data-rpd-ga]')) {
    var gaScript = d.createElement('script');
    gaScript.async = true;
    gaScript.dataset.rpdGa = 'true';
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    d.head.appendChild(gaScript);
  }

  if (!w.fbq) {
    var n = w.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var fbScript = d.createElement('script');
    fbScript.async = true;
    fbScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
    d.head.appendChild(fbScript);
  }
  w.fbq('set', 'autoConfig', false, PIXEL_ID);
  w.fbq('init', PIXEL_ID);
  w.fbq('trackSingle', PIXEL_ID, 'PageView');

  function ga(name, params) {
    try { w.gtag('event', name, params || {}); } catch (_) {}
  }
  function meta(name, params, options) {
    try { w.fbq('trackSingle', PIXEL_ID, name, params || {}, options || {}); } catch (_) {}
  }

  w.rpdTrack = {
    view: function () {
      ga('rpd_view', Object.assign({ surface: surface || 'unknown' }, sourceParams()));
      meta('ViewContent', { content_name: 'Race Pace Durability', content_type: 'product', value: 79, currency: 'USD' });
    },
    preview: function (detail) {
      ga('rpd_preview_open', Object.assign({ detail: detail || 'preview' }, sourceParams()));
      meta('CustomizeProduct', { content_name: 'Race Pace Durability Preview' });
    },
    checkout: function () {
      ga('begin_checkout', {
        currency: 'USD', value: 79,
        items: [{ item_id: 'race-pace-durability', item_name: 'Race Pace Durability', price: 79, quantity: 1 }]
      });
      ga('rpd_checkout_start', Object.assign({ value: 79, currency: 'USD' }, sourceParams()));
      meta('InitiateCheckout', { content_name: 'Race Pace Durability', value: 79, currency: 'USD', num_items: 1 });
    },
    purchase: function (transactionId) {
      if (!transactionId) return;
      var key = 'rpd_purchase_tracked_' + transactionId;
      try { if (w.localStorage.getItem(key)) return; } catch (_) {}
      ga('purchase', {
        transaction_id: transactionId,
        currency: 'USD', value: 79,
        items: [{ item_id: 'race-pace-durability', item_name: 'Race Pace Durability', price: 79, quantity: 1 }]
      });
      ga('rpd_purchase', Object.assign({ transaction_id: transactionId, value: 79, currency: 'USD' }, sourceParams()));
      meta('Purchase', { content_name: 'Race Pace Durability', value: 79, currency: 'USD' }, { eventID: transactionId });
      try { w.localStorage.setItem(key, '1'); } catch (_) {}
    }
  };

  if (surface === 'preview' || surface === 'offer') w.rpdTrack.view();
})(window, document);
