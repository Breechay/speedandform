#!/usr/bin/env node
/**
 * Netlify ignore command:
 *   exit 0 = skip this build; exit 1 = continue building.
 *
 * Production builds cost credits. A normal push to main must not consume them.
 * Deploy previews and branch deploys always remain available for QA.
 */
const { execFileSync } = require('node:child_process');

const RELEASE_SUBJECT = /^release\(site\): .+ \[FORM-PUBLISH\]$/;
const NON_PRODUCTION_CONTEXTS = new Set(['deploy-preview', 'branch-deploy', 'dev']);

function shouldBuild(context, subject) {
  if (NON_PRODUCTION_CONTEXTS.has(context)) return true;
  if (context !== 'production') return false;
  return typeof subject === 'string' && RELEASE_SUBJECT.test(subject.trim());
}

function latestSubject(env = process.env) {
  const commit = env.COMMIT_REF || 'HEAD';
  return execFileSync('git', ['show', '-s', '--format=%s', commit], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function run(env = process.env, readSubject = latestSubject) {
  if (env.CONTEXT !== 'production') {
    if (shouldBuild(env.CONTEXT)) {
      process.stdout.write('FORM: non-production preview/branch build allowed.\n');
      return 1;
    }
    process.stderr.write('FORM: unknown build context; skipping to protect production credits.\n');
    return 0;
  }

  let subject;
  try {
    subject = readSubject(env);
  } catch {
    // Do not accidentally spend credits if a production commit cannot be verified.
    process.stderr.write('FORM: cannot verify release commit; skipping production build.\n');
    return 0;
  }

  if (!shouldBuild('production', subject)) {
    process.stdout.write('FORM: routine commit; skipping paid production build.\n');
    return 0;
  }

  process.stdout.write('FORM: explicit site release commit; building production.\n');
  return 1;
}

if (require.main === module) {
  process.exitCode = run();
}

module.exports = { shouldBuild, latestSubject, run };
