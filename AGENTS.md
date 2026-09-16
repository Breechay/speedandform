# Start here: Speed & Form
For public site, Plans, Labs, plan packaging, or app-to-coach work, read:
1. [Current state and roadmap](docs/roadmap/FORM-ROADMAP.md).
2. [Current commercial execution](docs/marketing/CURRENT_COMMERCIAL_EXECUTION.md) before touching Meta, RPD, the coaching funnel, or the Unbounce exploration.
3. [Existing guardrails](docs/DO_NOT_BUILD.md) and [project context](docs/CURSOR_CONTEXT.md).
4. For app work: [Plan app audit brief](docs/audits/PLAN-APP-AUDIT-BRIEF.md).
5. For UI work: [Surface audit brief](docs/audits/SURFACE-AUDIT-BRIEF.md).
6. For any athlete-facing writing, ads, landing pages or onboarding: [Athlete Language Rule](docs/marketing/ATHLETE_LANGUAGE_RULE.md).
7. Before creating or changing any prospect-, buyer-, athlete-, account- or customer-facing email: read [FORM Email Experience Standard](docs/marketing/EMAIL_EXPERIENCE_STANDARD_2026-09-16.md) and [Email Execution Roadmap](docs/marketing/EMAIL_EXECUTION_ROADMAP_2026-09-16.md).

Active user instructions take precedence. Do not call a branch change live without checking production.
September 15 decision: Race Pace Durability is a paid 15-week plan with Weeks 1–4 open as the public preview and the complete plan priced at a one-time payment of $79. Moving beyond Week 4 routes to the purchase page. The old September 12 optional-support/free-full-plan model is retired. Live Stripe hosted checkout is connected. Stripe returns successful buyers to the RPD purchase confirmation flow, the Supabase webhook creates the paid entitlement, the same browser unlocks Weeks 5–15, and purchased access can be recovered on another device with the verified checkout email. Personal coaching retains its separate flow.
After relevant work update the roadmap: status, evidence, blocker, next action, tested commit and actual deployment state. Maintain one checklist.
Do not invent results, auto-publish private athlete data, silently change assignments, or promise unverified app features. Measured evidence, athlete reports, coach reads and decisions remain distinct.
Check remote main and concurrent work before release. Batch verified changes to conserve Netlify credits.

## Athlete language — no decoding
Do not assume an athlete knows training vocabulary because they are fast, experienced or high-volume. Fitness literacy and coaching literacy are different. The coach owns the complexity; the athlete gets a clear action and a clear reason to care.

For ads, landing pages, product pages, emails, onboarding and athlete-facing app copy:
- lead with the outcome or felt problem, then what they get and what they do;
- put methodology, physiology and FORM doctrine later;
- spell out abbreviations and prefer plain language over coaching shorthand;
- generic copy is acceptable when it is true, relevant and immediately understood;
- let verified results and execution proof carry sophistication instead of forcing clever copy;
- prefer `one-time payment of $79` over `$79 once`, `try Weeks 1–4 free` over `inspect Weeks 1–4`, and `hold race pace longer` over internal phrases such as `race-pace ownership`;
- Meta copy generation may be used as an ideation source. Keep the clearest truthful lines and reject invented personalization, guarantees, features or claims.

Standing test: **could a fit runner with little coaching vocabulary understand the first sentence immediately?** If not, simplify it. Read the full [Athlete Language Rule](docs/marketing/ATHLETE_LANGUAGE_RULE.md).

## Visual rule — one divider per boundary
Brice's standing rule applies to app and site: no double dividers, stacked rules or two nearby lines separating the same content. Choose one owner for each boundary. Never combine a card's bottom border with the next card's top border, a disclosure border with its container border, or an input underline with a decorative result rule. Prefer spacing when the boundary is already clear. During every UI review inspect adjacent components, open/closed disclosures, forms and the footer at desktop and phone widths. Remove duplicate rules before calling the surface ready. Tables may retain one separator per row; this is not a ban on useful structure.

## Writing — American spelling
Use practice, practiced and practicing (never practise, practised or practising) in site/app copy and audit documents. Keep instructions plain and address the reader as “you.”

## Typography is an acceptance rule
Read [FORM typography standard](docs/FORM_TYPOGRAPHY_STANDARD.md) before any app or site surface work. Preserve readable hierarchy, line lengths, data alignment, responsive stacking and one divider per boundary. Do not trade readability for decorative scale or tiny labels. Use plain punctuation instead of em dashes. The standard is also installed in FORM-iOS; record actual device checks rather than assuming them.

## Connected surfaces
Before changing identity, plans, execution or records, read [FORM connected surfaces](docs/FORM_CONNECTED_SURFACES.md). FORM, Forge, speedandform.com and the Console must share a documented, versioned connection. Read [HYROX app brief](docs/HYROX_APP_BRIEF.md) for that extension; it does not replace the active Adrian release gate.
