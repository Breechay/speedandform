-- The server's cron.timezone is GMT. This checks at 13:00 and 14:00 UTC
-- each Thursday/Saturday; the private worker itself requires 09:00-10:59
-- America/New_York, making DST transitions safe and duplicate checks no-ops.
-- No HTTP, email, push, athlete plan publication, or notification jobs.
select cron.schedule(
  'form-public-gatherings-rollover',
  '0 13,14 * * 4,6',
  'select form_rally_private.rollover_once();'
);
