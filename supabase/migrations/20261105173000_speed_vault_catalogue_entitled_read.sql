-- The 20-session Vault catalogue is an approved part of the Speed experience.
-- Publication controls launchability; it must not erase unlaunched library rows.
-- Direct reads remain limited to active Speed athletes and coaching admins.

drop policy if exists speed_vault_read on public.vault_sessions;
create policy speed_vault_read on public.vault_sessions
for select to authenticated
using (
  published
  or public.is_active_coaching_administrator()
  or exists (
    select 1
    from public.athlete_memberships membership
    join public.athlete_training_tab_access access on access.athlete_id=membership.athlete_id
    where membership.user_id=auth.uid()
      and membership.role='athlete' and membership.status='active'
      and access.speed_enabled
  )
);

drop policy if exists speed_vault_versions_read on public.vault_session_versions;
create policy speed_vault_versions_read on public.vault_session_versions
for select to authenticated
using (exists (
  select 1 from public.vault_sessions session
  where session.id=vault_session_versions.session_id
));
