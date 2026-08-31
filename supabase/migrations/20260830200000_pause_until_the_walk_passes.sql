-- Coaching synchronisation starts paused.
--
-- The release branch turns Gate A on by default, so the first athlete to open
-- 39.4 (7) begins talking to this database. The end-to-end walk has not run. Until
-- it has, the honest default is paused: nothing is lost while it is, because a
-- paused sync leaves cached plans readable and leaves filed evidence queued on the
-- device.
--
-- Set here rather than through set_coaching_sync because there is no coach at a
-- keyboard: this is the release process, and the event log says so with a null
-- actor rather than borrowing Brice's name for something he did not do.

update public.coaching_sync_state
   set enabled = false,
       paused_reason = 'Paused until the 39.4 (7) end-to-end athlete walk passes.',
       changed_at = now()
 where id;

insert into public.coaching_sync_events (enabled, reason, actor)
values (false, 'Paused by the release process before the 39.4 (7) walk. No coach threw this.', null);

do $$
begin
  if public.coaching_sync_enabled() then
    raise exception 'sync did not pause';
  end if;
end $$;
