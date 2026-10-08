-- Applied October 8, 2026 with Supabase apply_migration.
-- Recorded under its generated migration version 20261008075900.
-- Add authoritative component pace seconds per mile, and derive existing display clocks
-- only where the component/session units agree. Underlying session versions and
-- component values are immutable here. Unknown units and missing numeric values
-- retain their existing strings. Conflicting explicit units retain legacy strings.
-- Current app consumers display these clocks in their authored distance unit.
-- The new native client prefers the optional numeric fields.
-- Security, grants, wrappers and all unrelated response fields are preserved.

do $typed_paces$
declare
  target record;
  before_row record;
  after_row record;
  definition text;
  revised text;
  old_fragment constant text := $old$'pace_low', c.pace_low, 'pace_high', c.pace_high,$old$;
  old_unit_fragment constant text := $oldunit$'distance', c.distance, 'distance_unit', c.distance_unit,$oldunit$;
  new_unit_fragment constant text := $newunit$'distance', c.distance,
                          'distance_unit', case when c.distance > 0 then c.distance_unit
                                                else coalesce(v.distance_unit, c.distance_unit) end,$newunit$;
  new_fragment constant text := $new$'pace_low', case
                            when c.pace_low_seconds is null then c.pace_low
                            when c.distance > 0 and c.distance_unit is not null and v.distance_unit is not null
                              and c.distance_unit <> v.distance_unit then c.pace_low
                            when coalesce(case when c.distance > 0 then c.distance_unit end, v.distance_unit) = 'km'
                              then public.clock_from_seconds(round(c.pace_low_seconds::numeric / 1.609344)::integer)
                            when coalesce(case when c.distance > 0 then c.distance_unit end, v.distance_unit) = 'mi'
                              then public.clock_from_seconds(c.pace_low_seconds)
                            else c.pace_low end,
                          'pace_high', case
                            when c.pace_high_seconds is null then c.pace_high
                            when c.distance > 0 and c.distance_unit is not null and v.distance_unit is not null
                              and c.distance_unit <> v.distance_unit then c.pace_high
                            when coalesce(case when c.distance > 0 then c.distance_unit end, v.distance_unit) = 'km'
                              then public.clock_from_seconds(round(c.pace_high_seconds::numeric / 1.609344)::integer)
                            when coalesce(case when c.distance > 0 then c.distance_unit end, v.distance_unit) = 'mi'
                              then public.clock_from_seconds(c.pace_high_seconds)
                            else c.pace_high end,
                          'pace_low_seconds', c.pace_low_seconds,
                          'pace_high_seconds', c.pace_high_seconds,$new$;
begin
  perform set_config('lock_timeout', '5s', true);
  perform set_config('statement_timeout', '30s', true);

  for target in select * from (values
    ('public.athlete_plan_feed_impl(uuid)'::text, '20d821f64555fc03dc8a34de80dc7b72'::text),
    ('public.coach_preview_plan_feed(uuid)'::text, 'de220cce8821be7b63ac029d14091091'::text)
  ) as expected(signature, definition_md5)
  loop
    select p.proowner, p.proacl, p.prosecdef, p.provolatile, p.proparallel,
           p.proleakproof, p.proisstrict, p.proconfig,
           obj_description(p.oid, 'pg_proc') as comment
      into strict before_row
      from pg_proc p where p.oid=target.signature::regprocedure;

    select pg_get_functiondef(target.signature::regprocedure) into definition;
    if md5(definition) is distinct from target.definition_md5 then
      raise exception 'Coaching feed changed since review: %', target.signature;
    end if;
    if (length(definition)-length(replace(definition,old_fragment,'')))/length(old_fragment) <> 1 then
      raise exception 'Expected exactly one component pace projection in %', target.signature;
    end if;
    if (length(definition)-length(replace(definition,old_unit_fragment,'')))/length(old_unit_fragment) <> 1 then
      raise exception 'Expected exactly one component distance-unit projection in %', target.signature;
    end if;
    revised := replace(definition, old_fragment, new_fragment);
    revised := replace(revised, old_unit_fragment, new_unit_fragment);
    execute revised;

    select p.proowner, p.proacl, p.prosecdef, p.provolatile, p.proparallel,
           p.proleakproof, p.proisstrict, p.proconfig,
           obj_description(p.oid, 'pg_proc') as comment
      into strict after_row
      from pg_proc p where p.oid=target.signature::regprocedure;
    if to_jsonb(after_row) is distinct from to_jsonb(before_row) then
      raise exception 'Coaching feed attributes or privileges changed: %', target.signature;
    end if;
    if pg_get_functiondef(target.signature::regprocedure) is distinct from revised then
      raise exception 'Unexpected definition rewrite for %', target.signature;
    end if;
  end loop;

  if md5(pg_get_functiondef('public.athlete_plan_feed(uuid)'::regprocedure))
      is distinct from 'ba41bbbb9d15e2ed7b0ad9b06e11d371'
     or md5(pg_get_functiondef('public.athlete_plan_feed_before_exercises(uuid)'::regprocedure))
      is distinct from '214722e07c40f18de7977fc12ddfa0a0'
  then
    raise exception 'The authorized feed wrappers changed during this review';
  end if;
end
$typed_paces$;
