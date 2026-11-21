-- REVIEW ONLY. PROPOSAL. Brice applies production migrations. Do not apply from an agent session.
-- AUTHORITATIVE COPY: speedandform repo, supabase/held/20261101230000_public_plan_preview_allowlist.sql (moves to
-- supabase/migrations/ only on Brice's approval). The copy in FORM-iOS (supabase/mirrors/speedandform/) is a byte-identical
-- MIRROR kept for review traceability and tests. It is applied from ONE place only: the speedandform path, by hand, one file
-- at a time, after the migration-ledger check in docs/engineering/MIGRATION_OWNERSHIP_AND_APPLICATION_20261101.md. Never
-- apply both, and never run `supabase db push`. This file refuses to run twice by different routes (ledger check below).
-- Restricts public.public_plan_preview(p_slug) to an explicit allowlist of preview slugs.
--
-- Why: the function served weeks 1-4 (full session prescriptions), the race name/date and the pace band for ANY slug with a
-- live (published, unrevoked) publication. The website and iOS only ever ask for `race-pace-durability` (the free preview of
-- the paid product), but the same function also served the athlete-specific live slugs. Simon and Elijah consented (Brice,
-- Nov 1) to public access of their study plans through paired_study_plans / study_003_plan, which are unchanged; this removes
-- the redundant, unscoped path so no other athlete-specific prescription can become public through an arbitrary slug.
--
-- Behaviour preserved: signature, return type, SECURITY DEFINER, search_path, grants (anon, authenticated, service_role), and
-- the exact redaction (weeks 1-4 full, weeks 5+ empty shells). For an allowlisted slug the output is identical. For any other
-- slug the result is NULL, exactly as for an unknown slug. public_plan stays non-anon; the study functions are not touched.
-- REQUIRED reviewed-definition hash: before running, `set form.expected_preview_md5 = '<md5 of pg_get_functiondef>'`
-- (reviewed live value on Nov 1: 68866480ce502984eca14e47aff398dc). The migration ABORTS if the setting is absent or the
-- function in this database does not hash to it, so staging and production must both match the reviewed definition.
-- Only the disposable test harness may bypass this, with `set form.allow_unreviewed_definition = 'on'`.
-- Recovery: security_backup.function_definition_snapshot_20261101 holds the original definition verbatim; run it to restore.
begin;

create schema if not exists security_backup;
revoke all on schema security_backup from public, anon, authenticated;
create table if not exists security_backup.function_definition_snapshot_20261101 (
    function_signature text primary key,
    definition text not null,
    definition_md5 text not null,
    captured_at timestamptz not null default now()
);
revoke all on table security_backup.function_definition_snapshot_20261101 from public, anon, authenticated;

do $$
declare v_oid oid; v_expected text := nullif(current_setting('form.expected_preview_md5', true), '');
        v_def text; v_recorded boolean;
begin
    -- One application path: refuse if the migration ledger already records this migration (applied via another route).
    if to_regclass('supabase_migrations.schema_migrations') is not null then
        execute $q$select exists (select 1 from supabase_migrations.schema_migrations where name = 'public_plan_preview_allowlist')$q$ into v_recorded;
        if v_recorded then
            raise exception 'the migration ledger already records public_plan_preview_allowlist (applied by another route?); nothing changed';
        end if;
    end if;
    if v_expected is null and coalesce(current_setting('form.allow_unreviewed_definition', true), '') <> 'on' then
        raise exception 'set form.expected_preview_md5 to the reviewed function-definition hash before applying (see the runbook); nothing changed';
    end if;
    select p.oid into v_oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace and n.nspname = 'public'
     where p.proname = 'public_plan_preview' and pg_get_function_identity_arguments(p.oid) = 'p_slug text';
    if v_oid is null then raise exception 'public.public_plan_preview(p_slug text) not found; nothing changed'; end if;
    if not (select prosecdef from pg_proc where oid = v_oid) then raise exception 'public_plan_preview is not SECURITY DEFINER; review first'; end if;
    v_def := pg_get_functiondef(v_oid);
    if v_expected is not null and md5(v_def) <> v_expected then
        raise exception 'public_plan_preview differs from the reviewed definition (md5 %, expected %); nothing changed', md5(v_def), v_expected;
    end if;
    insert into security_backup.function_definition_snapshot_20261101 (function_signature, definition, definition_md5)
    values ('public.public_plan_preview(text)', v_def, md5(v_def)) on conflict do nothing;   -- the first (original) definition is kept
end $$;

-- The allowlist. Server-side only: no API role can read or write it.
create table if not exists public.public_preview_slugs (
    slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
    reason text not null,
    added_at timestamptz not null default now()
);
alter table public.public_preview_slugs enable row level security;
revoke all on table public.public_preview_slugs from public, anon, authenticated;
comment on table public.public_preview_slugs is
    'Slugs whose first four weeks public_plan_preview may serve to anonymous callers. Athlete-specific plans do NOT belong here: they have their own consented study functions.';
insert into public.public_preview_slugs (slug, reason)
values ('race-pace-durability', 'Free public preview (weeks 1-4) of the paid Race Pace Durability product; called by speedandform.com and the iOS app.')
on conflict (slug) do nothing;

create or replace function public.public_plan_preview(p_slug text) returns jsonb
language sql stable security definer set search_path to 'public', 'pg_temp' as $function$
with allowed as (
  select s.slug from public.public_preview_slugs s where s.slug = p_slug
), full_plan as (
  select public.public_plan(a.slug) as payload from allowed a
), redacted as (
  select jsonb_set(
    payload,
    '{weeks}',
    coalesce((
      select jsonb_agg(
        case
          when (week_item->>'week_number')::int <= 4 then week_item
          else jsonb_build_object(
            'week_number', (week_item->>'week_number')::int,
            'phase', null,
            'total_distance', null,
            'intent', null,
            'sessions', '[]'::jsonb
          )
        end
        order by (week_item->>'week_number')::int
      )
      from jsonb_array_elements(payload->'weeks') as week_item
    ), '[]'::jsonb),
    true
  ) as payload
  from full_plan
)
select payload from redacted;
$function$;

-- Self-check: grants and security mode are unchanged, and the allowlist is not readable by API roles.
do $$
begin
    if not has_function_privilege('anon', 'public.public_plan_preview(text)', 'EXECUTE')
       or not has_function_privilege('authenticated', 'public.public_plan_preview(text)', 'EXECUTE') then
        raise exception 'public_plan_preview lost EXECUTE for anon/authenticated';
    end if;
    if has_table_privilege('anon', 'public.public_preview_slugs', 'SELECT') or has_table_privilege('authenticated', 'public.public_preview_slugs', 'SELECT') then
        raise exception 'the allowlist is readable by an API role';
    end if;
    if not exists (select 1 from public.public_preview_slugs where slug = 'race-pace-durability') then
        raise exception 'the race-pace-durability preview is not allowlisted';
    end if;
end $$;
commit;
