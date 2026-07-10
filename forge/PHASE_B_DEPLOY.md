# Phase B Deploy Runbook — Rod Accountability

**Operational runbook only.** No new features until live sync is verified.

| Status | |
|---|---|
| Rod iOS local surface | Ready |
| Coach dashboard (web) | Coded in `speedandform/forge` — deploy to verify |
| WATCH on roster index | **Do not ship** — detail page only |
| Pre-auth intake queue | **Not built** — logs before Keychain token are dropped |

**Canonical program ID:** `rod_accountability_v1`  
**Athlete-facing name:** `Sculpt · 2-Day Shape`  
**Supabase project:** `zlhxvzgublgtuxplcjjl`

---

## File map

| Step | File |
|---|---|
| SQL (base) | `forge/supabase-schema.sql` |
| SQL (invite) | `forge/supabase-athlete-invite.sql` |
| SQL (sessions) | `forge/supabase-sessions.sql` |
| SQL (Phase B) | `forge/supabase-accountability.sql` |
| Edge function | `supabase/functions/sync-accountability/index.ts` |
| Web app | `forge/` → build output `forge-app/` |
| iOS sync | `FORM-iOS/FORM/Forge/ForgeSupabaseBridge.swift` |
| iOS deep link | `FORM-iOS/FORMApp.swift` (`form://forge-auth`) |

---

## 1. Supabase migrations

**Dashboard → SQL Editor.** Run in order (skip files already applied):

```text
1. forge/supabase-schema.sql
2. forge/supabase-athlete-invite.sql
3. forge/supabase-sessions.sql
4. forge/supabase-accountability.sql      ← Phase B
5. forge/supabase-coach-judgments.sql     ← stored Today judgment (Jun 2026)
```

**Phase B creates:** `intake_logs`, `waist_check_ins`, `athlete_app_state` + RLS + strength upsert policies.

**Judgment slice creates:** `coach_judgments` + RLS. See `FORM-iOS/docs/FORGE_ROD_JUDGMENT_EXPERIMENT_JUNE2026.md` after step 5.

**Verify:**

```sql
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('intake_logs', 'waist_check_ins', 'athlete_app_state');
```

Expect **3 rows**.

---

## 2. Edge function deploy

**Function:** `sync-accountability`  
**Source:** `supabase/functions/sync-accountability/index.ts`

| `kind` | Writes to |
|---|---|
| `intake` | `intake_logs` |
| `waist` | `waist_check_ins` |
| `heartbeat` | `athlete_app_state` |

**CLI:**

```bash
cd /Users/breechay/Documents/speedandform
supabase login
supabase link --project-ref zlhxvzgublgtuxplcjjl
supabase functions deploy sync-accountability
```

**Or:** Supabase Dashboard → Edge Functions → create/deploy from source file.

**Post-deploy curl** (replace token):

```bash
curl -s -X POST \
  'https://zlhxvzgublgtuxplcjjl.supabase.co/functions/v1/sync-accountability' \
  -H "Authorization: Bearer ATHLETE_ACCESS_TOKEN" \
  -H "apikey: ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"kind":"heartbeat","payload":{"lastOpenAt":"2026-06-14T12:00:00Z"}}'
```

Expect: `{"ok":true}`

Also confirm `sync-strength-session` is deployed if sessions have never synced.

---

## 3. Web env vars / build / deploy

**Env** (`forge/.env.local` + Netlify site settings):

```bash
VITE_SUPABASE_URL=https://zlhxvzgublgtuxplcjjl.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase → Settings → API>
```

**Build:**

```bash
cd /Users/breechay/Documents/speedandform/forge
npm install
npx tsc --noEmit          # must pass
npm run build             # writes ../forge-app/
```

If rolldown native binding fails: `npx vite build` after tsc.

**Deploy:** push repo to Netlify (publish root `.`, redirects in `_redirects` / `netlify.toml`).

| URL | Purpose |
|---|---|
| `https://speedandform.com/forge/` | Coach dashboard |
| `https://speedandform.com/forge/athlete/invite?code=XXXXXX` | Rod invite |

**Coach program template (before Rod onboard):**

