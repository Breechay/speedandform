'use strict';
/* Pass 1: static link-preview metadata only. No runtime JavaScript or packages. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ORIGIN = 'https://speedandform.com';
const DEFAULT_IMAGE = '/og/form-share-20260916.jpg';
const DEFAULT_ALT = 'Two runners in profile in a black-and-white photograph, with FORM, Run Development, and Brice · Miami + Remote.';
const PAGES = `anti-rotation.html app.html athletes.html avoid-injury.html competition.html cycles.html easy-run-standards.html easy-run.html es/plans/race-pace-durability/index.html field-notes.html form/index.html fueling.html ghost/cues.html ghost/index.html ghost/week-1.html ghost/week-2.html ghost/week-3.html ghost/week-4.html ghost/week-5.html ghost/week-6.html how-fast-should-i-run.html index.html labs/hyrox/index.html labs/index.html labs/raise-the-ceiling/index.html labs/speed-that-endures/index.html labs/the-last-10k/index.html labs/track/index.html ledger.html library/easy-days/index.html library/first-half-marathon-goal/index.html library/from-lifting-to-running/index.html library/half-marathon-week/index.html library/physique-volume/index.html library/the-two-paces/index.html library/when-a-week-goes-wrong/index.html library/why-phases/index.html library.html long-run-pace.html long-run.html mechanics-map.html miami-running-training.html mobility.html next.html notes.html pacing.html pain-map.html plan-speed-emergence.html plan-spring-2026.html plan.html plans/index.html plans/marathon-durability/index.html plans/race-pace-durability/index.html plans/race-pace-durability/support/index.html plans/raise-the-ceiling/index.html practice.html principles.html race-prep.html race-strategy.html recovery.html return.html running-form-errors.html running-terms.html search.html sessions.html shoes.html sleep.html speed.html split-calculator.html start.html strength-activation.html strength-fixes.html strength-routine.html strength.html the-field.html the-method.html the-work.html threshold-training.html threshold.html thursday.html training-arc.html training-interruptions.html training-map.html training-principles.html training-week.html troubleshooting.html`.split(' ');
// Explicit exceptions. A new dedicated card must be reviewed, never silently replaced.
const PRESERVE = {
  'es/plans/race-pace-durability/index.html': '/og/race-pace-durability.png',
  'labs/hyrox/index.html': '/og/hyrox-v1.png',
  'labs/index.html': '/og/labs.png',
  'labs/raise-the-ceiling/index.html': '/og/raise-the-ceiling-study.png',
  'labs/speed-that-endures/index.html': '/og/speed-that-endures-20260923.jpg',
  'long-run.html': '/og/long-run.jpg',
  'notes.html': '/og/note-001.jpg?v=rd28',
  'plans/race-pace-durability/index.html': '/og/race-pace-durability.png',
  'plans/race-pace-durability/support/index.html': '/og/race-pace-durability.png',
  'plans/raise-the-ceiling/index.html': '/og/raise-the-ceiling-plan.png',
  'threshold.html': '/og/threshold.jpg'
};
const ALTS = {
  '/og/race-pace-durability.png': 'FORM Race Pace Durability: a dark-green half-marathon plan card with the progression from broken work to continuous and late running.',
  '/og/hyrox-v1.png': 'FORM HYROX in lime on a dark background, with Train with purpose. Race with a plan.',
  '/og/labs.png': 'FORM living studies: The work. The response. The next decision. on a dark-green background.',
  '/og/raise-the-ceiling-study.png': 'FORM Raise the Ceiling study card: How much more speed is available?',
  '/og/speed-that-endures-20260923.jpg': 'Speed That Endures, a FORM Labs living study: a runner on the track, with the continuous race-pace ladder 5, 6, 8, 12 and 13.1 miles.',
  '/og/long-run.jpg': 'Three runners photographed from behind on a palm-lined Miami street.',
  '/og/note-001.jpg': 'A runner in profile outdoors, with a blue sky and concrete railing behind her.',
  '/og/raise-the-ceiling-plan.png': 'FORM Raise the Ceiling plan card showing Tuesday, Thursday and Saturday training.',
  '/og/threshold.jpg': 'Two runners side by side in profile outdoors in Miami.'
};
// Four articles inherited an unrelated easy-days description. Correct previews only.
const DESCRIPTIONS = {
  'library/first-half-marathon-goal/index.html': 'Set a first half-marathon goal from recent running, not a guess. Learn how to choose a starting target and adjust it as evidence builds.',
  'library/the-two-paces/index.html': 'Understand threshold pace and an easy-effort ceiling: two guides for keeping demanding runs purposeful and easy days controlled.',
  'library/when-a-week-goes-wrong/index.html': 'Missed a run? Learn how to return to your training week without cramming missed sessions together or turning every day into catch-up work.',
  'library/why-phases/index.html': 'Why physique training uses phases: focus the work, maintain what you have built, and move the emphasis in a deliberate order.'
};
const KEYS = ['og:type','og:title','og:description','og:url','og:site_name','og:locale','og:image','og:image:url','og:image:secure_url','og:image:type','og:image:width','og:image:height','og:image:alt','twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:src','twitter:image:alt'];
const BEGIN = '<!-- FORM share metadata: pass 1 -->';
const END = '<!-- /FORM share metadata -->';
function sha(text) { return crypto.createHash('sha256').update(text).digest('hex'); }
function decode(s) { return String(s).replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_,n) => String.fromCodePoint(n[0].toLowerCase()==='x' ? parseInt(n.slice(1),16) : +n)).replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'); }
function escape(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function attrs(tag) { const out = {}; for (const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) out[m[1].toLowerCase()] = decode(m[2] ?? m[3]); return out; }
function head(html) { return html.slice(0, html.toLowerCase().indexOf('</head>')); }
function meta(html, key) { for (const m of head(html).matchAll(/<meta\b[^>]*>/gi)) { const a = attrs(m[0]); if ((a.property || a.name) === key) return a.content || ''; } return ''; }
function canonical(html, file) { for (const m of head(html).matchAll(/<link\b[^>]*>/gi)) { const a = attrs(m[0]); if (a.rel === 'canonical') return new URL(a.href, ORIGIN).href; } return ORIGIN + (file === 'index.html' ? '/' : '/' + file.replace(/index\.html$/, '').replace(/\.html$/, '')); }
function imageInfo(root, url) {
  const u = new URL(url, ORIGIN);
  if (u.origin !== ORIGIN) throw new Error(`Non-local card needs manual review: ${url}`);
  const b = fs.readFileSync(path.join(root, decodeURIComponent(u.pathname)));
  if (b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return {type:'image/png',width:b.readUInt32BE(16),height:b.readUInt32BE(20),sha256:sha(b),bytes:b.length};
  if (b.readUInt16BE(0) === 0xffd8) {
    for (let i=2;i<b.length-8;) { if (b[i]!==255) throw new Error(`Invalid JPEG: ${url}`); const m=b[i+1]; if ([192,193,194].includes(m)) return {type:'image/jpeg',width:b.readUInt16BE(i+7),height:b.readUInt16BE(i+5),sha256:sha(b),bytes:b.length}; if ([218,217].includes(m)) break; i+=b.readUInt16BE(i+2)+2; }
  }
  throw new Error(`Unsupported or invalid card: ${url}`);
}
function transform(html, file, root) {
  if (!PAGES.includes(file)) return html;
  if (/noindex/i.test(meta(html,'robots'))) throw new Error(`Refusing noindex page: ${file}`);
  const old = meta(html,'og:image');
  const target = ORIGIN + (PRESERVE[file] || DEFAULT_IMAGE);
  const permitted = ['', ORIGIN+'/og/default.jpg', ORIGIN+'/og/default.jpg?v=rd26', target];
  if (file==='index.html') permitted.push(ORIGIN+'/og/homepage-run-development-20260916.jpg');
  if (file==='plans/index.html') permitted.push(ORIGIN+'/og/plans.png');
  if (!permitted.includes(old)) throw new Error(`Unexpected dedicated image on ${file}; inspect before replacing: ${old}`);
  const title = meta(html,'og:title') || decode(head(html).match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const description = DESCRIPTIONS[file] || meta(html,'og:description') || meta(html,'description');
  if (!title || !description) throw new Error(`Missing page-specific copy: ${file}`);
  const info = imageInfo(root,target);
  const alt = PRESERVE[file] ? meta(html,'og:image:alt') || ALTS[new URL(target).pathname] : DEFAULT_ALT;
  if (!alt) throw new Error(`Missing descriptive alt: ${file}`);
  const values = {
    'og:type':meta(html,'og:type') || 'article', 'og:title':title, 'og:description':description,
    'og:url':canonical(html,file), 'og:site_name':meta(html,'og:site_name') || 'Speed & Form',
    'og:locale':meta(html,'og:locale') || (file.startsWith('es/') ? 'es_ES' : 'en_US'),
    'og:image':target,'og:image:secure_url':target,'og:image:type':info.type,'og:image:width':info.width,'og:image:height':info.height,'og:image:alt':alt,
    'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':target,'twitter:image:alt':alt
  };
  const block = BEGIN+'\n'+Object.entries(values).map(([k,v])=>`<meta ${k.startsWith('og:')?'property':'name'}="${k}" content="${escape(v)}">`).join('\n')+'\n'+END+'\n';
  // Never run replacement expressions through script bodies or CSS.
  let h = head(html).replace(new RegExp(BEGIN+'[\\s\\S]*?'+END+'\\s*','g'),'');
  h = h.split(/(<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>)/gi).map(piece => {
    if (/^<(?:script|style)\b/i.test(piece)) {
      // The homepage already has a WebPage image. Update that reference only.
      if (file==='index.html' && /^<script[^>]*application\/ld\+json/i.test(piece)) return piece.replaceAll(ORIGIN+'/og/homepage-run-development-20260916.jpg',target);
      return piece;
    }
    return piece.replace(/<meta\b[^>]*>[ \t]*\r?\n?/gi, tag => { const a=attrs(tag);return KEYS.includes(a.property||a.name) ? '' : tag; });
  }).join('');
  // Keep the social block before any render resources, without moving those resources.
  const point = h.search(/<(?:style|script)\b/i);
  h = point<0 ? h+block : h.slice(0,point)+block+h.slice(point);
  return h+html.slice(html.toLowerCase().indexOf('</head>'));
}
function allHtml(root, dir='') { return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e => { const f=path.posix.join(dir,e.name); if (e.name.startsWith('.') || e.name==='node_modules') return []; return e.isDirectory()?allHtml(root,f):f.endsWith('.html')?[f]:[]; }).sort(); }
function build(root=path.resolve(__dirname,'..')) {
  const receiptPath=path.join(root,'docs/audits/SHARE-METADATA-MANIFEST-20260916.json');
  const prior=fs.existsSync(receiptPath)?JSON.parse(fs.readFileSync(receiptPath,'utf8')):null;
  const result=[];
  for (const file of PAGES) {
    const full=path.join(root,file), before=fs.readFileSync(full,'utf8'), after=transform(before,file,root);
    if (after!==before) fs.writeFileSync(full,after);
    const old=prior?.pages?.find(p=>p.file===file);
    result.push({file, action:PRESERVE[file]?'preserve':'replace', reason:PRESERVE[file]?'Dedicated subject-specific image':file==='plans/index.html'?'Old card says free to read/free to run; paid products now exist':file==='index.html'?'Owner supplied a replacement homepage image':'Approved default for public page', previousImage:old?.previousImage??meta(before,'og:image'),image:meta(after,'og:image'),title:meta(after,'og:title'),description:meta(after,'og:description'),bodySha256:sha(before.slice(before.toLowerCase().indexOf('</head>'))),imageSha256:imageInfo(root,meta(after,'og:image')).sha256});
  }
  const excluded=allHtml(root).filter(f=>!PAGES.includes(f)).map(file=>({file,reason:'Outside this public-page allowlist: retain exactly; private, app-specific, delivery, preview, legal or unreviewed route',sha256:sha(fs.readFileSync(path.join(root,file)))}));
  const receipt={version:'20260916-pass1',defaultImage:ORIGIN+DEFAULT_IMAGE,counts:{pages:result.length,replace:result.filter(p=>p.action==='replace').length,preserve:result.filter(p=>p.action==='preserve').length,excluded:excluded.length},pages:result,excluded};
  fs.mkdirSync(path.dirname(receiptPath),{recursive:true});fs.writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt.counts));return receipt;
}
module.exports={ORIGIN,DEFAULT_IMAGE,DEFAULT_ALT,PAGES,PRESERVE,DESCRIPTIONS,KEYS,attrs,head,meta,canonical,imageInfo,transform,allHtml,sha,build};
if(require.main===module) build();
