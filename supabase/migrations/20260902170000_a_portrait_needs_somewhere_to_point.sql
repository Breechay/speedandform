-- A portrait needs somewhere to point.
--
-- This morning added seven columns and a private bucket. The audit this evening
-- found `athletes` among the nineteen tables no surface can write, which means
-- an upload would have put a face in storage that no row referred to — the same
-- crack, opened by the same habit, six hours apart.
--
-- One writer, coach only, and it is the only column set on `athletes` that any
-- surface can reach. Deliberately narrow: this is not an athlete editor.
--
-- A null path is how a portrait is removed. The crop values survive it, because
-- taking a photograph down is not the same as forgetting how it was framed.

create or replace function public.set_athlete_portrait(
  p_athlete_id uuid,
  p_path text default null,
  p_x smallint default null,
  p_y smallint default null,
  p_zoom numeric default null,
  p_exposure numeric default null,
  p_contrast numeric default null,
  p_grade numeric default null,
  p_clear boolean default false
) returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'only a coach on this athlete may set their portrait';
  end if;

  -- The path must live under this athlete's own folder, the same rule the
  -- storage policy enforces. Checked here too, so a row can never point at a
  -- file the reader is not allowed to fetch.
  if p_path is not null and split_part(p_path, '/', 1) <> p_athlete_id::text then
    raise exception 'a portrait path begins with the athlete it belongs to';
  end if;

  update public.athletes set
    portrait_path     = case when p_clear then null else coalesce(p_path, portrait_path) end,
    portrait_x        = coalesce(p_x, portrait_x),
    portrait_y        = coalesce(p_y, portrait_y),
    portrait_zoom     = coalesce(p_zoom, portrait_zoom),
    portrait_exposure = coalesce(p_exposure, portrait_exposure),
    portrait_contrast = coalesce(p_contrast, portrait_contrast),
    portrait_grade    = coalesce(p_grade, portrait_grade),
    updated_at        = now()
  where id = p_athlete_id;
end $$;

comment on function public.set_athlete_portrait is
  'The only write any surface has on athletes. Sets the portrait pointer and its six crop values; null leaves a value alone and p_clear removes the photograph while keeping the framing.';

revoke all on function public.set_athlete_portrait(uuid, text, smallint, smallint, numeric, numeric, numeric, numeric, boolean) from public;
grant execute on function public.set_athlete_portrait(uuid, text, smallint, smallint, numeric, numeric, numeric, numeric, boolean) to authenticated;
