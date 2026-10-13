-- Publication authorization is separate from the athlete's private coach-sharing consent.
-- This registry holds no workout copies. Revocation takes effect on the next read.
create table public.strength_study_publications (
  study_slug text primary key check (study_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 80),
  consent_recorded_at timestamptz not null,
  consent_note text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.strength_study_publications enable row level security;
revoke all on public.strength_study_publications from public, anon, authenticated;
grant all on public.strength_study_publications to service_role;
comment on table public.strength_study_publications is
  'Service-managed publication consent. No client policies intentionally; private workout tables remain private.';

-- Only the public-read Edge Function may call this projection with its server-side role.
-- SECURITY INVOKER avoids creating a privileged anonymous RPC over private receipts.
create function public.published_strength_study(p_study_slug text, p_offset integer default 0)
returns jsonb language sql stable security invoker set search_path = '' as $$
with publication as (
  select athlete_id, display_name from public.strength_study_publications
  where study_slug = p_study_slug and revoked_at is null and consent_recorded_at <= now()
), eligible as (
  select r.*, v.version_number from public.forge_strength_receipts r
  join publication p on p.athlete_id = r.athlete_id
  left join public.planned_session_versions v on v.id = r.planned_session_version_id
    and v.athlete_id = r.athlete_id
  where r.native_payload is not null and r.completed_at is not null
    and r.consent_version = 'forge-coach-receipts-v1'
    and jsonb_typeof(r.native_payload->'sets') = 'array'
    and jsonb_array_length(r.native_payload->'sets') > 0
    and not (r.native_payload ? 'isBackfilled')
    and not (r.native_payload ? 'reportedHistorySource')
), page as (
  select * from eligible order by completed_at desc, receipt_id desc
  limit 50 offset greatest(0, least(coalesce(p_offset,0),10000))
), records as (
  select completed_at, receipt_id, jsonb_build_object(
    'id', md5(receipt_id), 'source', 'strength_app',
    'session_name', session_name, 'week', plan_week_number,
    'completed_at', completed_at, 'received_at', received_at,
    'prescription_version', version_number,
    'duration_seconds', native_payload->'durationSeconds',
    'sets', (select jsonb_agg(jsonb_build_object(
      'movement_id', s->>'movementId', 'movement_name', s->>'movementName',
      'set_index', s->'setIndex', 'weight', s->'weight',
      'weight_unit', case when s->>'weightUnit' in ('lb','kg') then s->>'weightUnit'
        when native_payload->>'weightUnit' in ('lb','kg') then native_payload->>'weightUnit' else null end,
      'reps', s->'reps', 'seconds', s->'seconds'
    ) order by n) from jsonb_array_elements(native_payload->'sets') with ordinality as x(s,n))
  ) as record from page
)
select case when not exists(select 1 from publication) then
  jsonb_build_object('schema_version',1,'status','not_published')
else jsonb_build_object(
  'schema_version',1,'status','published','study',p_study_slug,
  'athlete',(select display_name from publication),'source','strength_app',
  'checked_at',now(),'total_sessions',(select count(*) from eligible),
  'last_received_at',(select max(received_at) from eligible),
  'offset',greatest(0, least(coalesce(p_offset,0),10000)), 'page_size',50,
  'sessions',coalesce((select jsonb_agg(record order by completed_at desc,receipt_id desc) from records),'[]'::jsonb)
) end;
$$;
revoke all on function public.published_strength_study(text,integer) from public,anon,authenticated;
grant execute on function public.published_strength_study(text,integer) to service_role;
