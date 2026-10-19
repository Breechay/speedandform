/* Group runs: a public window onto the Running app's Collective.
   Reads only what the server publishes to an anonymous caller: collective_public_runs (public
   FORM runs), collective_galleries() and collective_album(run) (published, public runs only,
   withdrawn photos excluded). Requests carry the publishable key and no user session, so a
   signed-in coach never sees member-only albums here. Nothing is stored or sent.
   Addresses are the app's own share links, speedandform.com/run/<slug> (FORMCollectiveComposer.slug).
   Album composition is ported from FORMAlbumRow.compose (FORM-iOS
   FORM/Collective/FORMCollectiveAlbumViews.swift): the same frames in the same order. */
(function () {
  'use strict';
  var SUPA = 'https://pbgsjjegycacodiltbhn.supabase.co';
  var KEY = 'sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj';
  var ZONE = 'America/New_York';
  var MEDIA = SUPA + '/storage/v1/object/public/collective-media/';
  // FORM-iOS FORM/TrackSessions/FORMTrackSessionCatalog.swift: id → display title, distances.
  var SESSIONS = {
    'resurrection': ['Resurrection', '600 / 400 / 300 / 200'],
    'death': ['Death', '600 / 400 / 300 / 200 / 800 / 400'],
    'speed-demons': ['Speed Demons', '300 / 200 / 100'],
    'gauntlet': ['Gauntlet', '600 / 400 / 300 / 200 / 150'],
    'pyramid-intervals': ['Pyramid Intervals', '300 / 400 / 600 / 400 / 300'],
    'nice-and-easy': ['Nice and Easy', '200 / 800 / 400']
  };
  // The app's canonical meet points (FORMCollectiveComposer.canonicalMeetPoints).
  var MEET_POINTS = { 'Flamingo Park Track': 'Bench by the bleachers', 'The Labs': 'Front entrance' };
  var KIND = { track: 'Track', long_run: 'Long run' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(id) { return document.getElementById(id); }

  function request(path, body) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 12000);
    var init = { headers: { apikey: KEY }, signal: controller.signal, cache: 'no-store', credentials: 'omit' };
    if (body) { init.method = 'POST'; init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(body); }
    return fetch(SUPA + '/rest/v1/' + path, init).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('unavailable');
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }
  function loadRuns() {
    var q = new URLSearchParams({ select: 'id,kind,series_id,title,meet_at,starts_at,original_starts_at,meet_name,meet_address,group_facts,status', order: 'starts_at.desc', limit: '300' });
    return request('collective_public_runs?' + q).then(function (rows) {
      if (!Array.isArray(rows)) throw new Error('invalid');
      return rows.filter(function (r) { return KIND[r.kind] && Number.isFinite(Date.parse(r.starts_at)); });
    });
  }
  function loadGalleries() {
    return request('rpc/collective_galleries', {}).then(function (rows) {
      var by = {};
      (Array.isArray(rows) ? rows : []).forEach(function (g) { (by[g.run_id] = by[g.run_id] || []).push(g); });
      Object.keys(by).forEach(function (k) { by[k].sort(function (a, b) { return a.position - b.position; }); });
      return by;
    });
  }
  function loadAlbum(runID) {
    return request('rpc/collective_album', { run: runID }).then(function (rows) { return Array.isArray(rows) && rows[0] ? rows[0] : null; });
  }

  // Dates in Miami time.
  function parts(iso) {
    var d = new Date(iso), o = {};
    new Intl.DateTimeFormat('en-US', { timeZone: ZONE, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      .formatToParts(d).forEach(function (p) { o[p.type] = p.value; });
    var y = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    return { wd: o.weekday, day: o.day, mon: o.month, year: o.year, ymd: y };
  }
  function clock(iso, ampm) {
    var s = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
    return ampm ? s : s.replace(/\s?[AP]M$/, '');
  }
  function today() { return parts(new Date().toISOString()).ymd; }
  function isUpcoming(r) { return r.status !== 'archived' && parts(r.starts_at).ymd >= today(); }

  function facts(r) { return r.group_facts && typeof r.group_facts === 'object' ? r.group_facts : {}; }
  function session(r) { var s = SESSIONS[facts(r).workout_session_id]; return s ? { title: s[0], sequence: s[1] } : null; }
  // The app's albumTitle / albumDetail: the session when the morning had one, else the run's title.
  function title(r) { var s = session(r); return s ? s.title : r.title; }
  function detail(r) { var s = session(r); return [r.meet_name, s && s.sequence].filter(Boolean).join(' · '); }
  function meetPoint(r) { return facts(r).meet_point || MEET_POINTS[r.meet_name] || ''; }
  // FORMCollectiveComposer.slug: a series occurrence carries its Miami date, a one-off is its title.
  function slugOf(r, when) {
    var base = Array.from(String(r.title).toLowerCase()).map(function (c) { return /[\p{L}\p{N}]/u.test(c) ? c : '-'; })
      .join('').split('-').filter(Boolean).join('-');
    return r.series_id ? base + '-' + parts(when || r.starts_at).ymd : base;
  }
  function href(r) { return '/run/' + slugOf(r) + '/'; }
  function miles(list) {
    if (!Array.isArray(list) || !list.length) return '';
    var lo = Math.min.apply(null, list), hi = Math.max.apply(null, list);
    return (lo === hi ? lo : lo + '–' + hi) + ' mi';
  }

  // ---------------------------------------------------------------- run rows
  function calendarHref(r) {
    function stamp(iso) { return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
    // The app's calendar rule (FORMCollectiveComposer.calendarEntry): long runs 2.5 h, otherwise 1.5 h.
    var start = r.meet_at || r.starts_at, minutes = r.kind === 'long_run' ? 150 : 90;
    var end = new Date(Date.parse(r.starts_at) + minutes * 60000).toISOString();
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Speed & Form//Group runs//EN', 'BEGIN:VEVENT',
      'UID:' + r.id + '@speedandform.com', 'DTSTAMP:' + stamp(new Date().toISOString()), 'DTSTART:' + stamp(start), 'DTEND:' + stamp(end),
      'SUMMARY:' + String(r.title).replace(/[,;\\]/g, ' ') + ' · Speed & Form',
      'LOCATION:' + [r.meet_name, r.meet_address].filter(Boolean).join(' ').replace(/[,;\\]/g, ' '),
      'URL:https://speedandform.com' + href(r), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }
  function runRow(r, linked) {
    var p = parts(r.starts_at), f = facts(r), s = session(r), off = r.status === 'cancelled';
    var kind = KIND[r.kind] + (off ? ' · Canceled' : '');
    // "6:00 AM meet · 6:15 run": AM/PM said once, on the first time shown.
    var times = r.meet_at ? clock(r.meet_at, true) + ' meet · ' + clock(r.starts_at) + ' run' : clock(r.starts_at, true) + ' run';
    var mp = meetPoint(r);
    var where = r.meet_name ? esc(r.meet_name) + (mp ? ' · ' + esc(mp) : '') : 'Place to be confirmed';
    var work = '';
    if (s) work = '<p class="gr-work">This week: <b>' + esc(s.title) + ' · ' + esc(s.sequence) + '</b></p>';
    else if (Array.isArray(f.distance_miles) && f.distance_miles.length) work = '<p class="gr-work">Group offer: <b>' + esc(miles(f.distance_miles) + (f.pace ? ' · ' + f.pace : '')) + '</b></p>';
    var acts = off ? '' : '<a href="' + calendarHref(r) + '" download="speed-and-form-' + p.ymd + '.ics">Add to calendar</a>' +
      (r.meet_name ? '<a href="https://maps.google.com/?q=' + encodeURIComponent([r.meet_name, r.meet_address].filter(Boolean).join(', ')) + '" target="_blank" rel="noopener">Directions</a>' : '');
    var name = linked ? '<a href="' + href(r) + '">' + esc(r.title) + '</a>' : esc(r.title);
    return '<article class="gr-row' + (off ? ' is-off' : '') + '">' +
      '<div class="gr-date" aria-label="' + esc(p.wd + ' ' + p.mon + ' ' + p.day) + '"><span class="gr-mono">' + esc(p.wd) + '</span><b>' + esc(p.day) + '</b><span class="gr-mono">' + esc(p.mon) + '</span><span class="gr-mono gr-dm">' + esc(p.mon) + '</span></div>' +
      '<div class="gr-what"><p class="gr-kind gr-mono">' + esc(kind) + '</p><h2>' + name + '</h2>' +
      (off ? '<p class="gr-q">Not meeting on this date.</p>' : '<p>' + esc(times) + '<br><span class="gr-q">' + where + '</span></p>' + work) +
      '</div><div class="gr-acts gr-mono">' + acts + '</div></article>';
  }
  function morningItem(r, photos, lead) {
    var p = parts(r.starts_at), place = r.meet_name || '';
    var line = p.day + ' ' + p.mon + ' ' + p.year + (place ? ' · ' + place : '');
    if (photos && photos.length) {
      return '<a class="gr-card' + (lead ? ' is-lead' : '') + '" href="' + href(r) + '">' +
        '<img class="gr-print" src="' + esc(MEDIA + photos[0].object_path) + '" alt="' + esc(title(r) + ', ' + line) + '" loading="' + (lead ? 'eager' : 'lazy') + '" decoding="async">' +
        '<div class="gr-meta gr-mono"><span>' + esc(line) + '</span><span>' + esc(KIND[r.kind]) + '</span></div>' +
        '<h3>' + esc(title(r)) + '</h3><p class="gr-n">' + photos.length + (photos.length === 1 ? ' photograph' : ' photographs') + '</p></a>';
    }
    return '<div class="gr-plain"><div><h3>' + esc(title(r)) + '</h3><p>' + esc(line) + '</p></div><span class="gr-mono gr-kindtag">' + esc(KIND[r.kind]) + '</span></div>';
  }

  // ---------------------------------------------------------------- /runs/
  function renderList() {
    var next = $('gr-next-rows'), mornings = $('gr-mornings');
    if (!next || !mornings) return;
    next.innerHTML = '<p class="gr-state">Checking the next runs…</p>';
    mornings.innerHTML = '<p class="gr-state">Loading the mornings…</p>';
    Promise.all([loadRuns(), loadGalleries().catch(function () { return null; })]).then(function (res) {
      var runs = res[0], gal = res[1];
      var upcoming = runs.filter(isUpcoming).sort(function (a, b) { return Date.parse(a.starts_at) - Date.parse(b.starts_at); }).slice(0, 6);
      next.innerHTML = upcoming.length ? upcoming.map(function (r) { return runRow(r, true); }).join('') :
        '<p class="gr-state">No group run is currently scheduled. The published mornings and photographs remain below.</p>';
      var past = runs.filter(function (r) { return r.status !== 'cancelled' && !isUpcoming(r); });
      window.FORM_GROUP_RUNS = { upcoming: upcoming.length, mornings: past.length };
      if (!gal) { mornings.innerHTML = '<p class="gr-state">The photographs can’t be loaded right now.<button type="button" data-gr-retry>Try again</button></p>'; return; }
      var leadUsed = false;
      mornings.innerHTML = past.length ? '<div class="gr-grid">' + past.map(function (r) {
        var photos = gal[r.id], lead = !leadUsed && !!(photos && photos.length);
        if (lead) leadUsed = true;
        return morningItem(r, photos, lead);
      }).join('') + '</div>' : '<p class="gr-state">Nothing here yet.</p>';
    }).catch(function () {
      next.innerHTML = '<p class="gr-state">Can’t load runs right now.<button type="button" data-gr-retry>Try again</button></p>';
      mornings.innerHTML = '';
      window.FORM_GROUP_RUNS = { error: true };
    });
  }

  // ---------------------------------------------------------------- album
  // FORMAlbumRow.compose: photo_essay = lead, then [single] [pair 1:1.7] [single] repeating;
  // cover_story = lead, pairs 1:1, a last single; sequence = numbered singles; contact_sheet = rows of 3.
  function compose(items, layout) {
    if (!items.length) return [];
    var rest = items.slice(1), rows = [];
    if (layout === 'contact_sheet') { for (var i = 0; i < items.length; i += 3) rows.push({ t: 'sheet', f: items.slice(i, i + 3) }); return rows; }
    if (layout === 'sequence') return items.map(function (f, n) { return { t: 'num', n: n + 1, f: [f] }; });
    rows.push({ t: 'lead', f: [items[0]] });
    if (layout === 'cover_story') {
      while (rest.length >= 2) rows.push({ t: 'pair', w: 'equal', f: rest.splice(0, 2) });
      if (rest.length) rows.push({ t: 'single', f: [rest[0]] });
      return rows;
    }
    var step = 0;
    while (rest.length) {
      if (step % 3 === 1 && rest.length >= 2) rows.push({ t: 'pair', w: 'wide', f: rest.splice(0, 2) });
      else rows.push({ t: 'single', f: [rest.shift()] });
      step++;
    }
    return rows;
  }
  function singleAspect(f) { var a = (f.width || 3) / Math.max(f.height || 2, 1); return Math.min(Math.max(a, 0.8), 1.6); }
  function frame(f, i, total, alt, extra, style) {
    return '<button type="button" class="gr-f' + (f.fit ? ' is-fit' : '') + (extra ? ' ' + extra : '') + '" data-i="' + i + '"' + (style ? ' style="' + style + '"' : '') +
      ' aria-label="Open photo ' + (i + 1) + ' of ' + total + '"><img src="' + esc(MEDIA + f.path) + '" alt="' + esc(alt + ', photo ' + (i + 1) + ' of ' + total) + '" loading="' + (i < 2 ? 'eager' : 'lazy') + '" decoding="async"' +
      ' data-fx="' + (f.focal_x == null ? 0.5 : f.focal_x) + '" data-fy="' + (f.focal_y == null ? 0.5 : f.focal_y) + '"></button>';
  }
  function renderEssay(items, layout, alt) {
    var n = items.length, idx = function (f) { return items.indexOf(f); };
    return compose(items, layout).map(function (row) {
      if (row.t === 'lead') return frame(row.f[0], 0, n, alt, 'gr-lead');
      if (row.t === 'single') return frame(row.f[0], idx(row.f[0]), n, alt, '', 'aspect-ratio:' + singleAspect(row.f[0]));
      if (row.t === 'num') return '<div class="gr-seq"><p class="gr-num" aria-hidden="true">' + String(row.n).padStart(2, '0') + '</p>' + frame(row.f[0], idx(row.f[0]), n, alt, '', 'aspect-ratio:' + singleAspect(row.f[0])) + '</div>';
      if (row.t === 'pair') return '<div class="gr-pair is-' + row.w + '">' + row.f.map(function (f) { return frame(f, idx(f), n, alt); }).join('') + '</div>';
      return '<div class="gr-sheet">' + row.f.map(function (f) { return frame(f, idx(f), n, alt); }).join('') + '</div>';
    }).join('');
  }
  // The app's focal placement: centre the focal point, never past an edge (FORMAlbumPhoto.placed).
  function placeFocal(img) {
    if (!img.naturalWidth || img.closest('.is-fit')) return;
    var box = img.getBoundingClientRect(), a = img.naturalWidth / img.naturalHeight;
    var scale = Math.max(box.width / a, box.height), dw = scale * a, dh = scale;
    function pos(size, drawn, f) {
      if (drawn - size < 0.5) return 50;
      var off = Math.min(0, Math.max(size - drawn, size / 2 - f * drawn));
      return off / (size - drawn) * 100;
    }
    img.style.objectPosition = pos(box.width, dw, +img.dataset.fx) + '% ' + pos(box.height, dh, +img.dataset.fy) + '%';
  }
  // Frames are addressed by their stable asset id (#a1b2c3d4), never by position.
  function frameKey(f) { return String(f.asset || f.path).replace(/[^a-z0-9]/gi, '').slice(0, 8); }
  // Who is in each photograph: confirmed tags of people whose profiles are visible
  // (collective_album_people). Hidden people never come back, so their name never shows.
  function loadPeople(runID) {
    return request('rpc/collective_album_people', { run: runID }).then(function (rows) {
      var by = {};
      (Array.isArray(rows) ? rows : []).forEach(function (r) { (by[r.asset] = by[r.asset] || []).push(r); });
      return by;
    }).catch(function () { return {}; });
  }
  function viewer(items, pageURL, people) {
    var v = $('gr-viewer'), img = v.querySelector('img'), count = v.querySelector('[data-count]'), at = 0, last = null;
    var who = v.querySelector('[data-people]');
    function paintPeople() {
      if (!who) return;
      var list = (people && people.map && people.map[items[at].asset]) || [];
      who.hidden = !list.length;
      who.innerHTML = list.length ? '<span class="gr-mono">In this photo</span>' + list.map(function (p) {
        return '<a href="/people/' + esc(p.slug) + '">' + (p.avatar ? '<img src="' + esc(p.avatar) + '" alt="" width="28" height="28">' : '') + esc(p.name) + '</a>';
      }).join('') : '';
    }
    if (people) people.ready = paintPeople;
    function show(i) { at = (i + items.length) % items.length; img.src = MEDIA + items[at].path; count.textContent = (at + 1) + ' / ' + items.length; v.querySelector('[data-open]').href = MEDIA + items[at].path; history.replaceState(null, '', '#' + frameKey(items[at])); paintPeople(); }
    function open(i) { last = document.activeElement; v.classList.add('is-open'); document.documentElement.classList.add('gr-locked'); show(i); v.querySelector('[data-close]').focus(); }
    function close() { v.classList.remove('is-open'); document.documentElement.classList.remove('gr-locked'); history.replaceState(null, '', location.pathname); if (last) last.focus(); }
    v.querySelector('[data-close]').onclick = close;
    v.querySelector('.is-prev').onclick = function () { show(at - 1); };
    v.querySelector('.is-next').onclick = function () { show(at + 1); };
    v.querySelector('[data-share]').onclick = function () {
      var url = pageURL + '#' + frameKey(items[at]);
      if (navigator.share) navigator.share({ url: url }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(url);
    };
    document.addEventListener('keydown', function (e) {
      if (!v.classList.contains('is-open')) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(at + 1); else if (e.key === 'ArrowLeft') show(at - 1);
      else if (e.key === 'Tab') { var f = [].slice.call(v.querySelectorAll('button,a')); var i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
    var sx = null, stage = v.querySelector('.gr-vstage');
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    stage.addEventListener('pointerup', function (e) { if (sx == null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1)); });
    return open;
  }
  function renderRunPage() {
    var root = $('gr-album');
    if (!root) return;
    var slug = decodeURIComponent((location.pathname.match(/^\/run\/([^/]+)\/?$/) || [])[1] || '').toLowerCase();
    function fail(msg, retry) {
      root.innerHTML = '<p class="gr-empty">' + msg + (retry ? ' <button type="button" data-gr-retry class="gr-mono">Try again</button>' : '') + ' <a class="gr-mono" href="/runs/">All group runs</a></p>';
      $('gr-title').textContent = 'Group runs';
      window.FORM_GROUP_ALBUM = { error: msg };
    }
    if (!slug) return fail('This run isn’t here.');
    Promise.all([loadRuns(), loadGalleries().catch(function () { return {}; })]).then(function (res) {
      var runs = res[0], gal = res[1];
      // A moved occurrence keeps the address it was shared under (its original date) and its new one.
      var matches = runs.filter(function (r) { return slugOf(r) === slug || (r.original_starts_at && slugOf(r, r.original_starts_at) === slug); });
      if (!matches.length) return fail('This run isn’t here.');
      if (matches.length > 1) return fail('More than one run has this address.');
      var run = matches[0], p = parts(run.starts_at), url = 'https://speedandform.com' + href(run);
      var canon = document.querySelector('link[rel=canonical]');
      if (canon) canon.href = url;
      if (isUpcoming(run)) {
        document.body.classList.add('is-dark', 'is-run');
        document.title = run.title + ' · ' + p.wd + ' ' + p.mon + ' ' + p.day + ' | Speed & Form';
        $('gr-title').textContent = run.title;
        $('gr-sub').textContent = run.status === 'cancelled' ? 'Canceled' : KIND[run.kind];
        $('gr-when').textContent = '';
        root.innerHTML = '<div class="gr-rows">' + runRow(run, false) + '</div>';
        $('gr-count').textContent = 'Miami time';
        window.FORM_GROUP_ALBUM = { run: true, title: run.title };
        return;
      }
      return loadAlbum(run.id).then(function (album) {
        var items = album && Array.isArray(album.items) && album.items.length ? album.items :
          (gal[run.id] || []).map(function (g) { return { asset: g.object_path, path: g.object_path, width: 3, height: 2 }; });
        var layout = (album && album.layout) || 'photo_essay';
        var name = title(run), date = p.day + ' ' + p.mon + ' ' + p.year;
        document.title = name + ' · ' + date + ' | Speed & Form';
        if (album && album.appearance === 'dark') document.body.classList.add('is-dark');
        $('gr-title').textContent = name;
        $('gr-sub').textContent = detail(run);
        $('gr-when').textContent = date;
        if (!items.length) { root.innerHTML = '<p class="gr-empty" style="padding:0">No photographs published from this morning.</p>'; $('gr-count').textContent = ''; window.FORM_GROUP_ALBUM = { photos: 0 }; return; }
        // A film needs the public bucket to accept video; until then a published film has no public copy.
        root.innerHTML = renderEssay(items, layout, name + ', ' + date);
        $('gr-count').textContent = items.length + (items.length === 1 ? ' photograph' : ' photographs');
        root.querySelectorAll('img').forEach(function (img) { img.addEventListener('load', function () { placeFocal(img); }); if (img.complete) placeFocal(img); });
        if (window.ResizeObserver) new ResizeObserver(function () { root.querySelectorAll('img').forEach(placeFocal); }).observe(root);
        var people = { map: {} };
        var open = viewer(items, url, people);
        loadPeople(run.id).then(function (m) { people.map = m; if (people.ready) people.ready(); });
        root.addEventListener('click', function (e) { var b = e.target.closest('.gr-f'); if (b) open(+b.dataset.i); });
        var older = runs.filter(function (r) { return r.status !== 'cancelled' && Date.parse(r.starts_at) < Date.parse(run.starts_at) && (gal[r.id] || []).length; })[0];
        var nx = $('gr-next-album');
        if (older && nx) { nx.href = href(older); nx.textContent = 'Next: ' + title(older) + ' →'; nx.hidden = false; }
        var key = String(location.hash).slice(1), hit = items.findIndex(function (f) { return frameKey(f) === key; });
        if (hit >= 0) open(hit);
        window.FORM_GROUP_ALBUM = { photos: items.length, layout: layout, title: name };
      });
    }).catch(function () { fail('This can’t be loaded right now.', true); });
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-gr-retry]')) { if ($('gr-album')) renderRunPage(); else renderList(); }
    var share = e.target.closest('[data-gr-share-page]');
    if (share) { var url = location.href.split('#')[0]; if (navigator.share) navigator.share({ url: url }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(url); }
  });
  window.FORM_GROUP_RUNS_COMPOSE = compose;
  window.FORM_GROUP_RUNS_SLUG = slugOf;
  if ($('gr-album')) renderRunPage(); else renderList();
}());
