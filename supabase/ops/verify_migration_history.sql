-- READ-ONLY (SELECT only). Run against the TARGET database (staging, then production) BEFORE applying any migration by hand.
-- Why: the production ledger is ahead of both repos (several recent applied migrations have no file in either repo), so a
-- repo listing cannot say what has been applied. The ledger can. Names, not versions, identify a migration here: ledger
-- versions are application timestamps and differ from the authored file timestamps.
--
-- Edit the two literals below for the migration under check (plain SQL: works in psql, the SQL editor or a read-only tool).
select 'ledger_size' as check, count(*)::text as value, max(version) as detail from supabase_migrations.schema_migrations
union all
select 'already_recorded_by_name', count(*)::text, string_agg(version, ',') from supabase_migrations.schema_migrations where name = 'public_plan_preview_allowlist'
union all
select 'last_five_applied', count(*)::text, string_agg(version || ' ' || name, ' | ' order by version desc) from (select * from supabase_migrations.schema_migrations order by version desc limit 5) x
union all
-- the value to put in `set form.expected_preview_md5` and to compare with the reviewed hash recorded in the runbook
select 'reviewed_function_definition_md5', md5(pg_get_functiondef('public.public_plan_preview(text)'::regprocedure)), 'public.public_plan_preview(text)';
-- Expected before applying: already_recorded_by_name = 0 and reviewed_function_definition_md5 equal to the reviewed hash.
