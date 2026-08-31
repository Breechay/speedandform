-- The authenticated session, not the client, resolves the athlete identity.
-- FORM needs this small receipt after claim_access() in order to request the
-- complete assigned block. No client-supplied athlete id is accepted here.

create or replace function public.coaching_access_identity()
returns jsonb
language plpgsql stable security definer set search_path = public, auth, pg_temp
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'A signed-in account is required';
  end if;
  select jsonb_build_object('athlete_id', a.id, 'display_name', a.display_name)
    into result
    from public.athlete_memberships m
    join public.athletes a on a.id = m.athlete_id
   where m.user_id = auth.uid()
     and m.role = 'athlete'
     and m.status = 'active'
     and a.active
   limit 1;
  if result is null then
    raise exception 'No active coaching invitation was found for this verified email';
  end if;
  return result;
end;
$$;

revoke all on function public.coaching_access_identity() from public, anon;
grant execute on function public.coaching_access_identity() to authenticated;
