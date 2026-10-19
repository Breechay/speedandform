'use strict';
/* Verify build regeneration without requiring committed copies of every public
   HTML projection. The approved source, sitemap, publication tests and menu
   generator own the output. Any unexplained edit to content or private paths
   remains an error, and every changed file must be a generated public page. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const cp = require('node:child_process');
const { collect, transformHtml } = require('./build-site-menu.cjs');

const git = (...args) => cp.execFileSync('git', args, {encoding:'utf8',maxBuffer:30*1024*1024});
const changed = git('diff','--name-only','--').trim().split('\n').filter(Boolean);
const approved = new Set(collect());
const discoverable = new Set(['library.html','search.html','404.html','plans/index.html']);

function editorialOnly(html, file) {
  let x = html.replace(/<!-- Shared site menu -->[\s\S]*?<!-- \/Shared site menu -->\s*/g,'');
  x = x.replace(/<link\b[^>]*href=["']\/css\/sf-menu\.css[^"']*["'][^>]*>\s*/g,'');
  x = x.replace(/<script\b[^>]*src=["']\/js\/sf-menu\.js[^"']*["'][^>]*>\s*<\/script>\s*/g,'');
  x = x.replace(/<link\b[^>]*rel=["']icon["'][^>]*type=["']image\/svg\+xml["'][^>]*href=["']\/assets\/brand\/kit\/favicon\/form-rounded\.svg["'][^>]*>\s*/g,'');
  // Published public discovery redirects /people/ to the canonical /athletes/.
  // All other text, metadata, lessons, figures and athlete data remain exact.
  if (discoverable.has(file)) x = x.replaceAll('/athletes/', '/people/');
  return x;
}
for(const file of changed) {
  assert.ok(approved.has(file), 'Unexpected generated-file drift: '+file);
  assert.match(file,/\.html$/,'Only public HTML can be regenerated: '+file);
  const current=fs.readFileSync(file,'utf8');
  const old=git('show','HEAD:'+file);
  assert.equal(transformHtml(current,file),current,'Menu is not idempotent after build: '+file);
  assert.equal(editorialOnly(current,file),editorialOnly(old,file),
    'Non-menu public content changed on regeneration: '+file);
}
console.log('PASS: '+changed.length+' expected public HTML projections regenerate; no content/private drift.');
