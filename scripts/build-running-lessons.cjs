'use strict';
const fs=require('node:fs'),path=require('node:path');
const lessons=require('./running-lessons-content.cjs');
const {movement}=require('./movement-lessons-content.cjs');
const strength=require('./training-guide-content.cjs').find(g=>g.route==='/strength');
const pages=[...lessons,...movement,strength];
const {render}=require('./build-guides.cjs');
const root=path.resolve(__dirname,'..');
function build(){
 for(const g of pages){const file=path.join(root,g.file);fs.writeFileSync(file,render(g,fs.readFileSync(file,'utf8')));}
 // The authored six-week program keeps its own structure. Only family wayfinding
 // is projected here, never a new week or exercise prescription.
 const file=path.join(root,'ghost/index.html');let html=fs.readFileSync(file,'utf8');
 html=html.replace(/\s*<!-- LIBRARY-FAMILY -->[\s\S]*?<!-- \/LIBRARY-FAMILY -->\s*/g,'\n\n  ');
 html=html.replace(/<\/main>/,`<!-- LIBRARY-FAMILY --><div class="standalone-library-family">${require('./library-family.cjs').render('movement','/ghost')}</div><!-- /LIBRARY-FAMILY --></main>`);
 if(!html.includes('LIBRARY-FAMILY'))html=html.replace('  <div class="footer-links">',`<!-- LIBRARY-FAMILY -->${require('./library-family.cjs').render('movement','/ghost')}<!-- /LIBRARY-FAMILY -->\n  <div class="footer-links">`);
 if(!html.includes('/css/library-movement.css'))html=html.replace('</head>','<link rel="stylesheet" href="/css/library-movement.css?v=20261006-lessons">\n</head>');
 fs.writeFileSync(file,html);
 console.log(`Built ${pages.length} lessons and guides; connected all eleven movement pages.`);
}
if(require.main===module)build();
module.exports={build,lessons,pages};
