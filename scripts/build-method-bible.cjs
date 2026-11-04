#!/usr/bin/env node
// Small dependency-free static builder. One public Markdown source generates
// a crawlable, semantic HTML page; agents can read the same Markdown verbatim.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'method-bible/method.md'), 'utf8');
const outPath = path.join(root, 'method-bible/index.html');
const canonical = 'https://speedandform.com/method-bible/';
const description = 'Brice Ikouebe’s FORM Method Bible: train to win, purpose-dose-cost, speed reserve, threshold, endurance, glute strength, mobility, coaching evidence and progression.';
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const inline = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\((https:\/\/speedandform\.com\/[^)]+)\)/g,
    '<a href="$2">$1</a>');
const slug = (s) => s.replace(/^\d+\.\s*/, '').toLowerCase()
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

const lines = source.trim().split(/\r?\n/);
const sections = [];
let pageTitle = '';
let intro = '';
let currentSection = null;
let openList = null;
let paragraph = [];

function append(html) {
  if (currentSection) currentSection.html.push(html);
  else intro += html;
}
function flushParagraph() {
  if (paragraph.length) {
    append('<p>' + inline(paragraph.join(' ')) + '</p>');
    paragraph = [];
  }
}
function closeList() {
  if (openList) {
    append('</' + openList + '>');
    openList = null;
  }
}
for (const raw of lines) {
  const line = raw.trim();
  if (!line) { flushParagraph(); closeList(); continue; }
  if (line.startsWith('# ') && !pageTitle) {
    pageTitle = line.slice(2);
    continue;
  }
  if (line.startsWith('## ')) {
    flushParagraph(); closeList();
    const heading = line.slice(3);
    const chapter = heading.match(/^(\d+)\.\s*/)?.[1] || '';
    const label = heading.replace(/^\d+\.\s*/, '');
    currentSection = { chapter, title: label, id: slug(heading), html: [] };
    sections.push(currentSection);
    continue;
  }
  if (line.startsWith('### ')) {
    flushParagraph(); closeList();
    append('<h3>' + inline(line.slice(4)) + '</h3>');
    continue;
  }
  if (line.startsWith('> ')) {
    flushParagraph(); closeList();
    append('<blockquote><p>' + inline(line.slice(2)) + '</p></blockquote>');
    continue;
  }
  const ordered = line.match(/^\d+\.\s+(.+)/);
  const bullet = line.match(/^-\s+(.+)/);
  if (ordered || bullet) {
    flushParagraph();
    const type = ordered ? 'ol' : 'ul';
    if (openList !== type) { closeList(); append('<' + type + '>'); openList = type; }
    append('<li>' + inline((ordered || bullet)[1]) + '</li>');
    continue;
  }
  closeList();
  paragraph.push(line);
}
flushParagraph(); closeList();

if (sections.length < 15 || sections.some((section) => !section.html.length)) {
  throw new Error('The Bible needs all authored chapters, each with content.');
}
const chapterLinks = sections.map((s) =>
  `<a href="#${s.id}"><span>${esc(s.chapter)}</span>${esc(s.title)}</a>`).join('\n');
const chapters = sections.map((s) =>
  `<section class="chapter" id="${s.id}" aria-labelledby="${s.id}-title">
    <header class="chapter-head"><p class="chapter-index">${esc(s.chapter)} / FORM</p>
      <h2 id="${s.id}-title">${esc(s.title)}</h2></header>
    <div class="chapter-body">${s.html.join('\n')}</div>
    <a class="back-to-contents" href="#contents">Back to contents ↑</a>
  </section>`).join('\n');
