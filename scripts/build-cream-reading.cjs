'use strict';
/**
 * FORM's legacy reading pages are standalone HTML. Apply the shared reading
 * material before publishing, never after first paint. No runtime JS or packages.
 * Run this before a local static preview too. Auth, Labs, Plans and home are not
 * candidates. Content, scripts, forms, IDs and existing navigation stay intact.
 */
const fs = require('node:fs');
const path = require('node:path');
const VERSION = '20260916';
const STYLE = `/css/cream-reading.css?v=${VERSION}`;
const EXCLUDED = /^(?:index\.html|coach(?:\.html|\/)|athlete(?:\.html|\/)|auth\/|record(?:\.html|\/)|account(?:\.html|\/)|login(?:\.html|\/)|signin(?:\.html|\/)|village-intake\.html|private\/|studio\.html|films\.html|forge[^/]*(?:\.html|\/)|form(?:\.html|\/)|app\.html|plans\/|labs\/|mockup[^/]*(?:\.html|\/)|docs\/|tests\/|node_modules\/|\.git\/|_)/i;
function eligible(file, html) {
  return !EXCLUDED.test(file) && /--cream\s*:\s*#f5f2ec\b/i.test(html)
    && /Jost/.test(html) && /Cormorant Garamond/.test(html)
    && /class=["'][^"']*\b(?:content|page)\b/.test(html);
}
function declarations(css, selector = '') {
  const label = /text-transform\s*:\s*uppercase/i.test(css)
    || /(?:label|eyebrow|breadcrumb|caption|meta|\bhead\b)/i.test(selector);
  const note = /(?:note|hint|unit|caption|meta|\berr\b|summary)/i.test(selector);
  return css
    .replace(/font-family\s*:\s*(['"])Jost\1\s*,\s*sans-serif/gi, 'font-family: var(--reading-sans)')
    .replace(/font-family\s*:\s*(['"])Cormorant Garamond\1\s*,\s*serif/gi, 'font-family: var(--reading-serif)')
    .replace(/(font-weight\s*:\s*)(?:100|200|300)\b/gi, '$1400')
    .replace(/(font-size\s*:\s*)(\d+(?:\.\d+)?)px\b/gi, (m, prefix, n) => {
      const value = Number(n);
      const minimum = label ? 12 : note ? 14 : value < 12 ? 14 : 17;
      return value < minimum ? `${prefix}${minimum}px` : m;
    })
    .replace(/(letter-spacing\s*:\s*)(0?\.\d+)em/gi, (m, prefix, n) =>
      Number(n) > 0 ? `${prefix}${label ? '0.08' : '0'}em` : m)
    .replace(/(?<![-\w])(color\s*:\s*)var\(--line(?:-l)?\)/gi, '$1var(--ink-f)')
    .replace(/(opacity\s*:\s*)(0?\.\d+)/gi, (m, prefix) =>
      /color\s*:\s*var\(--ink(?:-f|-l)?\)/i.test(css) ? `${prefix}1` : m);
}
function transformHtml(html, file) {
  if (/data-form-reading=/.test(html) || !eligible(file, html)) return html;
  // Protect even HTML-looking template strings inside scripts, byte for byte.
  const pieces = html.split(/(<script\b[^>]*>[\s\S]*?<\/script\s*>)/gi);
  let next = pieces.map(piece => /^<script\b/i.test(piece) ? piece : piece
    .replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/[^"']*(?:Jost|Cormorant)[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<style\b([^>]*)>([\s\S]*?)<\/style\s*>/gi, (m, attrs, css) =>
      `<style${attrs}>${css.replace(/([^{}]+)\{([^{}]*)\}/g, (rule, selector, body) => `${selector}{${declarations(body, selector)}}`)}</style>`)
    .replace(/\bstyle=(['"])([\s\S]*?)\1/gi, (m, quote, css) => `style=${quote}${declarations(css)}${quote}`)
  ).join('');
  next = next.replace(/<html\b([^>]*)>/i, `<html$1 data-form-reading="${VERSION}">`);
  next = next.replace(/<\/head\s*>/i, `<link rel="stylesheet" href="${STYLE}">\n</head>`);
  if (/class=["'][^"']*\blib-section\b/.test(html)) {
    next = next.replace(/<body\b([^>]*)>/i, '<body$1 data-reading-layout="library">')
      .replace(/<span class="lib-section-label">([^<]*)<\/span>/g, '<h2 class="lib-section-label">$1</h2>');
  }
  return next;
}
function resolvePage(root, href) {
  let url;
  try { url = new URL(href.replace(/&amp;/g, '&'), 'https://speedandform.com/'); } catch { return null; }
  if (url.origin !== 'https://speedandform.com') return null;
  let route;
  try { route = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, ''); } catch { return null; }
  if (!route || route.includes('..') || EXCLUDED.test(route)) return null;
  for (const candidate of [route, `${route}.html`, `${route}/index.html`]) {
    const full = path.resolve(root, candidate);
    if (full.startsWith(path.resolve(root) + path.sep) && candidate.endsWith('.html')
      && !EXCLUDED.test(candidate) && fs.existsSync(full) && fs.statSync(full).isFile()) return candidate;
  }
  return null;
}
function collect(root) {
  const queue = ['library.html', ...fs.readdirSync(root).filter(n => n.endsWith('.html') && !EXCLUDED.test(n))];
  const seen = new Set();
  const pages = [];
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const html = fs.readFileSync(full, 'utf8');
    if (!eligible(file, html) && !/data-form-reading=/.test(html)) continue;
    pages.push({ file, html });
    for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
      const linked = resolvePage(root, match[1]);
      if (linked) queue.push(linked);
    }
  }
  return pages.sort((a, b) => a.file.localeCompare(b.file));
}
function build(root = path.resolve(__dirname, '..')) {
  if (!fs.existsSync(path.join(root, 'css/cream-reading.css'))) throw new Error('Reading stylesheet is missing.');
  const pages = collect(root);
  if (!pages.some(p => p.file === 'library.html')) throw new Error('Library must be present in the reading release.');
  for (const { file, html } of pages) {
    const output = transformHtml(html, file);
    if (output !== html) fs.writeFileSync(path.join(root, file), output);
  }
  const manifest = { version: VERSION, sourceCommit: process.env.COMMIT_REF || null, count: pages.length, pages: pages.map(p => p.file) };
  fs.writeFileSync(path.join(root, 'css/cream-reading-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`FORM cream reading: ${pages.length} public pages. Home, Labs, Plans and private surfaces untouched.`);
  return manifest;
}
if (require.main === module) build();
module.exports = { VERSION, STYLE, eligible, declarations, transformHtml, resolvePage, collect, build };
