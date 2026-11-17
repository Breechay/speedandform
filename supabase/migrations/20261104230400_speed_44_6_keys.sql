-- Initial display preferences for the approved nine-athlete 44.7 Speed rollout.
insert into public.athlete_speed_settings (athlete_id,distance_keys,default_distance_m)
select id,
  case slug
    when 'sam-pawlowski' then array[5000,10000,16093,21098]
    when 'sohel' then array[3219,4828,6437]
    when 'turner-goetsch' then array[1609,3000,5000]
    when 'anthony' then array[1000,1609,5000]
    when 'megan-bolan' then array[100,200,300,400,600,800,1000]
    when 'patrick-stowe' then array[5000,10000,21098,42195]
    when 'adrian' then array[5000,10000,21098,42195]
    when 'elijah' then array[1000,1609,5000]
    when 'brice' then array[200,400,600,800,1000,1609]
    else array[100,200,300,400,600,800,1000]
  end,
  case slug
    when 'hope' then 800
    when 'tinius' then 400
    when 'anthony' then 1000
    when 'adrian' then 42195
    when 'brice' then 1609
    when 'saul-licona' then 600
    when 'megan-bolan' then 600
    when 'elijah' then 1000
    else 1000
  end
from public.athletes
where slug in (
  'jose','hope','tinius','brice','anthony','megan-bolan','adrian','saul-licona','elijah'
)
on conflict (athlete_id) do nothing;

-- Athlete-facing pace preference is data, not a native-name exception. Elijah's
-- authored 1 km prescription remains metric while its pace is converted to /mi.
update public.athlete_speed_settings s
set pace_unit='mi',updated_at=now()
from public.athletes a
where a.id=s.athlete_id and a.slug='elijah';

insert into public.athlete_training_tab_access
  (athlete_id,speed_enabled,strength_enabled)
select id,true,(slug='brice')
from public.athletes
where slug in ('jose','hope','tinius','brice','anthony','megan-bolan','adrian','saul-licona','elijah')
on conflict (athlete_id) do update set
  speed_enabled=excluded.speed_enabled,
  strength_enabled=excluded.strength_enabled,
  updated_at=now();
