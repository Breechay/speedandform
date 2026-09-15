# Background film control — 2026-09-14

Brice rejected the large text button after confirming film playback worked. Replace it with a 16px play/pause icon inside a 44px circular touch target, at the same lower-right hero position. Accessible action label, title and keyboard focus remain. Muted automatic playback, reduced-motion preference, direct gesture retry and poster recovery are preserved.

Status: staged in the homepage playback PR; not deployed. Intake email formatting from the parent commit remains intact.

Validation: all inline JavaScript parses. A stubbed state check covers autoplay request, playing, pause/resume, error fallback and preservation of the SVG. No new device/browser visual acceptance is claimed.

Next: review on iPhone/iPad and desktop, then batch with the pending site release. The last published homepage remains 0834b45 until that deploy. Do not replace the playback recovery with older main code.
