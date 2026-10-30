const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const sql = fs.readFileSync(path.join(root,'supabase/migrations/20261025184500_form_miami_shared_publication_and_notifications.sql'),'utf8');
const site = fs.readFileSync(path.join(root,'js/group-runs.js'),'utf8');
const coach = fs.readFileSync(path.join(root,'coach/miami/miami.js'),'utf8');
const edge = fs.readFileSync(path.join(root,'supabase/functions/form-messages/index.ts'),'utf8');
const inbox = fs.readFileSync(path.join(root,'athlete/inbox.js'),'utf8');

assert.match(sql,/unique\s*\(planned_session_id\)/i,'one group link per exact planned session');
assert.match(sql,/exists\(select 1 from public\.session_completions where planned_session_id/i,'completed session exclusion');
assert.match(sql,/p_expected->>r\.session_id::text is distinct from v\.id::text/,'stale preview protection');
assert.match(sql,/coalesce\(s\.override_reason,' '\)|coalesce\(s\.override_reason,''\)/,'individual override exclusion');
assert.match(sql,/public\.form_miami_public_calendar\(\)/,'public boundary');
assert.match(sql,/join public\.collective_public_runs/,'only published public occurrences');
assert.match(sql,/where l\.lane='thursday'/,'no public Saturday private distances');
assert.match(sql,/u\.email_confirmed_at is not null/,'verified claimed addresses only');
assert.match(sql,/revoke all on public\.\%I from public, anon, authenticated/,'RLS and no direct grants');
assert.match(coach,/No FORM .* meetup is linked here/,'no implied Saturday gathering');
assert.match(coach,/form_miami_publish_thursday/,'one shared coach writer');
assert.match(coach,/form_miami_link_run/,'actual run link independent');
assert.match(site,/form_miami_public_calendar/,'website reads public publication projection');
assert.match(edge,/form_miami_email_claim/,'email receives only server recipients');
assert.match(edge,/coach_only/,'coach-only dispatcher');
assert.match(inbox,/form_miami_mark_read/,'private inbox read receipt');
// A shared date must carry the coach's current pace standard into each new
// typed component. The original writer dropped it whenever rep geometry changed.
const paceMigration = fs.readFileSync(path.join(root,'supabase/migrations/20261030033000_form_miami_shared_group_pace_standard.sql'),'utf8');
assert.match(paceMigration,/perform public\.form_miami_ensure_coach\(\)/,'coach auth remains mandatory');
assert.match(paceMigration,/p_expected->>r\.session_id::text is distinct from v\.id::text/,'version preview remains mandatory');
assert.match(paceMigration,/invalid_or_missing_group_pace/,'shared numeric targets required');
assert.match(paceMigration,/form_miami_is_protected_study_session/,'study-owned sessions excluded server-side');
assert.match(paceMigration,/s\.id=p_session_id and tp\.slug='simon-ceiling-durability-01'/,'Simon Study 003 is an explicit owner exception');
assert.match(paceMigration,/'protected',case when s\.id is null/,'protected state returned by coach preview');
assert.match(coach,/!r\.protected/,'coach preview does not sign protected studies for publication');
assert.match(paceMigration,/form_miami_week_story_status/,'coach-scoped week story receipt');
assert.match(paceMigration,/coach_audit_private\.week_story_is_current/,'week story checks authoritative audit timestamp');
assert.match(coach,/statuses\?\.\[r\.id\]!==true/,'coach cannot report a week current without its release receipt');
assert.match(coach,/sb\.from\('training_weeks'\)\.update/,'coach owns the weekly copy review');
assert.match(paceMigration,/n\.value \|\| jsonb_build_object/,'group pace fields are used directly');
assert.doesNotMatch(paceMigration,/old\.pace_low_seconds/,'do not retain wrong paces from prior geometry');
assert.match(coach,/paceLowSeconds=parsePace\(fast\)/,'coach editor writes fast /mi band');
assert.match(coach,/paceHighSeconds=parsePace\(slow\)/,'coach editor writes slow /mi band');
assert.match(coach,/paceMode==='effort'/,'explicit unpaced recovery day is supported');

const vm = require('node:vm');
const helpers = coach.slice(coach.indexOf('function formatPace('),coach.indexOf('function setRow('));
assert.ok(helpers.includes('function parsePace('),'pace helpers exist');
const paceHelpers = vm.runInNewContext(helpers+'; ({formatPace,parsePace})');
assert.equal(paceHelpers.parsePace('5:19'),319);
assert.equal(paceHelpers.parsePace('6:08'),368);
assert.equal(paceHelpers.formatPace(319),'5:19');
assert.throws(()=>paceHelpers.parsePace('3:99'));
assert.throws(()=>paceHelpers.parsePace('16:00'));

console.log('FORM Miami static publication contract passes.');
