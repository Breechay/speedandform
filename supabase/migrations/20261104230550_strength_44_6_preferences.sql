-- 44.6 athlete-owned strength preferences. Default rest is on, matching the app.
-- Mirror can read the selected athlete's preference but can never write it.
create table public.athlete_strength_preferences (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  rest_timer_enabled boolean not null default true,
  rest_sound_enabled boolean not null default true,
  weight_unit text not null default 'lb' check (weight_unit in ('lb','kg')),
  updated_at timestamptz not null default now()
);
alter table public.athlete_strength_preferences enable row level security;
create policy strength_preferences_own_read
 on public.athlete_strength_preferences for select to authenticated
 using (public.can_read_athlete(athlete_id));
create policy strength_preferences_own_insert
 on public.athlete_strength_preferences for insert to authenticated
 with check (public.is_athlete_member(athlete_id));
create policy strength_preferences_own_update
 on public.athlete_strength_preferences for update to authenticated
 using (public.is_athlete_member(athlete_id))
 with check (public.is_athlete_member(athlete_id));
revoke all on public.athlete_strength_preferences from anon;
grant select,insert,update on public.athlete_strength_preferences to authenticated;

create function public.athlete_strength_preference_feed(p_athlete_id uuid)
returns jsonb language sql stable security definer
set search_path = public, pg_temp as $$
select jsonb_build_object(
  'restTimerEnabled',coalesce(p.rest_timer_enabled,true),
  'restSoundEnabled',coalesce(p.rest_sound_enabled,true),
  'weightUnit',coalesce(p.weight_unit,'lb')
)
from public.athletes a
left join public.athlete_strength_preferences p on p.athlete_id=a.id
where a.id=p_athlete_id and public.can_read_athlete(a.id);
$$;

create function public.set_athlete_strength_preferences(
  p_athlete_id uuid,p_rest_timer_enabled boolean,p_rest_sound_enabled boolean,p_weight_unit text
)
returns jsonb language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  if not public.is_athlete_member(p_athlete_id) then
    raise exception 'Athlete may edit only their own Strength preferences'
      using errcode='42501';
  end if;
  if p_weight_unit not in ('lb','kg') or
     p_rest_timer_enabled is null or p_rest_sound_enabled is null then
    raise exception 'Invalid Strength preference';
  end if;
  insert into public.athlete_strength_preferences
      (athlete_id,rest_timer_enabled,rest_sound_enabled,weight_unit,updated_at)
  values (p_athlete_id,p_rest_timer_enabled,p_rest_sound_enabled,p_weight_unit,now())
  on conflict (athlete_id) do update set
      rest_timer_enabled=excluded.rest_timer_enabled,
      rest_sound_enabled=excluded.rest_sound_enabled,
      weight_unit=excluded.weight_unit,
      updated_at=now();
  return public.athlete_strength_preference_feed(p_athlete_id);
end;
$$;

revoke all on function public.athlete_strength_preference_feed(uuid) from public,anon;
revoke all on function public.set_athlete_strength_preferences(uuid,boolean,boolean,text) from public,anon;
grant execute on function public.athlete_strength_preference_feed(uuid) to authenticated;
grant execute on function public.set_athlete_strength_preferences(uuid,boolean,boolean,text) to authenticated;
