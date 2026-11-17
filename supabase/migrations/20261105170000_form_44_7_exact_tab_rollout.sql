-- FORM 44.7 rollout is deliberately narrow. Access is database-backed so the
-- athlete app and Coach Mirror resolve the same destinations without names in
-- native code.

update public.athlete_training_tab_access access
set speed_enabled = (athlete.slug in (
      'jose','hope','tinius','brice','anthony','megan-bolan','adrian','saul-licona','elijah'
    )),
    strength_enabled = (athlete.slug = 'brice'),
    updated_at = now()
from public.athletes athlete
where athlete.id = access.athlete_id
  and (access.speed_enabled is distinct from (athlete.slug in (
         'jose','hope','tinius','brice','anthony','megan-bolan','adrian','saul-licona','elijah'
       ))
    or access.strength_enabled is distinct from (athlete.slug = 'brice'));

insert into public.athlete_training_tab_access
  (athlete_id,speed_enabled,strength_enabled)
select athlete.id,true,(athlete.slug='brice')
from public.athletes athlete
where athlete.slug in (
  'jose','hope','tinius','brice','anthony','megan-bolan','adrian','saul-licona','elijah'
)
on conflict (athlete_id) do update set
  speed_enabled=excluded.speed_enabled,
  strength_enabled=excluded.strength_enabled,
  updated_at=now();

do $guard$
declare
  v_speed integer;
  v_strength integer;
begin
  select count(*) filter (where speed_enabled),
         count(*) filter (where strength_enabled)
    into v_speed,v_strength
    from public.athlete_training_tab_access;
  if v_speed <> 9 or v_strength <> 1 then
    raise exception 'FORM 44.7 tab rollout mismatch: speed %, strength %',v_speed,v_strength;
  end if;
end;
$guard$;
