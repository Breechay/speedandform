import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync(new URL('../../supabase/migrations/20261107100000_speed_record_v1.sql',import.meta.url),'utf8');

assert.match(sql,/security invoker/i);
assert.match(sql,/revoke all on function public\.athlete_speed_record_v1\(uuid\) from public,anon/i);
assert.match(sql,/access\.speed_enabled/);
assert.match(sql,/public\.can_read_athlete\(a\.id\)/);
assert.match(sql,/planned_session_version_id=link\.planned_session_version_id/);
assert.match(sql,/count\(distinct id\)/);
assert.match(sql,/sum\(piece\.duration_seconds\)\/sum\(piece\.distance_m\)\*1609\.344/);
assert.match(sql,/count\(piece\.piece_id\)=count\(\*\) filter\(where piece\.duration_seconds>0 and piece\.distance_m>0\)/);
assert.match(sql,/session\.state='published'/);
assert.match(sql,/version\.version_number=\(select max/);
assert.doesNotMatch(sql,/vault_sessions/);
assert.doesNotMatch(sql,/title ilike/i);

console.log('Speed Record v1 source contract passed');
