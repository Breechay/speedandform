-- Follow-up: classify timed repeats accurately even when pace is omitted.
create or replace function public.form_reject_easy_fast_component()
returns trigger language plpgsql security definer set search_path to 'public', 'pg_temp'
as $$
declare
  session_title text;
  min_easy integer;
  fastest integer;
  short_stride boolean;
begin
  if new.role <> 'work' then return new; end if;
  select v.title into session_title from public.planned_session_versions v where v.id=new.version_id;
  if session_title is null or session_title !~* '(^|[^[:alnum:]])easy([^[:alnum:]]|$)' then return new; end if;
  min_easy := public.form_easy_min_seconds(new.athlete_id);
  fastest := least(
     coalesce(new.pace_low_seconds,public.form_easy_pace_seconds(new.pace_low),99999),
     coalesce(new.pace_high_seconds,public.form_easy_pace_seconds(new.pace_high),99999)
  );
  short_stride := new.duration_seconds is not null and new.duration_seconds <= 30
                   and coalesce(new.repeat_count,1) <= 10
                   and coalesce(new.recovery_seconds,0) >= 30;
  -- Easy-plus-strides is allowed: up to 30 seconds each, with recovery.
  -- Repeated longer pickups are a quality workout, even without a pace field.
  if new.shape='repetitions' and coalesce(new.repeat_count,0)>=3
     and coalesce(new.duration_seconds,0)>=45
     and coalesce(new.recovery_seconds,0)>0 then
    raise exception using errcode='23514',
      message='FORM prescription conflict: long interval repetitions are labeled easy',
      detail=format('Session "%s" includes %s repeats of %s seconds with recovery.',session_title,new.repeat_count,new.duration_seconds),
      hint='Give this a truthful quality-session title and coaching prescription, or publish a continuous easy run. Short relaxed strides remain allowed.';
  end if;
  if fastest < min_easy and not short_stride then
    raise exception using errcode='23514',
      message='FORM prescription conflict: an easy session includes faster running',
      detail=format('Session "%s" includes a work pace of %s sec/mi; this athlete''s easy floor is %s sec/mi.',session_title,fastest,min_easy),
      hint='Publish a separate accurately labeled quality workout, or replace the fast work with genuine easy running. Do not change just the displayed title.';
  end if;
  return new;
end;
$$;
