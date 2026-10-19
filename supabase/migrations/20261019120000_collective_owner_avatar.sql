-- Owner photo (Oct 19, 2026). An athlete changes their own profile photo from the app: tap the
-- photo or name in the side door, pick a photo, adjust the square crop, save.
--
-- The app crops on the device (square, 1024 px, JPEG) and uploads to the public collective-media
-- bucket at avatars/<their person id>/<any name>.jpg, then calls
-- collective_update_my_person({"avatar": "avatars/<person id>/<name>.jpg"}). The function checks
-- the folder is theirs and the file exists, then stores the public URL in avatar_path, so every
-- reader (site, app, Runs room) keeps using avatar_path as an image source unchanged.

alter table public.collective_people drop constraint if exists collective_people_avatar_path_check;
alter table public.collective_people add constraint collective_people_avatar_path_check check (
  avatar_path is null
  or avatar_path ~ '^/[A-Za-z0-9/_.-]+$'
  or avatar_path ~ '^https://pbgsjjegycacodiltbhn\.supabase\.co/storage/v1/object/public/collective-media/avatars/[0-9a-f-]{36}/[A-Za-z0-9_-]+\.(jpg|jpeg|webp|png)$'
);

-- Storage: an owner reads, writes and removes only their own avatars/<person id>/ folder; the
-- publisher (Brice) can manage any avatar.
create or replace function public.collective_my_person_id() returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select p.id from public.collective_people p where public.collective_person_owned(p) limit 1;
$$;
revoke all on function public.collective_my_person_id() from public, anon;
grant execute on function public.collective_my_person_id() to authenticated;

create policy collective_media_avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'collective-media' and name like 'avatars/%'
              and ((storage.foldername(name))[2] = public.collective_my_person_id()::text or public.collective_is_publisher()));
create policy collective_media_avatars_select on storage.objects for select to authenticated
  using (bucket_id = 'collective-media' and name like 'avatars/%'
         and ((storage.foldername(name))[2] = public.collective_my_person_id()::text or public.collective_is_publisher()));
create policy collective_media_avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'collective-media' and name like 'avatars/%'
         and ((storage.foldername(name))[2] = public.collective_my_person_id()::text or public.collective_is_publisher()));

-- Owner update gains "avatar": the uploaded object's name inside collective-media.
create or replace function public.collective_update_my_person(changes jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare me public.collective_people; new_avatar text;
begin
  select * into me from public.collective_people p where public.collective_person_owned(p) limit 1 for update;
  if not found then raise exception 'no_profile'; end if;
  if changes ? 'avatar' then
    if (changes->>'avatar') !~ ('^avatars/' || me.id::text || '/[A-Za-z0-9_-]+\.(jpg|jpeg|webp|png)$') then
      raise exception 'avatar_not_yours';
    end if;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'collective-media' and o.name = changes->>'avatar') then
      raise exception 'avatar_missing';
    end if;
    new_avatar := 'https://pbgsjjegycacodiltbhn.supabase.co/storage/v1/object/public/collective-media/' || (changes->>'avatar');
  end if;
  update public.collective_people set
    visible = coalesce((changes->>'visible')::boolean, visible),
    show_last_initial = coalesce((changes->>'show_last_initial')::boolean, show_last_initial),
    public_fields = case when changes ? 'public_fields'
                         then array(select jsonb_array_elements_text(changes->'public_fields')) else public_fields end,
    bio = case when changes ? 'bio' then nullif(btrim(changes->>'bio'), '') else bio end,
    bio_confirmed = case when changes ? 'bio' then nullif(btrim(changes->>'bio'), '') is not null else bio_confirmed end,
    instagram = case when changes ? 'instagram' then nullif(ltrim(btrim(changes->>'instagram'), '@'), '') else instagram end,
    strava_url = case when changes ? 'strava_url' then nullif(btrim(changes->>'strava_url'), '') else strava_url end,
    avatar_path = coalesce(new_avatar, avatar_path)
   where id = me.id;
  return public.collective_my_person();
end $$;
