-- Run on an isolated database after all 44.6 migrations, never as a production
-- migration. Source fixtures: FORM_Speed_Tab_44_6/golden/held_best.json.
begin;

do $$
declare
  f record;
  n integer;
  i integer;
  best_ms bigint;
  held_ms bigint;
  candidate bigint;
begin
  for f in select * from (values
    ('José 1K',array[243000,243000,243000,242000]::bigint[],242700::bigint,242000::bigint),
    ('Hope 1K',array[250100,252600,242300,242700,243600,244000]::bigint[],242900::bigint,242300::bigint),
    ('Hope 400',array[90600,87300,89600,87400,83000,81800,81700,82000]::bigint[],81800::bigint,81700::bigint),
    ('Tinius 400',array[81500,80700,81500,83000]::bigint[],81200::bigint,80700::bigint),
    ('Tinius 800',array[171200,173100]::bigint[],172200::bigint,171200::bigint),
    ('Saul 600',array[131000,128000,137000,153000,131000]::bigint[],132000::bigint,128000::bigint),
    ('Saul 200',array[53000,38000,36000,43000]::bigint[],39000::bigint,36000::bigint)
  ) as fixtures(name,reps,expected_held,expected_best) loop
    n:=cardinality(f.reps);
    select min(item.value) into best_ms from unnest(f.reps) as item(value);
    held_ms:=null;
    if n>=3 then
      for i in 1..(n-2) loop
        candidate:=floor((f.reps[i]+f.reps[i+1]+f.reps[i+2])::numeric/300+0.5)::bigint*100;
        held_ms:=least(coalesce(held_ms,candidate),candidate);
      end loop;
    elsif n=2 then
      held_ms:=floor((f.reps[1]+f.reps[2])::numeric/200+0.5)::bigint*100;
    else
      held_ms:=floor(f.reps[1]::numeric/100+0.5)::bigint*100;
    end if;
    if held_ms is distinct from f.expected_held or best_ms is distinct from f.expected_best then
      raise exception 'Speed golden mismatch: %, held %, best %',f.name,held_ms,best_ms;
    end if;
  end loop;

  if public.speed_distance_key(0.62*1609.344,'mi')<>1000
     or public.speed_distance_key(0.4*1000,'km')<>400
     or public.speed_distance_key(1600,'m') is not null
     or public.speed_distance_key(13.1*1609.344,'mi')<>21098 then
    raise exception 'Track/road distance mapping violated';
  end if;

  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in (
      'athlete_speed_settings','athlete_season_pins','vault_sessions',
      'vault_session_versions','speed_piece_distance_corrections',
      'speed_plan_vault_links','speed_completion_vault_links'
    ) and not c.relrowsecurity
  ) then raise exception 'Speed table missing RLS'; end if;

  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='athlete_speed_marks') then
    raise exception 'A duplicate speed marks store was introduced';
  end if;

  if position('already belongs to a different Vault version' in
       pg_get_functiondef('public.file_vault_attempt(text,uuid,integer[],text,timestamptz)'::regprocedure)) = 0
     or position('already carries different rep times' in
       pg_get_functiondef('public.file_vault_attempt(text,uuid,integer[],text,timestamptz)'::regprocedure)) = 0
     or position('athlete_memberships <> 1' in
       pg_get_functiondef('public.file_vault_attempt(text,uuid,integer[],text,timestamptz)'::regprocedure)) = 0 then
    raise exception 'Vault filing retry/identity immutability guard is missing';
  end if;
end;
$$;

-- Live RLS acceptance in an isolated environment must additionally sign in as:
-- a) athlete with no marks: seven keys, all Held/Best null, shared Next/Vault;
-- b) Hope: private marks and season, none from unsigned measurements;
-- c) Brice Coach Mirror of Hope: EXACT same athlete_speed_feed bytes;
-- d) unrelated athlete and anon: no Hope feed, no Hope rep detail;
-- e) logged-in member: vault_cleared_faces returns faces only;
-- f) coach inserts version 2: version 1 immutable, old results unchanged.
rollback;
