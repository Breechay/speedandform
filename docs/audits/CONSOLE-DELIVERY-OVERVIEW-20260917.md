# Console access and delivery overview — September 17, 2026

Scope: coach-side access/delivery truth and a coach-owned preview of the athlete-facing Today surface. This pass does not sign in as athletes, widen authorization, create invitations, fabricate receipts or change prescriptions.

## What the Console now distinguishes

The Console derives four separate facts from canonical sources:

1. **Access** — active athlete membership, unclaimed athlete invite, or no athlete account.
2. **Training** — assigned plan, active coach-authored block, Adrian's specific web fallback, or no private plan.
3. **Record in** — FORM, Forge, or Coach direct based on the athlete's actual delivery configuration. A strength label alone does not silently promote a coach-direct athlete to Forge.
4. **Receipt** — whether the intended native channel has actually produced a canonical native receipt. FORM proof requires a `session_completions.source = 'form'` row. Forge proof requires `forge_strength_receipts`. Coach-imported history does not prove native FORM delivery.

A linked account is therefore not displayed as a proven app connection. An authored web plan is not displayed as a Forge receipt.

## Current live read

As of this pass:
- **Hope** — athlete invite pending; assigned RPD plan + active block; FORM is the intended recording target; no native FORM receipt is proven.
- **José** — athlete account linked; assigned RPD plan + active block; FORM is the intended recording target; no native FORM receipt is proven.
- **Adrian** — no athlete account link yet; Runner Mass web fallback is available; Forge is the intended eventual recording target for this pilot; no Forge receipt is proven.
- **Marcus** and **Natalie** — athlete invites pending; active running blocks; no native FORM receipt proven.
- **Rod, Devin, Marisa, Valerie, Simon** remain coach/direct according to their current delivery configuration unless a later pass deliberately moves them to an app channel. The Console does not infer Forge merely from a strength-oriented program name.
- No active athlete currently has a canonical Forge strength receipt in this project.
- Existing Hope/José/Natalie/Simon completion history is coach-imported and is preserved as real history, but does not satisfy the native FORM receipt proof.

## Coach-owned athlete preview

The selected athlete now has a collapsible **ATHLETE VIEW · Preview Today** beneath the working Console. It uses the same read-only athlete renderer as the athlete workspace, is explicitly labelled `coach-owned read-only preview · not a sign-in`, and is rendered inert so it cannot perform athlete actions.

For Adrian, the preview loads the same canonical three-week Runner Mass fallback used by his athlete workspace. A failure to load that fallback does not crash the Console; it simply withholds the fallback from the preview rather than inventing one.

## Privacy and authority

- Invite email is intentionally not selected into the Console delivery read. Only claim state matters.
- Membership rows remain the authorization source; the derived overview is informational only.
- Preview does not create an athlete session, token, workspace preference, filing or receipt.
- No database writes are required for this pass.
