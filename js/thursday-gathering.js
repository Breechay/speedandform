/* Public gathering projection v1. Collective owns dated attendance logistics;
   community-schedule owns only explicitly authored workout descriptions. */
(function () {
  'use strict';
  var schedule = (window.FORM_COMMUNITY_SCHEDULE || {}).thursday;
  if (!schedule) return;
  var zone = 'America/New_York';
  function text(id, value) { var el = document.getElementById(id); if (el) el.textContent = value; }
  function day(value) {
    var parts = new Intl.DateTimeFormat('en-US', {timeZone:zone, year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(new Date(value));
    function part(type) { return parts.find(function(p) { return p.type === type; }).value; }
    return part('year') + '-' + part('month') + '-' + part('day');
  }
  function time(value) { return new Intl.DateTimeFormat('en-US', {timeZone:zone, hour:'numeric', minute:'2-digit'}).format(new Date(value)); }
  function location(name, detail) {
    var link = document.querySelector('.loc-link');
    if (link) { link.textContent = name; link.href = 'https://maps.google.com/?q=' + encodeURIComponent(name + ', ' + detail); }
    text('thu-location-detail', detail);
  }
  function fallback(message) {
    text('thu-gathering-status', message);
    text('thu-eyebrow', 'Recurring Thursday practice');
    text('thu-when', schedule.whenLabel);
    text('thu-time-note', 'Usual time, not a confirmed date. Contact Brice before traveling.');
    text('thu-session-name', 'Workout to be confirmed');
    text('thu-session-code', 'Not yet published');
    text('thu-rotation-line', 'The workout is confirmed separately from the gathering. Ask Brice if you need details before attending.');
    location(schedule.locationName, schedule.locationCity + ' · ' + schedule.locationDetail);
  }
  function render(run) {
    var dateLabel = new Intl.DateTimeFormat('en-US', {timeZone:zone, weekday:'long', month:'long', day:'numeric'}).format(new Date(run.starts_at));
    text('thu-eyebrow', dateLabel);
    location(run.meet_name, [run.meet_address, (run.group_facts || {}).meet_point].filter(Boolean).join(' · '));
    text('thu-audience', (run.group_facts || {}).level || schedule.audience);
    if (run.status === 'cancelled') {
      text('thu-gathering-status', 'Gathering canceled');
      text('thu-when', 'Not meeting on this date');
      text('thu-time-note', 'Check back for the next published gathering.');
      text('thu-session-name', 'No session');
      text('thu-session-code', 'Canceled');
      text('thu-rotation-line', 'This dated gathering has been canceled.');
      return;
    }
    text('thu-gathering-status', 'Gathering confirmed');
    text('thu-when', (run.meet_at ? 'Meet ' + time(run.meet_at) + ' · ' : '') + 'Run ' + time(run.starts_at));
    text('thu-time-note', 'Miami time · ' + dateLabel);
    var authored = schedule.authored.find(function(entry) { return entry.date === day(run.starts_at); });
    var workout = authored && Number.isInteger(authored.idx) ? schedule.sessions[authored.idx] : null;
    text('thu-session-name', workout ? workout.name : 'Workout to be confirmed');
    text('thu-session-code', workout ? 'Session ' + workout.session : 'Details pending');
    text('thu-rotation-line', workout ? 'This week’s work: ' + workout.name + '.' : 'The gathering is confirmed. Brice will share the workout details separately.');
  }
  fallback('Checking the next gathering…');
  text('thu-audience', schedule.audience);
  var today = day(Date.now());
  // Start early enough for any Miami UTC offset, then filter by the local date.
  var query = new URLSearchParams({select:'title,meet_at,starts_at,meet_name,meet_address,group_facts,status', series_id:'eq.track-thursday', starts_at:'gte.' + today + 'T00:00:00Z', order:'starts_at.asc', limit:'12'});
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 10000);
  window.FORM_THURSDAY_READY = fetch('https://pbgsjjegycacodiltbhn.supabase.co/rest/v1/collective_public_runs?' + query, {
    headers:{apikey:'sb_publishable_5Dg5TUvnh2mEo-zCYAbgmw_WHNXKDqj'}, signal:controller.signal, cache:'no-store'
  }).then(function(response) {
    if (!response.ok) throw new Error('Schedule unavailable');
    return response.json();
  }).then(function(rows) {
    if (!Array.isArray(rows)) throw new Error('Invalid schedule');
    var run = rows.find(function(row) { return ['scheduled','cancelled'].includes(row.status) && Number.isFinite(Date.parse(row.starts_at)) && day(row.starts_at) >= today; });
    if (run) render(run); else fallback('Next gathering not yet published');
  }).catch(function() { fallback('Could not confirm the next gathering'); })
    .finally(function() { clearTimeout(timer); });
}());