- Name: `Sculpt · 2-Day Shape`
- Source: `Coach`
- **Notes:** `rod_accountability_v1` ← gates Accountability + Coach Playbook panels

Assign active program to Rod on roster.

---

## 4. iOS deep-link auth test

**Scheme:** `form://` (registered in `Info.plist`)

**Handler:** `ForgeSupabaseAuth.handleDeepLink` on `form://forge-auth?access_token=...`

**Manual test on device/simulator** (after web invite produces a session token):

```text
form://forge-auth?access_token=PASTE_ACCESS_TOKEN
```

Open from Safari or Notes. App should launch; token lands in Keychain (`com.speedandform.app.supabase`).

**Verify linked:** foreground app once → `ForgeAccountabilitySyncService.recordAppOpenIfNeeded()` fires heartbeat (requires token).

---

## 5. Invite → Open FORM app → token in Keychain

**Rod flow (do in this order):**

```text
1. Coach: Rod on roster, program assigned, invite code created
2. Rod: open invite URL on phone → sign in → Accept invite
3. Rod: tap "Open FORM app →"
4. FORM opens; Keychain now has access token
5. Coach: assign rod_accountability_v1 on Rod's device (see §5b)
```

**Do not have Rod log intake before step 3 completes.**

Pre-auth logs are **dropped** — there is no pre-auth queue. Post-auth failed syncs queue in UserDefaults and flush on foreground.

### 5b. Assign program on device

`rod_accountability_v1` is hidden from the public picker. Set active program on Rod's phone:

```swift
ForgeProgramLibrary.setSelectedForgeProgramId("rod_accountability_v1")
```

No athlete-facing assign UI yet — coach sets on device at handoff. **Do not** leave Rod in operator preview mode (preview does not sync).

Confirm Today shows **Sculpt · 2-Day Shape**, anchor rail, Mon/Fri only.

---

## 6. First intake log sync

**Rod action:** Tap **B** → Protein **Yes** → Save (no typed text required).

**Expected:**

- Local logbook row shows anchor label (not blank)
- Supabase `intake_logs` row within ~5s (or on next foreground if offline)

```sql
select id, anchor, had_protein, alcohol, eaten_at
from intake_logs
where athlete_id = 'ROD_AUTH_UUID'
order by eaten_at desc limit 3;
```

**Dashboard:** Accountability panel → protein days / last log updates after refresh.

---

## 7. First waist sync

**Rod or coach action:**

- Rod: Profile waist strip → enter inches → save  
- **Or** coach: Athlete detail → waist input → Log waist

```sql
select waist_inches, entered_by, recorded_at
from waist_check_ins
where athlete_id = 'ROD_AUTH_UUID'
order by recorded_at desc limit 1;
```

**Dashboard:** latest waist + delta vs previous.

---

## 8. First session sync

**Rod action:** Complete Mon or Fri session → Finish.

Requires `sync-strength-session` edge function + prior sessions SQL.

**Dashboard:** Sessions **1/2** (expected two sessions per week).

```sql
select session_name, completed_at
from strength_sessions
where athlete_id = 'ROD_AUTH_UUID'
order by completed_at desc limit 3;
```

---

## 9. Dashboard verification

Open `/forge/roster/:rodSlug` (athlete detail).

**Must see (in order):**

1. **AccountabilitySummary** — sessions, protein days, alcohol, last log/open, waist, week grid, OK/WATCH chip  
2. **CoachPlaybook** below summary — state chip, suggested texts, copy buttons  

**Must NOT see:**

- “Accountability data appears once Rod accepts invite…” (means `authUserId` missing)  
- Playbook missing (check template `notes = rod_accountability_v1`)  
- WATCH on roster index (not shipped — detail only)

**Playbook states:** OK · WATCH · ALCOHOL · RETURN · MISSED_SESSION  
**Next fixed point:** Mon–Thu → `Friday 6:15` · Fri–Sun → `Monday 6:15`

Refresh athlete detail after each Rod action; do not expect real-time push.

---

## 10. Failure checks

