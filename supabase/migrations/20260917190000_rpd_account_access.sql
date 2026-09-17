-- Account-aware reading of the published RPD product. This does not create or
-- revise an athlete assignment, attach a purchase, or grant a native subscription.
create or replace function public.rpd_account_access(p_include_plan boolean default true)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  caller uuid := auth.uid();
  verified_email text;
  published_plan_id uuid;
  mode text := 'preview';
  workspace text := 'account';
  has_coach boolean;
  has_athlete boolean;
  payload jsonb := null;
begin
  if caller is null then
    raise exception 'Sign in to check account access' using errcode = '42501';
  end if;
  select lower(btrim(u.email)) into verified_email from auth.users u
    where u.id = caller and u.email_confirmed_at is not null
      and (u.banned_until is null or u.banned_until <= now());
  if verified_email is null then
    raise exception 'A verified account is required' using errcode = '42501';
  end if;
  if exists (select 1 from public.account_deletion_requests d
      where d.user_id = caller and d.status in ('requested', 'processing', 'completed')) then
    raise exception 'Account access is unavailable' using errcode = '42501';
  end if;

  select exists (select 1 from public.athlete_memberships m
      join public.athletes a on a.id = m.athlete_id
      where m.user_id = caller and m.role = 'coach' and m.status = 'active' and a.active),
    exists (select 1 from public.athlete_memberships m
      join public.athletes a on a.id = m.athlete_id
      where m.user_id = caller and m.role = 'athlete' and m.status = 'active' and a.active)
    into has_coach, has_athlete;
  if has_coach and not has_athlete then workspace := 'coach';
  elsif has_athlete and not has_coach then workspace := 'athlete';
  end if;

  select p.plan_id into published_plan_id from public.plan_publications p
    where p.slug = 'race-pace-durability' and p.published_at is not null
      and p.revoked_at is null;
  if published_plan_id is null then
    raise exception 'The published plan is temporarily unavailable' using errcode = '55000';
  end if;

  -- Owner/admin rights are stored by the server, never inferred from user metadata.
  if exists (select 1 from public.coaching_administrators c
      where c.user_id = caller and c.status = 'active') then
    mode := 'coach';
    if not has_athlete then workspace := 'coach'; end if;
  elsif exists (select 1 from public.athlete_memberships m
      join public.athletes a on a.id = m.athlete_id and a.active
      join public.training_blocks b on b.athlete_id = a.id and b.status = 'active'
      where m.user_id = caller and m.role = 'coach' and m.status = 'active'
        and b.plan_id = published_plan_id) then
    mode := 'coach';
  elsif exists (select 1 from public.athlete_memberships m
      join public.athletes a on a.id = m.athlete_id and a.active
      join public.training_blocks b on b.athlete_id = a.id and b.status = 'active'
      where m.user_id = caller and m.role = 'athlete' and m.status = 'active'
        and b.plan_id = published_plan_id) then
    mode := 'assigned';
  elsif exists (select 1 from public.product_entitlements e
      where e.product_slug = 'race-pace-durability' and e.status = 'paid'
        and (e.auth_user_id = caller or (e.auth_user_id is null
          and lower(btrim(e.purchaser_email)) = verified_email))) then
    mode := 'purchased';
  end if;

  -- Full prescription crosses this door only after the server-side permission
  -- decision. public_plan remains service-role-only for direct callers.
  if mode <> 'preview' and p_include_plan then
    payload := public.public_plan('race-pace-durability');
    if payload is null then raise exception 'Plan unavailable' using errcode = '55000'; end if;
  end if;
  return jsonb_build_object('schema', 1, 'user_id', caller, 'mode', mode,
    'entitled', mode <> 'preview', 'workspace', workspace, 'plan', payload);
end;
$function$;
revoke all on function public.rpd_account_access(boolean) from public, anon, authenticated;
grant execute on function public.rpd_account_access(boolean) to authenticated, service_role;
comment on function public.rpd_account_access(boolean) is
  'Verified account reads of published RPD: active owner/related coach, assigned athlete, or paid purchaser. No athlete records or checkout identifiers returned. Explicit per-user authorization under SECURITY DEFINER. No writes.';
