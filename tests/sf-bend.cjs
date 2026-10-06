/* The bend is a measured drawing, not an ornament. Protect its proportion, its single source and its place on the homepage. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),bend=require('../scripts/sf-bend.cjs');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'css/home-commercial.css'),'utf8');
assert.equal(bend.TRACK.radius_m,36.5,'standard bend radius');assert.equal(bend.TRACK.lane_m,1.22,'standard lane width');assert.equal(bend.TRACK.lanes,8,'eight lanes');
assert.ok(Math.abs(bend.R_IN/bend.UNIT-36.5/1.22)<.01,'radius to lane proportion is the real one');
const inline=bend.renderBend();
assert.equal((inline.match(/<path /g)||[]).length,9,'nine lines make eight lanes');
assert.equal((inline.match(/<line /g)||[]).length,8,'one start line and seven staggered marks');
const deg=n=>bend.staggerAngle(n)*180/Math.PI;
for(let n=3;n<=8;n++)assert.ok(deg(n)>deg(n-1),'each outer lane starts farther round the bend');
assert.ok(Math.abs(deg(2)-10.6)<.1&&Math.abs(deg(8)-67.2)<.1,'400 m stagger angles');
assert.equal(html.split(inline).length,2,'homepage carries exactly one bend, generated, not hand-edited');
assert.ok(html.indexOf('class="sf-bend"')>html.indexOf('class="home-evidence"')&&html.indexOf('class="sf-bend"')<html.indexOf('class="home-also"'),'the bend lives in the practice fold');
assert.equal(fs.readFileSync(path.join(root,'assets/brand/the-bend.svg'),'utf8'),bend.renderBendAsset(),'brand asset matches the source');
assert.match(inline,/aria-hidden="true"/,'decoration is hidden from assistive technology');
for(const token of ['--lane','--bend-x','--bend-gap','--bend-solid','--bend-clear','vector-effect:non-scaling-stroke'])assert.ok(css.includes(token),'homepage stylesheet owns '+token);
assert.ok(!/topograph|contour|feTurbulence/i.test(css),'no texture substitutes for the bend');
console.log('PASS: the bend keeps true 400 m proportion, one generated source, one homepage use and a matching brand asset.');
