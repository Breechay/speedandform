'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');process.chdir(root);
const file='miami-running-training.html',before=fs.readFileSync(file,'utf8');
const blob=crypto.createHash('sha1').update('blob '+Buffer.byteLength(before)+'\0').update(before).digest('hex');
assert.equal(blob,'bcaa85ef0bb19238f147e50385087a251f5b4b78','Stop if the reviewed Miami source has changed');
const protectedPaths=['index.html','labs/hyrox/index.html','labs/speed-that-endures/index.html','js/community-schedule.js','scripts/share-metadata.cjs'];
const protectedBefore=new Map(protectedPaths.map(p=>[p,fs.readFileSync(p)]));
let html=before;
function once(old,replacement){assert.equal(html.split(old).length-1,1,'Expected one occurrence: '+old);html=html.replace(old,replacement);}
once('    }());','    })();');
html=html.replaceAll('Running Coach Miami | Community Speedwork + Personal Coaching — FORM','Running Coach Miami | Community Speedwork + Personal Coaching | FORM');
once('The live Thursday page owns the current start time and this week\'s exact session, so the details stay current.',"This week's session is on the Thursday page.");
once('; email updates will also be offered when the signup is live.','.');
once(' Email run announcements will also be available here when the signup is live.','');
once(' Email run alerts are being prepared and will appear here when signup is live.','');
let notes=0;
html=html.replace(/(<div\s+class="route-note"[^>]*>)([\s\S]*?)(<\/div>)/g,(all,open,body,close)=>{if(!body.includes('form.practice'))return all;notes++;return open+'<span>'+body.trim()+'</span>'+close;});
assert.equal(notes,1,'One Instagram note is placed in the second grid column');
let emailLinks=0;html=html.replace(/\s*<a\b[^>]*data-email-updates[^>]*>[\s\S]*?<\/a>/g,()=>{emailLinks++;return '';});assert.equal(emailLinks,1);
let emailScripts=0;html=html.replace(/\s*<script\b([^>]*)>([\s\S]*?)<\/script>/g,(all,attrs,body)=>{if(body.includes("document.querySelector('[data-email-updates]')")){emailScripts++;return '';}return all;});assert.equal(emailScripts,1);
let schemas=0;
html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(all,body)=>{
 const data=JSON.parse(body);if(!data['@graph'])return all;
 const org=data['@graph'].find(x=>x['@id']==='https://speedandform.com/#organization');
 const service=data['@graph'].find(x=>x['@type']==='Service');assert.ok(org&&service);
 org['@type']=['Organization','SportsOrganization'];org.name='Speed & Form';org.alternateName='FORM';
 service.offers={'@type':'Offer',name:'Run Development · 8 weeks',price:'1200',priceCurrency:'USD',url:'https://speedandform.com/#begin'};
 schemas++;return '<script type="application/ld+json">\n'+JSON.stringify(data,null,2)+'\n</script>';
});assert.equal(schemas,1);
const css=`\n    /* September 23: readable community information; retain the field-sheet design. */
    .info-row>span,.instrument>span,.intent>span,details>p,.route-note,.coaching-copy,.complete>p,.path span span,.card-copy,.body-copy,.session-card p{font-size:15.5px;line-height:1.55}
    .block-head .focus{font-size:13px}
    .price>span,footer span,.action-row>span,.coordinate>span{font-size:11px;letter-spacing:.08em}
    @media(min-width:900px){
      :root{--max:860px}
      .info-row>span,.instrument>span,.intent>span,details>p,.route-note,.coaching-copy,.complete>p,.path span span,.session-card p{font-size:16px}
    }
`;
once('</style>',css+'</style>');
const eventScript=`\n  <script>
    (() => {
      const t = window.FORM_COMMUNITY_SCHEDULE && window.FORM_COMMUNITY_SCHEDULE.thursday;
      if (!t) return;
      // Describe the recurring schedule, not an invented dated occurrence.
      const data = {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: 'FORM ' + t.weekday + ' community speedwork',
        description: 'Short, faster running with full recovery. All levels, run your own effort.',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventSchedule: { '@type': 'Schedule', byDay: 'https://schema.org/' + t.weekday, startTime: t.time24, repeatFrequency: 'P1W', scheduleTimezone: 'America/New_York' },
        location: { '@type': 'Place', name: t.locationName, address: { '@type': 'PostalAddress', addressLocality: t.locationCity, addressRegion: 'FL', addressCountry: 'US' } },
        organizer: { '@id': 'https://speedandform.com/#organization' },
        url: 'https://speedandform.com/thursday'
      };
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.textContent = JSON.stringify(data);
      document.head.appendChild(el);
    })();
  </script>
`;
once('</body>',eventScript+'</body>');
const share=require('./share-metadata.cjs');
const bodyHash=share.sha(html.slice(html.toLowerCase().indexOf('</head>')));
html=share.transform(html,file,root);
assert.equal(share.sha(html.slice(html.toLowerCase().indexOf('</head>'))),bodyHash,'Share normalization does not change the body');
assert.equal(share.transform(html,file,root),html,'Share normalization is idempotent');
assert.equal(share.meta(html,'og:image'),'https://speedandform.com/og/form-share-20260916.jpg','Retain the existing working image until the separate card upload');
fs.writeFileSync(file,html);
const receipt={version:'20260923-miami-functional-v2',baseRevision:'84eed9121fd135650ebc149aadedd421cda16a66',scope:'Functional repair and legibility only. Personal copy rewrite held. Existing share images retained.',pending:'The supplied Miami card is not included in this functional release. The absent newer HYROX card does not block the functional repair. Speed That Endures remains unchanged.',pages:[{file,afterSha256:share.sha(html),bodySha256:bodyHash,preview:{title:share.meta(html,'og:title'),description:share.meta(html,'og:description')},allowShareTransformRewrite:true}]};
fs.writeFileSync('docs/audits/MIAMI-FUNCTIONAL-V2-RECEIPT-20260923.json',JSON.stringify(receipt,null,2)+'\n');
fs.writeFileSync('scripts/miami-functional-v2-state.cjs',`'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {sha}=require('./share-metadata.cjs');
const receipt=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/audits/MIAMI-FUNCTIONAL-V2-RECEIPT-20260923.json'),'utf8'));
assert.equal(receipt.version,'20260923-miami-functional-v2');
const updates=new Map(receipt.pages.map(row=>[row.file,{...row}]));
function verify(file,html){const row=updates.get(file);if(!row)return false;assert.equal(sha(html),row.afterSha256,file+' exact reviewed Miami functional source');return true;}
module.exports={receipt,updates,verify};
`);
let state=fs.readFileSync('scripts/guide-state.cjs','utf8');
assert.ok(state.includes('function verify(file,html){'));
assert.ok(state.includes('...homepageV2.updates]);'));
state=state.replace("'use strict';","'use strict';\nconst miamiFunctionalV2=require('./miami-functional-v2-state.cjs');").replace('function verify(file,html){','function verify(file,html){if(miamiFunctionalV2.verify(file,html))return true;').replace('...homepageV2.updates]);','...homepageV2.updates,...miamiFunctionalV2.updates]);');
fs.writeFileSync('scripts/guide-state.cjs',state);
fs.appendFileSync('docs/roadmap/FORM-ROADMAP.md','\n\n## September 23: Miami community-page functional repair\n\nBounded source repair: the shared Thursday schedule renders again; the Instagram note no longer overlaps; unbuilt email promises, the hidden email CTA and its readiness request are removed; body text is larger and the desktop sheet is wider; the existing coaching price and organization identity are represented consistently. Recurring event metadata reads the same schedule object.\n\nSource acceptance is recorded in `docs/audits/MIAMI-FUNCTIONAL-V2-RECEIPT-20260923.json` and `tests/miami-community-schedule.cjs`. The release is not a new copy pass. Existing Miami/HYROX share images are deliberately retained; the supplied newer Miami card and missing newer HYROX card remain separate asset work. Speed That Endures and the homepage are unchanged. A successful branch check is not proof of a production deployment; verify the production commit before calling this live.\n');
for(const [p,bytes] of protectedBefore)assert.ok(fs.readFileSync(p).equals(bytes),'Unrelated source unchanged: '+p);
require('./guide-state.cjs').verify(file,html);
console.log(JSON.stringify({file,sha256:share.sha(html),bodySha256:bodyHash,protectedPaths},null,2));
