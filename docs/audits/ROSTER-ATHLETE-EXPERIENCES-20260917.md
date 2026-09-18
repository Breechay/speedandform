# Roster athlete workspace truth — September 17, 2026

Scope: extend the shared read-only athlete website to the actual current roster without inventing app delivery, plan assignment, account linkage or workout history.

## Rule fixed

The athlete workspace previously let the **kind of training** imply the **recording app**:

- strength-like program name → Forge
- running-like program name → FORM

That was not a safe rule. Discipline and delivery are now separate facts.

The workspace now derives:

- **discipline** — running or strength, for identity/voice;
- **delivery** — app-delivered or coach-managed, from the canonical athlete `delivery` field;
- **recording channel** — FORM/Forge only when app delivery is actually assigned; otherwise completed work is managed with Brice.

A strength athlete can therefore remain coach-managed. A runner can remain coach-managed.

## Current roster states used for acceptance

### App-delivered running

**Natalie**
- program: Run Development
- delivery: app
- active block: Run Development
- athlete invite: pending
- website identity: Run development
- completed-work channel: FORM
- website remains read-only

**Hope / José / Marcus**
- existing running/app behavior remains FORM-delivered according to their canonical records.
- This pass does not create or change assignments, memberships or receipts.

### Coach-managed strength

**Rod**
- Strength & Physique
- delivery: coach
- no current athlete link/invite
- no private authored block in the current athlete system
- website must not claim Forge

**Devin**
- same delivery shape as Rod
- website must not claim Forge

**Marisa**
- Functional Strength
- coach-managed
- website must not claim Forge

### Coach-managed running

**Valerie**
- Run Development
- delivery: coach
- no private block/account link yet
- website must not claim FORM recording

**Simon**
- Half build / active Threshold cycle
- delivery: coach
- existing authored block can remain visible
- completed work remains managed directly with Brice; running discipline alone does not promote him to FORM

### Adrian

Adrian keeps the dedicated three-week Runner Mass web fallback from Pass 4. His account surface remains coach-managed until the separate Forge Coach Pilot device gate proves authenticated delivery. The fallback may describe Forge as the eventual accepted recording workflow, but it does not claim a native receipt exists.

## Athlete-facing behavior

### No published web block + coach-managed
Today says:
- `Your training is coach-managed.`
- no filing is expected on the website
- athlete can ask Brice about training

Account says:
- Delivery → Coach-managed
- Completed work → With Brice

### Published block + coach-managed
The block/week/session prescription remains readable.
The plan summary says:
- `Managed by Brice`

Today says:
- Brice manages completed-work records directly
- website is read-only
- no FORM/Forge filing instruction appears

### App-delivered
Existing behavior remains:
- FORM for running
- Forge only when an actual app-delivery strength path exists

Account explicitly separates:
- Delivery
- Completed work

This prevents a program title from masquerading as a connected app.

## Acceptance

Source/model tests cover:
- Natalie app-delivered running → FORM
- Rod/Devin coach-managed strength → no Forge fiction
- Valerie coach-managed running → no FORM fiction
- Simon authored running block → readable prescription, coach-managed receipt path

Browser acceptance runs phone/tablet/desktop views for app-running, coach-strength and coach-running across Today / Plan / History / Account, with no filing controls or horizontal overflow.

No database writes are required for this pass.
