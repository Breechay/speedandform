-- Initial display preferences for the approved eight-athlete 44.7 Speed rollout.
insert into public.athlete_speed_settings (athlete_id,distance_keys)
select id,
  case slug
    when 'sam-pawlowski' then array[5000,10000,16093,21098]
    when 'sohel' then array[3219,4828,6437]
    when 'turner-goetsch' then array[1609,3000,5000]
    when 'anthony' then array[1000,1609,5000]
    when 'megan-bolan' then array[1000,1609,5000]
    when 'patrick-stowe' then array[5000,10000,21098,42195]
    when 'adrian' then array[5000,10000,21098,42195]
    when 'elijah' then array[5000,21098]
    else array[100,200,300,400,600,800,1000]
  end
from public.athletes
where slug in (
  'jose','hope','tinius','brice','anthony','megan-bolan','adrian','saul','elijah'
)
on conflict (athlete_id) do nothing;

insert into public.athlete_training_tab_access
  (athlete_id,speed_enabled,strength_enabled)
select id,true,(slug='brice')
from public.athletes
where slug in ('jose','hope','tinius','brice','anthony','megan-bolan','adrian','saul','elijah')
on conflict (athlete_id) do update set
  speed_enabled=excluded.speed_enabled,
  strength_enabled=excluded.strength_enabled,
  updated_at=now();
