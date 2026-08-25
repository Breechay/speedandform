-- Natalie's athlete invite. Every invite until now was a claimed coach invite of
-- Brice's, so her page has never been opened by a signed-in athlete.
--
-- claim_access matches on lower(email) from a VERIFIED session, so the stored
-- address is lowercased. When she signs in and the email is confirmed, the
-- membership is created and her record opens.

insert into public.access_invites (athlete_id, email, role)
select id, lower('Natalie.ramirez03@gmail.com'), 'athlete'
from public.athletes where slug = 'natalie'
on conflict do nothing;
