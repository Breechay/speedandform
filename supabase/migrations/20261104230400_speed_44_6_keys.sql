-- Initial display preferences, editable by coach Setup. These are not gates:
-- every other athlete uses the seven-lane default, even with no filed evidence.
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
    else array[100,200,300,400,600,800,1000]
  end
from public.athletes
where slug in (
  'jose','hope','tinius','brice','sam-reyes','sam-pawlowski',
  'sohel','turner-goetsch','anthony','megan-bolan','patrick-stowe','adrian'
)
on conflict (athlete_id) do nothing;
