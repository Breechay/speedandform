/* Public house identity only. No application UI, private records or product renaming. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const mark='<a class="sf-brand" href="/" aria-label="Speed and Form home"></a>';
const urls=[...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').matchAll(/<loc>https:\/\/speedandform\.com([^<]*)<\/loc>/g)].map(m=>m[1]);
const files=new Set(['index.html','privacy.html','terms.html','search.html','404.html']);
for(const url of urls){const route=url.replace(/^\/|\/$/g,'');for(const f of [route+'.html',route+'/index.html'])if(fs.existsSync(path.join(root,f))){files.add(f);break;}}
let changed=0;
for(const file of files){
  if(/^(?:coach|auth|athlete|record|private|forge-app|form-app|studio)(?:\/|\.html)/.test(file))continue;
  const full=path.join(root,file);if(!fs.existsSync(full))continue;
  let html=fs.readFileSync(full,'utf8'),before=html;
  // Preserve scripts byte-for-byte, including HTML template strings.
  html=html.split(/(<script\b[^>]*>[\s\S]*?<\/script>)/gi).map(piece=>/^<script\b/i.test(piece)?piece:piece
    .replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi,(all,attrs,body)=>{
      if(!/href=["'](?:\/|#top|index\.html)["']/.test(attrs))return all;
      if(/sf-brand/.test(attrs))return '<a'+attrs+'></a>';
      if(!/(?:brand|wordmark|logo|mark)/i.test(attrs)&&!/^\s*FORM\s*(?:<(?:span|i)[^>]*>\.\s*<\/(?:span|i)>)?\s*$/.test(body))return all;
      const cls=(attrs.match(/class="([^"]*)"/)||[])[1]||'';
      return mark.replace('class="sf-brand"','class="'+cls+' sf-brand"');
    })
    .replace(/<(?:div|span) class="footer-(?:brand|wordmark)">FORM(?:<span>\.<\/span>)?<\/(?:div|span)>/g,mark)
    .replace(/<p>Speed &amp; Form<br>Running with Brice\. Miami \+ Remote\.<\/p>/g,mark)
  ).join('');
  html=html.replace(/\/css\/sf-brand\.css\?v=[^"']+/g,'/css/sf-brand.css?v=20261001');
  if(html.includes('sf-brand')&&!html.includes('/css/sf-brand.css'))html=html.replace('</head>','<link rel="stylesheet" href="/css/sf-brand.css?v=20261001">\n</head>');
  if(html!==before){fs.writeFileSync(full,html);changed++;}
}
console.log('SF house identity: '+changed+' public pages updated.');
