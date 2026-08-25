-- The ladder now says what the block actually tests.
--
-- It was seeded as seven rungs with one 6. The authored block contains six miles
-- at race pace twice (weeks 5 and 7, the second "should feel easier") and eight
-- miles twice (weeks 9 and 11, same). A ladder with one 6 and one 8 cannot show
-- the repeat, and repeating a rung is the decision, not padding: six held again
-- at a lower effort is stronger evidence than reaching ten once.
--
-- Weeks 13 and 14 are also six and four miles at pace. They are taper
-- maintenance after the ten, not advances, so they get no rung.
--
-- Marcus gains an OUTSIDE rung at the front. His claim is how far he can hold
-- race pace outside, and every distance rung under it is unanswerable until a
-- run happens outdoors. A treadmill six would otherwise advance him.
--
-- Existing state is preserved by value, so a rung already held stays held.

do $$
declare
  m record;
  reached_values numeric[];
begin
  for m in
    select mk.id, mk.athlete_id, a.slug
      from public.athlete_marks mk
      join public.athletes a on a.id = mk.athlete_id
     where mk.is_primary and a.slug in ('hope', 'jose', 'marcus')
  loop
    select coalesce(array_agg(value), '{}') into reached_values
      from public.mark_checkpoints
     where mark_id = m.id and state in ('reached', 'repeated');

    delete from public.mark_checkpoints where mark_id = m.id;

    insert into public.mark_checkpoints (athlete_id, mark_id, value, label, position, state)
    select m.athlete_id, m.id, v.value, v.label,
           row_number() over (order by v.pos),
           case when v.value = any(reached_values) then 'reached' else 'proposed' end
      from (
        -- Marcus only. Value 0 because it is a condition, not a distance.
        select 0.0 as value, 'outside' as label, 0 as pos where m.slug = 'marcus'
        union all
        select * from (values
          (1.0, '1', 1), (2.0, '2', 2), (5.0, '5', 3),
          (6.0, '6', 4), (6.0, '6', 5),
          (8.0, '8', 6), (8.0, '8', 7),
          (10.0, '10', 8), (13.1, '13.1', 9)
        ) as d(value, label, pos)
      ) as v(value, label, pos);
  end loop;
end $$;

-- Two rungs share a value now, so only the position can identify one. The old
-- assumption that a value is unique to a rung no longer holds anywhere.
comment on column public.mark_checkpoints.value is
  'The distance the rung proves. Not unique: a repeated exposure is its own rung at the same value, which is how six held twice reads as a decision rather than a stall. Position identifies a rung; value does not.';
