-- Approved functional weekly focus is a distinct Halo template.
-- Existing plain, Thursday post-run and Saturday invite formats remain valid.
alter table public.form_ghost_messages drop constraint form_ghost_messages_template_kind_check;
alter table public.form_ghost_messages add constraint form_ghost_messages_template_kind_check
  check (template_kind in ('plain','thursday_postrun','saturday_invite','weekly_focus'));
