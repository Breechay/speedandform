'use strict';
// Minimal, conservative model of Netlify _redirects matching, enough to prove a path is force-404'd.
// Netlify evaluates _redirects top to bottom, first match wins; a trailing "!" forces the rule even when a file exists.
// This is a MODEL: the authoritative check is scripts/verify-withdrawn-routes.cjs against a real deploy.
const fs=require('fs');
function parse(text){
  const rules=[];
  for(const raw of text.split('\n')){
    const line=raw.trim(); if(!line||line.startsWith('#')) continue;
    const [from,to,status]=line.split(/\s+/);
    if(!from||!to) continue;
    const m=/^(\d+)(!)?$/.exec(status||'301');
    rules.push({from,to,status:m?+m[1]:301,force:!!(m&&m[2])});
  }
  return rules;
}
function normalize(p){
  let x=p.split('?')[0].split('#')[0].replace(/\/{2,}/g,'/');
  try{x=decodeURIComponent(x);}catch(e){}
  return x.toLowerCase();
}
function stripSlash(x){return x.length>1&&x.endsWith('/')?x.slice(0,-1):x;}
function matches(from,path){
  const f=from.toLowerCase();
  if(f.endsWith('/*')){const b=f.slice(0,-2);return path===b||path===b+'/'||path.startsWith(b+'/');}
  return stripSlash(f)===stripSlash(path);
}
function resolve(rules,rawPath){
  const path=normalize(rawPath);
  for(const r of rules) if(matches(r.from,path)) return r;
  return null;
}
function load(file){return parse(fs.readFileSync(file,'utf8'));}
module.exports={parse,load,resolve,normalize};
