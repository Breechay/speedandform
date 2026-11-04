-- Signed historical Speed evidence. Append, never replace filed source notes.
-- The immutable completion IDs and prescribed version IDs were read from the
-- FORM Athlete System on Nov 4, 2026. Any mismatch must abort, not relabel.

do $$
declare n integer;
begin
  select count(*) into n from public.session_completions c
  where c.id='d4728126-9fd0-4e65-b2e0-61a5cb55af56'::uuid
    and c.athlete_id='10000000-0000-4000-8000-000000000003'::uuid
    and c.planned_session_version_id='484d8452-5d33-463e-807c-cd4d221ca9ff'::uuid
    and c.rep_paces='400m reps in seconds: 90.6 / 87.3 / 89.6 / 87.4 / 83.0 / 81.8 / 81.7 / 82.0. Recovery 2:00 each.'
    and c.filed_at::date='2026-10-27';
  if n<>1 then raise exception 'Hope Oct 27 evidence no longer matches'; end if;

  select count(*) into n from public.session_pieces
  where completion_id='d4728126-9fd0-4e65-b2e0-61a5cb55af56'::uuid;
  if n not in (0,8) then raise exception 'Hope Oct 27 partial pieces need review'; end if;

  select count(*) into n from public.session_completions c
  where c.id='e264cc00-f342-459a-ba14-f4929a09562a'::uuid
    and c.athlete_id='0637f04a-042f-4888-9fc2-3d0ddb758544'::uuid
    and c.planned_session_version_id='f7ea8ed6-15a9-45c9-ba02-9197009e63ef'::uuid
    and c.filed_at::date='2026-10-29';
  if n<>1 then raise exception 'Saul Oct 29 evidence no longer matches'; end if;

  select count(*) into n from public.session_pieces p
  where p.completion_id='e264cc00-f342-459a-ba14-f4929a09562a'::uuid
    and p.kind='rep' and p.distance is null;
  if n not in (0,9) then raise exception 'Saul Oct 29 piece count needs review'; end if;

  if (select array_agg(p.duration_seconds order by p.position)
      from public.session_pieces p
      where p.completion_id='e264cc00-f342-459a-ba14-f4929a09562a'::uuid
        and p.kind='rep')
       is distinct from array[131,128,137,153,131,53,38,36,43] then
    raise exception 'Saul Oct 29 rep order no longer matches';
  end if;
end $$;

-- Hope's original coach-imported completion already preserves the WhatsApp /
-- Garmin source in athlete_note and the full sequence in rep_paces.
-- These eight typed pieces are an append-only projection of that signed line.
insert into public.session_pieces
  (athlete_id,completion_id,position,kind,distance,distance_unit,
   duration_seconds,duration_seconds_exact)
select c.athlete_id,c.id,x.ord::smallint,'rep',0.4,'km',
       round(x.seconds)::integer,x.seconds
from public.session_completions c
cross join lateral unnest(array[90.6,87.3,89.6,87.4,83.0,81.8,81.7,82.0]::numeric[])
  with ordinality as x(seconds,ord)
where c.id='d4728126-9fd0-4e65-b2e0-61a5cb55af56'::uuid
  and c.athlete_id='10000000-0000-4000-8000-000000000003'::uuid
on conflict (completion_id,position) do nothing;

-- Saul's native filing has the nine times but no distances. The Oct 29
-- immutable prescription defines positions 1–5 as 600m, 6–9 as 200m.
-- Keep his original nulls intact: corrections are signed additive records.
insert into public.speed_piece_distance_corrections
  (athlete_id,piece_id,distance_m,signed_by,source_note)
select p.athlete_id,p.id,case when p.position<=5 then 600 else 200 end,
       '79d1520c-7c7c-4cd2-bd31-229a3cc56158'::uuid,
       'Oct 29 native rep positions matched to coach-authored 5×600m + 4×200m version'
from public.session_pieces p
join public.session_completions c on c.id=p.completion_id and c.athlete_id=p.athlete_id
where c.id='e264cc00-f342-459a-ba14-f4929a09562a'::uuid
  and c.planned_session_version_id='f7ea8ed6-15a9-45c9-ba02-9197009e63ef'::uuid
  and p.kind='rep' and p.position between 1 and 9 and p.distance is null
on conflict (piece_id) do nothing;

-- A past attempt needs an explicit signed Vault link, not a guessed title.
insert into public.speed_completion_vault_links
  (athlete_id,completion_id,vault_version_id,linked_by,source_note)
select c.athlete_id,c.id,v.id,
       '79d1520c-7c7c-4cd2-bd31-229a3cc56158'::uuid,
       'Oct 27 coach-imported 1×1600 + 2×800 + 4×400 Descent Into Ruin'
from public.session_completions c
join public.vault_session_versions v on v.session_id='descent-into-ruin' and v.version_number=1
where c.id='33f038a6-4b4f-4b10-a72d-866204abd477'::uuid
  and c.athlete_id='a1eb15b4-3e91-4b45-a11a-b2e8af9708af'::uuid
  and (select count(*) from public.session_pieces p where p.completion_id=c.id and p.kind='rep')=7
on conflict (completion_id) do nothing;