| Symptom | Likely cause | Fix |
|---|---|---|
| Intake never in Supabase | No Keychain token | Invite → Open FORM app first |
| Intake never in Supabase | Edge function not deployed | Deploy `sync-accountability` |
| Dashboard empty panel | `auth_user_id` not linked | Re-run invite accept |
| Playbook missing | Template notes not `rod_accountability_v1` | Edit program template notes |
| Sessions 0/2 after workout | `sync-strength-session` missing | Deploy sessions stack |
| RLS error in logs | `coach_athletes` link missing | Verify invite linked slug |
| Rod sees wrong program | Preview mode active | Exit preview; set real program ID |
| Duplicate alcohol rows | Double-tap A | Non-blocker; dashboard treats as weekly flag |

**SQL debug — coach can read athlete rows?**

```sql
select ca.* from coach_athletes ca
join athletes a on a.slug = ca.athlete_id
where a.auth_user_id = 'ROD_AUTH_UUID';
```

---

## Smoke tests (run in order)

These four tests gate “Phase B live.”

### Test 1 — Intake

```text
Invite Rod → Open FORM app → log Breakfast protein → dashboard shows intake.
```

Pass: `intake_logs` row + Accountability last log = today + anchor counted.

### Test 2 — Alcohol

```text
Tap A → dashboard shows Alcohol this week.
```

Pass: `intake_logs.alcohol = true` for today. Double-tap may duplicate locally — acceptable for launch.

### Test 3 — Waist

```text
Enter waist → dashboard shows latest waist.
```

Pass: `waist_check_ins` row + dashboard waist field populated.

### Test 4 — Session

```text
Complete session → dashboard shows Sessions 1/2.
```

Pass: `strength_sessions` row + Accountability sessions counter.

**All four pass → Phase B is live. Stop building; observe Rod for two weeks.**

---

## Pre-auth queue (explicitly deferred)

Onboarding order must be:

```text
Invite accepted → Open FORM app → token written → first log
```

If Rod logs before token exists, those logs **do not sync and are not queued**. Do not skip the Open FORM app step.

Post-auth: failed network syncs queue offline and flush on foreground (`ForgeAccountabilitySyncService.flushQueues()` in `handleScenePhase`).

Building a pre-auth queue is **later** — only if onboarding order cannot be enforced.

---

## Rollback

| Layer | Action |
|---|---|
| SQL | Drop Phase B tables only if zero prod data (see previous migration file) |
| Edge | Disable/delete `sync-accountability` in Dashboard |
| Web | Redeploy prior `forge-app/` commit |
| iOS | Ship prior build; local logs remain on device |

---

## Launch day checklist

```text
[ ] 1. SQL migrations 1–5 applied (includes coach_judgments)
[ ] 2. sync-accountability deployed (+ sync-strength-session if needed)
[ ] 3. forge/.env.local + Netlify env vars set
[ ] 4. npm run build → forge-app/ deployed
[ ] 5. Program template notes = rod_accountability_v1
[ ] 6. Rod assigned + invite sent
[ ] 7. Rod: Accept → Open FORM app (token in Keychain)
[ ] 8. rod_accountability_v1 set on Rod's device (not preview)
[ ] 9. Smoke test 1 — Breakfast protein → dashboard
[ ] 10. Smoke test 2 — Tap A → alcohol flag
[ ] 11. Smoke test 3 — Waist → dashboard
[ ] 12. Smoke test 4 — Session → 1/2
[ ] 13. Coach Playbook state + copy text sane
[ ] 14. Judgment experiment — place one Today line → device verify (see FORGE_ROD_JUDGMENT_EXPERIMENT_JUNE2026.md)
```

**Extended iOS verification matrix** (re-entry training-day guard, archetype negative
check, strength-win strip, intake Works now):  
`FORM-iOS/docs/PHASE_B_DEPLOY.md`

---

## Out of scope for Phase B deploy

- WATCH badge on roster list  
- New Rod UI surfaces  
- Pre-auth intake queue  
- Photo weeks 0 / 3 / 6  
- Idempotent alcohol double-tap (nice-to-have later)

---

*Phase B runbook · speedandform + FORM-iOS · June 2026*
