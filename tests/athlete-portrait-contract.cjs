'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { parseArgs, verifyPortrait } = require('../scripts/verify-athlete-portrait.cjs');

const id = '653fb49b-4127-46ee-abf4-02babdf5df71';
const account = '92088ad2-90e2-4bba-997a-ed4e829563de';
const path = '/assets/athletes/anthony-20261023.jpg';
const params = { athleteId: id, slug: 'anthony', path, visible: true };
const config = { supabaseURL: 'https://example.supabase.co', publishableKey: 'test-public-key', accessToken: 'test-account-token' };

function mockFetch({ portrait = path, status = 200, directory = true, member = true, visible = true, accountID = account } = {}) {
  return async (url, options = {}) => {
    const route = new URL(url).pathname;
    const response = (body, code = 200, type = 'application/json') => ({
      status: code,
      headers: new Map([['content-type', type]]),
      json: async () => body
    });
    if (route.endsWith('/collective_people')) return response([{
      slug: 'anthony', athlete_id: id, account_id: accountID, avatar_path: portrait, visible
    }]);
    if (route.endsWith('/athlete_memberships')) return response(member ? [{ user_id: account }] : []);
    if (route.endsWith('/rpc/collective_people_directory')) return response(directory ? [{ person: { slug: 'anthony', avatar: path } }] : []);
    if (route === path && options.method === 'HEAD') return response(null, status, 'image/jpeg');
    throw new Error('Unexpected verification request ' + route);
  };
}

async function main() {
  assert.deepEqual(parseArgs(['--athlete-id', id, '--slug', 'anthony', '--path', path, '--visibility', 'public']), params);
  assert.throws(() => parseArgs(['--athlete-id', id, '--slug', 'anthony', '--path', path]), /visibility/);
  assert.throws(() => parseArgs(['--athlete-id', id, '--slug', 'anthony', '--path', 'javascript:alert(1)', '--visibility', 'public']), /image path/);

  const ok = await verifyPortrait(params, { ...config, fetcher: mockFetch() });
  assert.equal(ok.accountLinked, true);
  assert.equal(ok.imageURL, 'https://speedandform.com' + path);
  const unclaimedPrivate = await verifyPortrait({ ...params, visible: false }, {
    ...config, fetcher: mockFetch({ visible: false, directory: false, accountID: null })
  });
  assert.equal(unclaimedPrivate.accountLinked, false);
  await assert.rejects(verifyPortrait(params, { ...config, fetcher: mockFetch({ portrait: '/assets/athletes/wrong.jpg' }) }), /not the approved live file/);
  await assert.rejects(verifyPortrait(params, { ...config, fetcher: mockFetch({ status: 404 }) }), /HTTP 404/);
  await assert.rejects(verifyPortrait(params, { ...config, fetcher: mockFetch({ directory: false }) }), /roster visibility/);
  await assert.rejects(verifyPortrait(params, { ...config, fetcher: mockFetch({ member: false }) }), /active athlete membership/);
  await assert.rejects(verifyPortrait(params, { ...config, publishableKey: '' }), /publishable key/);

  // The coach site must resolve the exact same person record as the iOS Dossier,
  // keyed by athlete_id. Name matching and private-storage-only signing regress.
  const coachSource = fs.readFileSync('private/data.js', 'utf8');
  assert.match(coachSource, /from\('collective_people'\)/);
  assert.match(coachSource, /select\('athlete_id,avatar_path'\)\.in\('athlete_id', athleteIds\)/);
  assert.match(coachSource, /publishedByAthlete\.get\(athlete\.id\)/);
  assert.match(coachSource, /portraitUrl: canonical \|\| fallback/);
  assert.doesNotMatch(coachSource.slice(coachSource.indexOf('export async function signPortraits'), coachSource.indexOf('// A standing fact')), /first_name.*avatar_path/);
  console.log('PASS: portrait verifier fails closed on mismatched identity, broken image, roster omission and unverified account');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
