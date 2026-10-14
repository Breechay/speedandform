-- Oct 13, 2026 data, from Brice: Strava links for the first group (matched by profile name),
-- Tinius's last initial, José tagged beside Hope on the long-run photos, and the three
-- library photos renamed so no file name carries a person's name.
update public.collective_people p set strava_url = v.url,
  public_fields = case when 'strava' = any(p.public_fields) then p.public_fields else p.public_fields || array['strava'] end,
  last_initial = coalesce(p.last_initial, v.li)
from (values ('hope','https://www.strava.com/athletes/147194619',null),
             ('jose','https://www.strava.com/athletes/136021107',null),
             ('adrian','https://www.strava.com/athletes/28764283',null),
             ('tinius','https://www.strava.com/athletes/102936164','S')) v(slug,url,li)
where p.slug = v.slug;
insert into public.collective_person_tags (person_id, library_id, status, confirmed_at, created_by)
select p.id, l, 'confirmed', now(), null
  from public.collective_people p, unnest(array['bridge-profile','canopy-street','crossing-ahead']) l
 where p.slug = 'jose' on conflict do nothing;
update public.collective_person_tags set library_id = case library_id
  when 'hope-bridge-stride' then 'bridge-stride' when 'jose-track-dusk' then 'track-dusk' when 'adrian-dune-path' then 'dune-path' end
 where library_id in ('hope-bridge-stride','jose-track-dusk','adrian-dune-path');
update public.collective_people set hero_path = replace(replace(replace(hero_path,
  'hope-bridge-stride','bridge-stride'),'jose-track-dusk','track-dusk'),'adrian-dune-path','dune-path')
 where hero_path ~ '(hope-bridge-stride|jose-track-dusk|adrian-dune-path)';
