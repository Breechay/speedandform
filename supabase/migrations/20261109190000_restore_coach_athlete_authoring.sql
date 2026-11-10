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

-- A new identity has no block to select. The existing schedule_training_block
-- writer is only for future handoffs and explicitly refuses a start today.
-- Create one opening block with generated Week dates, never a second block or
-- an automatic plan publication. Workouts are authored in separate versions.
create or replace function public.author_initial_training_block(
  p_athlete_id uuid, p_name text, p_purpose text, p_total_weeks smallint,
  p_starts_on date, p_race_on date default null, p_race_name text default null,
  p_race_place text default null, p_goal_statement text default null,
  p_week_starts_on smallint default 1
) returns uuid
language plpgsql security definer set search_path = '' as $function$
declare
  acting_coach uuid := (select auth.uid());
  new_block uuid;
  week_number smallint;
  week_date date;
  today_ny date := (now() at time zone 'America/New_York')::date;
  initial_status text;
begin
  if acting_coach is null or not public.is_coach_member(p_athlete_id) then
    raise exception 'Only this athlete''s signed-in coach may start their block' using errcode = '42501';
  end if;
  if length(btrim(coalesce(p_name, ''))) not between 3 and 120
     or p_purpose is null or p_purpose not in ('race_build', 'development')
     or p_total_weeks is null or p_total_weeks not between 1 and 24
     or p_starts_on is null or p_starts_on < today_ny - 6
     or p_week_starts_on is null or p_week_starts_on not between 1 and 7
     or extract(isodow from p_starts_on)::smallint <> p_week_starts_on then
    raise exception 'Choose a valid first block, weekday and start date' using errcode = '22023';
  end if;
  if p_race_on is not null and
     (p_race_on < p_starts_on or p_race_on > p_starts_on + (p_total_weeks * 7 - 1)) then
    raise exception 'Race day must fall within the block' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_athlete_id::text, 42017));
  if exists (select 1 from public.training_blocks where athlete_id = p_athlete_id) then
    raise exception 'This athlete already has a training block. Open it instead.' using errcode = '23505';
  end if;
  initial_status := case when p_starts_on <= today_ny then 'active' else 'scheduled' end;

  insert into public.training_blocks (
    athlete_id, source, name, block_number, purpose, total_weeks,
    starts_on, ends_on, status, race_on, race_name, race_place,
    goal_statement, week_starts_on, authored_by
  ) values (
    p_athlete_id, 'coach_authored', btrim(p_name), 1, p_purpose, p_total_weeks,
    p_starts_on, p_starts_on + (p_total_weeks * 7 - 1), initial_status,
    p_race_on, nullif(btrim(p_race_name), ''), nullif(btrim(p_race_place), ''),
    nullif(btrim(p_goal_statement), ''), p_week_starts_on, acting_coach
  ) returning id into new_block;

  for week_number in 1..p_total_weeks loop
    week_date := p_starts_on + ((week_number - 1) * 7);
    insert into public.training_weeks (
      athlete_id, block_id, week_number, starts_on, ends_on, state
    ) values (
      p_athlete_id, new_block, week_number, week_date, week_date + 6,
      case when initial_status = 'active' and week_number = 1 then 'in_progress' else 'planned' end
    );
  end loop;
  return new_block;
end;
$function$;

revoke all on function public.author_initial_training_block(
  uuid,text,text,smallint,date,date,text,text,text,smallint) from public, anon;
grant execute on function public.author_initial_training_block(
  uuid,text,text,smallint,date,date,text,text,text,smallint) to authenticated;

comment on function public.author_initial_training_block(uuid,text,text,smallint,date,date,text,text,text,smallint) is
  'Start the first dated coach block for an existing authorized athlete. Refuses preexisting blocks, preserves the ordinary session publication and Week story gates.';
