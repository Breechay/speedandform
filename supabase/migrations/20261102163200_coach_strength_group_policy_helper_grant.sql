-- Existing authenticated RLS policies on coach_strength_groups and
-- coach_strength_group_members call this SECURITY DEFINER role predicate.
-- Without EXECUTE, *every* browser read fails before the policy can decide.
-- The predicate still only returns administrator status and does not grant
-- read/write access to any table by itself.
grant execute on function public.is_active_coaching_administrator(uuid) to authenticated;
