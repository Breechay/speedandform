import fs from 'node:fs';
import assert from 'node:assert/strict';

const runbook = fs.readFileSync(new URL('../docs/audits/ATHLETE-ECOSYSTEM-RUNBOOK-20260918.md', import.meta.url), 'utf8');
const passes = fs.readFileSync(new URL('../docs/roadmap/ATHLETE-ECOSYSTEM-PASSES-20260917.md', import.meta.url), 'utf8');
const roadmap = fs.readFileSync(new URL('../docs/roadmap/FORM-ROADMAP.md', import.meta.url), 'utf8');

let checks=0;
const has=(text,re,msg)=>{assert.match(text,re,msg);checks+=1};
const lacks=(text,re,msg)=>{assert.doesNotMatch(text,re,msg);checks+=1};

has(runbook,/SOURCE COMPLETE · SCHEMA LIVE · WEB PRODUCTION LIVE · ANONYMOUS PROD ACCEPTED · OWNER\/ATHLETE AUTH WALKS \+ TWO NATIVE DEVICE GATES OPEN/,'closure keeps release truth explicit');
has(runbook,/7875919a71e99a3ed801b1b25780b16188f2b76c/,'accepted web source is recorded');
has(runbook,/6aac3e68f243b00008917eea/,'actual Netlify deploy is recorded');
has(runbook,/dd8cfef0fb8348290b4ccd79ff681f141b6e4f1e/,'actual deployed commit is recorded');
has(runbook,/20260918002500_evidence_review_instruction_chain\.sql/,'review-chain migration is named');
has(runbook,/20260918011500_form_native_exact_retry_noop\.sql/,'retry migration is named');
has(runbook,/Applied successfully, in order/,'applied migrations preserve their explicit order');
has(runbook,/Do not infer this from a merge to main/,'merge is not deployment approval');
has(runbook,/Adrian's real invite email\/account decision/,'Forge device gate remains explicit');
has(runbook,/current-head Mac compile/,'FORM device gate remains explicit');
has(runbook,/No plan title may silently upgrade an athlete to a connected app/,'delivery law is preserved');
has(runbook,/Do not distribute the native assigned-plan beta before this gate closes/,'native distribution remains gated');
lacks(runbook,/all passes are live/i,'runbook never overclaims production');

has(passes,/\| 11 \|[\s\S]*MERGED \+ ACCEPTED; PRODUCTION HELD/,'Pass 11 is closed without claiming deployment');
has(passes,/\| 12 \|[\s\S]*COMPLETE; RELEASE HELD/,'Pass 12 is complete without claiming production release');
has(roadmap,/source-complete through Pass 12/,'master roadmap points at closure state');
has(roadmap,/ATHLETE-ECOSYSTEM-RUNBOOK-20260918\.md/,'master roadmap links runbook');

console.log(`PASS: ${checks} athlete ecosystem closure/runbook checks`);
