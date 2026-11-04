-- Verbatim authored track Vault catalogue from FORMTrackSessionCatalog.swift
-- (44.5 RC). Targets in milliseconds, inclusive; one-number bands are ceilings.
-- Future proposed Thursday work is NOT silently made a published Vault target.

insert into public.vault_sessions (id,title,authored_order,published)
values
 ('resurrection','RESURRECTION',1,true),
 ('death','DEATH',2,true),
 ('speed-demons','SPEED DEMONS',3,true),
 ('gauntlet','GAUNTLET',4,true),
 ('pyramid-intervals','PYRAMID INTERVALS',5,true),
 ('nice-and-easy','NICE AND EASY',6,true),
 ('descent-into-ruin','DESCENT INTO RUIN',7,true),
 ('the-fifth-circle','THE FIFTH CIRCLE',8,false)
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
 {"reps":5,"distanceMeters":600,"targetMinMs":null,"targetMaxMs":null,"recovery":null},
 {"reps":4,"distanceMeters":200,"targetMinMs":null,"targetMaxMs":null,"recovery":null}]'::jsonb)
on conflict (session_id,version_number) do nothing;
