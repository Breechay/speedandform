-- A portrait leaves the phone.
--
-- FORM keeps avatars in ~/Documents/form_avatars on the device. Nothing on the
-- server has ever held an athlete's face, and the Console draws a monogram. Labs
-- is composed around the photograph: a missing standing fact is an empty
-- section, a missing portrait is the whole design.
--
-- Signed, not public. A face is not session evidence and it is not public
-- either, and inventing a consent model to save a re-sign call is the wrong
-- trade. One hour, the same as evidence; the bench re-signs when the tab comes
-- back into view.
--
-- Six crop values, not four. --exp, --con, --px, --py, --pz are what the design
-- file carries per athlete, and --grade is a live control in the photo lab —
-- freezing the grade at build time would freeze the one setting most likely to
-- move once real photographs land.

alter table public.athletes
  add column if not exists portrait_path text,
  add column if not exists portrait_x smallint not null default 50
    check (portrait_x between 0 and 100),
  add column if not exists portrait_y smallint not null default 40
    check (portrait_y between 0 and 100),
  add column if not exists portrait_zoom numeric(4,2) not null default 1.00
    check (portrait_zoom between 1 and 3),
  add column if not exists portrait_exposure numeric(4,2) not null default 0.90
    check (portrait_exposure between 0.2 and 2),
  add column if not exists portrait_contrast numeric(4,2) not null default 1.16
    check (portrait_contrast between 0.5 and 2),
  add column if not exists portrait_grade numeric(4,2) not null default 0.20
    check (portrait_grade between 0 and 1);

comment on column public.athletes.portrait_path is
  'Object path in the athlete-portraits bucket, beginning with the athlete UUID. Signed at read time. Null is a monogram, which is a complete state and not a missing one.';

-- The bucket. Paths begin with the athlete UUID, exactly as session-evidence
-- does, so one folder rule authorises the whole tree.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'athlete-portraits', 'athlete-portraits', false, 8388608,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Read: anyone on the athlete, coach or athlete. The athlete can see their own
-- portrait, which is the least surprising rule there is.
create policy athlete_portrait_member_read on storage.objects for select to authenticated
  using (
    bucket_id = 'athlete-portraits'
    and exists (
      select 1 from public.athlete_memberships m
      where m.user_id = auth.uid()
        and m.status = 'active'
        and m.athlete_id::text = (storage.foldername(name))[1]
    )
  );

-- Write: the coach. The portrait is a composition decision made beside the
-- crop, not something an athlete uploads into a surface they never see.
create policy athlete_portrait_coach_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'athlete-portraits'
    and owner_id = auth.uid()::text
    and exists (
      select 1 from public.athlete_memberships m
      where m.user_id = auth.uid()
        and m.role = 'coach'
        and m.status = 'active'
        and m.athlete_id::text = (storage.foldername(name))[1]
    )
  );

create policy athlete_portrait_coach_update on storage.objects for update to authenticated
  using (
    bucket_id = 'athlete-portraits'
    and exists (
      select 1 from public.athlete_memberships m
      where m.user_id = auth.uid() and m.role = 'coach' and m.status = 'active'
        and m.athlete_id::text = (storage.foldername(name))[1]
    )
  );

create policy athlete_portrait_coach_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'athlete-portraits'
    and exists (
      select 1 from public.athlete_memberships m
      where m.user_id = auth.uid() and m.role = 'coach' and m.status = 'active'
        and m.athlete_id::text = (storage.foldername(name))[1]
    )
  );
