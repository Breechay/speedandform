-- Verbatim authored track Vault catalogue from FORMTrackSessionCatalog.swift
-- (44.5 RC). Targets in milliseconds, inclusive; one-number bands are ceilings.
-- Future proposed Thursday work is NOT silently made a published Vault target.

insert into public.vault_sessions (id,title,family,authored_order,published)
values
 ('resurrection','RESURRECTION','SPEED',1,false),
 ('death','DEATH','SPEED',2,false),
 ('speed-demons','SPEED DEMONS','SPEED',3,false),
 ('gauntlet','GAUNTLET','SPEED',4,false),
 ('pyramid-intervals','PYRAMID INTERVALS','SPEED',5,false),
 ('nice-and-easy','NICE AND EASY','SPEED',6,false),
 ('descent-into-ruin','DESCENT INTO RUIN','SPEED',7,false),
 ('the-fifth-circle','THE FIFTH CIRCLE','SPEED',8,false),
 ('1000-600-400','1000 / 600 / 400 × 2','SPEED',9,false),
 ('5k-pyramid','5K PYRAMID','SPEED',10,false),
 ('the-switch','THE SWITCH','SPEED',11,false),
 ('descending-ladder','DESCENDING LADDER','SPEED',12,false),
 ('broken-5k','BROKEN 5K','SPEED',13,false),
 ('five-by-one','FIVE BY ONE','SPEED',14,false),
 ('long-holds-01','LONG HOLDS 01','LONG HOLDS',15,false),
 ('long-holds-02','LONG HOLDS 02','LONG HOLDS',16,false),
 ('long-holds-03','LONG HOLDS 03','LONG HOLDS',17,false),
 ('continuous-22','CONTINUOUS 22','LONG HOLDS',18,false),
 ('long-holds-04','LONG HOLDS 04','LONG HOLDS',19,false),
 ('long-holds-05','LONG HOLDS 05','LONG HOLDS',20,false)
on conflict (id) do nothing;

-- JSON blocks: repetitions, metres, authored target seconds, authored recovery.
-- Preserve exact targets even where the catalogue's derived pace text differs.
insert into public.vault_session_versions (session_id,version_number,blocks)
values
('resurrection',1,'[
 {"reps":3,"distanceMeters":600,"targetMinMs":108000,"targetMaxMs":112000,"recovery":"2:30min"},
 {"reps":4,"distanceMeters":400,"targetMinMs":68000,"targetMaxMs":72000,"recovery":"1:30min"},
 {"reps":4,"distanceMeters":300,"targetMinMs":48000,"targetMaxMs":52000,"recovery":"1min"},
 {"reps":4,"distanceMeters":200,"targetMinMs":29000,"targetMaxMs":32000,"recovery":"45s"}]'::jsonb),
('death',1,'[
 {"reps":2,"distanceMeters":600,"targetMinMs":108000,"targetMaxMs":112000,"recovery":"3min"},
 {"reps":2,"distanceMeters":400,"targetMinMs":68000,"targetMaxMs":72000,"recovery":"2:30min"},
 {"reps":3,"distanceMeters":300,"targetMinMs":48000,"targetMaxMs":52000,"recovery":"2min"},
 {"reps":3,"distanceMeters":200,"targetMinMs":29000,"targetMaxMs":32000,"recovery":"3min"},
 {"reps":1,"distanceMeters":800,"targetMinMs":145000,"targetMaxMs":155000,"recovery":"4min"},
 {"reps":1,"distanceMeters":400,"targetMinMs":68000,"targetMaxMs":72000,"recovery":null}]'::jsonb),
('speed-demons',1,'[
 {"reps":4,"distanceMeters":300,"targetMinMs":50000,"targetMaxMs":52000,"recovery":"2:30min"},
 {"reps":6,"distanceMeters":200,"targetMinMs":32000,"targetMaxMs":34000,"recovery":"90s"},
 {"reps":8,"distanceMeters":100,"targetMinMs":15000,"targetMaxMs":17000,"recovery":"90s"}]'::jsonb),
