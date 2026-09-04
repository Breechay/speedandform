-- A band belongs to the block, not to forty components.
--
-- `6:30–6:45` is repeated on fifty-four components per athlete. Change race pace
-- and you edit fifty-four rows, and the surface re-derives the block's pace key
-- by counting which band appears most often — which works only because nobody
-- has changed it yet.
--
-- Two of the three bands can be derived. The third cannot exist at all:
-- threshold is real for both athletes, deliberately deprioritised in this block,
-- and prescribed nowhere in it, so there is no component to read it off. Its
-- number and the sentence that explains it are authored coaching text, and
-- `training_blocks.purpose` is an enum. Without a home the choice is to hard-code
-- José's and Hope's coaching into a JavaScript file, where it would also render
-- for Marcus and Natalie. This is the smaller thing.
--
-- Additive, one table, seeded for two blocks. A block with no rows falls back to
-- deriving easy and race work from its components, which is what every other
-- athlete gets.

create table if not exists public.block_pace_bands (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.training_blocks(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  position smallint not null,

  -- What the band is for. Not an enum: a block may name a band this list has
  -- never heard of, and the label is what an athlete reads.
  label text not null check (length(btrim(label)) > 0),
  value text not null check (length(btrim(value)) > 0),

  -- The band in seconds per mile, where it has one. Threshold has a number and
  -- no session, so it carries low and no high; easy is a ceiling and carries the
  -- same shape for a different reason. Nothing derives ownership from this table.
  low_seconds integer check (low_seconds is null or low_seconds > 0),
  high_seconds integer check (high_seconds is null or high_seconds > 0),

  -- WHEN you use it, never how it was derived. A derivation is bookkeeping; an
  -- athlete opening this needs to know which sessions it governs.
  when_line text not null check (length(btrim(when_line)) > 0),

  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block_id, position)
);

create index block_pace_bands_block_idx on public.block_pace_bands (block_id, position);

alter table public.block_pace_bands enable row level security;
create policy pace_bands_member_read on public.block_pace_bands
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy pace_bands_coach_write on public.block_pace_bands
  for insert to authenticated with check (public.is_coach_member(athlete_id));
create policy pace_bands_coach_edit on public.block_pace_bands
  for update to authenticated using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id));

create trigger block_pace_bands_set_updated_at
  before update on public.block_pace_bands
  for each row execute function public.set_updated_at();

comment on table public.block_pace_bands is
  'The pace key for a block, authored once and inherited, rather than re-derived by counting which band appears on the most components. Carries the bands a block prescribes AND the ones it deliberately does not — threshold is real for these athletes and prescribed in no session, and that is the fact the cell exists to state.';

-- Brice's words, for the two Race Pace Durability blocks.
insert into public.block_pace_bands
  (block_id, athlete_id, position, label, value, low_seconds, high_seconds, when_line, authored_by)
select b.id, b.athlete_id, v.position, v.label, v.value, v.low_seconds, v.high_seconds, v.when_line,
       '79d1520c-7c7c-4cd2-bd31-229a3cc56158'
from public.training_blocks b
join public.athletes a on a.id = b.athlete_id
cross join (values
  (1::smallint, 'EASY', '8:45 /mi or slower', 525, null::integer,
     'Build the volume that supports the work. There is no floor — slower is never wrong.'),
  (2::smallint, 'RACE WORK', '6:30–6:45 /mi', 390, 405,
     'Extend how far the pace can be carried. 6:45 is the target and 6:30 is the fastest that still counts; under 6:30 is not a better session, it is a different one.'),
  (3::smallint, 'THRESHOLD', '≈6:15 /mi', 375, null::integer,
     'Keep the ceiling alive while this block spends more of its work on race pace. You already have pace above race pace — the harder problem is carrying the target farther.')
) as v(position, label, value, low_seconds, high_seconds, when_line)
where b.status = 'active' and a.slug in ('jose', 'hope')
on conflict (block_id, position) do nothing;
