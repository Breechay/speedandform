'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://speedandform.com';
const reportPath = process.env.HOUSE_INTEGRITY_REPORT || '';

const errors = [];
const warnings = [];
const notes = [];
const seenFiles = new Map();

const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));
const normRoute = value => {
  const u = new URL(value, ORIGIN);
  let p = u.pathname || '/';
  p = p.replace(/\/+/g, '/');
  if (p !== '/') p = p.replace(/\/+$/, '');
  return p || '/';
};
const add = (level, code, subject, message) => {
  const item = { level, code, subject, message };
  (level === 'error' ? errors : warnings).push(item);
};

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/gs)) out[m[1].toLowerCase()] = m[3];
  return out;
}
function head(html) {
  return (html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i) || [,''])[1];
}
function meta(html, key) {
  for (const m of head(html).matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    if ((a.name || a.property) === key) return a.content || '';
  }
  return '';
}
function canonical(html) {
  for (const m of head(html).matchAll(/<link\b[^>]*>/gi)) {
    const a = attrs(m[0]);
    if ((a.rel || '').toLowerCase().split(/\s+/).includes('canonical')) return a.href || '';
  }
  return '';
}
function pageTitle(html) {
  return ((head(html).match(/<title>([\s\S]*?)<\/title>/i) || [,''])[1] || '').replace(/\s+/g, ' ').trim();
}

function parseRedirects() {
  const map = new Map();
  if (exists('netlify.toml')) {
    const src = read('netlify.toml');
    for (const block of src.split(/\[\[redirects\]\]/).slice(1)) {
      const from = (block.match(/^\s*from\s*=\s*["']([^"']+)["']/m) || [,''])[1];
      const to = (block.match(/^\s*to\s*=\s*["']([^"']+)["']/m) || [,''])[1];
      const status = Number((block.match(/^\s*status\s*=\s*(\d+)/m) || [,0])[1]);
      if (from && to && !/[:*]/.test(from)) map.set(normRoute(from), { to, status, source: 'netlify.toml' });
    }
  }
  if (exists('_redirects')) {
    for (const raw of read('_redirects').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const parts = line.split(/\s+/);
      if (parts.length < 2 || /[:*]/.test(parts[0])) continue;
      map.set(normRoute(parts[0]), { to: parts[1], status: Number(parts[2] || 301), source: '_redirects' });
    }
  }
  return map;
}
const redirects = parseRedirects();

