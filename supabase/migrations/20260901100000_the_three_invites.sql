-- The invitations for Hope, José and Marcus.
--
-- claim_access() matches a VERIFIED email against an unclaimed invite. Without a row
-- here an athlete taps Connect, receives the link, signs in, and is told there is no
-- invitation for them -- which reads as the app rejecting them rather than as
-- something nobody created yet.
--
-- The addresses are the ones from the Field roster, confirmed by Brice. Nothing here
-- grants access on its own: the athlete still has to prove the email is theirs, and
-- the invite is consumed the moment they do.

insert into public.access_invites (athlete_id, email, role)
select a.id, e.email, 'athlete'
  from (values
    ('hope',   'hsfinnane@icloud.com'),
    ('jose',   'josef@santosdesoto.net'),
    ('marcus', 'marcusballiette44@gmail.com')
  ) as e(slug, email)
  join public.athletes a on a.slug = e.slug
on conflict (athlete_id, email, role) do nothing;

do $$
declare open_invites integer;
begin
  select count(*) into open_invites from public.access_invites
   where claimed_at is null and email in
     ('hsfinnane@icloud.com','josef@santosdesoto.net','marcusballiette44@gmail.com');
  if open_invites <> 3 then
    raise exception 'expected three unclaimed athlete invites, found %', open_invites;
  end if;
end $$;
