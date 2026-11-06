-- Coach review reads the same durable piece evidence as athlete receipts and
-- Speed. Keep rep_paces as a compatibility fallback for older completions.

do $migration$
declare
  v_definition text := pg_get_functiondef('public.coach_filings_pending(integer)'::regprocedure);
  v_updated text;
begin
  v_updated := replace(
    v_definition,
    E'''athlete_note'', c.athlete_note, ''rep_paces'', c.rep_paces)',
    E'''athlete_note'', c.athlete_note, ''rep_paces'', c.rep_paces,\n'
    || E'             ''rep_splits'', coalesce((select jsonb_agg(jsonb_build_object(\n'
    || E'               ''position'',piece.position,\n'
    || E'               ''distance_meters'',round(coalesce(correction.distance_m,case piece.distance_unit\n'
    || E'                 when ''m'' then piece.distance when ''km'' then piece.distance*1000\n'
    || E'                 when ''mi'' then piece.distance*1609.344 else null end))::integer,\n'
    || E'               ''duration_ms'',round(coalesce(piece.duration_seconds_exact,piece.duration_seconds::numeric)*1000)::bigint\n'
    || E'             ) order by piece.position)\n'
    || E'             from public.session_pieces piece\n'
    || E'             left join public.speed_piece_distance_corrections correction\n'
    || E'               on correction.piece_id=piece.id and correction.athlete_id=c.athlete_id\n'
    || E'             where piece.completion_id=c.id and piece.athlete_id=c.athlete_id\n'
    || E'               and piece.kind=''rep''),''[]''::jsonb))'
  );
  if v_updated = v_definition then
    raise exception 'coach_filings_pending structured split insertion did not match reviewed source';
  end if;
  execute v_updated;
end;
$migration$;

revoke all on function public.coach_filings_pending(integer) from public,anon;
grant execute on function public.coach_filings_pending(integer) to authenticated;

comment on function public.coach_filings_pending(integer) is
  'Coach-scoped unmarked filing queue with canonical structured rep splits and legacy rep text fallback.';
