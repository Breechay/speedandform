# Coach Console reconciliation · 11 September 2026

The authenticated production read was compared with `COACH_CONSOLE_FOCUSED (3).html`.
Canonical facts win; the HTML is a one-time migration reference for settled coach context and UI intent.

| Reference athlete/data | Canonical record found? | Action |
|---|---|---|
| Marisa · functional strength · once weekly · Wednesday 4 PM proposed | No athlete or membership | Controlled migration creates/reuses `marisa`, adds coach membership, baseline schedule and private coach context. No session is marked confirmed. |
| Natalie · Run Development | Yes: athlete, membership, active block, weeks, sessions and baseline | Reuse unchanged. Display from canonical records. |
| Valerie · comfortable 5K · baseline to establish · Wednesday track | No athlete or membership | Controlled migration creates/reuses `valerie`, adds coach membership, baseline schedule and private coach context. No running baseline is invented. |
| Rod · strength and physique · Mon/Fri 6:30 · weekend proposed | No athlete or membership | Controlled migration creates/reuses `rod`, adds coach membership, baseline schedule and private coach context. |
| Rod · 13.9% supplied Aug 21 | No generic canonical measurement object | Not migrated. The dossier labels it as awaiting a canonical measurement record; no semantically wrong storage path was added. |
| José · Race Pace Durability | Yes: athlete, membership, active block, canonical weeks, versions, components and evidence | Reuse unchanged. Broken work remains separate from continuous ownership. |
| Hope · Race Pace Durability | Yes: athlete, membership, active block, canonical weeks, versions, components and evidence | Reuse unchanged. Proposed and established states remain distinct. |
| Devin · strength and physique · normally 3× · changing schedule | No athlete or membership | Controlled migration creates/reuses `devin`, adds coach membership, baseline schedule and private coach context. First measurement remains pending. |
| Devin · Thursday Sep 10 completed | Prototype reference only; no canonical session/completion | Not migrated or displayed as completed. |
| Simon and Marcus | Canonical athletes and memberships exist | Preserved, hidden only from the normal Console roster through UI preferences. |
| Lisa | Not visible through the authenticated canonical read | Included in the hidden preference if a canonical `lisa` row exists in another environment; never deleted. |

The intended UI order is Marisa, Natalie, Valerie, Rod, José, Hope, Devin. The order and
hidden set live in `console_preferences`; they are presentation state, never coaching truth.
