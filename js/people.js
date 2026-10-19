/* Athletes: /people/ (directory and search) and /people/<slug> (a profile).
   Reads only what the server publishes to an anonymous caller (20261013230000):
   collective_people_directory(), collective_person(slug). Hidden people return nothing, so a
   hidden profile is gone from the directory, search and its own address alike. Only the fields
   each person chose come back; a draft bio never does. Photos are the person's confirmed tags:
   site library photographs (resolved through /media/library/library.json) and photos in live,
   public albums. A tag says who is in a photograph, not who attended. */
(function () {
  'use strict';
  var SUPA = 'https://pbgsjjegycacodiltbhn.supabase.co';
  var KEY = 'sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj';
  var MEDIA = SUPA + '/storage/v1/object/public/collective-media/';
  var ZONE = 'America/New_York';
  var KIND = { 'long run': 'Long run', track: 'Track', social: 'After the run', strength: 'Strength' };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function request(path, body) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 12000);
    var init = { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}),
      signal: controller.signal, cache: 'no-store', credentials: 'omit' };
    return fetch(SUPA + '/rest/v1/' + path, init).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('unavailable');
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }
  function library() {
    return fetch('/media/library/library.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('library'); return r.json(); })
      .then(function (lib) { var by = {}; (lib.photos || []).forEach(function (p) { by[p.id] = p; }); return by; });
  }
  // Same address the app shares (FORMCollectiveComposer.slug; js/group-runs.js slugOf).
  function runHref(title, startsAt, series) {
    var base = Array.from(String(title).toLowerCase()).map(function (c) { return /[\p{L}\p{N}]/u.test(c) ? c : '-'; }).join('').split('-').filter(Boolean).join('-');
    if (!series) return '/run/' + base;
    var ymd = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(startsAt));
    return '/run/' + base + '-' + ymd;
  }
  function day(iso) { return new Intl.DateTimeFormat('en-US', { timeZone: ZONE, month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso)); }
  function bestDate(d) { return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(new Date(d + 'T00:00:00Z')); }
  function sized(path, size) { return /-2400\.webp$/.test(path) ? path.replace(/-2400\.webp$/, '-' + size + '.webp') : path; }
  var IG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/></svg>';
  var STRAVA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l6-14 6 14"/><path d="M13 20l3.5-7 3.5 7"/></svg>';

  function canonical(path) { var c = document.querySelector('link[rel=canonical]'); if (c) c.href = 'https://speedandform.com' + path; }
  function ytThumb(id) { return 'https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/hqdefault.jpg'; }
  function libSrc(lib, id, size) { var ph = lib && lib[id]; return ph && ph.files ? (ph.files[size] || ph.files['1200'] || ph.files['1600'] || ph.files['800']) : ''; }
  var FILMS = SUPA + '/storage/v1/object/public/collective-films/';
  // Only objects in our known bucket and the session's own slug may be used.
  function hostedMedia(se, path, allowed) {
    var slug = String(se && se.slug || '');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return '';
    var value = String(path || '');
    var prefix = 'sessions/' + slug + '/';
    if (!value.startsWith(prefix)) return '';
    var file = value.slice(prefix.length);
    var match = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(mp4|jpg|webp)$/.exec(file);
    if (!match || allowed.indexOf(match[2]) === -1) return '';
    return FILMS + value;
  }
  function videoURL(se) { return hostedMedia(se, se && se.video_path, ['mp4']); }
  function sessionPoster(se, lib) {
    return hostedMedia(se, se && se.poster_path, ['jpg', 'webp']) ||
      (se && se.youtube_id ? ytThumb(se.youtube_id) :
      (se && se.poster ? libSrc(lib, se.poster, '1200') :
      (se && se.library && se.library[0] ? libSrc(lib, se.library[0], '1200') : '')));
  }
  function sessionDate(d) { return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(d + 'T00:00:00Z')); }
  var PLAY = '<span class="pp-play" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg></span>';
  // A session card: the film's poster (YouTube's frame, or a library photo) linking to the session page.
  function sessionCard(se, lib) {
    var img = sessionPoster(se, lib);
    var film = !!(videoURL(se) || se.youtube_id);
    return '<a class="pp-film" href="/session/' + esc(se.slug) + '"' + (film ? ' aria-label="Watch: ' + esc(se.title) + '"' : '') + '>' +
      (img ? '<span class="pp-film-frame"><img src="' + esc(img) + '" alt="" loading="lazy">' + (film ? PLAY : '') + '</span>' : '') +
      '<b>' + esc(se.title) + '</b><span>' + esc([se.detail, sessionDate(se.date)].filter(Boolean).join(' · ')) + '</span></a>';
  }

  function monogram(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    var initials = (parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '');
    return '<span class="pp-monogram" aria-hidden="true">' + esc(initials.toUpperCase()) + '</span>';
  }

  // ---------------------------------------------------------------- directory
  function renderDirectory() {
    var list = $('pp-list'), find = $('pp-find'), note = $('pp-note'), people = [];
    function paint() {
      var q = (find.value || '').trim().toLowerCase().replace(/^@/, '');
      var shown = people.filter(function (p) {
        return !q || String(p.name).toLowerCase().indexOf(q) >= 0 || String(p.instagram || '').toLowerCase().indexOf(q) >= 0;
      });
      list.innerHTML = shown.map(function (p) {
        var media = p.avatar
          ? '<img class="pp-card-img" src="' + esc(p.avatar) + '" alt="" loading="lazy">'
          : monogram(p.name);
        var sub = p.bio || p.discipline || (p.instagram ? '@' + p.instagram : '');
        return '<li class="pp-card"><a href="/people/' + esc(p.slug) + '">' +
          '<div class="pp-card-media">' + media + '</div>' +
          '<div class="pp-card-info"><b>' + esc(p.name) + '</b>' +
          (sub ? '<small>' + esc(sub) + '</small>' : '') +
          '</div></a></li>';
      }).join('');
      note.textContent = people.length && !shown.length ? 'No one by that name yet.' : '';
      window.FORM_PEOPLE = { shown: shown.length, total: people.length };
    }
    function load() {
      note.textContent = 'Loading…';
      request('rpc/collective_people_directory').then(function (rows) {
        people = (Array.isArray(rows) ? rows : []).map(function (r) { return r.person || r; }).filter(function (p) { return p && p.slug && p.name; });
        if (!people.length) { note.textContent = 'No profiles yet.'; window.FORM_PEOPLE = { shown: 0, total: 0 }; return; }
        paint();
      }).catch(function () {
        note.innerHTML = 'This can’t be loaded right now. <button type="button" data-pp-retry>Try again</button>';
        window.FORM_PEOPLE = { error: true };
      });
    }
    find.addEventListener('input', paint);
    document.addEventListener('click', function (e) { if (e.target.closest('[data-pp-retry]')) load(); });
    load();
  }

  // ---------------------------------------------------------------- profile
  function renderProfile() {
    var root = $('pp-profile');
    var slug = decodeURIComponent((location.pathname.match(/^\/people\/([^/]+)\/?$/) || [])[1] || '').toLowerCase();
    function missing(msg, retry) {
      document.title = 'Athletes | Speed & Form';
      root.innerHTML = '<section class="pp-missing"><h1>' + esc(msg) + '</h1><p class="pp-note">' +
        (retry ? '<button type="button" data-pp-retry>Try again</button> · ' : '') + '<a href="/people/">All athletes</a></p></section>';
      window.FORM_PERSON = { error: msg };
    }
    function load() {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return missing('This profile isn’t here.');
      Promise.all([request('rpc/collective_person', { slug: slug }), library().catch(function () { return {}; })]).then(function (res) {
        var p = res[0], lib = res[1];
        if (!p || !p.slug) return missing('This profile isn’t here.');
        paint(p, lib);
      }).catch(function () { missing('This can’t be loaded right now.', true); });
    }
    function paint(p, lib) {
      document.title = p.name + ' | Speed & Form';
      canonical('/people/' + p.slug);
      var hero = p.hero ? '<img class="pp-hero" src="' + esc(sized(p.hero.path, 1200)) + '" srcset="' + esc(sized(p.hero.path, 1200)) + ' 1200w, ' + esc(p.hero.path) + ' 2400w" sizes="(max-width:760px) 100vw, 560px" alt="' + esc(p.name) + '" style="object-position:' + (p.hero.focal_x * 100) + '% ' + (p.hero.focal_y * 100) + '%">' : '';
      var links = (p.instagram ? '<a href="https://instagram.com/' + esc(p.instagram) + '" rel="noopener" target="_blank">' + IG + '@' + esc(p.instagram) + '</a>' : '') +
        (p.strava ? '<a href="' + esc(p.strava) + '" rel="noopener" target="_blank">' + STRAVA + 'Strava</a>' : '');
      var now = p.now ? '<div class="pp-now"><p class="pp-mono">Now</p><b>' + esc(p.now.title) + '</b>' + (p.now.detail ? '<p class="pp-q">' + esc(p.now.detail) + '</p>' : '') +
        (p.now.url ? '<a href="' + esc(p.now.url) + '">Follow the study ↗</a>' : '') + '</div>' : '';
      var best = p.best ? '<div class="pp-best"><p class="pp-mono">Best</p><b>' + esc(p.best.time) + '</b><p class="pp-q">' +
        esc([p.best.event, p.best.place, p.best.date ? bestDate(p.best.date) : null].filter(Boolean).join(' · ')) + '</p></div>' : '';

      // Photos & films, grouped: album photos by run (newest first), library photos by kind.
      var groups = [];
      var byRun = {};
      (p.album || []).forEach(function (a) {
        var g = byRun[a.run_id];
        if (!g) { g = byRun[a.run_id] = { title: a.run_title, sub: day(a.starts_at), href: runHref(a.run_title, a.starts_at, a.series_id), photos: [] }; groups.push(g); }
        g.photos.push({ src: MEDIA + a.path, alt: a.run_title, fx: a.focal_x, fy: a.focal_y });
      });
      var byKind = {};
      (p.library || []).forEach(function (id) {
        var ph = lib[id]; if (!ph || !ph.files) return;
        var label = KIND[ph.kind] || 'Photographs';
        var g = byKind[label];
        if (!g) { g = byKind[label] = { title: label, sub: '', href: null, photos: [] }; groups.push(g); }
        var f = ph.files['1200'] || ph.files['1600'] || ph.files['800'] || ph.files[Object.keys(ph.files)[0]];
        g.photos.push({ src: f, alt: ph.alt || label, fx: ph.focal ? ph.focal.x : 0.5, fy: ph.focal ? ph.focal.y : 0.5 });
      });
      var count = groups.reduce(function (n, g) { return n + g.photos.length; }, 0);
      var media = groups.map(function (g) {
        var n = g.photos.length + (g.photos.length === 1 ? ' photo' : ' photos');
        var head = '<span>' + esc(g.title) + '</span><span>' + esc([g.sub, n].filter(Boolean).join(' · ')) + (g.href ? ' ›' : '') + '</span>';
        return '<div class="pp-group">' + (g.href ? '<a href="' + esc(g.href) + '">' + head + '</a>' : '<p>' + head + '</p>') +
          '<div class="pp-grid' + (g.photos.length === 1 ? ' is-one' : '') + '">' + g.photos.map(function (ph) {
            return '<img src="' + esc(ph.src) + '" alt="' + esc(ph.alt) + '" loading="lazy" style="object-position:' + ((ph.fx == null ? 0.5 : ph.fx) * 100) + '% ' + ((ph.fy == null ? 0.5 : ph.fy) * 100) + '%">';
          }).join('') + '</div></div>';
      }).join('');

      root.innerHTML =
        '<div class="pp-head">' + hero + '<div class="pp-intro">' +
          '<div class="pp-idline">' + (p.avatar ? '<img class="pp-av" src="' + esc(p.avatar) + '" alt="" width="56" height="56">' : '') +
            '<p class="pp-mono">' + esc(['Athlete', p.discipline].filter(Boolean).join(' · ')) + '</p></div>' +
          '<h1>' + esc(p.name) + '</h1>' +
          (p.bio ? '<p class="pp-bio">' + esc(p.bio) + '</p>' : '') +
          (p.discipline ? '<p class="pp-disc">' + esc(p.discipline) + '</p>' : '') +
          (links ? '<div class="pp-links">' + links + '</div>' : '') +
          (now || best ? '<div class="pp-facts">' + now + best + '</div>' : '') +
          ((p.sessions || []).length ? '<section class="pp-sessions" aria-label="Film"><p class="pp-mono">' + ((p.sessions || []).some(function (x) { return videoURL(x) || x.youtube_id; }) ? 'Film' : 'Sessions') + '</p>' + p.sessions.map(function (x) { return sessionCard(x, lib); }).join('') + '</section>' : '') +
        '</div></div>' +
        (count ? '<section class="pp-media" aria-label="Photos and films"><h2>Photos & films</h2>' + media + '</section>' : '') +
        '<p class="pp-foot">Speed & Form, Miami.</p>';
      // Mobile reorder: the avatar sits beside the name, as on the app profile.
      var idl = root.querySelector('.pp-idline'), h1 = root.querySelector('.pp-intro h1');
      if (window.matchMedia('(max-width:760px)').matches && idl && h1) idl.appendChild(h1);
      window.FORM_PERSON = { slug: p.slug, photos: count, groups: groups.length, sessions: (p.sessions || []).length, fields: Object.keys(p).sort() };
    }
    document.addEventListener('click', function (e) { if (e.target.closest('[data-pp-retry]')) load(); });
    load();
  }

  // ---------------------------------------------------------------- session
  function renderSession() {
    var root = $('pp-session');
    var slug = decodeURIComponent((location.pathname.match(/^\/session\/([^/]+)\/?$/) || [])[1] || '').toLowerCase();
    function missing(msg, retry) {
      root.innerHTML = '<section class="pp-missing"><h1>' + esc(msg) + '</h1><p class="pp-note">' +
        (retry ? '<button type="button" data-pp-retry>Try again</button> · ' : '') + '<a href="/people/">All athletes</a></p></section>';
      window.FORM_SESSION = { error: msg };
    }
    function embed(id, title) {
      return '<div class="pp-embed"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?rel=0&modestbranding=1&playsinline=1" title="' + esc(title) +
        '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>';
    }
    function nativePlayer(se, lib) {
      var url = videoURL(se);
      if (!url) return '';
      var poster = sessionPoster(se, lib);
      return '<div class="pp-embed"><video class="pp-native-video"' + (se.slug === 'adrian-7x800-2026-10-14' ? ' muted' : '') + ' controls playsinline preload="metadata"' +
        (poster ? ' poster="' + esc(poster) + '"' : '') + ' aria-label="' + esc(se.title) +
        '"><source src="' + esc(url) + '" type="video/mp4">Your browser cannot play this video.</video></div>';
    }
    function load() {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return missing('This session isn’t here.');
      Promise.all([request('rpc/collective_session', { slug: slug }), library().catch(function () { return {}; })]).then(function (res) {
        var se = res[0], lib = res[1];
        if (!se || !se.slug) return missing('This session isn’t here.');
        document.title = se.title + ' | Speed & Form';
        canonical('/session/' + se.slug);
        var who = (se.people || []).map(function (p) {
          return '<a href="/people/' + esc(p.slug) + '">' + (p.avatar ? '<img src="' + esc(p.avatar) + '" alt="" width="32" height="32">' : '') + esc(p.name) + '</a>';
        }).join('');
        var clips = (se.clips || []).filter(function (c) { return c && c.youtube_id; });
        var photos = (se.library || []).map(function (id) { var ph = lib[id]; return ph ? '<img src="' + esc(libSrc(lib, id, '1200')) + '" alt="' + esc(ph.alt || '') + '" loading="lazy">' : ''; }).join('');
        root.innerHTML =
          '<section class="pp-sess-head"><p class="pp-mono">' + esc(['Session', sessionDate(se.date), se.place].filter(Boolean).join(' · ')) + '</p>' +
          '<h1>' + esc(se.title) + '</h1>' + (se.detail ? '<p class="pp-bio">' + esc(se.detail) + '</p>' : '') +
          (who ? '<div class="pp-who">' + who + '</div>' : '') + '</section>' +
          (videoURL(se) ? nativePlayer(se, lib) : (se.youtube_id ? embed(se.youtube_id, se.title) : (sessionPoster(se, lib) ? '<img class="pp-hero pp-wide" src="' + esc(sessionPoster(se, lib)) + '" alt="">' : ''))) +
          (clips.length ? '<section class="pp-media"><h2>Clips</h2><div class="pp-clips">' + clips.map(function (c) {
            return '<figure>' + embed(c.youtube_id, c.title || se.title) + (c.title ? '<figcaption>' + esc(c.title) + '</figcaption>' : '') + '</figure>';
          }).join('') + '</div></section>' : '') +
          (photos ? '<section class="pp-media"><h2>Photos</h2><div class="pp-grid">' + photos + '</div></section>' : '') +
          (se.run ? '<p class="pp-note"><a href="' + esc(runHref(se.run.title, se.run.starts_at, se.run.series_id)) + '">' + esc(se.run.title) + ' · the group run ›</a></p>' : '') +
          '<p class="pp-foot">Speed & Form, Miami.</p>';
        window.FORM_SESSION = { slug: se.slug, film: !!(videoURL(se) || se.youtube_id), hosted: !!videoURL(se), clips: clips.length, people: (se.people || []).length };
      }).catch(function () { missing('This can’t be loaded right now.', true); });
    }
    document.addEventListener('click', function (e) { if (e.target.closest('[data-pp-retry]')) load(); });
    load();
  }

  if ($('pp-session')) renderSession(); else if ($('pp-profile')) renderProfile(); else if ($('pp-list')) renderDirectory();
}());
