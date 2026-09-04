-- Purpose is an enum, not a sentence.
--
-- block_purpose_known checks purpose against ('race_build','development').
-- author_block passed prose into it. The sentence belongs in goal_statement,
-- which is where a block already keeps the thing a person reads.
--
-- Third value invented at the writer instead of read off the column it has to
-- satisfy, in one migration set. The pattern is worth naming: a writer built
-- against a remembered schema rather than the live one.

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
  if p_purpose not in ('race_build', 'development') then
    raise exception 'a block is a race_build or a development block. The sentence goes in the goal statement.';
  end if;

  update public.training_blocks set status = 'complete'
   where athlete_id = p_athlete_id and status = 'active';

  insert into public.training_blocks (athlete_id, source, name, block_number, purpose,
    total_weeks, starts_on, ends_on, status, race_on, race_name, race_place,
    goal_statement, week_starts_on, authored_by)
  values (p_athlete_id, 'coach_authored', btrim(p_name), p_block_number, p_purpose,
    p_total_weeks, p_starts_on, p_starts_on + (p_total_weeks * 7 - 1), 'active',
    p_race_on, p_race_name, p_race_place, p_goal_statement, p_week_starts_on, auth.uid())
  returning id into created;

  for n in 1..p_total_weeks loop
    week_start := p_starts_on + ((n - 1) * 7);
    insert into public.training_weeks (athlete_id, block_id, week_number, starts_on, ends_on, state)
    values (p_athlete_id, created, n, week_start, week_start + 6,
            case when n = 1 then 'in_progress' else 'planned' end);
  end loop;

  return created;
end $$;

revoke all on function public.author_block(uuid, text, text, smallint, date, date, text, text, text, smallint, smallint) from public;
grant execute on function public.author_block(uuid, text, text, smallint, date, date, text, text, text, smallint, smallint) to authenticated;