const metadata = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  '@id': canonical + '#article',
  mainEntityOfPage: canonical,
  headline: 'FORM — The Method Bible',
  description,
  author: { '@type': 'Person', name: 'Brice Ikouebe', url: 'https://speedandform.com/' },
  publisher: { '@type': 'Organization', name: 'Speed & Form', url: 'https://speedandform.com/' },
  datePublished: '2026-11-04',
  dateModified: '2026-11-04',
  inLanguage: 'en-US',
  about: ['Athletic development', 'Run development', 'Speed training', 'Strength training', 'Training methodology'],
  isAccessibleForFree: true
};
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">
  <meta name="theme-color" content="#f4f2ec">
  <title>FORM Method Bible | Train to Win | Speed &amp; Form</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" type="text/markdown" title="FORM Method Bible · plain text" href="/method-bible/method.md">
  <link rel="icon" type="image/svg+xml" href="/assets/brand/kit/favicon/form-rounded.svg">
  <link rel="preload" href="/assets/site/fonts/inter-tight-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/method-bible/method.css?v=1">
  <meta property="og:type" content="article">
  <meta property="og:title" content="FORM Method Bible · Train to Win">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:site_name" content="Speed &amp; Form">
  <meta property="og:image" content="https://speedandform.com/og/public-the-method-20261006.jpg">
  <meta property="og:image:secure_url" content="https://speedandform.com/og/public-the-method-20261006.jpg">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Speed &amp; Form. FORM Method Bible: Train to Win.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="FORM Method Bible · Train to Win">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="https://speedandform.com/og/public-the-method-20261006.jpg">
  <meta name="twitter:image:alt" content="Speed &amp; Form. FORM Method Bible: Train to Win.">
  <script type="application/ld+json">${JSON.stringify(metadata).replace(/</g, '\\u003c')}</script>
</head>
<body>
<a class="skip-link" href="#main">Skip to the Method Bible</a>
<header class="site-header">
  <a class="home-mark" href="/" aria-label="Speed and Form home"><img src="/assets/brand/kit/emblem/sf-emblem-ink.svg" width="88" height="35" alt=""></a>
  <nav aria-label="Reading and coaching"><a href="/the-method">The Method</a><a href="/training-map">Training Map</a><a href="/library">Library</a><a href="/coaching/miami/">Train with FORM ↗</a></nav>
</header>
<div class="hero" id="top"><div class="hero-rule"></div><div class="hero-meta"><span>FORM / RUN DEVELOPMENT</span><span>A living method · Edition 01 · November 2026</span></div>
  <h1>THE METHOD<br><em>BIBLE.</em></h1>
  <div class="hero-bottom"><p>Train to win.<br><span>Build the athlete.</span></p>
  <div class="hero-intro">${intro}</div></div>
</div>
<div class="reader" id="main">
  <aside class="toc" id="contents" aria-label="Table of contents">
    <p class="toc-kicker">CONTENTS · ${sections.length} CHAPTERS</p>
    <nav class="toc-links" aria-label="Chapters">${chapterLinks}</nav>
    <div class="toc-tools"><a href="/method-bible/method.md">Read as plain text ↗</a><a href="/the-method">Short introduction ↗</a></div>
  </aside>
  <div class="reading-column">
    <details class="mobile-toc"><summary>Explore the ${sections.length} chapters</summary><nav aria-label="Chapters">${chapterLinks}</nav></details>
    <div class="reading-head"><span>BRICE IKOUEBE</span><span>SPEED &amp; FORM</span></div>
    ${chapters}
    <footer class="reader-footer"><p>The method is a living practice. Its application is individual, and newer evidence may change a rule.</p><a href="#top">Return to the beginning ↑</a></footer>
  </div>
</div>
<footer class="site-footer"><a href="/" aria-label="Speed and Form home"><img src="/assets/brand/kit/emblem/sf-emblem-ink.svg" width="100" height="40" alt=""></a><div><a href="/coaching/miami/">Run Development</a><a href="/library">Library</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a></div><span>© Speed &amp; Form · 2026</span></footer>
</body>
</html>
`;
fs.writeFileSync(outPath, html);
process.stdout.write(`Built method-bible/index.html: ${sections.length} chapters, ${html.length} bytes.\n`);
