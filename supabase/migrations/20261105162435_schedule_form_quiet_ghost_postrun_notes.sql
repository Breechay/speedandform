-- Separate from the public-event cron: run fifteen minutes later, after
-- successful one-ahead rollover, and never trigger a notification.
select cron.schedule('form-quiet-postrun-ghost-notes','15 13,14 * * 4,6',
  'select form_rally_private.enqueue_due_ghost();');