('gauntlet',1,'[
 {"reps":3,"distanceMeters":600,"targetMinMs":108000,"targetMaxMs":112000,"recovery":"3min"},
 {"reps":2,"distanceMeters":400,"targetMinMs":68000,"targetMaxMs":72000,"recovery":"2:30min"},
 {"reps":3,"distanceMeters":300,"targetMinMs":48000,"targetMaxMs":52000,"recovery":"2min"},
 {"reps":2,"distanceMeters":200,"targetMinMs":29000,"targetMaxMs":32000,"recovery":"2min"},
 {"reps":2,"distanceMeters":150,"targetMinMs":20000,"targetMaxMs":22000,"recovery":"Full recovery"}]'::jsonb),
('pyramid-intervals',1,'[
 {"reps":2,"distanceMeters":300,"targetMinMs":50000,"targetMaxMs":52000,"recovery":"90s"},
 {"reps":2,"distanceMeters":400,"targetMinMs":68000,"targetMaxMs":72000,"recovery":"2min"},
 {"reps":1,"distanceMeters":600,"targetMinMs":102000,"targetMaxMs":105000,"recovery":"2:30min"},
 {"reps":2,"distanceMeters":400,"targetMinMs":68000,"targetMaxMs":70000,"recovery":"2min"},
 {"reps":2,"distanceMeters":300,"targetMinMs":50000,"targetMaxMs":52000,"recovery":"Full recovery"}]'::jsonb),
('nice-and-easy',1,'[
 {"reps":3,"distanceMeters":200,"targetMinMs":29000,"targetMaxMs":32000,"recovery":"30s"},
 {"reps":2,"distanceMeters":800,"targetMinMs":145000,"targetMaxMs":150000,"recovery":"4min"},
 {"reps":1,"distanceMeters":400,"targetMinMs":68000,"targetMaxMs":70000,"recovery":null}]'::jsonb),
('descent-into-ruin',1,'[
 {"reps":1,"distanceMeters":1600,"targetMinMs":360000,"targetMaxMs":360000,"recovery":"3:00"},
 {"reps":2,"distanceMeters":800,"targetMinMs":175000,"targetMaxMs":175000,"recovery":"2:00–2:30"},
 {"reps":4,"distanceMeters":400,"targetMinMs":84000,"targetMaxMs":84000,"recovery":"90s between reps"}]'::jsonb),
-- Fifth Circle is an unpublished draft until the coach authors bands.
('the-fifth-circle',1,'[
 {"reps":5,"distanceMeters":600,"targetMinMs":125000,"targetMaxMs":128000,"recovery":"2:00 rest"},
 {"reps":4,"distanceMeters":200,"targetMinMs":40000,"targetMaxMs":41000,"recovery":"200m easy"}]'::jsonb),
('long-holds-01',1,'[
 {"reps":2,"durationSeconds":600,"recoverySeconds":120,"paceLowSeconds":360,"paceHighSeconds":368,"paceUnit":"mi"}]'::jsonb),
