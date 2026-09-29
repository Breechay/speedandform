// Run with FORM: the public web door. Reads the same production runs the FORM app reads, as
// anyone can (published FORM runs, their details and changes, public counts). Never names.
// Rules mirror the app composer (FORMCollectiveComposers.swift): one time format on rows,
// canonical meet points, one "Was" line for a change, counts only for past runs.
(function () {
  "use strict";

  const API = "https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/";
  // Publishable key: public by design; row-level security decides what anyone can read.
  const KEY = "sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj";
  const ZONE = "America/New_York";

  // "I'm in" until the app is on the App Store: an honest handoff, never a fake web RSVP.
  // When the app ships, set mode to "app" (the same /run/<slug> URL opens the native run).
  const JOIN = {
    mode: "instagram",
    url: "https://ig.me/m/form.practice",
    label: "I'm in",
    note: "Message @form.practice to be counted in.",
  };

  // Strava is where the club lives (discovery, activities). It is never the RSVP.
  const STRAVA = "https://strava.app.link/xvSVVKcCP6b";
  const footer = `<footer class="foot"><a href="${STRAVA}" rel="noopener">FORM on Strava ↗</a></footer>`;

  const MEET_POINTS = { "Flamingo Park Track": "Bench by the bleachers", "The Labs": "Front entrance" };
  const WEATHER = "We call it by 5:00 AM. If there's lightning, we delay or cancel the run here.";
  const TURNAROUNDS = "Self-supported. Start with the group. Take the distance that fits your day.";

  const app = document.getElementById("app");

  // ---------- data ----------
  async function get(path, body) {
    const res = await fetch(API + path, {
      method: body ? "POST" : "GET",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(path + " " + res.status);
    return res.json();
  }

  async function load() {
    const [runs, details, changes, terms, counts] = await Promise.all([
      get("collective_runs?select=id,author_kind,kind,series_id,title,visibility,meet_at,starts_at,meet_name,meet_address,group_facts,created_at&order=starts_at"),
      get("collective_run_details?select=run_id,group_facts,issued_at&order=issued_at").catch(() => []),
      get("collective_run_changes?select=run_id,kind,meet_at,starts_at,meet_name,meet_address,issued_at&order=issued_at"),
      get("collective_run_series_terms?select=series_id,effective_from,meet_minute,run_minute,warm_up_arrival,warm_up_together,warm_up_strides,issued_at").catch(() => []),
      get("rpc/collective_public_in_counts", {}),
    ]);
    const countBy = Object.fromEntries(counts.map((c) => [c.run_id, c.in_count]));
    return runs
      .filter((r) => r.author_kind === "form" && r.visibility === "public")
      .map((r) => compose(r, details, changes, terms, countBy[r.id] || 0));
  }

  // One run as it stands now: details resolve key by key in issue order; changes apply in order.
  function compose(r, details, changes, terms, count) {
    const facts = Object.assign({}, r.group_facts || {});
    details.filter((d) => d.run_id === r.id).forEach((d) => Object.assign(facts, d.group_facts));
    let cur = { meetAt: r.meet_at, startsAt: r.starts_at, meetName: r.meet_name, meetAddress: r.meet_address };
    let was = null;
    let cancelled = false;
    changes.filter((c) => c.run_id === r.id).forEach((c) => {
      if (c.kind === "cancelled") { cancelled = true; return; }
      const before = Object.assign({}, cur);
      if (c.kind === "time") { cur.meetAt = c.meet_at; cur.startsAt = c.starts_at; }
      if (c.kind === "place") { cur.meetName = c.meet_name; cur.meetAddress = c.meet_address; }
      const arriveBefore = before.meetAt || before.startsAt, arriveNow = cur.meetAt || cur.startsAt;
      if (arriveBefore !== arriveNow) was = "Was " + bareClock(arriveBefore);
      else if (before.meetName !== cur.meetName) was = "Was " + before.meetName;
    });
    const series = terms
      .filter((t) => t.series_id === r.series_id && t.effective_from <= dayKey(cur.startsAt) && (!r.created_at || t.issued_at <= r.created_at))
      .sort((a, b) => (a.effective_from + a.issued_at).localeCompare(b.effective_from + b.issued_at))
      .pop();
    return {
      id: r.id, kind: r.kind, title: r.title, seriesId: r.series_id,
      meetAt: cur.meetAt, startsAt: cur.startsAt, meetName: cur.meetName, meetAddress: cur.meetAddress,
      meetPoint: facts.meet_point || MEET_POINTS[cur.meetName] || null,
      host: facts.host || null, facts, was, cancelled, count, series,
      slug: slug(r.title, r.series_id, cur.startsAt),
      over: dayOver(cur.startsAt),
    };
  }

  // ---------- time (Miami) ----------
  const fmt = (opts) => new Intl.DateTimeFormat("en-US", Object.assign({ timeZone: ZONE }, opts));
  const clock = (iso) => fmt({ hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  const bareClock = (iso) => clock(iso).replace(/\s?[AP]M$/, "");
  const dayKey = (iso) => fmt({ year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso)).replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$1-$2");
  const shortDay = (iso) => fmt({ weekday: "short" }).format(new Date(iso));
  const longDay = (iso) => fmt({ weekday: "long" }).format(new Date(iso));
  const monthDay = (iso) => fmt({ month: "short", day: "numeric" }).format(new Date(iso));
  const dayOver = (iso) => dayKey(new Date().toISOString()) > dayKey(iso);
  const minuteClock = (m) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")}`;

  // Same rule as the app: a one-off is its title; a series occurrence carries its Miami date.
  function slug(title, seriesId, startsAt) {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return seriesId ? `${base}-${dayKey(startsAt)}` : base;
  }

  // ---------- words ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const eyebrow = (r) => (r.kind === "track" ? "Track Thursday" : r.kind === "long_run" ? "Group long run" : "Group run");
  const miles = (a) => (a.length > 1 && a[0] !== a[a.length - 1] ? `${a[0]}–${a[a.length - 1]}` : `${a[0]}`) + " mi";
  function distance(r) {
    if (r.facts.distance_miles && r.facts.distance_miles.length) return miles(r.facts.distance_miles);
    if (r.facts.together_miles) return `${r.facts.together_miles} mi`;
    return null;
  }
  function dose(r) {
    if (r.kind === "track") return r.facts.level || null;
    const d = distance(r);
    if (!d) return "Details Thursday";
    return [d, r.facts.pace].filter(Boolean).join(" · ");
  }
  const meta = (r) => `${r.meetName} · ${clock(r.meetAt || r.startsAt)}`;
  const mapsURL = (r) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${r.meetName}, ${r.meetAddress}`);

  // ---------- door ----------
  function door(runs) {
    const upcoming = runs.filter((r) => !r.over);
    const past = runs.filter((r) => r.over && !r.cancelled).reverse();
    const row = (r, archived) => `
      <a class="row${r.cancelled ? " cancelled" : ""}" href="/run/${esc(r.slug)}">
        <div><div class="row-day">${esc(shortDay(r.startsAt))}</div><div class="row-date">${esc(monthDay(r.startsAt))}</div></div>
        <div>
          <div class="eyebrow">${esc(eyebrow(r))}</div>
          <div class="row-title">${esc(r.title)}</div>
          ${archived ? `<div class="row-dose">${esc([distance(r), r.count ? `${r.count} runners` : null].filter(Boolean).join(" · "))}</div>`
                     : dose(r) ? `<div class="row-dose">${esc(dose(r))}</div>` : ""}
          <div class="row-meta${r.was ? " now" : ""}">${esc(meta(r))}</div>
          ${r.was && !archived ? `<div class="row-meta">${esc(r.was)}</div>` : ""}
          ${r.cancelled ? `<div class="flag">Cancelled</div>` : ""}
        </div>
      </a>`;
    return `
      <section class="intro">
        <h1>Run with FORM.</h1>
        <p>Runs anyone can join. Say you're in and show up.</p>
      </section>
      <section class="section" aria-labelledby="up">
        <h2 id="up">Upcoming</h2>
        ${upcoming.length ? upcoming.map((r) => row(r, false)).join("")
          : `<div class="empty"><strong>Nothing posted yet.</strong><span>Thursday track and Saturday long runs show up here once they're set.</span></div>`}
      </section>
      ${past.length ? `<section class="section" aria-labelledby="past"><h2 id="past">Past runs</h2>${past.map((r) => row(r, true)).join("")}</section>` : ""}`;
  }

  // ---------- one run ----------
  function page(r) {
    const fact = (label, html) => `<div class="fact"><dt>${esc(label)}</dt><dd>${html}</dd></div>`;
    const struck = r.cancelled ? " struck" : "";
    const when = r.meetAt
      ? `<strong class="${struck}">Meet ${esc(clock(r.meetAt))}</strong><span class="sub${struck}">Run ${esc(clock(r.startsAt))}</span>`
      : `<strong class="${struck}">Start ${esc(clock(r.startsAt))}</strong>`;
    const where = `<strong>${esc(r.meetName)}</strong>${r.meetPoint ? `<span>${esc(r.meetPoint)}</span>` : ""}
      <span class="sub"><a href="${esc(mapsURL(r))}" rel="noopener">${esc(r.meetAddress)}</a></span>`;
    const t = r.series;
    const warm = r.kind === "track" && t && t.warm_up_arrival
      ? `<span>When you arrive: ${esc(t.warm_up_arrival)}</span><span>Together: ${esc(t.warm_up_together)}</span><span>Strides: ${esc(t.warm_up_strides)}</span><span class="sub">Then the workout.</span>`
      : null;
    const rows = [
      fact("When", `<strong>${esc(longDay(r.startsAt))}, ${esc(monthDay(r.startsAt))}</strong>${when}${r.was ? `<span class="was">${esc(r.was)}</span>` : ""}`),
      fact("Where", where),
    ];
    if (r.over) {
      const d = distance(r);
      const big = `<div class="big">${d ? `<div><b>${esc(d.replace(" mi", ""))}</b><span>Miles</span></div>` : ""}${r.count ? `<div><b>${r.count}</b><span>Runners</span></div>` : ""}</div>`;
      return `
        <a class="back" href="/run">← All runs</a>
        <header class="run-head"><div class="eyebrow">${esc(eyebrow(r))}</div><h1>${esc(r.title)}</h1></header>
        ${big}
        <dl class="facts">${rows.join("")}</dl>
        <div class="action"><a class="btn" href="/run">See upcoming runs</a></div>`;
    }
    if (r.host) rows.push(fact("Host", esc(r.host)));
    if (warm) rows.push(fact("Warm-up", warm));
    if (r.kind === "track") rows.push(fact("Session", r.facts.workout_session_id ? "Posted" : "Workout posts Wednesday"));
    const d = distance(r);
    if (r.kind === "long_run") rows.push(fact("Distance", d ? esc(d) : "Details Thursday"));
    if (r.facts.pace) rows.push(fact(r.kind === "long_run" ? "Easy" : "Pace", `${esc(r.facts.pace)}${r.facts.pace_metric ? `<span class="sub">${esc(r.facts.pace_metric)}</span>` : ""}`));
    if (r.facts.level) rows.push(fact("Level", esc(r.facts.level)));
    if (r.kind === "long_run" && !r.cancelled) rows.push(fact("Turnarounds", esc(TURNAROUNDS)));
    if (!r.cancelled) rows.push(fact("Weather", esc(WEATHER)));
    const action = r.cancelled
      ? `<div class="action"><p><strong>This run is cancelled.</strong></p></div>`
      : `<div class="action sticky"><a class="btn" href="${esc(JOIN.url)}" rel="noopener">${esc(JOIN.label)}</a><p>${esc(JOIN.note)}</p></div>`;
    return `
      <a class="back" href="/run">← All runs</a>
      <header class="run-head"><div class="eyebrow${r.cancelled ? " is-cancelled" : ""}">${r.cancelled ? "Cancelled" : esc(eyebrow(r))}</div><h1>${esc(r.title)}</h1></header>
      <dl class="facts">${rows.join("")}</dl>
      ${action}`;
  }

  function render(html, title) {
    app.innerHTML = html + footer;
    if (title) document.title = title;
  }

  function showError() {
    render(`<div class="state"><strong>Can't load runs.</strong>Check your connection and try again.<br><button class="retry" type="button">Try again</button></div>`);
    app.querySelector(".retry").addEventListener("click", start);
  }

  async function start() {
    render(`<p class="state">Loading runs…</p>`);
    let runs;
    try { runs = await load(); } catch (e) { showError(); return; }
    const m = location.pathname.match(/^\/run\/([a-z0-9-]{1,80})\/?$/);
    if (!m) { render(door(runs), "Run with FORM | Group runs in Miami"); return; }
    const r = runs.find((x) => x.slug === m[1]);
    if (!r) {
      render(`<a class="back" href="/run">← All runs</a><div class="state"><strong>This run isn't posted.</strong>See what's coming up on <a href="/run">Run with FORM</a>.</div>`, "Run with FORM");
      return;
    }
    render(page(r), `${r.title}, ${monthDay(r.startsAt)} | Run with FORM`);
  }

  start();
})();
