# Speed & Form Auth Email Templates

These files are the canonical customer-facing designs for Supabase Auth.

They follow `docs/BRAND.md` and `docs/marketing/EMAIL_EXPERIENCE_STANDARD_2026-09-16.md`. The October 6 auth-paper-room ruling supersedes the older white-card / green-period treatment for these messages.

## Important deployment note

The hosted Supabase project does **not** automatically read these repository files. Apply the corresponding HTML + subject in hosted **Authentication → Emails / Email Templates** (or via the Supabase Management API), then perform a real render test.

Do not call an auth email live merely because the file exists here.

## House treatment

- Sender display: **Speed & Form**, not FORM.
- Sender path while the verified sending subdomain is in use: `access@send.speedandform.com`.
- Reply-To/support: `support@speedandform.com`.
- Use the ink SF emblem alone. Never substitute the serif FORM wordmark, a green period, or a text logo.
- Field: bone `#e8e3d9`. Ink `#161916`. Quiet text `#5e625b`.
- Left-aligned hierarchy. Rules and space instead of a centered card.
- One square ink action. No green CTA, rounded card, rounded button, photograph, bend, cloth, or lit headline.
- Email-safe Arial/Helvetica carries reading type; Courier New is the mono fallback for the small house label and verification code.
- Copy is literal. State the account action once, then the expiry/security note.
- Keep a useful hidden preheader so the inbox preview does not repeat the subject.

## Subjects

| Flow | Subject | File |
|---|---|---|
| Magic link | `Your Speed & Form sign-in link` | `magic_link.html` |
| Password recovery | `Reset your Speed & Form password` | `recovery.html` |
| Confirm signup/email | `Confirm your Speed & Form email` | `confirmation.html` |
| Invite | `Your Speed & Form access` | `invite.html` |
| Email change | `Confirm your new Speed & Form email` | `email_change.html` |
| Reauthentication | `{{ .Token }} is your Speed & Form verification code` | `reauthentication.html` |
| Password changed | `Your Speed & Form password changed` | `password_changed_notification.html` |
| Email changed | `Your Speed & Form email changed` | `email_changed_notification.html` |
| Phone changed | `Your Speed & Form phone number changed` | `phone_changed_notification.html` |
| Identity linked | `A Speed & Form sign-in method was added` | `identity_linked_notification.html` |
| Identity unlinked | `A Speed & Form sign-in method was removed` | `identity_unlinked_notification.html` |
| MFA added | `A Speed & Form verification method was added` | `mfa_factor_enrolled_notification.html` |
| MFA removed | `A Speed & Form verification method was removed` | `mfa_factor_unenrolled_notification.html` |

## Delivery rules

- Use custom SMTP from the verified `send.speedandform.com` sending domain until the root sending domain is verified.
- Keep transactional/auth open and click tracking OFF so single-use auth links are not rewritten.
- TLS enforced.
- Do not use a no-reply identity when a support path is expected in the message.
- Never add marketing copy to auth/security email.
- Magic-link, confirmation, recovery, invite and email-change actions must work when opened in a different browser from the one that requested the email.
- Security notifications should be enabled deliberately, not merely because a template exists.

## Acceptance

For each hosted template:
1. send to Gmail and Apple Mail;
2. inspect phone rendering and dark mode;
3. check sender display, subject, inbox preview and SF emblem;
4. click the real auth action exactly once;
5. verify redirect/session behavior from the same browser and from a different browser context;
6. verify tracking stays off;
7. verify support/recovery copy is correct;
8. record the live subject and screenshot before calling it accepted.
