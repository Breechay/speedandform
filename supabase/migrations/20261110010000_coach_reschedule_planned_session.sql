-- A coach-authored date move is separate from revising the workout dose.
-- The original session and versions survive; a move is recorded immutably.
create or replace function public.coach_reschedule_planned_session(
  p_session_id uuid,
  p_expected_date date,
  p_target_date date,
  p_reason text,
  p_withdraw_session_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  source_row public.planned_sessions%rowtype;
  redundant public.planned_sessions%rowtype;
  the_week public.training_weeks%rowtype;
  target_label text;
begin
  if auth.uid() is null then raise exception 'Sign in as an assigned coach'; end if;
  if length(btrim(coalesce(p_reason, ''))) < 12 then
    raise exception 'Explain why the day changed (at least 12 characters)';
  end if;
  if p_target_date is null then raise exception 'Choose a date'; end if;

  -- Stable lock order prevents two simultaneous coach moves from racing.
  perform 1 from public.planned_sessions
   where id in (p_session_id, p_withdraw_session_id) order by id for update;
  select * into source_row from public.planned_sessions where id = p_session_id;
  if not found or source_row.state <> 'published' or source_row.withdrawn_at is not null then
    raise exception 'This is no longer an active published session';
  end if;
  if not public.is_coach_member(source_row.athlete_id) then
    raise exception 'Only an assigned coach may reschedule this athlete';
  end if;
  if source_row.scheduled_on is distinct from p_expected_date then
    raise exception 'The session date changed since you opened it. Refresh and review.';
  end if;
  if exists (select 1 from public.session_completions where planned_session_id = p_session_id) then
    raise exception 'Filed evidence cannot be moved. Correct the filing instead.';
  end if;
  if exists (select 1 from public.athlete_session_placements where planned_session_id = p_session_id) then
    raise exception 'An athlete placement exists. Review it before rescheduling the source.';
  end if;
  select * into the_week from public.training_weeks where id = source_row.week_id;
  if not found or p_target_date < the_week.starts_on or p_target_date > the_week.ends_on then
    raise exception 'Select a date in the original training week';
  end if;
  if p_target_date = p_expected_date then raise exception 'Select a different date'; end if;

  target_label := case extract(isodow from p_target_date)::int
    when 1 then 'Monday' when 2 then 'Tuesday' when 3 then 'Wednesday'
    when 4 then 'Thursday' when 5 then 'Friday' when 6 then 'Saturday' else 'Sunday' end;

  if p_withdraw_session_id is not null then
    if p_withdraw_session_id = p_session_id then raise exception 'Cannot withdraw the moved session'; end if;
    select * into redundant from public.planned_sessions where id = p_withdraw_session_id;
    if not found or redundant.athlete_id <> source_row.athlete_id
      or redundant.week_id <> source_row.week_id
      or redundant.scheduled_on <> p_target_date or redundant.state <> 'published'
      or redundant.withdrawn_at is not null then
      raise exception 'The run being replaced is no longer on the selected day';
    end if;
  end if;

  -- Existing withdrawn-slot protection still applies; do not bypass its approval requirement.
  update public.planned_sessions
    set scheduled_on = p_target_date, day_label = target_label, updated_at = now()
    where id = p_session_id;
  if p_withdraw_session_id is not null then
    perform public.withdraw_session(p_withdraw_session_id,
      'Replaced by rescheduled session ' || p_session_id::text || ': ' || btrim(p_reason));
  end if;
  insert into public.planned_session_moves
    (athlete_id, planned_session_id, from_date, to_date, from_day_label,
     to_day_label, coach_decision, moved_by)
  values (source_row.athlete_id, p_session_id, source_row.scheduled_on, p_target_date,
          source_row.day_label, target_label, btrim(p_reason), auth.uid());

  return jsonb_build_object('session_id', p_session_id, 'scheduled_on', p_target_date,
    'day_label', target_label, 'withdrawn_session_id', p_withdraw_session_id);
end;
$$;

revoke all on function public.coach_reschedule_planned_session(uuid,date,date,text,uuid) from public, anon;
grant execute on function public.coach_reschedule_planned_session(uuid,date,date,text,uuid) to authenticated;
