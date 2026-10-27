# FORM Netlify production release gate

## October 27, 2026 · operating rule

**Website edits are not production deploys.** The Netlify production build pipeline
must skip normal pushes to `main`. Branch deploys and pull-request previews remain
available for QA. The live site and the separate Supabase-backed athlete-plan
publishing flow are not changed by this gate.

### Why

The October 2026 credit review found frequent paid production deployments
were the dominant cost, not site traffic. Auto-credit recharge was disabled.
Avoiding unnecessary releases protects both the budget and site availability.
Keep invoice amounts and current balances in private financial records, not
the public website repository.

### Release mechanics

The `[build] ignore` command in `netlify.toml` runs
`node scripts/netlify-release-gate.cjs`.

- `CONTEXT=production` with a regular commit subject: **skip** (exit 0).
- `CONTEXT=production` with a verified subject matching
  `release(site): <batch description> [FORM-PUBLISH]`: **build** (exit 1).
- `CONTEXT=deploy-preview` or `branch-deploy`: **build** (exit 1).
- A production commit whose subject cannot be read: **skip** (fail closed).
- A missing/unrecognized build context: **skip** (fail closed).

The release token is checked **only in the commit subject**. Mentioning it in a
document, PR body, or ordinary commit body does not authorize a release.
GitHub workflows, Netlify build hooks, and manual UI uploads may bypass this
repo-level gate; they remain separately bound by owner approval.

### Safe day-to-day flow

1. Develop, test, and review small changes on a working branch and PR.
2. Merge ready code/content to `main` in coherent batches. Ordinary merge
   commits do not trigger a paid production build.
3. Obtain Brice's explicit **publish/deploy** authorization for the particular
   website batch. Complete required functional and visual QA first.
4. Create and push **one** deliberately named release commit on `main`, e.g.
   `git commit --allow-empty -m "release(site): October site batch [FORM-PUBLISH]"`.
   This triggers the single production build of the accumulated `main` state.
5. Verify the resulting Netlify deploy and actual public URL. Report separately
   whether it was edited, tested, committed, previewed, deployed, and verified.

The release commit can be empty because its job is to authorize deployment of
already-tested source. An urgent fix can use the same pattern after explicit
authorization, without waiting for the routine batch cadence.

### Before activating

- Merge this guard as an **ordinary** commit, not a release-marker commit. Its
  own deployment status depends on the prior Netlify configuration; do not
  claim production is gated before confirming an actual test push.
- Confirm a normal push to `main` is marked skipped by Netlify, with no
  production publish or credit charge.
- Confirm a PR preview builds and the website remains available.
- Confirm an authorized marker commit completes a production deploy.
- Audit external build hooks and any other connected Netlify sites; this
  repo gate cannot control them.

### Athlete training is database data, not a website release

Coached workout prescriptions, pace/recovery targets, weekly dates, race
priorities, and private athlete notes use the authorized Supabase coaching
publication pipeline. For an existing app-supported field, editing and
publishing that live data **must not** trigger a Netlify production build or
an App Store submission. Validate the coaching prescription and authority,
publish one revision, read back the latest server version, and verify it in
the signed-in athlete's Week before saying it is live.

Changes to Coach Console HTML/JavaScript itself still require the deliberate
website release path. Changes to native iOS rendering or unsupported fields
require a separately tested iOS build. A failed athlete refresh must never
silently substitute an invented or stale workout.

### Subscription decision

Keep auto-recharge off. Do not downgrade the hosting plan while availability
could be affected. After a full billing cycle of controlled releases, inspect
requests, bandwidth, deploy counts, and required plan features. Then choose
the lowest tier that keeps `speedandform.com` reliable. Avoid deleting old
projects or changing domain/DNS settings as a billing shortcut.

### Verification

`node --test tests/netlify-release-gate.cjs`
