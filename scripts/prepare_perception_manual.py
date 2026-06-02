#!/usr/bin/env python3
"""Extract base64 images from FORM Perception Manual HTML for web deploy."""

from __future__ import annotations

import argparse
import base64
import re
import sys
from pathlib import Path


def prepare(source: Path, html_out: Path, assets_dir: Path) -> None:
    text = source.read_text(encoding="utf-8")
    assets_dir.mkdir(parents=True, exist_ok=True)

    ext_for_mime = {
        "jpeg": "jpg",
        "jpg": "jpg",
        "png": "png",
        "webp": "webp",
        "gif": "gif",
    }

    index = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal index
        index += 1
        mime = match.group(1)
        b64 = match.group(2)
        ext = ext_for_mime.get(mime, mime)
        filename = f"{index:02d}.{ext}"
        out_path = assets_dir / filename
        out_path.write_bytes(base64.b64decode(b64))
        rel = assets_dir.name + "/" + filename
        return f'src="/assets/{rel}"'

    pattern = re.compile(
        r'src="data:image/([^;]+);base64,([^"]+)"',
        flags=re.DOTALL,
    )
    slim, count = pattern.subn(replace, text)

    html_out.parent.mkdir(parents=True, exist_ok=True)
    html_out.write_text(slim, encoding="utf-8")

    print(f"Extracted {count} images → {assets_dir}")
    print(f"HTML → {html_out} ({html_out.stat().st_size:,} bytes)")
    print(f"Assets total → {sum(p.stat().st_size for p in assets_dir.iterdir()):,} bytes")


def main() -> int:
    repo = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "source",
        nargs="?",
        default=str(Path.home() / "Downloads" / "FORM_Perception_Manual_v10 (3).html"),
    )
    parser.add_argument(
        "--html-out",
        default=str(repo / "perception-manual.html"),
    )
    parser.add_argument(
        "--assets-dir",
        default=str(repo / "assets" / "perception-manual"),
    )
    args = parser.parse_args()

    source = Path(args.source).expanduser()
    if not source.is_file():
        print(f"Source not found: {source}", file=sys.stderr)
        return 1

    prepare(source, Path(args.html_out), Path(args.assets_dir))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
