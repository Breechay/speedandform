-- A session asks a question. A coach answers it. Two facts, two homes.
--
-- `establishes_checkpoint_id` was specified on 4 September as "the ladder rung
-- this session would move if it lands" and, the same day, as "this session is
-- the one aiming at that rung — a coaching intention rather than an eligibility
-- test". That is authored intent about a session that has not been run.
--
-- The verb was the only misleading thing about it. `establishes` reads as a
-- record of the past and means an intention about the future, and the surfaces
-- would have had to explain that to an athlete before they had run a step.
--
-- Renamed while it is free: 0 of 309 rows populated, and no surface reads it.
-- The day the ask model ships this rename costs data, code and a deployment.

alter table public.planned_sessions
  rename column establishes_checkpoint_id to asks_checkpoint_id;

comment on column public.planned_sessions.asks_checkpoint_id is
  'The ladder rung this session ASKS about — authored before it is run, never inferred from its shape. Separate from is_key: a session can be what the week asks without asking a rung. It does not record establishment; that is a coach ruling in mark_checkpoint_movements.';

-- ── the answer keeps its own home, and gains the missing axis ───────────────
--
-- `mark_checkpoint_movements` already carries the ruling: source, decision,
-- previous and resulting state, the evidence, a required reason and enforced
-- attribution. Nothing about the verdict needed building.
--
-- What it could not carry is WHY the coach believes the result happened. That
-- lived only in `reason` as prose, which means the question that matters at the
-- plan level — did three athletes miss this rung for the same cause — could only
-- be answered by reading sentences. Inferring meaning from prose is the same
-- shape-matching this model exists to remove, one layer up.
--
-- Five readings, and only one of them is evidence about the athlete's
-- durability. The other four are evidence about the conditions of the test.

alter table public.mark_checkpoint_movements
  add column if not exists interpretation text
    check (interpretation in ('pace', 'durability', 'load', 'environment', 'insufficient_evidence'));

comment on column public.mark_checkpoint_movements.interpretation is
  'What the coach believes explains the result. Authored, nullable, never inferred. `durability` is the only value that is evidence about the athlete; `pace`, `load`, `environment` and `insufficient_evidence` are evidence about the conditions of the test and must not be read as the athlete failing.';

-- ── the asks that exist today ───────────────────────────────────────────────
--
-- Scoped to the blocks actually named Race Pace Durability, which is José's and
-- Hope's. Their rungs are 1 · 2 · 5 · 6 · 8 · 10 · 13.1, with 1 and 2 reached.
--
-- The scope is not decoration. Written without it, this migration also tagged
-- four sessions of Marcus's — he carries the same 6:30–6:45 band and a ladder
-- nobody has audited — including a long run matching his unreached rung 2, which
-- is the exact shape-matching this column exists to abolish. Whether Marcus is
-- running this method is an open coaching judgment on the list, and a migration
-- must not answer it by arithmetic.
--
-- An ask is the FIRST dated session whose single continuous work component at
-- the block's race-pace band equals a rung that was not already reached. That
-- deliberately excludes three things a shape match would have swept in:
--
--   · long runs carrying two miles at race pace, which match the reached rung 2
--     and ask nothing — precisely the inference this column replaces;
--   · W13's second six-mile session, because a rung is asked once and six is
--     answered in W4;
--   · the race itself, which is not a training ask.
--
-- Written as one deliberate classification, asserted below, and never repeated:
-- from here a coach authors the ask when they author the session.
with band as (
  select athlete_id, min(pace_low) lo, max(pace_high) hi
    from planned_session_components
   where role = 'work' and pace_low = '6:30' and pace_high = '6:45'
   group by athlete_id),
latest as (
  select distinct on (v.planned_session_id) v.*
    from planned_session_versions v
   order by v.planned_session_id, v.version_number desc),
candidate as (
  select ps.id session_id, ck.id checkpoint_id, ps.athlete_id,
         row_number() over (partition by ps.athlete_id, ck.id
                            order by ps.scheduled_on) seq
    from planned_sessions ps
    join training_weeks w on w.id = ps.week_id
    join training_blocks blk on blk.id = w.block_id
                            and blk.status = 'active'
                            and blk.name = 'Race Pace Durability'
    join latest lv on lv.planned_session_id = ps.id
    join planned_session_components c on c.version_id = lv.id
    join band b on b.athlete_id = ps.athlete_id
    join athlete_marks m on m.athlete_id = ps.athlete_id and m.is_primary
    join mark_checkpoints ck on ck.mark_id = m.id and ck.value = c.distance
   where ps.state <> 'cancelled'
     and ps.scheduled_on is not null
     and c.role = 'work' and c.shape = 'continuous'
     and c.pace_low = b.lo and c.pace_high = b.hi
     and ck.state <> 'reached'
     and ck.value < 13.1)
update public.planned_sessions ps
   set asks_checkpoint_id = candidate.checkpoint_id
  from candidate
 where candidate.session_id = ps.id and candidate.seq = 1;

do $$
declare n integer; per_athlete text; dupes integer;
begin
  select count(*) into n from public.planned_sessions where asks_checkpoint_id is not null;
  if n <> 8 then
    raise exception 'expected 8 asks — four rungs for each of two athletes — got %', n;
  end if;

  -- A rung is asked once. Two sessions claiming the same checkpoint would put
  -- the ladder back into ambiguity.
  select count(*) into dupes from (
    select asks_checkpoint_id from public.planned_sessions
     where asks_checkpoint_id is not null
     group by asks_checkpoint_id having count(*) > 1) t;
  if dupes <> 0 then raise exception '% checkpoints are asked by more than one session', dupes; end if;

  -- A session may only ask a rung belonging to the athlete it is prescribed to.
  if exists (select 1 from public.planned_sessions ps
               join public.mark_checkpoints ck on ck.id = ps.asks_checkpoint_id
              where ck.athlete_id <> ps.athlete_id) then
    raise exception 'a session asks a rung that belongs to another athlete';
  end if;

  select string_agg(x, '; ' order by x) into per_athlete from (
    select a.slug || ': ' || string_agg(ck.value::text, ', ' order by ck.value) x
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join public.mark_checkpoints ck on ck.id = ps.asks_checkpoint_id
     group by a.slug) t;
  raise notice 'asks authored — %', per_athlete;
end $$;
