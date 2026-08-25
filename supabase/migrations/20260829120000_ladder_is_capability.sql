-- Reverting 20260829100000. It conflated two different objects.
--
-- The proof ladder is the distinct capability sequence: how far has become
-- believable. 1 2 5 6 8 10 13.1.
--
-- The authored block is a different shape: what the plan asks, in order.
-- 2 5 6 6 8 8 10 6 4. The repeated six and eight are real and must be visible,
-- but as exposures in the evidence, not as duplicated capability rungs. The late
-- six and four are taper maintenance. Rendering them as rungs made a taper look
-- like regression and made a scheduled session look like a new level of proof.
--
-- OUTSIDE is also removed. It is a condition on whether Marcus's evidence counts,
-- which is what surface on the completion records. It is not a capability.

do $$
declare
  m record;
  reached_values numeric[];
begin
  for m in
    select mk.id, mk.athlete_id
      from public.athlete_marks mk
      join public.athletes a on a.id = mk.athlete_id
     where mk.is_primary and a.slug in ('hope', 'jose', 'marcus')
  loop
    select coalesce(array_agg(distinct value), '{}') into reached_values
      from public.mark_checkpoints
     where mark_id = m.id and state in ('reached', 'repeated');

    delete from public.mark_checkpoints where mark_id = m.id;

    insert into public.mark_checkpoints (athlete_id, mark_id, value, label, position, state)
    select m.athlete_id, m.id, v.value, v.label, v.pos,
           case when v.value = any(reached_values) then 'reached' else 'proposed' end
      from (values
        (1.0, '1', 1), (2.0, '2', 2), (5.0, '5', 3), (6.0, '6', 4),
        (8.0, '8', 5), (10.0, '10', 6), (13.1, '13.1', 7)
      ) as v(value, label, pos);
  end loop;
end $$;

comment on column public.mark_checkpoints.value is
  'A distinct distance the claim is testing. One rung per capability. Repeated exposures of the same distance belong to the block and to the evidence, not here: duplicating a rung turns a scheduled session into an apparent new level of proof.';
