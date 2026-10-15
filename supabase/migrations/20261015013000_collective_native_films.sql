-- FORM Collective: native films in publisher-controlled Supabase Storage.
-- A 24 MB H.264/AAC video cannot fit the 5 MB image-only collective-media bucket.
-- Public paths are published only through the same existing session visibility predicate.
-- Storage publication is public-by-URL; withdrawing requires deleting the object as well as
-- clearing the session's video_path. Do not treat a hidden profile alone as a media takedown.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('collective-films', 'collective-films', true, 62914560,
        array['video/mp4','image/jpeg','image/webp']::text[])
on conflict (id) do nothing;

create policy collective_films_publisher_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'collective-films'
              and (storage.foldername(name))[1] = 'sessions'
              and public.collective_is_publisher());
create policy collective_films_publisher_select on storage.objects
  for select to authenticated
  using (bucket_id = 'collective-films'
         and (storage.foldername(name))[1] = 'sessions'
         and public.collective_is_publisher());
create policy collective_films_publisher_update on storage.objects
  for update to authenticated
  using (bucket_id = 'collective-films'
         and (storage.foldername(name))[1] = 'sessions'
         and public.collective_is_publisher())
  with check (bucket_id = 'collective-films'
              and (storage.foldername(name))[1] = 'sessions'
              and public.collective_is_publisher());
create policy collective_films_publisher_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'collective-films'
         and (storage.foldername(name))[1] = 'sessions'
         and public.collective_is_publisher());

alter table public.collective_sessions
  add column video_path text,
  add column poster_path text;

alter table public.collective_sessions
  add constraint collective_session_video_path_format check (
    video_path is null or
    (video_path ~ '^sessions/[a-z0-9]+(-[a-z0-9]+)*/[0-9a-f-]{36}\\.mp4$'
     and video_path like 'sessions/' || slug || '/%')
  ),
  add constraint collective_session_poster_path_format check (
    poster_path is null or
    (poster_path ~ '^sessions/[a-z0-9]+(-[a-z0-9]+)*/[0-9a-f-]{36}\\.(jpg|webp)$'
     and poster_path like 'sessions/' || slug || '/%')
  );

-- Preserve the previous public shape and its publication gate. These paths only appear
-- inside the already filtered public session response, and are resolved by the clients
-- against the fixed Supabase Storage origin and collective-films bucket.
create or replace function public.collective_session_public(s public.collective_sessions)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'slug', s.slug, 'title', s.title, 'detail', s.detail, 'date', s.happened_on, 'place', s.place,
    'youtube_id', s.youtube_id, 'video_path', s.video_path, 'poster_path', s.poster_path,
    'clips', s.clips, 'poster', s.poster_library_id,
    'library', to_jsonb(s.library_ids),
    'run', (select jsonb_build_object('id', r.id, 'title', r.title, 'starts_at', r.starts_at, 'series_id', r.series_id)
              from public.collective_runs_current r
             where r.id = s.run_id and r.author_kind = 'form' and r.visibility = 'public'),
    'people', (select jsonb_agg(
                  jsonb_build_object('slug', p.slug,
                                     'name', public.collective_person_name(p),
                                     'avatar', p.avatar_path)
                  order by lower(p.first_name))
                 from public.collective_session_people sp
                 join public.collective_people p on p.id = sp.person_id
                where sp.session_id = s.id)));
$$;

revoke all on function public.collective_session_public(public.collective_sessions)
  from public, anon, authenticated;
comment on column public.collective_sessions.video_path is
  'Owner-hosted public Storage path within collective-films; clear and delete object to withdraw media.';