function routeToFile(route, seen = new Set()) {
  const r = normRoute(route);
  if (seen.has(r)) return null;
  seen.add(r);
  if (r === '/') return exists('index.html') ? 'index.html' : null;
  const rel = decodeURIComponent(r).replace(/^\//, '');
  const candidates = [rel, rel + '.html', path.posix.join(rel, 'index.html')];
  for (const candidate of candidates) {
    const full = path.join(ROOT, candidate);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return candidate;
  }
  const rule = redirects.get(r);
  if (rule && /^\//.test(rule.to)) return routeToFile(rule.to, seen);
  return null;
}

function staticTargetExists(route) {
  const r = normRoute(route);
  if (routeToFile(r)) return true;
  const rel = decodeURIComponent(r).replace(/^\//, '');
  if (!rel) return true;
  const full = path.join(ROOT, rel);
  return fs.existsSync(full) && fs.statSync(full).isFile();
}

function sitemapRoutes() {
  const xml = read('sitemap.xml');
  const routes = [];
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = m[1].trim();
    if (!url.startsWith(ORIGIN)) {
      add('error', 'sitemap.foreign-origin', 'sitemap.xml', url);
      continue;
    }
    routes.push(normRoute(url));
  }
  const dupes = routes.filter((r, i) => routes.indexOf(r) !== i);
  for (const r of new Set(dupes)) add('error', 'sitemap.duplicate', r, 'Duplicate sitemap route.');
  return [...new Set(routes)];
}

const sitemap = sitemapRoutes();
const sitemapSet = new Set(sitemap);
const publicPages = new Map();

for (const route of sitemap) {
  const file = routeToFile(route);
  if (!file) {
    add('error', 'sitemap.unresolved', route, 'Sitemap route does not resolve to a committed file or exact redirect.');
    continue;
  }
  if (!/\.html$/i.test(file)) continue;
  if (!publicPages.has(file)) publicPages.set(file, { file, routes: [], indexable: true });
  publicPages.get(file).routes.push(route);
}
for (const file of ['search.html', '404.html', 'support.html', 'form-house.html']) {
  if (exists(file) && !publicPages.has(file)) publicPages.set(file, { file, routes: [], indexable: false });
}

function routeForPage(page) {
  if (page.routes && page.routes.length) return page.routes[0];
  if (page.file === 'index.html') return '/';
  if (page.file.endsWith('/index.html')) return '/' + page.file.slice(0, -'index.html'.length);
  return '/' + page.file.replace(/\.html$/, '');
}

const requiredShare = ['og:title','og:description','og:url','og:site_name','og:image','twitter:card','twitter:title','twitter:description','twitter:image'];

for (const page of publicPages.values()) {
  const html = read(page.file);
  seenFiles.set(page.file, html);
  if (!pageTitle(html)) add('error', 'metadata.title', page.file, 'Missing <title>.');
  if (!meta(html, 'description')) add('error', 'metadata.description', page.file, 'Missing meta description.');

  if (page.indexable) {
    const robots = meta(html, 'robots').toLowerCase();
    if (robots.includes('noindex')) add('error', 'metadata.noindex-in-sitemap', page.file, 'Sitemap page declares noindex.');

    const can = canonical(html);
    if (!can) add('error', 'metadata.canonical', page.file, 'Missing canonical URL.');
    else if (!can.startsWith(ORIGIN)) add('error', 'metadata.canonical-origin', page.file, can);
    else if (!page.routes.some(r => normRoute(can) === normRoute(r))) add('warning', 'metadata.canonical-route', page.file, 'Canonical does not match any sitemap route for this file: ' + can);

    for (const key of requiredShare) {
      if (!meta(html, key)) add('error', 'metadata.share-' + key.replace(':','-'), page.file, 'Missing ' + key + '.');
    }

    const ogSite = meta(html, 'og:site_name');
    if (ogSite && ogSite !== 'Speed & Form' && ogSite !== 'Speed &amp; Form') {
      add('error', 'brand.og-site-name', page.file, 'Use Speed & Form as the site name; found "' + ogSite + '".');
    }

    const ogUrl = meta(html, 'og:url');
    if (ogUrl && can && normRoute(ogUrl) !== normRoute(can)) add('error', 'metadata.og-url', page.file, 'og:url and canonical disagree.');

    const ogImage = meta(html, 'og:image');
    const twImage = meta(html, 'twitter:image');
    if (ogImage && !ogImage.startsWith(ORIGIN + '/')) add('warning', 'metadata.og-image-origin', page.file, ogImage);
    if (ogImage && twImage && ogImage !== twImage) add('warning', 'metadata.share-image-parity', page.file, 'Open Graph and Twitter images differ.');
  }

  if (/<a\b(?![^>]*\bsf-brand\b)[^>]*href=["']\/(?:["']|#)[^>]*>\s*FORM(?:\s*<[^>]+>\.\s*<\/[^>]+>)?\s*<\/a>/i.test(html)) {
    add('warning', 'brand.legacy-home-wordmark', page.file, 'Legacy FORM text wordmark links home instead of using .sf-brand.');
  }
  if (/class=["'][^"']*(?:nav-wordmark|footer-wordmark)[^"']*["']/i.test(html)) {
    add('warning', 'brand.legacy-wordmark-class', page.file, 'Legacy wordmark class remains.');
  }
  if (/fonts\.googleapis\.com/i.test(html)) {
    add('warning', 'brand.external-font', page.file, 'External Google Fonts remain; current house pages prefer committed/local type.');
  }
}

let search = [];
try {
  search = JSON.parse(read('search-index.json'));
} catch (e) {
  add('error', 'search.json', 'search-index.json', e.message);
}

if (!Array.isArray(search)) {
  add('error', 'search.shape', 'search-index.json', 'Catalog must be an array.');
} else {
  const urls = new Set();
  const titles = new Set();
  const categories = new Set(['start','coaching','half-marathon','training','movement','race','recovery','practice','house']);

  for (const entry of search) {
    const subject = entry && entry.url ? entry.url : 'search-index.json';
    if (!entry || typeof entry !== 'object') {
      add('error','search.entry',subject,'Entry must be an object.');
      continue;
    }

    for (const key of ['url','title','description','category','type']) {
      if (!String(entry[key] || '').trim()) add('error','search.required',subject,'Missing '+key+'.');
    }

    const r = normRoute(entry.url || '/');
    if (urls.has(r)) add('error','search.duplicate-url',r,'Duplicate search URL.');
    else urls.add(r);

    const tk = String(entry.title || '').trim().toLowerCase();
    if (tk && titles.has(tk)) add('error','search.duplicate-title',entry.title,'Duplicate search title.');
    else if (tk) titles.add(tk);

    if (!categories.has(entry.category)) add('error','search.category',subject,'Unknown category: '+entry.category);
    if (!routeToFile(r)) add('error','search.unresolved',r,'Search result does not resolve.');
    if (!sitemapSet.has(r)) add('error','search.not-in-sitemap',r,'Searchable page is missing from sitemap.');
  }
}

const inbound = new Map(sitemap.map(r => [r, 0]));

for (const page of publicPages.values()) {
  const html = seenFiles.get(page.file) || read(page.file);
  const baseRoute = routeForPage(page);
  const linkHtml = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  for (const m of linkHtml.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) {
    const href = (m[2] || '').trim();
    if (!href || href.startsWith('#') || /^(?:mailto:|tel:|sms:|javascript:|data:)/i.test(href)) continue;

    let url;
    try {
      url = new URL(href, ORIGIN + baseRoute);
    } catch {
      add('error','link.invalid',page.file,href);
      continue;
    }
    if (url.origin !== ORIGIN) continue;

    const target = normRoute(url.pathname);
    if (!staticTargetExists(target)) {
      add('error','link.broken',page.file,href+' -> '+target);
      continue;
    }

    if (sitemapSet.has(target) && target !== normRoute(baseRoute)) {
      inbound.set(target, (inbound.get(target) || 0) + 1);
    }

    if (url.hash && routeToFile(target)) {
      const targetHtml = read(routeToFile(target));
      const id = decodeURIComponent(url.hash.slice(1));
      const fragmentFound = id && [
        'id="' + id + '"',
        "id='" + id + "'",
        'name="' + id + '"',
        "name='" + id + "'"
      ].some(token => targetHtml.includes(token));
      if (id && !fragmentFound) {
        add('warning','link.fragment',page.file,href+' points to no static id/name.');
      }
    }
  }
}

for (const [route, count] of inbound) {
  if (route !== '/' && count === 0 && !search.some(e => normRoute(e.url) === route)) {
    add('warning','discovery.orphan',route,'No inbound link from audited public pages and not present in search.');
  }
}

if (exists('data/public-share.json')) {
  let cards = {};
  try {
    cards = JSON.parse(read('data/public-share.json'));
  } catch (e) {
    add('error','share.manifest-json','data/public-share.json',e.message);
  }

  for (const [file, card] of Object.entries(cards)) {
    if (!exists(file)) {
      add('error','share.missing-page',file,'Listed in public-share manifest.');
      continue;
    }

    const html = read(file);
    const image = meta(html,'og:image');
    if (card.image && image && normRoute(image) !== normRoute(card.image)) {
      add('error','share.manifest-image',file,'Page and public-share manifest disagree.');
    }

    if (image && image.startsWith(ORIGIN + '/')) {
      const rel = new URL(image).pathname.replace(/^\//,'');
      if (!exists(rel)) add('error','share.image-file',file,'Share image is not committed: '+rel);
    }
  }
}

const report = {
  generated_at: new Date().toISOString(),
  summary: {
    sitemap_routes: sitemap.length,
    public_html_files: publicPages.size,
    searchable_pages: Array.isArray(search) ? search.length : 0,
    errors: errors.length,
    warnings: warnings.length
  },
  errors,
  warnings,
  notes
};

if (reportPath) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}

console.log('HOUSE INTEGRITY');
console.log('  sitemap routes:   ' + report.summary.sitemap_routes);
console.log('  public html:      ' + report.summary.public_html_files);
console.log('  searchable pages: ' + report.summary.searchable_pages);
console.log('  errors:           ' + errors.length);
console.log('  warnings:         ' + warnings.length);

for (const item of errors) console.error('ERROR ['+item.code+'] '+item.subject+': '+item.message);
for (const item of warnings) console.warn('WARN  ['+item.code+'] '+item.subject+': '+item.message);

if (errors.length) process.exit(1);
console.log('PASS: public house integrity hard checks.');
