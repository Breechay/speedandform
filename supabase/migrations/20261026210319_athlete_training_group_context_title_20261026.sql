-- Optional editorial title when a group calendar day has no FORM prescription.
-- The field is not a workout prescription, RSVP, attendance, completion or verified occurrence.
-- Production Run 0440 context_title = 'Track Workout'; fixture data belongs in tests.

alter table public.athlete_training_groups
 add column context_title text;

comment on column public.athlete_training_groups.context_title is
 'Optional display title for a calendar-only group day with no FORM planned session. This is not a prescription, RSVP, attendance record or verified occurrence.';
