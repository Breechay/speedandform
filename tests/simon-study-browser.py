"""Compatibility entry point for the shared JavaScript browser acceptance."""
import os
import pathlib
import subprocess

script = pathlib.Path(__file__).with_suffix('.cjs')
node = os.environ.get('CODEX_PRIMARY_RUNTIME_NODE', 'node')
raise SystemExit(subprocess.call([node, str(script)]))
