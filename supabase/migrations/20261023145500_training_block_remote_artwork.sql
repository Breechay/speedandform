-- Training block art is per athlete and per active block, not per app release.
-- Intentionally does not infer a race from the image, the block name or a focus.
alter table public.training_blocks add column if not exists artwork_url text;
alter table public.training_blocks add constraint training_blocks_artwork_url_https
  check (artwork_url is null or artwork_url ~ '^https://[^[:space:]]+$') not valid;
do $do$ declare f text; begin
  select pg_get_functiondef(p.oid) into f from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='athlete_dossier'
    and pg_get_function_identity_arguments(p.oid)='athlete uuid';
  if f is null then raise exception 'athlete_dossier missing'; end if;
  if position('''phases'', public.athlete_block_phases_live(b.id)' in f)=0
     then raise exception 'dossier contract changed'; end if;
  f:=replace(f,'''phases'', public.athlete_block_phases_live(b.id)',
    '''artwork_url'', b.artwork_url, ''phases'', public.athlete_block_phases_live(b.id)');
  execute f;
end $do$;
-- To change artwork later: upload an image to an approved HTTPS image host,
-- then update only the matching training_blocks.id artwork_url.
-- NULL restores the app's bundled city image, or the plain ink card.
