#!/usr/bin/env python3
"""
One-way import: Claude Downloads export → repo source of truth.

Overwrites:
  perception-manual.html
  assets/perception-manual/*.jpg

Does NOT run on normal edits. Edit perception-manual.html directly instead.
"""

from __future__ import annotations

import argparse
import base64
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
HTML_OUT = REPO / "perception-manual.html"
ASSETS_DIR = REPO / "assets" / "perception-manual"

SOURCE_BANNER = """<!--
  SOURCE OF TRUTH — edit this file in the repo only.
  Deploy: perception-manual.html + assets/perception-manual/*.jpg
  Live: https://speedandform.com/perception-manual
  Do not commit Claude Downloads exports (base64). Import once: scripts/import_claude_perception_export.py
  See: docs/PERCEPTION_MANUAL.md
-->
"""


def import_export(source: Path) -> None:
    text = source.read_text(encoding="utf-8")

    if "data:image" not in text:
        print(
            "Warning: no base64 images found. If this is already the repo HTML, "
            "edit perception-manual.html directly — no import needed.",
            file=sys.stderr,
        )

    ext_for_mime = {"jpeg": "jpg", "jpg": "jpg", "png": "png", "webp": "webp", "gif": "gif"}
    index = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal index
        index += 1
        mime = match.group(1)
        b64 = match.group(2)
        ext = ext_for_mime.get(mime, mime)
        filename = f"{index:02d}.{ext}"
        ASSETS_DIR.mkdir(parents=True, exist_ok=True)
        (ASSETS_DIR / filename).write_bytes(base64.b64decode(b64))
        return f'src="/assets/perception-manual/{filename}"'

    pattern = re.compile(r'src="data:image/([^;]+);base64,([^"]+)"', flags=re.DOTALL)
    slim, count = pattern.subn(replace, text)

    if not slim.lstrip().startswith("<!--"):
        slim = SOURCE_BANNER + slim.lstrip()

    HTML_OUT.write_text(slim, encoding="utf-8")

    print(f"Imported {count} images → {ASSETS_DIR}")
    print(f"Wrote {HTML_OUT} ({HTML_OUT.stat().st_size:,} bytes)")
    print("Next: git diff, commit, push.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "source",
        help="Claude export path (base64 HTML from Downloads)",
    )
    args = parser.parse_args()

    source = Path(args.source).expanduser()
    if not source.is_file():
        print(f"Not found: {source}", file=sys.stderr)
        return 1

    import_export(source)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
