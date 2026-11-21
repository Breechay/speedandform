'use strict';
// Study pages must not carry a baked copy of a plan. This blanks every [data-cs-plan] container, [data-cs-race] and
// [data-cs-version] in the committed HTML; connected-study.js fills them ONLY from a live response verified as "published".
// Idempotent. Usage: node scripts/studies/neutralize-baked-study-plans.cjs [--check] [files...]
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const PLACEHOLDER='<p class="cs-state" role="status" data-plan-state="checking">Checking the publication status…</p><noscript><p class="cs-state" role="status" data-plan-state="unverified">The plan is shown only after its publication status is verified in the browser. Turn on JavaScript to see it.</p></noscript>';
function neutralize(html){
  let out='',i=0;
  const open=/<div\b[^>]*\bdata-cs-plan="[^"]*"[^>]*>/g;
  for(let m;(m=open.exec(html));){
    const start=m.index+m[0].length;let depth=1;const tags=/<\/?div\b[^>]*>/g;tags.lastIndex=start;let end=-1;
    for(let t;(t=tags.exec(html));){depth+=t[0].startsWith('</')?-1:1;if(!depth){end=t.index;break;}}
    if(end<0)throw new Error('Unbalanced data-cs-plan container');
    out+=html.slice(i,start)+PLACEHOLDER;i=end;open.lastIndex=end;
  }
  out+=html.slice(i);
  out=out.replace(/(<[a-z0-9]+\b[^>]*\bdata-cs-race="[^"]*"[^>]*>)[^<]*(<\/)/g,'$1—$2').replace(/(<[a-z0-9]+\b[^>]*\bdata-cs-version="[^"]*"[^>]*>)[^<]*(<\/)/g,'$1$2');
  return out;
}
if(require.main===module){
  const check=process.argv.includes('--check');
  let files=process.argv.slice(2).filter(a=>!a.startsWith('--'));
  if(!files.length)files=cp.execFileSync('git',['ls-files','-z','--','*.html'],{cwd:ROOT}).toString().split('\0').filter(Boolean).filter(f=>fs.readFileSync(path.join(ROOT,f),'utf8').includes('data-cs-plan'));
  let dirty=0;
  for(const f of files){const p=path.join(ROOT,f),a=fs.readFileSync(p,'utf8'),b=neutralize(a);if(a!==b){dirty++;if(!check)fs.writeFileSync(p,b);console.log((check?'WOULD CHANGE ':'neutralized ')+f);}}
  if(check&&dirty){console.error('Baked study plan content found');process.exitCode=1;}else console.log(JSON.stringify({files:files.length,changed:dirty}));
}
module.exports={neutralize,PLACEHOLDER};
