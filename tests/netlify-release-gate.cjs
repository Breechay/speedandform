const assert = require('node:assert/strict');
const test = require('node:test');
const { shouldBuild, run } = require('../scripts/netlify-release-gate.cjs');

test('ordinary production commits never build', () => {
  assert.equal(shouldBuild('production', 'Update athlete study'), false);
  assert.equal(shouldBuild('production', 'fix(site): urgent typo'), false);
  assert.equal(shouldBuild('production', 'release(site): homepage refresh'), false);
  assert.equal(shouldBuild('production', 'release(site): homepage [form-publish]'), false);
  assert.equal(shouldBuild('production', 'release(site): homepage [FORM-PUBLISH] extra'), false);
  assert.equal(shouldBuild('production', ''), false);
});

test('only a deliberately named production release commit builds', () => {
  assert.equal(
    shouldBuild('production', 'release(site): October public-site batch [FORM-PUBLISH]'),
    true,
  );
  assert.equal(shouldBuild('production', 'release(site): emergency fix [FORM-PUBLISH]'), true);
});

test('deploy previews and branch deploys build without a release marker', () => {
  for (const context of ['deploy-preview', 'branch-deploy', 'dev']) {
    assert.equal(shouldBuild(context, 'Update athlete study'), true);
    assert.equal(run({ CONTEXT: context, COMMIT_REF: 'not-a-real-commit' }), 1);
  }
});

test('unknown or missing contexts fail closed', () => {
  for (const context of [undefined, null, 'unexpected']) {
    assert.equal(shouldBuild(context, 'Update athlete study'), false);
    assert.equal(run({ CONTEXT: context }), 0);
  }
});

test('a production build fails closed when the commit cannot be read', () => {
  assert.equal(run({ CONTEXT: 'production', COMMIT_REF: 'not-a-real-commit' }), 0);
});

test('runtime honors the subject, including an explicit approved release', () => {
  const production = { CONTEXT: 'production' };
  assert.equal(run(production, () => 'Update athlete study'), 0);
  assert.equal(
    run(production, () => 'release(site): tested website batch [FORM-PUBLISH]'),
    1,
  );
});
