# Email updates: Pass 6B

Owner: Brice. Status: IMPLEMENTED IN REVIEW BRANCH; NOT ACTIVATED.

This bounded pass adds a staged opt-in page, confirmation email, confirmation/opt-out handling, a server-side Edge Function and an isolated consent/outbox migration. It does not publish a form that pretends to work, import contacts, send a campaign, alter provider settings or modify athlete accounts.

Read-only connected checks reconfirmed the active FORM Athlete System project and its four existing Edge Functions. A metadata-only schema query found no existing newsletter/subscriber/email data tables. Resend reports `send.speedandform.com` verified with open/click tracking off; `speedandform.com` root sending still reports failed. No production data or sender configuration has been mutated by this implementation.

The owner has not yet supplied an approved public business mailing address. No home or former café address is substituted. Activation also requires secure server credentials, the live challenge widget, webhook registration, a real authorized inbox delivery check, the privacy disclosure/headers and a cleanup schedule. The available Supabase connector exposes deployment and SQL, not a dedicated Edge Function secret-setting action; real values are not guessed or committed. Existing source, private data and public deployment remain protected.

The operational contract, test method, remaining gates and primary-source references are in `docs/publishing/EMAIL-UPDATES.md`. The ecosystem register remains the single release checklist. The receipt will be updated with the tested revision and actual CI result after review. A successful fixture run will not be represented as live email delivery.
