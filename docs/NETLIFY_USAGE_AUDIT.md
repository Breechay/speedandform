# What is consuming Netlify

4 September. **Reported, not changed.**

**No Netlify Functions exist.** Zero invocations. Not the cost.

Three things are, in order of likely size:

### 1 · Everything is served with caching disabled

`netlify.toml` sets, for `/*`:

    Cache-Control = "no-cache, no-store, must-revalidate"

Every asset re-downloads on every request, every visit, forever. The repo ships
**11 MB of `assets/`** and a `media/` directory of **MP4 files** — `practice.mp4`,
`run-development.mp4`, and a second copy of `practice.mp4` under `mockupc/`. A
handful of page views with video on them is a meaningful fraction of a free
bandwidth allowance, and none of it is ever cached.

That header was added deliberately ("belt and suspenders"), and it is the single
biggest lever. It is also the one that most needs a decision rather than a fix:
the reason it exists is that stale builds were being served.

### 2 · `publish = "."` ships the entire repository

The published directory is the repo root, so **114.8 MB of tracked objects** are
processed and uploaded on every deploy. That includes two handoff archives —
`docs/track-c-handoff/FORM-TRACK-C.zip` and `docs/track-e-handoff/FORM-TRACK-E.zip`
— 13 MB of `docs/`, and a 1.2 MB `CURRENT_PLAN_DUMP.json` that is regenerated
several times a day. `keys/` is correctly excluded; nothing else is.

### 3 · Build frequency

**29 commits pushed in the last 24 hours**, each triggering a build of that 115 MB.
Auto-publish is off, so these are builds rather than production deploys — but
they are still builds. Several `codex/*` and `console/*` branches also build.

### What I have changed: nothing

Pushes are held from here. Commits stay local until you ask for a checkpoint,
and then it is one deploy rather than thirty.

### If you want the cheapest three fixes later

1. Cache `/assets/*` and `/media/*` for a year with hashed names, and keep
   `no-store` on the HTML only. Almost all the bandwidth, almost none of the risk.
2. Move the two handoff ZIPs and `media/*.mp4` out of the published tree.
3. Turn off branch deploys for `codex/*`.

None of it is urgent while development is local.
