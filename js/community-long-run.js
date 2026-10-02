/* Public Saturday long-run projection v1.
   Collective owns dated occurrences. The public community page only reads
   explicitly published fields and falls back to an unscheduled state. */
(function () {
  'use strict';
  var status = document.getElementById('long-run-status');
  var route = document.getElementById('long-run-route');
  var notice = document.getElementById('long-run-notice');
  if (!status) return;

  var zone = 'America/New_York';
  function day(value) {
    var parts = new Intl.DateTimeFormat('en-US', {timeZone:zone, year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date(value));
    function part(type) { return parts.find(function(p) { return p.type === type; }).value; }
    return part('year') + '-' + part('month') + '-' + part('day');
  }
  function dateLabel(value) {
    return new Intl.DateTimeFormat('en-US', {timeZone:zone, weekday:'long', month:'long', day:'numeric'}).format(new Date(value));
  }
  function time(value) {
    return new Intl.DateTimeFormat('en-US', {timeZone:zone, hour:'numeric', minute:'2-digit'}).format(new Date(value));
  }
  function unscheduled(message) {
    status.textContent = message || 'No long run scheduled yet';
    if (route) route.textContent = 'Changes around Miami';
    if (notice) notice.textContent = 'Exact route and meeting point are announced before each confirmed run';
  }
  function render(run) {
    if (run.status === 'cancelled') {
      status.textContent = dateLabel(run.starts_at) + ' · canceled';
      if (route) route.textContent = 'Check the next announcement';
      if (notice) notice.textContent = 'This dated run is not meeting. Check back for the next published occurrence.';
      return;
    }
    var facts = run.group_facts || {};
    status.textContent = dateLabel(run.starts_at) + (run.meet_at ? ' · meet ' + time(run.meet_at) : '');
    if (route) route.textContent = [run.meet_name, run.meet_address, facts.meet_point].filter(Boolean).join(' · ') || 'Miami · route published with the occurrence';
    if (notice) notice.textContent = facts.level ? facts.level + ' · confirm the dated details before traveling' : 'Confirmed occurrence · check the dated details before traveling';
  }

  unscheduled('Checking the next long run…');
  var today = day(Date.now());
  var query = new URLSearchParams({
    select:'title,meet_at,starts_at,meet_name,meet_address,group_facts,status,series_id',
    starts_at:'gte.' + today + 'T00:00:00Z',
    order:'starts_at.asc',
    limit:'40'
  });
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, 10000);

  window.FORM_LONG_RUN_READY = fetch('https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/collective_public_runs?' + query, {
    headers:{apikey:'sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj'},
    signal:controller.signal,
    cache:'no-store'
  }).then(function (response) {
    if (!response.ok) throw new Error('Schedule unavailable');
    return response.json();
  }).then(function (rows) {
    if (!Array.isArray(rows)) throw new Error('Invalid schedule');
    var run = rows.find(function (row) {
      if (!['scheduled','cancelled'].includes(row.status)) return false;
      if (!Number.isFinite(Date.parse(row.starts_at)) || day(row.starts_at) < today) return false;
      var haystack = [row.series_id, row.title].filter(Boolean).join(' ').toLowerCase();
      return /long[ -]?run|saturday/.test(haystack) && row.series_id !== 'track-thursday';
    });
    if (run) render(run); else unscheduled();
  }).catch(function () {
    unscheduled('Could not confirm the next long run');
  }).finally(function () {
    clearTimeout(timer);
  });
}());
