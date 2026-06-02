#!/usr/bin/env python3
"""Deprecated alias — use import_claude_perception_export.py instead."""

import subprocess
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
target = here / "import_claude_perception_export.py"
raise SystemExit(subprocess.call([sys.executable, str(target), *sys.argv[1:]]))
