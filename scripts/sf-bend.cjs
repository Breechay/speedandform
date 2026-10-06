/* The bend. Speed & Form house signature. See docs/BRAND.md.
   The first bend of a standard 400 m track, drawn to true proportion.
   Every number below is a real track measurement. Do not redraw this by hand. */
const fs=require('node:fs'),path=require('node:path');
const TRACK={radius_m:36.5,lane_m:1.22,lanes:8,measure_offset_m:.2};
const UNIT=22; // drawing units per lane. CSS scales the drawing; the proportion never changes.
const r=n=>+(TRACK.radius_m/TRACK.lane_m*UNIT+n*UNIT).toFixed(1); // line n: 0 is the inside of lane 1
const R_IN=r(0),R_OUT=r(TRACK.lanes),BOX=840;
// 400 m staggered start: how far ahead lane n starts so every lane runs the same distance.
const stagger_m=n=>2*Math.PI*((n-1)*TRACK.lane_m-.1);
const staggerAngle=n=>stagger_m(n)/(TRACK.radius_m+(n-1)*TRACK.lane_m+TRACK.measure_offset_m);
function lanes(){return Array.from({length:TRACK.lanes+1},(_,n)=>`<path d="M-4000 ${r(n)}H0A${r(n)} ${r(n)} 0 0 0 ${r(n)} 0"/>`).join('');}
function marks(){const out=[`<line x1="0" y1="${R_IN}" x2="0" y2="${R_OUT}"/>`];
  for(let n=2;n<=TRACK.lanes;n++){const a=staggerAngle(n),s=Math.sin(a),c=Math.cos(a),a1=r(n-1),a2=r(n);
    out.push(`<line x1="${(a1*s).toFixed(1)}" y1="${(a1*c).toFixed(1)}" x2="${(a2*s).toFixed(1)}" y2="${(a2*c).toFixed(1)}"/>`);}
  return out.join('');}
/* Inline form for a page. The centre of the bend is 0,0. CSS owns size, position, weight and strength. */
function renderBend(){return `<div class="sf-bend" aria-hidden="true"><svg viewBox="${-BOX} ${-BOX} ${BOX*2} ${BOX*2}" focusable="false"><g class="sf-bend-lanes">${lanes()}</g><g class="sf-bend-marks">${marks()}</g></svg></div>`;}
/* Standalone form for story frames, covers and print. Bone on transparent. */
function renderBendAsset(){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-700 -8 1548 856" fill="none" stroke="#e8e3d9" stroke-width="1.5"><title>The bend. Speed &amp; Form.</title><g opacity=".22">${lanes().replace(/M-4000/g,'M-700')}</g><g opacity=".6">${marks()}</g></svg>\n`;}
module.exports={TRACK,UNIT,R_IN,R_OUT,BOX,staggerAngle,renderBend,renderBendAsset};
if(require.main===module){const dest=path.resolve(__dirname,'..','assets/brand/the-bend.svg');fs.writeFileSync(dest,renderBendAsset());console.log('The bend: wrote '+path.relative(path.resolve(__dirname,'..'),dest));}
