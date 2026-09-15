/* Race Pace Durability public funnel measurement.
   No training inputs, checkout email, or private athlete data are sent to Meta/GA4. */
(function (w, d) {
  'use strict';
  if (!/^(www\.)?speedandform\.com$/.test(w.location.hostname)) return;
  if (w.navigator.globalPrivacyControl || w.navigator.doNotTrack === '1' || w.doNotTrack === '1') return;

  var GA_ID = 'G-HKG3MXM668';
  var PIXEL_ID = '147659485878240';
  var surface = d.body && d.body.getAttribute('data-rpd-surface');

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
      ga('rpd_view', { surface: surface || 'unknown' });
      meta('ViewContent', { content_name: 'Race Pace Durability', content_type: 'product', value: 79, currency: 'USD' });
    },
    preview: function (detail) {
      ga('rpd_preview_open', { detail: detail || 'preview' });
      meta('CustomizeProduct', { content_name: 'Race Pace Durability Preview' });
    },
    checkout: function () {
      ga('begin_checkout', {
        currency: 'USD', value: 79,
        items: [{ item_id: 'race-pace-durability', item_name: 'Race Pace Durability', price: 79, quantity: 1 }]
      });
      ga('rpd_checkout_start', { value: 79, currency: 'USD' });
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
      ga('rpd_purchase', { transaction_id: transactionId, value: 79, currency: 'USD' });
      meta('Purchase', { content_name: 'Race Pace Durability', value: 79, currency: 'USD' }, { eventID: transactionId });
      try { w.localStorage.setItem(key, '1'); } catch (_) {}
    }
  };

  if (surface === 'preview' || surface === 'offer') w.rpdTrack.view();
})(window, document);
