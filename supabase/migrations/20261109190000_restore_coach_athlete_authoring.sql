-- Restore the private new-athlete writer used by the Programming console.
-- The original function was SECURITY INVOKER, while athletes and memberships
-- deliberately have no authenticated INSERT policies. As a result, the old
-- function could not create its very first membership. Keep both writes in
-- one transaction behind the existing protected-administrator guard.

create or replace function public.author_athlete(
  p_slug text, p_display_name text, p_first_name text,
  p_program_name text, p_account_label text,
  p_target_event text default null, p_goal_label text default null,
  p_delivery text default 'app',
  p_goal_seconds integer default null, p_target_pace_seconds integer default null
) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare
  created uuid;
  acting_coach uuid := (select auth.uid());
  normalized_slug text := lower(btrim(p_slug));
  normalized_name text := regexp_replace(btrim(coalesce(p_display_name, '')), '[[:space:]]+', ' ', 'g');
begin
  if acting_coach is null or not public.is_active_coaching_administrator(acting_coach) then
    raise exception 'Only an active coaching administrator may add an athlete' using errcode = '42501';
  end if;
  if normalized_slug is null
     or normalized_slug !~ '^[a-z0-9][a-z0-9-]{1,68}[a-z0-9]$'
     or length(normalized_name) not between 3 and 120
     or length(btrim(coalesce(p_first_name, ''))) not between 1 and 80
     or length(btrim(coalesce(p_program_name, ''))) not between 1 and 120
     or length(btrim(coalesce(p_account_label, ''))) not between 1 and 120
     or p_delivery is null or p_delivery not in ('app', 'coach') then
    raise exception 'Athlete details are incomplete or invalid' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.athletes
    where slug = normalized_slug
       or lower(regexp_replace(btrim(display_name), '[[:space:]]+', ' ', 'g')) = lower(normalized_name)
  ) then
    raise exception 'An athlete with this name or slug already exists. Open that record instead of creating another.'
      using errcode = '23505';
  end if;

  insert into public.athletes (
    slug, display_name, first_name, home_surface, target_event, goal_label,
    program_name, account_label, delivery, goal_seconds, target_pace_seconds
  ) values (
    normalized_slug, normalized_name, btrim(p_first_name), 'form',
    nullif(btrim(p_target_event), ''), nullif(btrim(p_goal_label), ''),
    btrim(p_program_name), btrim(p_account_label), p_delivery,
    p_goal_seconds, p_target_pace_seconds
  ) returning id into created;

  insert into public.athlete_memberships (athlete_id, user_id, role, status)
  values (created, acting_coach, 'coach', 'active');
  return created;
end;
$function$;

revoke all on function public.author_athlete(text, text, text, text, text, text, text, text, integer, integer)
  from public, anon;
grant execute on function public.author_athlete(text, text, text, text, text, text, text, text, integer, integer)
  to authenticated;

comment on function public.author_athlete(text, text, text, text, text, text, text, text, integer, integer) is
  'Authenticated protected administrator creates one private athlete and their own active coach membership atomically. No Auth user, email, plan or public roster entry is created.';
