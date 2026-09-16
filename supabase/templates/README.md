# FORM Auth Email Templates

These files are the canonical customer-facing email designs for Supabase Auth.

They follow `docs/marketing/EMAIL_EXPERIENCE_STANDARD_2026-09-16.md`.

## Important deployment note

The hosted Supabase project does **not** automatically read these repository files. Apply the corresponding HTML + subject in hosted **Authentication → Emails / Email Templates** (or via the Supabase Management API), then perform a real render test.

Do not claim a hosted template is live merely because the file exists here.

## Subjects

| Flow | Subject | File |
|---|---|---|
| Magic link | `Your FORM sign-in link` | `magic_link.html` |
| Password recovery | `Reset your FORM password` | `recovery.html` |
| Confirm signup/email | `Confirm your FORM email` | `confirmation.html` |
| Invite | `You’re invited to FORM` | `invite.html` |
| Email change | `Confirm your new email` | `email_change.html` |
| Reauthentication | `{{ .Token }} is your FORM verification code` | `reauthentication.html` |
| Password changed | `Your FORM password changed` | `password_changed_notification.html` |
| Email changed | `Your FORM email changed` | `email_changed_notification.html` |
| Phone changed | `Your FORM phone number changed` | `phone_changed_notification.html` |
| Identity linked | `A FORM sign-in method was added` | `identity_linked_notification.html` |
| Identity unlinked | `A FORM sign-in method was removed` | `identity_unlinked_notification.html` |
| MFA added | `A FORM verification method was added` | `mfa_factor_enrolled_notification.html` |
| MFA removed | `A FORM verification method was removed` | `mfa_factor_unenrolled_notification.html` |

## Delivery rules

- Use custom SMTP from a verified Speed & Form sender domain.
- Keep transactional/auth open and click tracking OFF so single-use auth links are not rewritten.
- TLS enforced.
- Sender target: `FORM <access@speedandform.com>` after root domain verification.
- Reply-To/support: `support@speedandform.com`.
- Never add marketing copy to auth/security email.
- Test magic-link, recovery, invite, and email-change URLs end-to-end after any template change.
- Security notifications should be enabled deliberately, not just because a template exists.

## Acceptance

For each hosted template:
1. send to Gmail and Apple Mail;
2. inspect phone rendering and dark mode;
3. click the real auth action exactly once;
4. verify redirect/session behavior;
5. verify the action still works with tracking disabled;
6. verify support/recovery copy is correct;
7. record the live subject and screenshot before calling it accepted.
