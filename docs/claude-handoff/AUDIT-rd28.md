# Audit — reachable surface, rd28

Everything reachable from `/`: three plates, Begin, five questions, review, done, `/notes`.

Cursor's implementation of 03-as-the-question and the Note-on-review is correct. The still and every rule that served it are gone. No dead selectors left. Films unchanged, watchdog fix intact, film B still held off the pipe until 01 can play.

Five things fixed below. One thing to watch.

---

## 1. The review screen had an exit at the worst possible moment — fixed

The Note was wrapped in `<a href="/notes">`, sitting directly above Send.

Nothing in the intake is persisted. No localStorage, no sessionStorage, no URL state. Five answers, a typed paragraph, name and email live only in a JavaScript object. A tap on that link navigates away and all of it is gone, and the back button returns to a blank first question.

That is a link out of the funnel placed at the highest-stakes point in the funnel, and the person most likely to tap it is the one who is hesitating — exactly the person the Note is there to reassure.

Now a `<figure>`. Same words, same bronze rule, no navigation. The Note earns its place by being read, not by being clicked.

If a route to `/notes` from there is ever wanted, it has to persist the answers first. Not before.

## 2. Plate 03 had no index — fixed

01 and 02 carry `01 / THE WORK` and `02 / THE PRACTICE`. 03 carried nothing while the ticks on the right still counted to 03. The eyebrow is part of the grammar; dropping it on one plate makes that plate read as a different kind of thing.

Added `03 / THE START`. The section's aria-label now matches the other two instead of repeating the question the `<h2>` already says.

## 3. `/notes` was sharing a 9:16 image as its link card — fixed

`og:image` pointed at the full-height frame. Every platform expects roughly 1.91:1 and will either letterbox it into a grey slab or crop it to her midsection. For a page whose entire purpose is being shared, the share card was the one broken thing on it.

Added `/og/note-001.jpg`, a 1200×630 crop, plus alt text. The full-height frame still runs on the page itself.

## 4. The options never declared their own state — fixed

Selection is styled through `[aria-pressed="true"]`, but no option carried the attribute until the first tap. Before then a screen reader announces nine plain buttons with no indication they are a choice, and the plate chips in particular read as navigation.

All 42 options now ship with `aria-pressed="false"`.

## 5. `note-001.jpg` was 239KB — fixed

Down to 144KB at 900×1600, which is still more than any phone renders. It is no longer on the homepage, so this only costs `/notes`, but `/notes` is the page athletes will open from a shared link on cellular.

---

## Watch, not fixed

**Plate 03 is tight on a small phone.** On a 375×667 viewport the content comes to roughly 610px against 667 available — it fits, with about 57px of slack. On anything narrower the nine chips wrap to a sixth row and the question starts getting pushed under the bar.

Not worth pre-emptively solving. Worth looking at on the smallest phone you can find. If it breaks, the fix is 03's `h2` — it is currently set to 01's display scale, and a question does not need to be as large as the offer.

**Nine options is a lot for a first impression.** It works because they are all short and all obviously about the reader. But 01 and 02 each say one thing, and 03 says nine. If it ever reads as a menu rather than a question, the move is fewer options on the plate with the full set still inside the intake — not a smaller plate.

---

## Verified working

- Tapping an option on 03 records the answer, opens the intake at question two, and Begin still opens at question one. No contradiction; Begin never moved.
- Both option sets share `data-key="goal"` and stay in sync, so Change an answer shows the choice made on the plate.
- Back out of question two returns to plate 03, not plate 01.
- 01 + first thesis + Begin is still complete without a single extra gesture.
- No cart, no Stripe, no payment path on any page. Payment is Zelle, arranged in the reply. See `AFTER-SEND.md`.
