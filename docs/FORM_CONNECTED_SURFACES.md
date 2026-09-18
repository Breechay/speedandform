# FORM connected surfaces

Standing rule from Brice, September 14, 2026. Applies to FORM, Forge, speedandform.com and the coach Console.

Every feature involving people, plans or training records must either use the shared contract now or name the versioned connection it will use later. A link alone does not prove data integration. An offline prototype must say what remains local and how it can migrate without losing identity or history.

- **One person.** Reuse verified identity and membership. A program code, email string or public page visit is not authentication or permission.
- **One assigned prescription.** Preserve plan, session, block and version IDs across surfaces. Publishing a revised template does not rewrite an athlete's existing assignment or completed work.
- **One coaching truth.** Athlete-specific coaching facts live first in the canonical athlete assignment / published coach decision in the FORM Athlete System. The public study/site and the native app are projections of that same decision, never independent authorities. If Brice changes an athlete's future pace band, plan version, session, recovery or coaching instruction on a study/site surface, the change is incomplete until the canonical athlete record is updated; the app must then receive it through the normal assignment/feed path. A static study edit must never silently disagree with the athlete's app. Historical evidence stays on the version that was actually performed.
- **One filing path per record type.** Reuse the authoritative receiver and authorization model. Offline retries use stable submission IDs; corrections preserve prior evidence and attribution. Do not create parallel athlete or workout tables before auditing existing ones.
- **Clear ownership.** Preserve coach, athlete, FORM and imported authorship per block and per observation. The Console can author/review; apps execute; the website teaches and presents explicitly approved material. These roles may evolve through a documented contract.
- **Shared coaching doctrine.** When a surface interprets running, follow `docs/FORM_RUN_DEVELOPMENT_MANIFESTO.md`: look for ease, intervene selectively, layer changes, use repeated exposure and preserve athlete ownership. Do not turn the doctrine into a universal movement score or fixed visual ideal.
- **Explicit connection state.** Distinguish on-device, queued, received, rejected and revised. Never call a local save synced. Keep account changes, deletion and access revocation from moving records to another person.
- **Private by default.** Coach visibility requires authority and applicable consent. A private filing never becomes a public study automatically. Public reference URLs carry no private tokens or personal workout data.
- **Compatible evolution.** Document schema/version, units, missing-value semantics, source precision, deep-link fallback, migration and rollback. Older clients must fail clearly or retain read-only access rather than silently corrupt new data.
- **One operating roadmap.** Bridge Season CSV owns milestone state; ROADMAP owns rationale; NOW selects attention. Repo records carry implementation evidence; Console projects the owning sources.

Before calling any cross-surface feature complete, trace one authorized athlete from assignment to installed execution, offline/retry, received record, Console review and correction. Also prove an unrelated account cannot read or file it. Record the source/build/deploy checked and any untested surface.

Typography and plain-language standards apply independently on every surface. Preserve each product's visual identity, readable responsive hierarchy, American “practice,” and one divider per boundary.
