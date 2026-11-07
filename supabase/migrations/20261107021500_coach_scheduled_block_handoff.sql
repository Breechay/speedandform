-- Schedule the next published running block without changing the current athlete plan.
-- Coach authors into generated weeks; the daily handoff activates only a complete
-- next block after its start date. No unpublished draft becomes the phone's plan.

alter table public.training_blocks
  drop constraint training_blocks_status_check;
alter table public.training_blocks
  add constraint training_blocks_status_check
  check (status in ('draft','scheduled','active','complete','archived'));

create unique index if not exists one_scheduled_block_per_athlete_idx
  on public.training_blocks (athlete_id) where status = 'scheduled';

create or replace function public.schedule_training_block(
  p_athlete_id uuid, p_name text, p_purpose text, p_total_weeks smallint,
  p_starts_on date, p_race_on date default null, p_race_name text default null,
  p_race_place text default null, p_goal_statement text default null,
  p_week_starts_on smallint default 1
) returns uuid
language plpgsql security invoker set search_path = public, pg_temp
as $function$
declare
  new_block uuid;
  week_number smallint;
  week_date date;
  next_number smallint;
  active_end date;
begin
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'only this athlete''s coach can schedule a block';
  end if;
  if p_name is null or length(btrim(p_name)) < 3 or
     p_purpose not in ('race_build', 'development') or
     p_total_weeks is null or p_total_weeks not between 1 and 24 or
     p_starts_on is null or p_starts_on <= current_date or
     p_week_starts_on is null or p_week_starts_on not between 1 and 7 then
    raise exception 'give the future block a name, valid purpose, 1–24 weeks and a future start';
  end if;
  if extract(isodow from p_starts_on)::smallint <> p_week_starts_on then
    raise exception 'the block start and first weekday must agree';
  end if;
  if p_race_on is not null and
     (p_race_on < p_starts_on or p_race_on > p_starts_on + (p_total_weeks * 7 - 1)) then
    raise exception 'race day must fall inside this block';
  end if;

  -- Serialize publication for this athlete. The unique index catches retries
  -- and the second signed-in browser without creating another next block.
  perform pg_advisory_xact_lock(hashtextextended(p_athlete_id::text, 42017));
  if exists (select 1 from public.training_blocks
              where athlete_id = p_athlete_id and status = 'scheduled') then
    raise exception 'this athlete already has a scheduled next block; open and author it';
  end if;
  select ends_on into active_end
    from public.training_blocks
    where athlete_id = p_athlete_id and status = 'active'
    for update;
  if active_end is not null and p_starts_on <= active_end then
    raise exception 'the next block must begin after the current block ends';
  end if;
  select coalesce(max(block_number), 0) + 1 into next_number
    from public.training_blocks where athlete_id = p_athlete_id;
  if next_number > 32767 then raise exception 'block sequence has reached its limit'; end if;

  insert into public.training_blocks
    (athlete_id, source, name, block_number, purpose, total_weeks,
     starts_on, ends_on, status, race_on, race_name, race_place,
     goal_statement, week_starts_on, authored_by)
  values
    (p_athlete_id, 'coach_authored', btrim(p_name), next_number,
     p_purpose, p_total_weeks, p_starts_on, p_starts_on + (p_total_weeks * 7 - 1),
     'scheduled', p_race_on, nullif(btrim(p_race_name), ''),
     nullif(btrim(p_race_place), ''), nullif(btrim(p_goal_statement), ''),
     p_week_starts_on, auth.uid())
  returning id into new_block;

  for week_number in 1..p_total_weeks loop
    week_date := p_starts_on + ((week_number - 1) * 7);
    insert into public.training_weeks
      (athlete_id, block_id, week_number, starts_on, ends_on, state)
    values (p_athlete_id, new_block, week_number, week_date, week_date + 6, 'planned');
  end loop;
  return new_block;
end
$function$;

revoke all on function public.schedule_training_block(
  uuid,text,text,smallint,date,date,text,text,text,smallint) from public;
grant execute on function public.schedule_training_block(
  uuid,text,text,smallint,date,date,text,text,text,smallint) to authenticated;

-- The scheduler runs as the database owner, never as a browser token. It will
-- not promote an incomplete nine-week block or a block overlapping current work.
create or replace function public.activate_due_training_blocks()
returns integer
language plpgsql security definer set search_path = public, pg_temp
as $function$
declare
  candidate record;
  activated integer := 0;
  run_day date := (now() at time zone 'America/New_York')::date;
  weeks_with_work integer;
  changed integer;
begin
  for candidate in
    select b.id, b.athlete_id, b.starts_on, b.total_weeks
      from public.training_blocks b
     where b.status = 'scheduled' and b.starts_on <= run_day
     order by b.starts_on, b.id
     for update skip locked
  loop
    perform pg_advisory_xact_lock(hashtextextended(candidate.athlete_id::text, 42017));
    -- Never switch to an empty or partially-authored block. All weeks require
    -- at least one actually published session, not merely generated dates.
    select count(distinct w.id) into weeks_with_work
      from public.training_weeks w
      join public.planned_sessions s on s.week_id = w.id
       and s.athlete_id = candidate.athlete_id
       and s.state = 'published'
       and s.scheduled_on between w.starts_on and w.ends_on
     where w.block_id = candidate.id and w.athlete_id = candidate.athlete_id;
    if weeks_with_work <> candidate.total_weeks then continue; end if;
    if exists (
      select 1 from public.training_blocks a
       where a.athlete_id = candidate.athlete_id and a.status = 'active'
         and a.ends_on >= candidate.starts_on
    ) then continue; end if;

    update public.training_blocks
       set status = 'complete'
     where athlete_id = candidate.athlete_id and status = 'active';
    update public.training_blocks
       set status = 'active'
     where id = candidate.id and status = 'scheduled';
    get diagnostics changed = row_count;
    activated := activated + changed;
    update public.training_weeks set state = 'in_progress'
     where block_id = candidate.id and week_number = 1;
  end loop;
  return activated;
end
$function$;

revoke all on function public.activate_due_training_blocks() from public, anon, authenticated;
select cron.schedule(
  'form-next-running-block-handoff',
  '15 10 * * *',
  'select public.activate_due_training_blocks();'
);

comment on function public.schedule_training_block is
  'Coach-only future block with generated weeks. Preserves the active plan until dated handoff.';
comment on function public.activate_due_training_blocks is
  'Daily activation of fully authored scheduled blocks, without overlapping the previous active block.';
