-- Bootstrap the owner account discovered from the repository's authenticated
-- Git identity. The invitation grants only assigned-coach access and is claimed
-- after a verified Supabase session proves the same email address.

insert into public.access_invites (athlete_id, email, role)
select id, 'briceikouebe@gmail.com', 'coach'
from public.athletes
on conflict (athlete_id, email, role) do nothing;

