-- Read-only preflight for the existing "Database error saving new user" failure.
-- Run in the Supabase SQL editor for the Training Phases project.
-- Do not configure Apple until the returned trigger/function chain is understood.

-- 1. Every non-internal trigger attached directly to auth.users.
select
  trigger_namespace.nspname as trigger_schema,
  trigger_proc.proname as trigger_function,
  trigger_def.tgname as trigger_name,
  trigger_def.tgenabled as trigger_enabled,
  pg_get_triggerdef(trigger_def.oid, true) as trigger_definition,
  pg_get_functiondef(trigger_proc.oid) as function_definition
from pg_trigger trigger_def
join pg_class target_table on target_table.oid = trigger_def.tgrelid
join pg_namespace target_namespace on target_namespace.oid = target_table.relnamespace
join pg_proc trigger_proc on trigger_proc.oid = trigger_def.tgfoid
join pg_namespace trigger_namespace on trigger_namespace.oid = trigger_proc.pronamespace
where target_namespace.nspname = 'auth'
  and target_table.relname = 'users'
  and not trigger_def.tgisinternal
order by trigger_def.tgname;

-- 2. Public functions that mention auth.users and may be called indirectly.
select
  function_namespace.nspname as function_schema,
  function_def.proname as function_name,
  pg_get_function_identity_arguments(function_def.oid) as arguments,
  pg_get_functiondef(function_def.oid) as function_definition
from pg_proc function_def
join pg_namespace function_namespace on function_namespace.oid = function_def.pronamespace
where function_namespace.nspname not in ('pg_catalog', 'information_schema')
  and function_def.prokind in ('f', 'p')
  and pg_get_functiondef(function_def.oid) ilike '%auth.users%'
order by function_namespace.nspname, function_def.proname;

-- 3. Foreign keys that can reject or cascade a new auth.users insert workflow.
select
  source_namespace.nspname as source_schema,
  source_table.relname as source_table,
  constraint_def.conname as constraint_name,
  pg_get_constraintdef(constraint_def.oid, true) as constraint_definition
from pg_constraint constraint_def
join pg_class source_table on source_table.oid = constraint_def.conrelid
join pg_namespace source_namespace on source_namespace.oid = source_table.relnamespace
join pg_class target_table on target_table.oid = constraint_def.confrelid
join pg_namespace target_namespace on target_namespace.oid = target_table.relnamespace
where constraint_def.contype = 'f'
  and target_namespace.nspname = 'auth'
  and target_table.relname = 'users'
order by source_namespace.nspname, source_table.relname, constraint_def.conname;

-- 4. RLS policies on profile/account tables. Review any table written by step 1.
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
order by tablename, policyname;
