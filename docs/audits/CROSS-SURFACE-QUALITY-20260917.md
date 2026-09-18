# Cross-surface quality review — September 17, 2026

Status: **WEB ACCEPTED; NATIVE DEVICE GATES REMAIN SEPARATE**

Scope: Home/account routing, shared sign-in doorway, athlete workspace, Coach Console shared controls, Race Pace Durability plan + access restore, and the truthful handoff to native FORM / Forge. This pass does not reopen accepted product architecture or convert native source readiness into device acceptance.

## Benchmark lens

The review uses patterns that hold across mature consumer software rather than copying another product's visual language:

- **Account continuity:** after sign-in, navigation should become the person's destination — Console, My training, My plan or Account — rather than continuing to advertise Sign in.
- **Read versus act:** browsing a plan, seeing history, filing a workout, correcting evidence and coaching review remain visibly different authorities.
- **Payment-state separation:** a network outage is not “no purchase,” a verification failure is not “buy again,” and restoring access never implies another charge.
- **Failure without destruction:** errors say what was *not* changed and provide a recovery action.
- **Touch + keyboard parity:** primary navigation and actions meet a 44px hit target; keyboard-operable surfaces retain visible focus.
- **Privacy by precision:** describe what is actually verified or shared; avoid generic “secure” claims where the useful fact is email control, account linkage or explicit sharing consent.

## What was already correct

### Home/account destination
The shared account resolver already maps verified state to one meaningful destination:

- coach → **Console**
- linked athlete → **My training**
- standalone RPD purchaser → **My plan**
- signed-in but unlinked account → **Account**
- signed out → **Sign in**

Existing Chromium/WebKit account regression continues to prove those states on Home and the RPD page. Local storage is only a discovery hint; backend verification decides access.

### RPD protected-content failure
The source layer already had the right security behavior:

- failed verification clears protected prescription from the viewer;
- future navigation is disabled;
- the page says **“Your training has not changed.”**
- Retry and Open account are offered;
- it explicitly says there is no need to make another payment.

The Pass 11 browser gate re-proves this after layout/accessibility changes.

### Athlete / Console authority
Earlier accepted passes already separate:
- read-only athlete website;
- native app recording only when canonical delivery says app;
- coach-owned Console actions;
- inert coach preview of the athlete view;
- claim judgment from athlete-facing review/instruction;
- imported history from native receipts.

Pass 11 preserves those boundaries.

## Concrete defects repaired

### 1 · Private touch targets were inconsistent
A handful of controls were 40–42px or text-only even though nearby controls used the 44px platform target.

Repaired:
- athlete Today / Plan / History / Account tabs → 44px minimum;
- athlete Plan week arrows → 44 × 44;
- athlete text actions such as **See the full week** → 44px minimum;
- shared private record-menu button → 44 × 44;
- auth inline reset action → 44px minimum;
- session piece remove/add controls → 44px;
- Console review-chain action → 44px minimum.

The shared stylesheet cache key was refreshed on production private surfaces (Athlete, Console, Record and auth callback), and Coach Console also receives the updated athlete workspace CSS used by its preview.

### 2 · Athlete loading was visual but not announced
The spinner had an aria label but no live status semantics.

Now both initial HTML and subsequent record loads use:
- `role="status"`
- `aria-live="polite"`
- screen-reader text: **Loading your training…**

### 3 · Athlete recovery did not explain state preservation
The generic error offered Retry only.

Now it says:
- **Your account and training were not changed.**
- primary **Try again**
- secondary **Use another account**

The second action performs the existing sign-out path rather than creating an alternate auth mechanism.

### 4 · Pending account copy made a vague security claim
Old:
> “[email] is secure, but…”

New:
> “You’re signed in as [email], but this account has not been matched to an athlete workspace.”

That states the useful fact without using “secure” as a substitute for account state.

### 5 · RPD desktop hit targets lagged behind its mobile accessibility override
The later mobile access stylesheet already enforced 44px controls, but the desktop base still used 38–40px controls.

Now:
- top navigation links have a 44px minimum height;
- standard buttons have a 44px minimum height;
- desktop week arrows are 44 × 44;
- existing mobile 44px share / full-plan / week controls remain intact.

### 6 · RPD keyboard plan focus was invisible
The plan section is intentionally keyboard-focusable because Left/Right arrows page through weeks, but its stylesheet explicitly removed the focus outline.

Now:
- buttons/links get a visible lime `:focus-visible` ring;
- the plan surface gets its own visible focus ring while retaining no always-on mouse outline.

Browser acceptance focuses the actual plan and measures a rendered outline.

### 7 · Purchase restore confused server failure with “no purchase”
This was the consequential Pass 11 finding.

Old behavior:
- signed-in restore lookup receives HTTP 503;
- code falls through the same branch as a valid “not paid” result;
- UI says **No paid purchase was found**.

That turns availability failure into a false commercial verdict.

New behavior:
- non-2xx lookup → throws **Purchase lookup unavailable**;
- the user sees:
  **We couldn’t check this purchase right now. Nothing was charged or changed. Try again in a moment.**
- only a successful lookup with a non-paid result may say no paid purchase was found.

### 8 · Restore language overstated identity proof
Removed generic “secure link” language.

The page now says **sign-in link** and explains the actual mechanism:
> Stripe ties the purchase to the email used at checkout. The sign-in link verifies control of that address before this browser unlocks the paid weeks.

Heading changed from “It proves the purchase belongs to you” to:
**It matches your email to the purchase.**

## Browser acceptance

Dedicated Pass 11 acceptance uses real production page modules with synthetic identities/data only.

Engines:
- Chromium
- WebKit

Widths:
- 390 phone
- 1440 desktop
- existing access regression additionally covers 375 / 390 / 430 / 768 / 1024 / 1440.

Measured, not inferred:
- shared sign-in password-reset control >= 44px;
- sign-in primary action >= 44px;
- athlete tabs >= 44px;
- athlete text action >= 44px;
- athlete week arrows >= 44px;
- RPD phone share/week/full-plan controls >= 44px;
- RPD desktop nav/share/week controls >= 44px;
- visible keyboard outline on the focusable RPD plan;
- no horizontal overflow;
- no uncaught JavaScript errors;
- protected RPD content clears on access outage;
- access outage exposes Retry;
- purchase-restore outage renders the non-transactional error;
- existing comprehensive account/access regression remains green in both engines.

## Native handoff truth

Pass 11 does not erase the two native acceptance gates:

### Forge / Adrian
- App Store Forge remains cloud-off.
- internal Coach Pilot is a separate draft source path.
- canonical native receipt receiver passed rollback acceptance.
- Adrian is expected at Runner Mass W1D3 Upper B from real W1D1 + W1D2 reports unless later real work is surfaced.
- installed Coach Pilot sign-in / consent / real receipt / replay still require the device gate.

### FORM assigned-plan filing
- existing native plan/filer is reconciled in draft PR #26;
- exact immutable version + stable evidence receipt + append-only coach correction were backend-accepted;
- exact-retry audit source fix is merged on the website/backend repo but deliberately not applied live;
- current FORM-iOS GitHub jobs fail before runner allocation, so current-head Mac/device proof remains open.

No web copy in this pass claims those native gates are complete.

## Result

The connected web ecosystem now has one consistent recovery grammar:

1. **Say what state is known.**
2. **Do not turn unavailable into denied.**
3. **Say what was not changed.**
4. **Offer the smallest recovery action.**
5. **Never require a new payment, account or fabricated training record to escape an error.**

That is the standard future surfaces should inherit.
