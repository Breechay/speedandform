'use strict';
// A workout awaiting details must not make a published gathering uncertain.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'thursday.html'),'utf8');
const schedule=fs.readFileSync(path.join(root,'js/community-schedule.js'),'utf8');
const script=fs.readFileSync(path.join(root,'js/thursday-gathering.js'),'utf8');
const run={title:'Track Thursday',meet_at:'2026-10-01T10:00:00Z',starts_at:'2026-10-01T10:15:00Z',meet_name:'Flamingo Park Track',meet_address:'11 St & Jefferson Ave',group_facts:{level:'All levels',meet_point:'Bench by the bleachers'},status:'scheduled'};
async function render(rows,now='2026-10-01T00:30:00Z',ok=true){
 const nodes={},el=id=>nodes[id]||(nodes[id]={textContent:''}),requests=[];
 class Clock extends Date { static now(){return Date.parse(now);} }
 const context=vm.createContext({window:{},document:{getElementById:el,querySelector:()=>el('location')},Intl,Date:Clock,Number,URLSearchParams,AbortController,setTimeout,clearTimeout,
  fetch:async(url,options)=>{requests.push({url,options});return {ok,json:async()=>rows};}});
 vm.runInContext(schedule,context);vm.runInContext(script,context);await context.window.FORM_THURSDAY_READY;
 return {nodes,requests};
}
(async()=>{
 let r=await render([run]);
 assert.equal(r.nodes['thu-gathering-status'].textContent,'Gathering confirmed');
 assert.match(r.nodes['thu-when'].textContent,/Meet 6:00 AM · Run 6:15 AM/);
 assert.equal(r.nodes['thu-session-name'].textContent,'Workout to be confirmed');
 assert.match(r.nodes['thu-location-detail'].textContent,/Bench by the bleachers/);
 assert.match(r.requests[0].url,/collective_public_runs/);
 assert.equal(new URL(r.requests[0].url).searchParams.get('starts_at'),'gte.2026-09-30T00:00:00Z','Date follows Miami, not UTC visitor date');
 assert.equal(r.requests[0].options.cache,'no-store');
 r=await render([{...run,status:'cancelled'}]);
 assert.equal(r.nodes['thu-gathering-status'].textContent,'Gathering canceled');
 assert.equal(r.nodes['thu-when'].textContent,'Not meeting on this date');
 assert.equal(r.nodes['thu-session-name'].textContent,'No session');
 r=await render([{...run,meet_at:'2026-10-01T11:00:00Z',starts_at:'2026-10-01T11:15:00Z',meet_name:'Changed track'}]);
 assert.equal(r.nodes.location.textContent,'Changed track');assert.match(r.nodes['thu-when'].textContent,/Meet 7:00 AM · Run 7:15 AM/);
 r=await render([run],'2026-10-02T05:00:00Z');assert.equal(r.nodes['thu-gathering-status'].textContent,'Next gathering not yet published');
 r=await render([]);assert.equal(r.nodes['thu-gathering-status'].textContent,'Next gathering not yet published');
 r=await render([],undefined,false);assert.equal(r.nodes['thu-gathering-status'].textContent,'Could not confirm the next gathering');
 assert.match(r.nodes['thu-time-note'].textContent,/not a confirmed date/);
 r=await render([{...run,meet_at:'2026-11-05T11:00:00Z',starts_at:'2026-11-05T11:15:00Z'}],'2026-11-04T12:00:00Z');
 assert.match(r.nodes['thu-when'].textContent,/Meet 6:00 AM · Run 6:15 AM/,'Miami daylight saving time');
 r=await render([{...run,starts_at:'2026-09-24T10:15:00Z',meet_at:'2026-09-24T10:00:00Z'}],'2026-09-23T12:00:00Z');
 assert.equal(r.nodes['thu-session-name'].textContent,'Gauntlet','Explicit authored workout remains available');
 assert.ok(html.includes('/js/thursday-gathering.js?v=20261001'));
 assert.ok(!html.includes('Brice will confirm it.'));
 assert.ok(html.includes('/coaching/miami/?start=assessment#inquiry-program'));
 console.log('PASS Thursday: published/canceled/moved/absent/unavailable gatherings, separate authored workouts, Miami date and DST, public read only.');
})().catch(error=>{console.error(error);process.exit(1);});