('1000-600-400',1,'[
 {"reps":1,"distanceMeters":1000,"targetMinMs":210000,"targetMaxMs":215000,"recovery":"2:00 easy"},
 {"reps":1,"distanceMeters":600,"targetMinMs":120000,"targetMaxMs":123000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":"3:00 easy"},
 {"reps":1,"distanceMeters":1000,"targetMinMs":210000,"targetMaxMs":215000,"recovery":"2:00 easy"},
 {"reps":1,"distanceMeters":600,"targetMinMs":120000,"targetMaxMs":123000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":null}]'::jsonb),
('5k-pyramid',1,'[
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":800,"targetMinMs":160000,"targetMaxMs":163000,"recovery":"2:00 easy"},
 {"reps":1,"distanceMeters":1200,"targetMinMs":246000,"targetMaxMs":251000,"recovery":"2:30 easy"},
 {"reps":1,"distanceMeters":800,"targetMinMs":160000,"targetMaxMs":163000,"recovery":"2:00 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":null}]'::jsonb),
('the-switch',1,'[
 {"reps":1,"distanceMeters":600,"targetMinMs":120000,"targetMaxMs":123000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":"2:30 easy"},
 {"reps":1,"distanceMeters":600,"targetMinMs":120000,"targetMaxMs":123000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":"2:30 easy"},
 {"reps":1,"distanceMeters":600,"targetMinMs":120000,"targetMaxMs":123000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":"2:30 easy"},
 {"reps":1,"distanceMeters":600,"targetMinMs":120000,"targetMaxMs":123000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":null}]'::jsonb),
('descending-ladder',1,'[
 {"reps":1,"distanceMeters":1200,"targetMinMs":246000,"targetMaxMs":251000,"recovery":"2:00 easy"},
 {"reps":1,"distanceMeters":1000,"targetMinMs":201000,"targetMaxMs":204000,"recovery":"2:00 easy"},
 {"reps":1,"distanceMeters":800,"targetMinMs":159000,"targetMaxMs":162000,"recovery":"2:00 easy"},
 {"reps":1,"distanceMeters":600,"targetMinMs":118000,"targetMaxMs":121000,"recovery":"2:00 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":75000,"targetMaxMs":78000,"recovery":null}]'::jsonb),
('broken-5k',1,'[
 {"reps":1,"distanceMeters":800,"targetMinMs":159000,"targetMaxMs":162000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":"2:30 easy"},
 {"reps":1,"distanceMeters":800,"targetMinMs":159000,"targetMaxMs":162000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":"2:30 easy"},
 {"reps":1,"distanceMeters":800,"targetMinMs":159000,"targetMaxMs":162000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":"2:30 easy"},
 {"reps":1,"distanceMeters":800,"targetMinMs":159000,"targetMaxMs":162000,"recovery":"1:30 easy"},
 {"reps":1,"distanceMeters":400,"targetMinMs":76000,"targetMaxMs":79000,"recovery":null}]'::jsonb),
('five-by-one',1,'[
 {"reps":5,"distanceMeters":1000,"targetMinMs":198000,"targetMaxMs":202000,"recovery":"2:30 easy"}]'::jsonb),
('long-holds-02',1,'[{"reps":3,"durationSeconds":480,"recoverySeconds":90,"paceLowSeconds":358,"paceHighSeconds":366,"paceUnit":"mi"}]'::jsonb),
('long-holds-03',1,'[{"reps":2,"durationSeconds":720,"recoverySeconds":120,"paceLowSeconds":356,"paceHighSeconds":364,"paceUnit":"mi"}]'::jsonb),
('continuous-22',1,'[{"reps":1,"durationSeconds":1320,"recoverySeconds":0,"paceLowSeconds":355,"paceHighSeconds":364,"paceUnit":"mi"}]'::jsonb),
('long-holds-04',1,'[{"reps":2,"durationSeconds":840,"recoverySeconds":180,"paceLowSeconds":352,"paceHighSeconds":360,"paceUnit":"mi"}]'::jsonb),
('long-holds-05',1,'[
 {"reps":1,"durationSeconds":1200,"recoverySeconds":180,"paceLowSeconds":350,"paceHighSeconds":360,"paceUnit":"mi"},
 {"reps":1,"durationSeconds":480,"recoverySeconds":0,"paceLowSeconds":350,"paceHighSeconds":360,"paceUnit":"mi"}]'::jsonb)
on conflict (session_id,version_number) do nothing;

-- A Vault entry becomes athlete-visible only when an attributable published plan
-- links to the exact immutable version. Prototype/canonical rows stay unpublished.
insert into public.speed_plan_vault_links
  (plan_version_id,athlete_id,vault_version_id,linked_by,source_note)
select pv.id,pv.athlete_id,vv.id,pv.authored_by,
       'Published plan title matched to FORM Vault immutable version'
from public.planned_sessions p
join lateral (
  select candidate.* from public.planned_session_versions candidate
  where candidate.planned_session_id=p.id
  order by candidate.version_number desc,candidate.id desc limit 1
) pv on true
join public.vault_session_versions vv on vv.version_number=1
join public.vault_sessions vs on vs.id=vv.session_id
where p.state='published' and pv.authored_by is not null
  and ((vs.id='descent-into-ruin' and lower(pv.title)='descent into ruin')
    or (vs.id='long-holds-01' and lower(pv.title) like 'long holds 01%'))
on conflict (plan_version_id) do nothing;

update public.vault_sessions session
set published=true
where exists (
  select 1 from public.vault_session_versions version
  join public.speed_plan_vault_links link on link.vault_version_id=version.id
  where version.session_id=session.id
);
