# Publishing Field Notes and maintaining Ask Brice

The release checklist remains `docs/roadmap/SITE-ECOSYSTEM-PASSES-20260916.md`. This file is the publishing procedure, not a second roadmap.

## Publish a note

Edit `scripts/field-notes-content.cjs`. Each entry owns a stable lower-case, hyphenated `slug`, category, title, short summary, revised date, paragraphs, takeaway and related public links. `published` must be the boolean `true` to appear. A draft with `published: false` is not rendered into HTML, the feed or the sitemap. Do not place private athlete data or sensitive draft material in this public repository, regardless of its publication flag.

Keep the slug after publication; an edited headline is not a reason to break existing shares. The first entry is the featured note. The remaining entries become the short index. Check the date and author before publication. First-person coaching reflections must genuinely represent Brice; specific results, athlete reports, medical claims and images require their own source/consent check. The four initial editions cite their old Note numbers internally. Original Field Notes text remains recoverable in Git at `780f409ed521f3c6290c19e0d80279331bf4eecc:field-notes.html`.

Run in this order:

```sh
node scripts/build-contact-notes.cjs
node scripts/build-discovery.cjs
node scripts/snapshot-contact-notes.cjs
node tests/contact-notes.cjs
```

The snapshot command deliberately updates the review boundary; do not run it in CI merely to conceal drift. Review the diff and run the browser tests. Repeat the two build commands and confirm no new diff. Publish through a reviewed branch and the existing Netlify main integration. Verify actual HTML, feed content type and media after publication.

The existing gallery manifest owns published albums. After publishing an album through `TRACK-GALLERY.md`, rebuild Notes and discovery so the same publication appears in the reader feed. Do not invent a session date for an undated selection. Withdrawing a previously published note requires deliberate treatment of its existing URL; setting a flag alone is not a deletion/redirect policy. Never silently erase a shareable old article.

## Ask Brice is a local draft, not a web submission

`/ask/` uses the already-public email destination. `scripts/build-contact-notes.cjs` renders the page and a public title/path allowlist in `js/question-contexts.json`. A reader arriving from a note supplies only `?about=the-note-slug`. The browser ignores unknown or unsafe keys. Neither the URL nor analytics receives the question.

`js/contact-notes.js` assembles an encoded mailto for the visitor's email app. It never POSTs or persists the text. Do not change its button to Send unless a separately verified server submission actually exists. Copy failures reveal a selected plain-text fallback. A draft too long for the conservative URI limit remains fully available to copy; it is never silently cut. Reload clears the draft. The public address remains available without JavaScript.

Keep contact, coaching and newsletter consent separate. A question is not an application, an accepted lead, an email subscription or permission to send marketing. Do not put names, messages or mailto bodies in analytics. A future direct-send endpoint needs a separate abuse, validation, privacy, delivery and recovery review before replacing this handoff.

## Follow without email

The feed is `/field-notes/feed.xml`, linked in HTML metadata and on the Field Notes page. It includes only published notes and actual published albums. Feed GUIDs are canonical URLs and must stay stable. No mandatory signup or email capture is added to viewing/downloading photos.

## Later email delivery

Use the existing email-experience standard and the recorded 6B gates. A verified sender alone is not a subscriber-management system. Confirm server-side keys, explicit opt-in, confirmation and unsubscribe paths, suppression handling, rate limits, a business mailing address approved for public disclosure, and delivery/error behavior. Do not import the General segment, coaching contacts or buyers into a newsletter by inference. Do not publish an inert signup form or misleading success state. No campaign is sent automatically when a note is published.
