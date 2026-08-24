-- An invitation is never consumed merely because an auth row was created.
-- Only a session whose email has been verified may claim access.

create or replace function public.claim_access()
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text;
  caller_confirmed_at timestamptz;
  claimed integer := 0;
begin
  if caller_id is null then
    raise exception 'A verified email session is required';
  end if;

  select lower(u.email), u.email_confirmed_at
  into caller_email, caller_confirmed_at
  from auth.users u
  where u.id = caller_id;

  if caller_email is null or caller_email = '' or caller_confirmed_at is null then
    raise exception 'A verified email session is required';
  end if;

  insert into public.profiles (user_id, display_name)
  values (
    caller_id,
    coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', split_part(caller_email, '@', 1))
  )
  on conflict (user_id) do nothing;

  insert into public.athlete_memberships (athlete_id, user_id, role)
  select i.athlete_id, caller_id, i.role
  from public.access_invites i
  where i.email = caller_email
    and i.claimed_at is null
    and (i.expires_at is null or i.expires_at > now())
  on conflict do nothing;

  get diagnostics claimed = row_count;

  update public.access_invites i
  set claimed_by = caller_id, claimed_at = now()
  where i.email = caller_email
    and i.claimed_at is null
    and (i.expires_at is null or i.expires_at > now())
    and exists (
      select 1 from public.athlete_memberships m
      where m.athlete_id = i.athlete_id
        and m.user_id = caller_id
        and m.role = i.role
    );

  return claimed;
end;
$$;

revoke all on function public.claim_access() from public;
grant execute on function public.claim_access() to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

