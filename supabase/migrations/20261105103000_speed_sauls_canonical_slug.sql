-- FORM 44.7 production readback found Saul's canonical slug is `saul-licona`,
-- while the initial additive cohort seed looked for `saul`. Repair the data key;
-- access remains database-owned and no native athlete-name exception is added.
do $$
declare
  athlete uuid;
begin
  select id into strict athlete from public.athletes where slug='saul-licona';

  insert into public.athlete_speed_settings
    (athlete_id,distance_keys,default_distance_m)
  values
    (athlete,array[100,200,300,400,600,800,1000],600)
  on conflict (athlete_id) do update set
    distance_keys=excluded.distance_keys,
    default_distance_m=excluded.default_distance_m,
    updated_at=now();

  insert into public.athlete_training_tab_access
    (athlete_id,speed_enabled,strength_enabled)
  values (athlete,true,false)
  on conflict (athlete_id) do update set
    speed_enabled=true,
    strength_enabled=false,
    updated_at=now();
end $$;
