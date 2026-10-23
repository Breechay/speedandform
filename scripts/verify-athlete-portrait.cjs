'use strict';

// Read-only post-publication gate. No service-role credentials or database writes.
// Run only after the new image is in a successful production deployment.
const assert = require('node:assert/strict');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE_IMAGE = /^\/[A-Za-z0-9/_.-]+\.(?:jpe?g|png|webp)$/i;

function parseArgs(argv) {
  const pairs = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i]?.startsWith('--') || argv[i + 1] == null) throw new Error('Use --athlete-id UUID --slug SLUG --path /assets/athletes/FILE.jpg --visibility public|private');
    pairs[argv[i].slice(2)] = argv[i + 1];
  }
  assert.match(pairs['athlete-id'] || '', UUID, 'A canonical athlete UUID is required');
  assert.match(pairs.slug || '', /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'A valid person slug is required');
  assert.match(pairs.path || '', SITE_IMAGE, 'A versioned site image path is required');
  assert.ok(['public', 'private'].includes(pairs.visibility), 'Explicit public/private visibility is required');
  return { athleteId: pairs['athlete-id'], slug: pairs.slug, path: pairs.path, visible: pairs.visibility === 'public' };
}

async function verifyPortrait({ athleteId, slug, path, visible }, { supabaseURL, publishableKey, accessToken, siteURL = 'https://speedandform.com', fetcher = fetch }) {
  assert.match(athleteId, UUID);
  assert.match(path, SITE_IMAGE);
  assert.ok(supabaseURL && publishableKey && accessToken, 'A publisher access token, Supabase URL and publishable key are required');
  const rest = new URL('/rest/v1/', supabaseURL);
  const headers = { apikey: publishableKey, Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
  async function rows(endpoint, query = {}) {
    const url = new URL(endpoint, rest);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    const response = await fetcher(url, { headers });
    assert.equal(response.status, 200, `Supabase ${endpoint} HTTP ${response.status}`);
    const data = await response.json();
    assert.ok(Array.isArray(data), `Expected an array from ${endpoint}`);
    return data;
  }

  const people = await rows('collective_people', {
    select: 'slug,athlete_id,account_id,avatar_path,visible', athlete_id: `eq.${athleteId}`
  });
  assert.equal(people.length, 1, 'Exactly one collective person must be bound to this canonical athlete ID');
  const person = people[0];
  assert.equal(person.slug, slug, 'Portrait subject slug does not match the athlete');
  assert.equal(person.avatar_path, path, 'Database portrait is not the approved live file');
  assert.equal(person.visible, visible, 'Public profile visibility differs from coach authorization');

  if (person.account_id) {
    const members = await rows('athlete_memberships', {
      select: 'user_id', athlete_id: `eq.${athleteId}`, user_id: `eq.${person.account_id}`,
      role: 'eq.athlete', status: 'eq.active'
    });
    assert.equal(members.length, 1, 'Account ID does not belong to an active athlete membership');
  }

  const directoryURL = new URL('rpc/collective_people_directory', rest);
  const directoryResponse = await fetcher(directoryURL, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(directoryResponse.status, 200, `Public athlete directory HTTP ${directoryResponse.status}`);
  const directory = await directoryResponse.json();
  assert.ok(Array.isArray(directory), 'Public directory response is not an array');
  const entries = directory.map((entry) => entry.person || entry).filter((entry) => entry.slug === slug);
  assert.equal(entries.length, visible ? 1 : 0, 'Public athlete roster visibility does not agree with Supabase');
  if (visible) assert.equal(entries[0].avatar, path, 'Public website portrait does not match the canonical portrait');

  const imageURL = new URL(path, siteURL);
  const imageResponse = await fetcher(imageURL, { method: 'HEAD', redirect: 'follow' });
  assert.equal(imageResponse.status, 200, `Production image returned HTTP ${imageResponse.status}`);
  assert.match(imageResponse.headers.get('content-type') || '', /^image\/(jpeg|png|webp)/i, 'Production URL is not an image');
  return { slug, athleteId, imageURL: imageURL.href, visible, accountLinked: Boolean(person.account_id) };
}

if (require.main === module) {
  (async () => {
    const args = parseArgs(process.argv.slice(2));
    const result = await verifyPortrait(args, {
      supabaseURL: process.env.FORM_SUPABASE_URL,
      publishableKey: process.env.FORM_SUPABASE_PUBLISHABLE_KEY,
      accessToken: process.env.FORM_PUBLISHER_ACCESS_TOKEN
    });
    console.log('PASS: live image, Supabase athlete ID, account, visibility and website roster agree.');
    console.log(`${result.slug}: ${result.imageURL}; account ${result.accountLinked ? 'linked' : 'not yet claimed'}`);
  })().catch((error) => {
    console.error('NOT PUBLISHED:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { parseArgs, verifyPortrait };
