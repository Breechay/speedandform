/* Speed & Form brand kit. Text assets only: vectors, tokens, templates, README.
   Everything is generated from the same sources the site uses, so the kit cannot drift from the house.
   Raster previews, the PDF and the zip come from scripts/render-brand-kit.cjs, which needs a browser and is not part of the Netlify build. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),kit=path.join(root,'assets/brand/kit');
const {renderBend,renderBendAsset,renderBendPlaced}=require('./sf-bend.cjs');
const COLORS={black:'#0d0f0e',bone:'#e8e3d9',ink:'#161916',quietOnBlack:'#b8bbb2',quietOnBone:'#5e625b'};
const seal=fs.readFileSync(path.join(root,'assets/brand/sf-seal.svg'),'utf8');
const sealPath=(seal.match(/<path[^>]*\sd="([^"]+)"/)||[])[1];
if(!sealPath)throw Error('SF emblem path not found');
const emblem=(fill,extra='')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 798 290" role="img" aria-label="Speed and Form"${extra}><path fill="${fill}" fill-rule="evenodd" d="${sealPath}"/></svg>`;
const write=(rel,body)=>{const f=path.join(kit,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,body);};

write('emblem/sf-emblem-bone.svg',emblem(COLORS.bone)+'\n');
write('emblem/sf-emblem-ink.svg',emblem(COLORS.ink)+'\n');
write('bend/the-bend-bone.svg',renderBendAsset(COLORS.bone));
write('bend/the-bend-ink.svg',renderBendAsset(COLORS.ink));

write('tokens/tokens.css',`/* Speed & Form house tokens. */
:root{
  --sf-black:${COLORS.black};
  --sf-bone:${COLORS.bone};
  --sf-ink:${COLORS.ink};
  --sf-quiet-on-black:${COLORS.quietOnBlack};
  --sf-quiet-on-bone:${COLORS.quietOnBone};
  --sf-rule:rgba(232,227,217,.18);
  --sf-sans:"Inter Tight",Arial,sans-serif;
  --sf-mono:"JetBrains Mono",ui-monospace,monospace;
  --sf-display-weight:450;
  --sf-display-tracking:-.05em;
  --sf-lit:linear-gradient(100deg,#000 28%,rgba(0,0,0,.6) 96%); /* mask for a headline on black */
  --sf-bend-line:2px;
  --sf-bend-lanes:.3;
  --sf-bend-marks:.8;
}
`);
write('tokens/tokens.json',JSON.stringify({color:COLORS,type:{sans:'Inter Tight',mono:'JetBrains Mono',displayWeight:450,displayTracking:'-0.05em'},bend:{radius_m:36.5,lane_m:1.22,lanes:8,line_px:2,laneStrength:.3,markStrength:.8},light:{headlineMask:'linear-gradient(100deg,#000 28%,rgba(0,0,0,.6) 96%)'}},null,2)+'\n');

const fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;450;500&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">';
const base=`*{box-sizing:border-box}html,body{margin:0;background:#1b1d1c}body{font-family:"Inter Tight",Arial,sans-serif;-webkit-font-smoothing:antialiased}
.board{position:relative;overflow:hidden;background:${COLORS.black};color:${COLORS.bone};margin:0 auto}
.board>svg.bend{position:absolute;left:0;top:0}
.mark{position:absolute;display:block}.mark svg{display:block;width:100%;height:auto}
.label,.meta{font-family:"JetBrains Mono",ui-monospace,monospace;font-weight:400;letter-spacing:.08em;text-transform:uppercase;color:${COLORS.quietOnBlack};margin:0}
h1{margin:0;font-weight:450;letter-spacing:-.05em;line-height:1.04;-webkit-mask-image:linear-gradient(100deg,#000 28%,rgba(0,0,0,.6) 96%);mask-image:linear-gradient(100deg,#000 28%,rgba(0,0,0,.6) 96%);padding-bottom:.2em}`;
const page=(title,css,body)=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${fonts}
<style>
${base}
${css}
</style>
</head>
<body>
<!-- Speed & Form template. Replace the text in [brackets]. Keep the bend, the emblem and the spacing as they are.
     One bend per piece. Never mirror it: runners turn left. Rules: https://speedandform.com/brand/ -->
${body}
</body>
</html>
`;
const mark=emblem('currentColor');
const bend=o=>renderBendPlaced(o).replace('<svg ','<svg class="bend" ');

/* Story, 1080 x 1920. Type stays out of the top 14% and the bottom 20%. */
write('templates/story-9x16.html',page('Speed & Form story, 9:16',
`.board{width:1080px;height:1920px}.mark{left:84px;top:290px;width:150px}.copy{position:absolute;left:84px;top:470px;width:760px}.label{font-size:24px}h1{font-size:108px;margin-top:26px}.meta{font-size:24px;margin-top:34px;text-transform:none;letter-spacing:.02em}`,
`<div class="board">${bend({width:1080,height:1920,x:84,y:1480,lane:40})}<span class="mark">${mark}</span><div class="copy"><p class="label">[Label]</p><h1>[One sentence.]<br>[Maybe two.]</h1><p class="meta">speedandform.com</p></div></div>`));

/* Invite or post, 1080 x 1350. */
write('templates/invite-4x5.html',page('Speed & Form invite, 4:5',
`.board{width:1080px;height:1350px}.mark{left:84px;top:84px;width:150px}.copy{position:absolute;left:84px;top:300px;width:800px}h1{font-size:120px}.meta{font-size:28px;margin-top:22px;color:${COLORS.bone}}.meta+.meta{margin-top:10px;color:${COLORS.quietOnBlack}}`,
`<div class="board">${bend({width:1080,height:1350,x:84,y:1250,lane:40})}<span class="mark">${mark}</span><div class="copy"><h1>[What it is.]</h1><p class="meta">[Day · Time]</p><p class="meta">[Place]</p></div></div>`));

/* Document cover, US Letter. Print with backgrounds on. */
write('templates/pdf-cover-letter.html',page('Speed & Form document cover',
`@page{size:Letter;margin:0}html,body{background:${COLORS.black}}.board{width:816px;height:1056px}.mark{left:64px;top:64px;width:110px}.copy{position:absolute;left:64px;top:340px;width:600px}.label{font-size:12px}h1{font-size:64px;margin-top:18px}.meta{font-size:12px;margin-top:20px}`,
`<div class="board">${bend({width:816,height:1056,x:64,y:960,lane:30})}<span class="mark">${mark}</span><div class="copy"><p class="label">Speed &amp; Form</p><h1>[Document title.]</h1><p class="meta">[Date · Version]</p></div></div>`));

/* Email header art, 600 x 200. The lanes begin at the start line so nothing runs under the emblem.
   Export as an image; email clients do not draw inline SVG reliably. */
write('templates/email-header.html',page('Speed & Form email header',
`.board{width:600px;height:200px}.mark{left:32px;top:82px;width:100px}`,
`<div class="board">${bend({width:600,height:200,x:220,y:178,lane:14,line:1.5,straight:false})}<span class="mark">${mark}</span></div>`));
write('templates/email-header-snippet.html',`<!-- Paste at the top of an email. Host email-header.png yourself or use the Speed & Form address below. -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.black}"><tr><td align="center">
<a href="https://speedandform.com/"><img src="https://speedandform.com/assets/brand/kit/templates/email-header.png" width="600" height="200" alt="Speed &amp; Form" style="display:block;border:0;width:100%;max-width:600px;height:auto"></a>
</td></tr></table>
`);

write('README.txt',`SPEED & FORM · BRAND KIT
https://speedandform.com/brand/

WHAT IS HERE
emblem/     The SF emblem. Bone for dark grounds, ink for paper. SVG and PNG.
bend/       The bend. The first bend of a 400 m track, to scale. SVG and PNG.
avatar/     The emblem on cloth. Square, for profile pictures.
templates/  Story 9:16, invite 4:5, document cover, email header. Open the HTML, replace the text in [brackets].
tokens/     Colors and type for developers.

THE SHORT VERSION
1. The emblem stands alone. No name beside it. Bone on dark, ink on paper.
2. One bend per piece. Straight in from the left, rising on the right. Never mirrored.
3. Black ${COLORS.black}. Bone ${COLORS.bone}. Ink ${COLORS.ink}.
4. Inter Tight says what it means. JetBrains Mono says what happened: prices, dates, distances.
5. Lit, not printed. On black, nothing is brighter than the photograph.
6. Real athletes, real sessions, real Miami. No stock. No generated people. Ask before using a photograph.
7. Short sentences. First person when it is Brice. No hype.

Made something? Send it before it goes out: https://speedandform.com/contact
`);
/* The brand page carries the same generated bend as the homepage. Never hand-edit it. */
const pageFile=path.join(root,'brand/index.html'),html=fs.readFileSync(pageFile,'utf8'),slot=/<!-- sf-bend -->[\s\S]*?<!-- \/sf-bend -->/;
if(!slot.test(html))throw Error('Brand page bend slot is missing');
fs.writeFileSync(pageFile,html.replace(slot,'<!-- sf-bend -->'+renderBend()+'<!-- /sf-bend -->'));
console.log('Brand kit: vectors, tokens, templates and README written to assets/brand/kit/.');
