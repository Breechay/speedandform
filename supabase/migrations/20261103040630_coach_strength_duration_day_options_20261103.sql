-- Read-only coach-authorized selector for manual strength duration filing.
-- Strength assignments are not directly selectable by authenticated browsers.
create function public.coach_strength_duration_day_options(p_athlete_id uuid)
returns table (
  strength_day_id uuid,
  scheduled_on date,
  session_title text,
  duration_seconds integer,
  duration_source text,
  filed_at timestamptz,
  superseded_by_strength_receipt_id text
)
language plpgsql security definer set search_path = ''
as $function$
begin
  if auth.uid() is null or not public.is_coach_member(p_athlete_id) then
    raise exception 'Active coach membership required' using errcode = '42501';
  end if;
  return query
    select d.id, d.scheduled_on, d.title, c.duration_seconds,
           c.duration_source, c.filed_at, c.superseded_by_strength_receipt_id
      from public.form_training_strength_days d
      left join public.coach_strength_duration_completions c
        on c.strength_day_id = d.id
     where d.athlete_id = p_athlete_id
       and d.cleared_at is null
     order by d.scheduled_on desc
     limit 40;
end;
$function$;

revoke all on function public.coach_strength_duration_day_options(uuid)
  from public, anon;
grant execute on function public.coach_strength_duration_day_options(uuid)
  to authenticated;
