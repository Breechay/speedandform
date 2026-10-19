# FORM Deployment Discipline
## Owner-approved engineering rule · October 19, 2026

**Do not deploy every edit. Work in batches. Commit freely, deploy deliberately.**

Preview and local builds are for iteration. Production deploys happen only when a coherent batch is ready, after QA, or when a change is genuinely urgent.

### Default cadence

- **Maximum one routine production deploy per work block.**
- Bundle small copy, styling, study, metadata, content and non-urgent code edits into that deploy.
- Intermediate commits are encouraged. A commit is not a deployment instruction.
- Preview/local builds, tests and screenshots should be used to refine work before production.
- Emergency fixes, broken production paths, security issues and other genuinely urgent corrections may bypass the routine cadence.

### Authorization rule

A request such as **“make this change,” “edit this,” “fix this,” “update this,”** or **“commit this”** does **not** authorize a production deploy.

Codex, ChatGPT and other agents may deploy only when:

1. the owner explicitly says **deploy**, **publish**, **push live**, **make it live**, or equivalent; or
2. the task is already an explicitly approved release task whose scope includes deployment.

If deployment is not explicitly authorized, stop after the code/content change, tests, preview evidence and commit. Report that production is unchanged.

### Cost discipline

Netlify credits are a production resource. Avoid spending them on iterative edits that can be validated locally or in a preview workflow. Before triggering production, ask:

1. Is the work block coherent and ready?
2. Have the relevant tests passed?
3. Has visual/functional QA been completed where required?
4. Can any remaining nearby edits be bundled into this same release?
5. Is production deployment explicitly authorized?

### Status language

Keep these states distinct:

**Edited → Tested → Committed → Previewed/QA'd → Deployed → Production-verified**

Never collapse “committed” or “merged” into “live.”

This rule governs the public website, Labs/studies, plans, brand surfaces and supporting production infrastructure unless a narrower release rule explicitly overrides it.
