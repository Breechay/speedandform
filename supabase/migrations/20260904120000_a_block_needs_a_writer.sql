-- A block needs a writer.
--
-- `athletes`, `training_blocks` and `training_weeks` are three of the nineteen
-- tables no surface can write, which is why entering Simon has been impossible
-- without a migration. Coach only, and narrow: this creates the container a
-- plan lives in, and `author_session` fills it.
--
-- Weeks are generated from the block's own opening day rather than passed in.
-- Fifteen hand-typed date pairs is fifteen chances to put a Tuesday in the wrong
-- week, and the block already knows when it starts and which day it opens on.

create or replace function public.author_athlete(
  p_slug text, p_display_name text, p_first_name text,
  p_program_name text, p_account_label text,
  p_target_event text default null, p_goal_label text default null,
  p_delivery text default 'app',
  p_goal_seconds integer default null, p_target_pace_seconds integer default null
) returns uuid
language plpgsql security invoker set search_path = public, pg_temp as $$
declare created uuid;
begin
  if not public.is_coaching_administrator() then
    raise exception 'only a coaching administrator may enter an athlete';
  end if;
  if exists (select 1 from public.athletes where slug = lower(btrim(p_slug))) then
    raise exception 'an athlete with that slug already exists. Find them rather than entering a second one.';
  end if;

  insert into public.athletes (slug, display_name, first_name, home_surface, target_event,
                               goal_label, program_name, account_label, delivery,
                               goal_seconds, target_pace_seconds)
  values (lower(btrim(p_slug)), btrim(p_display_name), btrim(p_first_name), 'form',
          p_target_event, p_goal_label, p_program_name, p_account_label, p_delivery,
          p_goal_seconds, p_target_pace_seconds)
  returning id into created;

  -- The author becomes their coach. An athlete nobody coaches is a row.
  insert into public.athlete_memberships (athlete_id, user_id, role, status)
  values (created, auth.uid(), 'coach', 'active');

  return created;
end $$;

create or replace function public.author_block(
  p_athlete_id uuid, p_name text, p_purpose text, p_total_weeks smallint,
  p_starts_on date, p_race_on date default null,
  p_race_name text default null, p_race_place text default null,
  p_goal_statement text default null, p_week_starts_on smallint default 1,
  p_block_number smallint default 1
) returns uuid
language plpgsql security invoker set search_path = public, pg_temp as $$
declare created uuid; n smallint; week_start date;
begin
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'only a coach on this athlete may author their block';
  end if;
  if p_total_weeks is null or p_total_weeks < 1 then
    raise exception 'a block is at least one week long';
  end if;

  -- One active block. A second would make "the plan" ambiguous everywhere.
  update public.training_blocks set status = 'complete'
   where athlete_id = p_athlete_id and status = 'active';

  insert into public.training_blocks (athlete_id, source, name, block_number, purpose,
    total_weeks, starts_on, ends_on, status, race_on, race_name, race_place,
    goal_statement, week_starts_on, authored_by)
  values (p_athlete_id, 'coach', btrim(p_name), p_block_number, btrim(p_purpose),
    p_total_weeks, p_starts_on, p_starts_on + (p_total_weeks * 7 - 1), 'active',
    p_race_on, p_race_name, p_race_place, p_goal_statement, p_week_starts_on, auth.uid())
  returning id into created;

  -- Generated, not typed. The block knows when it opens.
  for n in 1..p_total_weeks loop
    week_start := p_starts_on + ((n - 1) * 7);
    insert into public.training_weeks (athlete_id, block_id, week_number, starts_on, ends_on, state)
    values (p_athlete_id, created, n, week_start, week_start + 6,
            case when n = 1 then 'in_progress' else 'planned' end);
  end loop;

  return created;
end $$;

revoke all on function public.author_athlete(text, text, text, text, text, text, text, text, integer, integer) from public;
revoke all on function public.author_block(uuid, text, text, smallint, date, date, text, text, text, smallint, smallint) from public;
grant execute on function public.author_athlete(text, text, text, text, text, text, text, text, integer, integer) to authenticated;
grant execute on function public.author_block(uuid, text, text, smallint, date, date, text, text, text, smallint, smallint) to authenticated;

comment on function public.author_athlete is
  'Enters an athlete and makes the author their coach. Refuses a duplicate slug by name, because the failure mode is a second Simon rather than a missing one.';
comment on function public.author_block is
  'Creates a block and generates its weeks from the opening day. Closes any existing active block, so "the plan" is never ambiguous.';
