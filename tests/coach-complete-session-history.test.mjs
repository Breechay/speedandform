import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const source = readFileSync(new URL('../private/data.js', import.meta.url), 'utf8');
const helper = source.match(/async function selectCompleteAthleteHistory\([\s\S]*?\n\}/)?.[0];

function readerWith(rows, { errorAt = null } = {}) {
  assert.ok(helper, 'complete-history pagination helper is present');
  const calls = [];
  const supabase = {
    from(table) {
      assert.equal(table, 'planned_session_components');
      return {
        select(columns) { assert.equal(columns, '*'); return this; },
        eq(column, value) {
          assert.equal(column, 'athlete_id');
          assert.equal(value, 'athlete-1');
          return this;
        },
        order(column, options) {
          assert.ok(column === 'position' || column === 'id');
          assert.equal(options.ascending, true);
          return this;
        },
        async range(from, to) {
          calls.push([from, to]);
          if (from === errorAt) return { data: null, error: new Error('Page unavailable') };
          return { data: rows.slice(from, to + 1), error: null };
        }
      };
    }
  };
  const read = new Function('supabase', `const ATHLETE_HISTORY_PAGE = 500;
${helper}
return selectCompleteAthleteHistory;`)(supabase);
  return { read, calls };
}

test('athlete histories beyond 1,000 rows retain the final workout stage', async () => {
  // A component query ordered by position puts every first step before
  // every second step, so the third can be silently lost at the API row cap.
  const rows = Array.from({ length: 1203 }, (_, i) => ({
    id: String(i).padStart(4, '0'),
    position: i < 600 ? 1 : i < 1200 ? 2 : 3
  }));
  const { read, calls } = readerWith(rows);
  const result = await read('planned_session_components', 'athlete-1', 'position');
  assert.equal(result.error, null);
  assert.equal(result.data.length, 1203);
  assert.deepEqual(result.data.slice(-3).map(row => row.position), [3, 3, 3]);
  assert.deepEqual(calls, [[0, 499], [500, 999], [1000, 1499]]);
});

test('a failed later page returns an error rather than an incomplete prescription', async () => {
  const rows = Array.from({ length: 1203 }, (_, id) => ({ id, position: 1 }));
  const { read, calls } = readerWith(rows, { errorAt: 500 });
  const result = await read('planned_session_components', 'athlete-1', 'position');
  assert.equal(result.data, null);
  assert.match(result.error.message, /Page unavailable/);
  assert.deepEqual(calls, [[0, 499], [500, 999]]);
});

test('coach and athlete records paginate both versions and components', () => {
  const record = source.split('export async function loadAthleteRecord')[1]
    .split('export async function')[0];
  assert.match(record, /selectCompleteAthleteHistory\('planned_session_versions', athleteId, 'version_number', false\)/);
  assert.match(record, /selectCompleteAthleteHistory\('planned_session_components', athleteId, 'position'\)/);
  const syntax = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    input: source,
    encoding: 'utf8'
  });
  assert.equal(syntax.status, 0, syntax.stderr);
});
