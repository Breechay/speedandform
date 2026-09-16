#!/usr/bin/env python3
"""Move the public cream reference pages to the homepage's reading tokens.

One-time, idempotent migration. Only CSS declarations, the old Google-font
request, a root opt-in attribute and one shared stylesheet link are changed.
Content, URLs, event handlers and athlete data stay intact. The search reader
accepts both keyword formats already present in search-index.json.
The manifest is intentionally explicit. Private consoles, native/React apps,
Labs, dark plans, checkout and the approved homepage are not in scope.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
PAGES = '''anti-rotation app arc athletes avoid-injury competition cycles easy-run easy-run-standards field-notes fueling how-fast-should-i-run ledger library long-run long-run-pace mechanics-map miami-running-training mobility pacing pain-map plan plan-speed-emergence plan-spring-2026 principles practice race-prep race-strategy recovery return running-form-errors running-terms search sessions shoes sleep speed split-calculator start strength strength-activation strength-fixes strength-routine support taper-key-biscayne the-field the-method the-work threshold threshold-training thursday training-arc training-interruptions training-map training-principles training-week troubleshooting'''.split()
FILES = [f'{name}.html' for name in PAGES] + [
    f'ghost/{name}.html' for name in ['index','cues',*[f'week-{i}' for i in range(1,7)]]]
FILES += [f'athletes/{name}.html' for name in ['index','bobby','breech','jose','kyle','lisa','marcus','megan','mike','ryan','sam-p','sam-v','simon','tinius']]
FILES += ['plans/index.html','privacy.html','terms.html']
LINK = '<link rel="stylesheet" href="/css/cream-reading.css?v=20260916">'


def declarations(css: str) -> str:
    css = re.sub(r"(['\"])Cormorant Garamond\1\s*,\s*serif", 'var(--cream-serif)', css)
    css = re.sub(r"(['\"])Jost\1\s*,\s*sans-serif", 'var(--cream-sans)', css)
    css = re.sub(r'(font-weight\s*:\s*)300\b', r'\g<1>400', css)
    # Text never borrows the decorative border colors.
    css = re.sub(r'(?<![-\w])(color\s*:\s*)var\(--line(?:-l)?\)', r'\g<1>var(--cream-muted)', css)
    css = re.sub(r'(max-width\s*:\s*)560px\b', r'\g<1>var(--cream-width)', css)
    def size(m):
        n = float(m[2])
        if n <= 9: token = '--cream-label'
        elif n <= 11: token = '--cream-small'
        elif n <= 12: token = '--cream-note'
        elif n <= 16: token = '--cream-text'
        else: return m[1] + f'{n / 16:g}rem'
        return m[1] + f'var({token})'
    css = re.sub(r'(font-size\s*:\s*)([\d.]+)px\b', size, css)
    # Old .3/.4em tracking was decorative; it also broke long phone labels.
    def tracking(m):
        n = float(m[2])
        return m[1] + ('.08em' if n >= .1 else '0' if n >= 0 else m[2]+'em')
    css = re.sub(r'(letter-spacing\s*:\s*)([\d.-]+)em\b', tracking, css)
    return css


def fix_search_keywords(source: str) -> str:
    # The existing index contains both arrays and comma-separated strings.
    # A .map on the latter stopped the entire search before results rendered.
    for field in ('keywords', 'synonyms'):
        old = f"(entry.{field} || []).map(k => k.toLowerCase())"
        new = f"(Array.isArray(entry.{field}) ? entry.{field} : String(entry.{field} || '').split(',')).map(k => String(k).trim().toLowerCase())"
        source = source.replace(old, new)
    return source


def migrate(source: str, name: str) -> str:
    if name == 'search.html':
        source = fix_search_keywords(source)
    if 'data-cream=' in source:
        return source
    source = re.sub(r'(<style\b[^>]*>)([\s\S]*?)(</style>)', lambda m:m[1]+declarations(m[2])+m[3], source, flags=re.I)
    # Includes style attributes inside client-rendered HTML template strings;
    # no JavaScript expression, data value or action is changed.
    source = re.sub(r'(\bstyle\s*=\s*)(["\'])([\s\S]*?)\2', lambda m:m[1]+m[2]+declarations(m[3])+m[2], source)
    source = re.sub(r'<link\b[^>]*href=["\']https://fonts\.googleapis\.com/[^>]*(?:Cormorant|Jost)[^>]*>\s*', '', source, flags=re.I)
    surface = 'catalog' if name == 'plans/index.html' else 'reading'
    source = re.sub(r'<html\b', '<html data-cream="'+surface+'"', source, count=1, flags=re.I)
    source = source.replace('</head>', LINK+'\n</head>', 1)
    return source


def main():
    changed = []
    for name in FILES:
        path = ROOT / name
        source = path.read_text()
        result = migrate(source, name)
        if source != result:
            path.write_text(result)
            changed.append(name)
    print(f'Cream reading: {len(changed)} changed; {len(FILES)} public pages in manifest.')

if __name__ == '__main__':
    main()
