'use strict';
// FORM publication rule: Present the evidence. Don't narrate the presentation.
// This check catches unequivocal public-copy regressions; human editorial and
// visual review remain mandatory. Never lint historical docs or private feeds.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const ORIGIN = 'https://speedandform.com';

const banned = [
  ['ui.one-click-away', /\bone click away\b/gi],
  ['ui.full-details-remain', /\bfull details remain\b/gi],
  ['ui.editorial-formula', /\bsession,\s*experience,\s*decision\b/gi],
  ['voice.work-has-faces', /\bthe work has faces\b/gi],
  ['voice.camera-caught', /\bsee what the camera caught\b/gi],
  ['voice.look-inside', /\ba look inside the work\b/gi],
  ['internal.method-frozen', /\bmethod frozen\b/gi],
  ['internal.inspect-plan', /\binspect the plan\b/gi],
  ['ui.follow-as-happens', /\bfollow the study as it happens\b/gi],
];

function decode(value) {
  return value
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/&(?:amp|#38);/gi, '&')
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function normalize(value) {
  return decode(value).replace(/\s+/g, ' ').trim();
}
function tagAttr(tag, attr) {
  for (const m of tag.matchAll(/\b([a-z:-]+)\s*=\s*(["'])(.*?)\2/gis)) {
    if (m[1].toLowerCase() === attr) return m[3];
  }
  return '';
}
function scanHtml(html, file) {
  const matches = [];
  const h = (html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i) || [,''])[1];
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [,html])[1];
  const subjects = [
    {section:'visible copy', text: normalize(body
      .replace(/<!--[^]*?-->/g, ' ')
      .replace(/<script\b[^]*?<\/script\s*>/gi, ' ')
      .replace(/<style\b[^]*?<\/style\s*>/gi, ' ')
      .replace(/<svg\b[^]*?<\/svg\s*>/gi, ' ')
      .replace(/<template\b[^]*?<\/template\s*>/gi, ' ')
      .replace(/<[^>]*>/g, ' '))},
  ];
  const title = (h.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [,''])[1];
  if (title) subjects.push({section:'title', text:normalize(title)});
  for (const m of h.matchAll(/<meta\b[^>]*>/gi)) {
    const name = tagAttr(m[0], 'name') || tagAttr(m[0], 'property');
    if (!['description','og:description','twitter:description','og:title','twitter:title'].includes(name?.toLowerCase())) continue;
    subjects.push({section:name, text: normalize(tagAttr(m[0], 'content') || '')});
  }
  for (const {section,text} of subjects) {
    for (const [rule,regex] of banned) {
      regex.lastIndex = 0;
      for (const hit of text.matchAll(regex)) {
        matches.push({file,section,rule,excerpt:text.slice(Math.max(0,hit.index-45),hit.index+hit[0].length+65).trim()});
      }
    }
  }
  return matches;
}

function findPublicHtml() {
  const pages = new Set();
  function add(rel) {
    const p = path.join(ROOT, rel);
    if (fs.existsSync(p) && fs.statSync(p).isFile() && rel.endsWith('.html')) pages.add(rel);
  }
  if (fs.existsSync(path.join(ROOT, 'sitemap.xml'))) {
    const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    for (const hit of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const url = new URL(hit[1], ORIGIN);
      if (url.origin !== ORIGIN) continue;
      const rel = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g,'');
      if (!rel) {add('index.html');continue;}
      for (const candidate of [rel, rel+'.html', rel+'/index.html']) add(candidate);
    }
  }
  for (const rel of [
    'index.html', 'brand/index.html', 'plans/index.html', 'runs/index.html',
    'people/index.html', 'coaching/miami/index.html', 'form-house.html'
  ]) add(rel);
  const labs = path.join(ROOT,'labs');
  if (fs.existsSync(labs)) for (const entry of fs.readdirSync(labs,{withFileTypes:true})) {
    if (entry.isDirectory()) add('labs/'+entry.name+'/index.html');
  }
  return [...pages].sort();
}

function run() {
  const pages = findPublicHtml();
  const violations = pages.flatMap(file => scanHtml(fs.readFileSync(path.join(ROOT,file),'utf8'), file));
  for (const x of violations) console.error('EDITORIAL ' + x.rule + ' · ' + x.file + ' · ' + x.section + ': ' + x.excerpt);
  console.log('FORM editorial contract: '+pages.length+' public pages checked; '+violations.length+' high-confidence violations.');
  if (process.env.EDITORIAL_REPORT) {
    const output = path.resolve(process.env.EDITORIAL_REPORT);
    fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,JSON.stringify({checked:pages,violations},null,2)+'\n');
  }
  if (violations.length) process.exitCode = 1;
}
module.exports = {scanHtml,findPublicHtml,run};
if (require.main === module) run();
