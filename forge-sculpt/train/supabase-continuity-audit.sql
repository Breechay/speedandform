-- FORGE continuity foundation — remote schema preflight
-- READ ONLY. Run each result set in the Training Phases Supabase SQL editor.
-- Do not generate or apply account migrations until this output is reviewed.

-- 1. Existing account, assignment, session, and coach table columns.
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema in ('auth', 'public')
  and table_name in (
    'users',
    'identities',
    'athlete_profiles',
    'athletes',
    'coach_profiles',
    'coach_athletes',
    'program_templates',
    'program_assignments',
    'session_instances',
    'strength_sessions',
    'set_logs',
    'athlete_app_state',
    'connected_identities',
    'product_access',
    'session_completions',
    'session_draft_sets',
    'user_preferences',
    'legacy_migrations',
    'devices',
    'training_events',
    'account_audit_events',
    'identity_reviews'
  )
order by table_schema, table_name, ordinal_position;

-- 2. Primary, unique, foreign-key, and check constraints.
select
  n.nspname as table_schema,
  c.relname as table_name,
  con.conname as constraint_name,
  con.contype as constraint_type,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('auth', 'public')
  and c.relname in (
    'users',
    'identities',
    'athlete_profiles',
    'athletes',
    'coach_profiles',
    'coach_athletes',
    'program_templates',
    'program_assignments',
    'session_instances',
    'strength_sessions',
    'set_logs',
    'athlete_app_state',
    'connected_identities',
    'product_access',
    'session_completions',
    'session_draft_sets',
    'user_preferences',
    'legacy_migrations',
    'devices',
    'training_events',
    'account_audit_events',
    'identity_reviews'
  )
order by table_schema, table_name, constraint_type, constraint_name;

-- 3. Existing indexes, including columns used by current RLS.
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname in ('auth', 'public')
  and tablename in (
    'users',
    'identities',
    'athlete_profiles',
    'athletes',
    'coach_profiles',
    'coach_athletes',
    'program_templates',
    'program_assignments',
    'session_instances',
    'strength_sessions',
    'set_logs',
    'athlete_app_state',
    'connected_identities',
    'product_access',
    'session_completions',
    'session_draft_sets',
    'user_preferences',
    'legacy_migrations',
    'devices',
    'training_events',
    'account_audit_events',
    'identity_reviews'
  )
order by schemaname, tablename, indexname;

-- 4. RLS enablement and every current policy on relevant public tables.
select
  n.nspname as table_schema,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'athlete_profiles',
    'athletes',
    'coach_profiles',
    'coach_athletes',
    'program_templates',
    'program_assignments',
    'session_instances',
    'strength_sessions',
    'set_logs',
    'athlete_app_state',
    'connected_identities',
    'product_access',
    'session_completions',
    'session_draft_sets',
    'user_preferences',
    'legacy_migrations',
    'devices',
    'training_events',
    'account_audit_events',
    'identity_reviews'
  )
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'athlete_profiles',
    'athletes',
    'coach_profiles',
    'coach_athletes',
    'program_templates',
    'program_assignments',
    'session_instances',
    'strength_sessions',
    'set_logs',
    'athlete_app_state',
    'connected_identities',
    'product_access',
    'session_completions',
    'session_draft_sets',
    'user_preferences',
    'legacy_migrations',
    'devices',
    'training_events',
    'account_audit_events',
    'identity_reviews'
  )
order by tablename, policyname;

-- 5. Triggers attached to relevant account/session tables.
select
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema in ('auth', 'public')
  and event_object_table in (
    'users',
    'identities',
    'athlete_profiles',
    'athletes',
    'coach_profiles',
    'coach_athletes',
    'program_templates',
    'program_assignments',
    'session_instances',
    'strength_sessions',
    'set_logs',
    'athlete_app_state',
    'connected_identities',
    'product_access',
    'session_completions',
    'session_draft_sets',
    'user_preferences',
    'legacy_migrations',
    'devices',
    'training_events',
    'account_audit_events',
    'identity_reviews'
  )
order by event_object_schema, event_object_table, trigger_name, event_manipulation;

-- 6. Exact functions referenced by non-system auth/public triggers.
select distinct
  function_ns.nspname as function_schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  pg_get_functiondef(p.oid) as definition
from pg_trigger trg
join pg_class source_table on source_table.oid = trg.tgrelid
join pg_namespace source_ns on source_ns.oid = source_table.relnamespace
join pg_proc p on p.oid = trg.tgfoid
join pg_namespace function_ns on function_ns.oid = p.pronamespace
where not trg.tgisinternal
  and source_ns.nspname in ('auth', 'public')
order by function_schema, function_name, arguments;

-- 6b. Non-trigger RPC/policy helpers and every user-defined SECURITY DEFINER function.
select
  function_ns.nspname as function_schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  owner_role.rolname as owner,
  p.prosecdef as security_definer,
  p.proacl as access_control,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace function_ns on function_ns.oid = p.pronamespace
join pg_roles owner_role on owner_role.oid = p.proowner
where function_ns.nspname = 'public'
   or (
     p.prosecdef
     and function_ns.nspname not in ('pg_catalog', 'information_schema')
     and function_ns.nspname not like 'pg_toast%'
   )
order by function_schema, function_name, arguments;

-- 7. Existing foreign keys that point at auth.users.
select
  source_ns.nspname as source_schema,
  source_table.relname as source_table,
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid, true) as constraint_definition
from pg_constraint con
join pg_class source_table on source_table.oid = con.conrelid
join pg_namespace source_ns on source_ns.oid = source_table.relnamespace
join pg_class target_table on target_table.oid = con.confrelid
join pg_namespace target_ns on target_ns.oid = target_table.relnamespace
where con.contype = 'f'
  and target_ns.nspname = 'auth'
  and target_table.relname = 'users'
order by source_schema, source_table, constraint_name;

-- 8. Views that depend on current athlete/assignment/session tables.
select
  view_schema,
  view_name,
  table_schema,
  table_name
from information_schema.view_table_usage
where table_schema = 'public'
  and table_name in (
    'athlete_profiles',
    'athletes',
    'coach_athletes',
    'program_assignments',
    'session_instances',
    'strength_sessions',
    'set_logs',
    'connected_identities',
    'product_access',
    'session_completions',
    'session_draft_sets',
    'user_preferences',
    'legacy_migrations',
    'devices',
    'training_events',
    'account_audit_events',
    'identity_reviews'
  )
order by view_schema, view_name, table_name;

-- 9. Table grants that can bypass or broaden the intended authority paths.
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'athlete_profiles',
    'athletes',
    'coach_profiles',
    'coach_athletes',
    'program_templates',
    'program_assignments',
    'session_instances',
    'strength_sessions',
    'set_logs',
    'athlete_app_state',
    'connected_identities',
    'product_access',
    'session_completions',
    'session_draft_sets',
    'user_preferences',
    'legacy_migrations',
    'devices',
    'training_events',
    'account_audit_events',
    'identity_reviews'
  )
order by table_name, grantee, privilege_type;

-- 9b. EXECUTE grants on callable public routines.
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_routine_grants
where routine_schema = 'public'
order by routine_name, grantee, privilege_type;
