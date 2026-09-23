'use strict';
// Narrow, repeatable publication build. Does not write the database.
// Requires the owner-approved R2 migration to have run first.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..'),DIR=path.join(ROOT,'labs/the-two-curves'),FILE=path.join(DIR,'index.html');
const adapter=require(path.join(DIR,'plan-projection.js'));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const fmtStatic=s=>adapter.format(s,'km').replace(/\{e:(\d+)\}/g,(_,x)=>x+' m').replace(/\{b1\}/g,'Sep 28').replace(/\{b1end\}/g,'Nov 1').replace(/\{g1\}/g,'Oct 29');
const COPY={
 'claimsub':['More usable speed. At an acceptable cost.','Plus de vitesse utilisable. À un coût acceptable.'],
 'q':['Can Simon make faster running last longer, while developing the speed above it?','Simon peut-il tenir plus longtemps une allure plus rapide, tout en développant la vitesse au-dessus ?'],
 's1.p':['Two official April results. They describe that period, not a fresh September test.','Deux résultats officiels d’avril. Ils décrivent cette période, pas un test récent de septembre.'],
 'ch.l':['Two historical anchors','Deux repères historiques'],
 'ch.h':['One working model.','Un modèle de travail.'],
 'ch.p':['The line connects two race results; it is not a measured physiological curve. We are testing whether the hold, the higher-speed marker, or both can improve without an unacceptable recovery cost. The red horizon is only a long-range possibility, not a requirement for Saumur. Race cards retain organizer display paces; plotted positions use time and distance.','La ligne relie deux résultats de course ; ce n’est pas une courbe physiologique mesurée. Nous observons si la tenue, le repère de vitesse supérieure, ou les deux peuvent progresser sans coût de récupération excessif. L’horizon rouge reste une possibilité lointaine, pas une condition pour Saumur. Les fiches gardent les allures affichées par l’organisateur ; les positions utilisent temps et distance.'],
 'cr.p':['Simon chose a controlled race to secure sub-1:30, according to his coach. The fading Brice observed occurred in some faster training, not in this evenly paced half. Those are different demands. The next question is how much faster running can remain controlled, first fresh and later after prior running.','D’après son coach, Simon a choisi une course maîtrisée pour passer sous 1h30. Les baisses d’allure observées par Brice concernaient certains entraînements plus rapides, pas ce semi régulier. Ce sont des efforts différents. La question suivante est de tenir une allure plus rapide sous contrôle, d’abord frais, puis après avoir déjà couru.'],
 's2.p':['Five weeks, with room to repeat. Keep the Tuesday progression, repeat the first Thursday dose, and reduce the load before the 5K read. Later steps depend on the work and the recovery, not just the date.','Cinq semaines, avec la possibilité de répéter. Garder la progression du mardi, répéter la première dose du jeudi, puis alléger avant le test de 5 km. La suite dépend du travail et de la récupération, pas seulement de la date.'],
 'tr1.p':['Working band: {p:226.8-231.8}. Start near {p:232}; finishing there with control is enough. Two minutes very easy jogging between pieces. The next step must be earned.','Plage de travail : {p:226.8-231.8}. Commencer vers {p:232} ; finir à cette allure sous contrôle suffit. Deux minutes de footing très facile entre les blocs. Chaque étape doit être méritée.'],
 'tr2.p':['The April 5K gives a provisional reference. Start toward {p:212-214}. Repeat the dose before extending it, especially while Tuesday changes.','Le 5 km d’avril donne un repère provisoire. Commencer vers {p:212-214}. Répéter la dose avant de l’allonger, surtout lorsque mardi évolue.'],
 'tr3.p':['Easy means {p:295} or slower, guided by effort. No fast finish in this block. The planned distance is not a minimum to force when recovery is poor.','Facile signifie {p:295} ou plus lent, selon l’effort. Pas de fin rapide dans ce bloc. La distance prévue n’est pas un minimum à forcer si la récupération est mauvaise.'],
 'br1.p':['Faster intervals test the upper end. A better 5K may help, but it is not required at every gate for the half-marathon work to be progressing.','Les intervalles rapides explorent le haut. Un meilleur 5 km peut aider, mais il n’est pas nécessaire à chaque étape pour que le travail du semi progresse.'],
 'br2.p':['Threshold-oriented work is one possible bridge. Tuesday already overlaps the provisional reference. Do not add a third hard day just to complete the diagram.','Le travail proche du seuil est un pont possible. Mardi recoupe déjà le repère provisoire. Ne pas ajouter un troisième jour dur pour compléter le schéma.'],
 'br3.p':['First ask for more controlled continuity. Later, repeat a supported pace after a defined amount of prior running. That later question has not yet been directly tested.','Chercher d’abord plus de continuité sous contrôle. Ensuite, reprendre une allure étayée après une quantité définie de course facile. Cette dernière question n’a pas encore été testée directement.'],
 'k.half':['Working half-pace band','Plage de travail pour le semi'],
 'k.thr':['Provisional threshold reference','Repère de seuil provisoire'],
 'k.ceil':['Provisional ceiling reference','Repère de plafond provisoire'],
 'rb.thr':['Work history','Historique du travail'],'rb.thr.v':['Recorded + reported','Enregistré + rapporté'],
 'rb.next':['Next assessment','Prochain test'],
 'c1.p':['Develop faster running and more controlled continuity in the same opening block.','Développer la vitesse et une continuité maîtrisée dans le même premier bloc.'],
 'c1.s':['A better hold can count even if the 5K stays the same.','Une meilleure tenue compte même si le 5 km ne change pas.'],
 'c2.p':['Tuesday earns longer pieces. Thursday repeats before extending. Saturday stays easy.','Mardi mérite des blocs plus longs. Jeudi répète avant d’allonger. Samedi reste facile.'],
 'c3.b':['Work history','Historique'],'c3.bv':['March + September','Mars + septembre'],
 's3.p':['Recorded work, athlete reports and coach interpretation are kept separate. These historical records do not certify current readiness.','Le travail enregistré, les ressentis et l’interprétation du coach restent distincts. Ces données historiques ne certifient pas la disponibilité actuelle.'],
 'e1.h':['The race held. Faster training asks the next question.','La course a tenu. L’entraînement plus rapide pose la suite.'],
 'e1.p':['The April race was a successful conservative execution, not a failed conversion test. The coach-reported faster-long-run limiter remains a separate observation. We are testing control, continuity and eventually prior-running context rather than assuming a single cause.','Le semi d’avril était une exécution prudente réussie, pas un test de conversion raté. La limite observée par le coach en sortie longue plus rapide reste distincte. Nous testons le contrôle, la continuité et ensuite la course préalable, sans supposer une cause unique.'],
 'e2.h':['Recorded pieces. Provisional reference.','Blocs enregistrés. Repère provisoire.'],
 'e2.p':['The existing coach import records repetitions at {p:227.422} and {p:224.94}, with RPE 7. Original activity, conditions and next-day recovery are not linked. In his words:','L’import du coach contient des répétitions à {p:227.422} et {p:224.94}, avec un effort de 7/10. L’activité originale, les conditions et la récupération du lendemain ne sont pas liées. Ses mots :'],
 'r4':['Threshold-related field record','Repère de terrain proche du seuil'],
 'r4.s':['Sep 4 coach import: recorded repetitions, RPE 7; physiological threshold remains provisional.','Import du coach du 4 sept. : répétitions enregistrées, effort 7/10 ; seuil physiologique non établi.'],
 'r6':['Experimental working band','Plage de travail expérimentale'],
 'r6.s':['Narrower than the 1:19-1:23 goal envelope. Not established race pace.','Plus étroite que l’objectif de 1h19 à 1h23. Ce n’est pas une allure de course établie.'],
 'sc1.p':['The historical record supports substantial broken running near the working band. This block tests current control and continuity while developing higher-speed work. A stronger hold with an unchanged 5K can be progress.','L’historique étaye un volume conséquent de course fractionnée proche de la plage visée. Ce bloc teste le contrôle et la continuité actuels tout en développant la vitesse. Une meilleure tenue peut être un progrès sans meilleur 5 km.'],
 'sc2.p':['It does not establish a laboratory threshold, a VO₂max gain, the cause of an incomplete recording, current 45-mile weeks, or a guaranteed 1:20 half. Later work stays conditional.','Il n’établit ni un seuil de laboratoire, ni un gain de VO₂max, ni la cause d’un enregistrement incomplet, ni un volume actuel de 45 miles, ni un semi garanti en 1h20. La suite reste conditionnelle.'],
 'g.st.after':['Awaiting Gate 01 review','Lecture de la porte 01 attendue'],
 'g.hist5':['APRIL 5K','5 KM D’AVRIL'],'g.histhalf':['APRIL HALF','SEMI D’AVRIL'],
 'hx.l':['Historical evidence','Données historiques'],'hx.h':['He already had the pieces.','Il avait déjà les blocs.'],
 'hx.p':['Brice reports about 45 miles per week in the earlier block. The selected sessions show substantial faster pieces. They support the starting idea, not a claim that the same readiness is present today.','Brice rapporte environ 45 miles par semaine dans le bloc précédent. Ces séances choisies montrent des blocs rapides conséquents. Elles étayent le départ proposé, pas la disponibilité actuelle.'],
 'hx.m25.h':['March 25: thirty-two broken minutes.','25 mars : trente-deux minutes fractionnées.'],
 'hx.m25.p':['Garmin records 20 minutes at {p:231.771427}, 3 minutes of very easy recovery at {p:447.38734}, then 12 minutes at {p:229.907342}. The activity evaluation was Strong, with Moderate perceived effort, 3/10. The longest continuous piece was 20 minutes. Next-day recovery is not supplied.','Garmin enregistre 20 minutes à {p:231.771427}, 3 minutes de récupération très facile à {p:447.38734}, puis 12 minutes à {p:229.907342}. L’activité est évaluée « Strong », avec un effort « Moderate », 3/10. Le plus long bloc continu dure 20 minutes. La récupération du lendemain n’est pas fournie.'],
 'hx.m25.n':['The shorter recorded cooldown explains the difference from the written session. Both faster blocks were captured in full. This is not evidence of eight continuous kilometres or a physiological threshold.','Le retour au calme enregistré plus court explique l’écart avec la description. Les deux blocs rapides sont complets. Cela ne démontre ni huit kilomètres continus ni un seuil physiologique.'],
 'hx.m11.h':['March 11: partial recording, reason unknown.','11 mars : enregistrement partiel, raison inconnue.'],
 'hx.m11.p':['The 3 × 12 title is not the completed record. Garmin shows 12:00 and 9:37.6 of work, separated by 1:30 very easy recovery. Mean work paces were {p:233.635562} and {p:234.256933}. The third repetition is absent. We have not established why the recording ended.','Le titre 3 × 12 ne décrit pas le travail enregistré complet. Garmin montre 12:00 puis 9:37,6 de travail, séparés par 1:30 très facile. Les allures moyennes sont {p:233.635562} et {p:234.256933}. La troisième répétition est absente. La raison de l’arrêt de l’enregistrement reste inconnue.'],
 'hx.other':['Other athlete-written descriptions','Autres descriptions de l’athlète'],
 'hx.f10':['Feb 10: 3 × 10 minutes, {p:223} → {p:235} → {p:240}. Slower repetitions after the fastest opening; the precise cause is not measured.','10 févr. : 3 × 10 minutes, {p:223} → {p:235} → {p:240}. Ralentissement après le départ le plus rapide ; la cause précise n’est pas mesurée.'],
 'hx.f24':['Feb 24: 2 × 14 minutes, {p:235} → {p:231}. Second repetition described as faster.','24 févr. : 2 × 14 minutes, {p:235} → {p:231}. Deuxième répétition décrite comme plus rapide.'],
 'hx.m03':['Mar 3: description lists 20 + 8 minutes. The full written session totals 61 minutes; moving time is 40:49. The mismatch remains unresolved.','3 mars : la description donne 20 + 8 minutes. La séance écrite complète totalise 61 minutes ; le temps en mouvement est de 40:49. L’écart reste non résolu.'],
 'hx.m18':['Mar 18: 2 × 15 minutes, {p:232} → {p:229}. Two substantial pieces, second described as faster.','18 mars : 2 × 15 minutes, {p:232} → {p:229}. Deux blocs conséquents, le second décrit comme plus rapide.'],
 'hx.source':['Source: coach-supplied screenshots. Recorded intervals, captions and athlete evaluations are different kinds of evidence. No raw time series or exact heart-rate drift was reconstructed.','Source : captures fournies par le coach. Intervalles enregistrés, descriptions et ressentis sont des preuves différentes. Aucune série brute ni dérive cardiaque exacte n’a été reconstruite.'],
 'rules.h':['How this block stays useful.','Comment garder ce bloc utile.'],
 'rules.p':['Repeat before forcing. Let pace yield when conditions or recovery make the prescribed work too costly. Heart rate is context, not a standalone 175-bpm pass/fail rule. Keep the existing Feel/Effort report, add reserve and limiter, and check the next day.','Répéter plutôt que forcer. Laisser l’allure baisser si les conditions ou la récupération rendent le travail trop coûteux. La fréquence cardiaque apporte du contexte, pas une règle isolée à 175 bpm. Garder le ressenti et l’effort existants, ajouter la réserve et la limite, puis vérifier le lendemain.'],
 'rules.note':['Distances with timed warm-ups, recoveries and cooldowns are planning estimates. Run the prescribed components; do not add miles to force the estimate. Sunday is unauthored.','Les distances avec échauffement, récupération et retour au calme chronométrés sont des estimations. Suivre les blocs prescrits sans ajouter de distance pour atteindre l’estimation. Dimanche n’est pas programmé.'],
 'gate.l':['Gate 01: a decision window','Porte 01 : une fenêtre de décision'],
 'gate.h':['Two reads. Room to recover.','Deux lectures. Le temps de récupérer.'],
 'gate.a.h':['Oct 29: the 5K','29 oct. : le 5 km'],
 'gate.a.p':['Tuesday is easy. The 5K establishes a current field reference; its effort is read differently from a controlled Tuesday. Compare conditions and recovery, not just the finishing time.','Mardi est facile. Le 5 km établit un repère actuel ; son effort ne se lit pas comme celui d’un mardi contrôlé. Comparer les conditions et la récupération, pas seulement le chrono.'],
 'gate.b.h':['From Nov 3: continuity, if ready','À partir du 3 nov. : continuité, si prêt'],
 'gate.b.p':['Consider {d:6} to {d:8} continuous only after normal recovery and coach approval. This is a candidate, not an assigned sixth week. Record controlled duration without running until failure.','Envisager {d:6} à {d:8} en continu après une récupération normale et l’accord du coach. C’est une possibilité, pas une sixième semaine programmée. Mesurer la durée maîtrisée sans chercher l’échec.'],
 'gate.c.h':['Read the cost before the next step','Lire le coût avant la suite'],
 'gate.c.p':['A stronger hold with the same 5K can be success. Expensive early: review pace and controlled sustained work. Expensive only after more running: investigate continuity and later durability. Poor recovery: reduce demand. Unclear but recovered: check comparability before changing the plan.','Une meilleure tenue avec le même 5 km peut être une réussite. Coût élevé dès le départ : revoir l’allure et le travail soutenu contrôlé. Coût tardif : examiner la continuité puis la durabilité. Mauvaise récupération : alléger. Résultat flou mais récupération normale : vérifier la comparaison avant de changer le plan.']
};
const HISTORY=`<div class="history-wall" id="history"><span class="lbl" data-i="hx.l"></span><h3 data-i="hx.h"></h3><p data-i="hx.p"></p><div class="history-pair"><article><span class="pill ok">Recorded intervals</span><h4 data-i="hx.m25.h"></h4><p data-i="hx.m25.p"></p><p data-i="hx.m25.n"></p></article><article><span class="pill wait">Partial recording</span><h4 data-i="hx.m11.h"></h4><p data-i="hx.m11.p"></p></article></div><h4 data-i="hx.other"></h4><div class="history-notes"><p data-i="hx.f10"></p><p data-i="hx.f24"></p><p data-i="hx.m03"></p><p data-i="hx.m18"></p></div><p class="source-note" data-i="hx.source"></p></div>`;
const GATE=`<div class="gate-window" id="gate"><span class="lbl" data-i="gate.l"></span><h3 data-i="gate.h"></h3><div class="gate-grid"><article><h4 data-i="gate.a.h"></h4><p data-i="gate.a.p"></p></article><article><h4 data-i="gate.b.h"></h4><p data-i="gate.b.p"></p></article><article><h4 data-i="gate.c.h"></h4><p data-i="gate.c.p"></p></article></div></div>`;
const CSS=`\n/* Study 003 evidence / publication revision R2 */
.history-wall,.gate-window{margin-top:38px;padding-top:26px;border-top:1px solid var(--rule-hard)}
.history-wall h3,.gate-window h3{font-size:clamp(25px,2.7vw,40px);line-height:1.1;margin:10px 0 18px}
.history-wall h4,.gate-window h4{font-size:19px;line-height:1.3;margin:12px 0}
.history-wall p,.gate-window p,.plan-rules p{font-size:16px;line-height:1.65;max-width:68ch;color:var(--ink-2)}
.history-pair{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin:24px 0}.history-pair article+article{padding-left:28px;border-left:1px solid var(--rule)}
.history-notes{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}.source-note{font-size:13px!important;color:var(--graphite)!important}
.gate-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px}.gate-grid article{min-width:0}
.plan-rules{padding:20px 0 4px}.plan-rules h3{font-size:22px;margin:0}.plan-frame{display:block;margin-top:8px;font-size:12px;line-height:1.5;color:var(--graphite)}
.plan-source{font:12px/1.5 var(--f-mono);letter-spacing:.02em;color:var(--graphite);padding:12px 0;max-width:80ch}
.plan-source[data-source-state="review_required"]{color:var(--red)}
@media(max-width:900px){.history-pair,.history-notes,.gate-grid{grid-template-columns:1fr}.history-pair article+article{padding:22px 0 0;border-left:0;border-top:1px solid var(--rule)}}
`;
async function main(){
 const pub=await adapter.read(AbortSignal.timeout(25000));
 assert.equal(pub.revision,'SIMON-003-R2-20260923');
 assert.equal(pub.payload.version.number,2,'Review a later version before rebuilding this release');
 assert.deepEqual(pub.payload.weeks.map(w=>w.total_distance),[63,67,70,62,52]);
 fs.writeFileSync(path.join(DIR,'published-plan.json'),JSON.stringify(pub,null,2)+'\n');
 fs.writeFileSync(path.join(DIR,'published-plan.js'),'/* Generated from approved FORM publication. Do not author here. */\nwindow.FORMSimonPublishedPlan = '+JSON.stringify(pub).replace(/</g,'\\u003c')+';\n');
 let html=fs.readFileSync(FILE,'utf8');const beforeImages=[...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>hash(m[1]));
 const scriptRE=/<script>\s*\(\(\) => \{[\s\S]*?<\/script>/;
 let script=html.match(scriptRE)?.[0];assert.ok(script,'Main study script missing');
 if(!html.includes('SIMON_R2_IMPLEMENTED')){
  assert.ok(html.includes('scale(.98)'),'Preserve reviewed figure scale');
  const b0=script.indexOf('const E = '),b1=script.indexOf('const ARC = [');assert.ok(b0>=0&&b1>b0);
  script=script.slice(0,b0)+'let B1 = window.FORMSimonPlan.fromPublication(window.FORMSimonPublishedPlan);\n\n'+script.slice(b1);
  script=script.replace('const BLOCK01_START = "2026-09-28";','const BLOCK01_START = window.FORMSimonPublishedPlan.payload.running.starts_on;');
  script=script.replace('DATA: the only place a number or a session is authored.','PROJECTION: sessions come from the approved FORM publication.');
  const a0=script.indexOf('const ARC = ['),a1=script.indexOf('  {cls:"gate", when:{en:"Thanksgiving',a0);assert.ok(a1>a0);
  script=script.slice(0,a0)+`const ARC = [
  {cls:"gate",when:{en:"Thu · Oct 29",fr:"Jeu. · 29 oct."},t:{en:"Gate 01 · current 5K",fr:"Porte 01 · 5 km actuel"},p:{en:"Easy Tuesday, then the 5K read. Record conditions, execution and recovery. This is a current reference, not proof of a five-week causal gain.",fr:"Mardi facile, puis le test de 5 km. Noter conditions, exécution et récupération. C’est un repère actuel, pas la preuve d’un effet causal de cinq semaines."}},
  {cls:"cond",when:{en:"From Tue · Nov 3",fr:"À partir du mar. · 3 nov."},t:{en:"Continuous read · awaiting coach approval",fr:"Lecture continue · accord du coach attendu"},p:{en:"Consider {d:6} to {d:8} continuous only after normal recovery. This candidate is not yet assigned in FORM. Shorten or defer rather than force a result.",fr:"Envisager {d:6} à {d:8} en continu après une récupération normale. Cette possibilité n’est pas encore programmée dans FORM. Raccourcir ou reporter plutôt que forcer."}},
  {cls:"cond",when:{en:"After both reads",fr:"Après les deux lectures"},t:{en:"Choose the next emphasis",fr:"Choisir la priorité suivante"},p:{en:"A better hold can count with an unchanged 5K. Let control, recovery and where effort rises decide whether to emphasize sustained work, continuity, later prior-running context, or less load.",fr:"Une meilleure tenue compte même sans meilleur 5 km. Le contrôle, la récupération et le moment où l’effort augmente décident : travail soutenu, continuité, course préalable plus tard, ou allègement."}},
`+script.slice(a1);
  const t0=script.indexOf('const T = '),t1=script.indexOf('const MON = ',t0);assert.ok(t0>=0&&t1>t0);
  const literal=script.slice(t0+'const T = '.length,t1).trim().replace(/;$/,'');
  const T=vm.runInNewContext('('+literal+')',{}, {timeout:1000});Object.assign(T,COPY);
  // Exact canonical mile clocks converted once, not separately typed equivalents.
  T['tr1.p'][0]=T['tr1.p'][0].replace('{p:226.8-231.8}',`{p:${365/adapter.MI}-${373/adapter.MI}}`);
  T['tr1.p'][1]=T['tr1.p'][1].replace('{p:226.8-231.8}',`{p:${365/adapter.MI}-${373/adapter.MI}}`);
  T['e2.p']=T['e2.p'].map(s=>s.replace('{p:227.422}',`{p:${366/adapter.MI}}`).replace('{p:224.94}',`{p:${362/adapter.MI}}`));
  T['hx.m25.p']=T['hx.m25.p'].map(s=>s.replace('{p:231.771427}',`{p:${373/adapter.MI}}`).replace('{p:447.38734}',`{p:${720/adapter.MI}}`).replace('{p:229.907342}',`{p:${370/adapter.MI}}`));
  T['hx.m11.p']=T['hx.m11.p'].map(s=>s.replace('{p:233.635562}',`{p:${376/adapter.MI}}`).replace('{p:234.256933}',`{p:${377/adapter.MI}}`));
  script=script.slice(0,t0)+'const T = '+JSON.stringify(T,null,1)+';\n'+script.slice(t1);
  script=script.replace('>CURRENT 5K</text>','>${t("g.hist5")}</text>').replace('>CURRENT HALF</text>','>${t("g.histhalf")}</text>');
  script=script.replace('CEILING HORIZON · ${unit===','${lang==="fr"?"HORIZON POSSIBLE":"POSSIBLE HORIZON"} · ${unit===');
  script=script.replace('<span class="body">·</span>','<span class="body">—</span>');
  const refresh=`
let publicationState='saved';
function renderPublicationState(){
 const el=document.getElementById('planSource');if(!el)return;
 el.dataset.sourceState=publicationState;
 const ver=window.FORMSimonPublishedPlan.payload.version.number;
 el.textContent=publicationState==='live'?(lang==='fr'?'Plan publié vérifié · version ':'Approved plan checked · version ')+ver:publicationState==='review_required'?(lang==='fr'?'Publication à revoir. Suivre le plan attribué dans FORM. Copie précédente affichée ci-dessous.':'Publication needs review. Follow your assigned FORM plan. Previous approved copy shown below.'):(lang==='fr'?'Copie publiée enregistrée · version ':'Saved approved copy · version ')+ver+(lang==='fr'?' · connexion non vérifiée.':' · live connection not verified.');
}
async function refreshApprovedPublication(){
 try{
  const next=await window.FORMSimonPlan.read(AbortSignal.timeout(12000));
  if(next.payload.running.starts_on!==BLOCK01_START)throw Error('Calendar changed; review the study');
  B1=window.FORMSimonPlan.fromPublication(next);window.FORMSimonPublishedPlan=next;publicationState='live';
 }catch(e){publicationState=String(e.message).includes('approved/current')?'review_required':'saved';}
 renderGrid();renderPublicationState();
}
`;
  script=script.replace('function renderAll(){',refresh+'\nfunction renderAll(){');
  script=script.replace('renderCopy(); renderStatus(); renderGrid(); renderArc(); renderSplits(); renderChart();','renderCopy(); renderStatus(); renderGrid(); renderArc(); renderSplits(); renderChart(); renderPublicationState();');
  script=script.replace('\nrenderAll();\n','\nrenderAll();\nrefreshApprovedPublication();\n');
  html=html.replace(scriptRE,()=>'<script src="/labs/the-two-curves/plan-projection.js"></script>\n<script src="/labs/the-two-curves/published-plan.js"></script>\n'+script);
  html=html.replace('</style>',CSS+'\n</style>');
  const evidenceAnchor=html.indexOf('    <article class="entry">',html.indexOf('id="evidence"'));assert.ok(evidenceAnchor>0);
  html=html.slice(0,evidenceAnchor)+HISTORY+'\n'+html.slice(evidenceAnchor);
  html=html.replace('    <div class="tools">','    <div class="plan-rules"><h3 data-i="rules.h"></h3><p data-i="rules.p"></p><p class="source-note" data-i="rules.note"></p></div>\n    <div class="tools">');
  html=html.replace('    <div class="arc">',GATE+'\n    <div class="arc">');
  for(const [k,v] of Object.entries(T)){
   if(typeof v[0]!=='string')continue;
   const re=new RegExp('(<([a-z][\\w:-]*)\\b[^>]*\\bdata-i=["\\\']'+escapeRE(k)+'["\\\'][^>]*>)[\\s\\S]*?(<\\/\\2>)','g');
   html=html.replace(re,(_,open,tag,close)=>open+fmtStatic(v[0])+close);
  }
  html=html.replace(/<tr><td data-i="r4">[\s\S]*?<\/tr>/,`<tr><td data-i="r4">${T['r4'][0]}</td><td>2 × 10 min · <span data-u="p:${366/adapter.MI}">${adapter.format('{p:'+366/adapter.MI+'}')}</span> / <span data-u="p:${362/adapter.MI}">${adapter.format('{p:'+362/adapter.MI+'}')}</span></td><td data-i="r4.s">${T['r4.s'][0]}</td><td><span class="pill wait">Provisional</span></td></tr>`);
  html=html.replace('<html lang="en">','<html lang="en" data-study-revision="SIMON-003-R2-20260923">');
  html=html.replace('<main>','<!-- SIMON_R2_IMPLEMENTED\nAgent entry point: docs/studies/SIMON-STUDY-003.md.\nThe approved FORM publication owns the schedule. Do not author a second B1 array.\nHistorical evidence is qualified in evidence.json. Hidden comments are not private storage.\n-->\n<main>');
 }
 const saved=`<!-- STUDY003_SAVED_GRID --><p class="plan-source" id="planSource" data-source-state="saved">Saved approved plan · version ${pub.payload.version.number}. Current connection has not been checked.</p><div class="grid-plan" id="gridPlan" role="table" aria-label="Block 01, every day">${adapter.fallbackGrid(pub)}</div><!-- END_STUDY003_SAVED_GRID -->`;
 if(html.includes('<!-- STUDY003_SAVED_GRID -->'))html=html.replace(/<!-- STUDY003_SAVED_GRID -->[\s\S]*?<!-- END_STUDY003_SAVED_GRID -->/,()=>saved);
 else html=html.replace(/<div class="grid-plan" id="gridPlan"[^>]*><\/div>/,()=>saved);
 assert.ok(html.includes('id="planSource"')&&html.includes('id="history"'),'Missing review sections');
 const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
 for(const [,attrs,body] of scripts){if(attrs.includes('application/ld+json'))JSON.parse(body);else if(body.trim())new vm.Script(body);}
 assert.deepEqual([...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>hash(m[1])),beforeImages,'Image bytes changed');
 assert.ok(html.includes('scale(.98)')&&html.includes('.reveal{opacity:1'),'Preserve figure and fail-open content');
 fs.writeFileSync(FILE,html);
 if(!process.argv.includes('--refresh-only')){
  const a=path.join(ROOT,'AGENTS.md');let text=fs.readFileSync(a,'utf8');
  const rule='\n## Simon / Study 003\nBefore any Simon plan, evidence or study edit, read [Study 003 protocol](docs/studies/SIMON-STUDY-003.md). R2 supersedes the earlier automatic Thursday escalation and October 27 continuous test. Preserve historical evidence, very easy recoveries, the separated Gate 01 window, and the approved-publication/app parity contract.\n';
  if(!text.includes('## Simon / Study 003'))fs.writeFileSync(a,text+rule);
  const rp=path.join(ROOT,'docs/roadmap/FORM-ROADMAP.md');let road=fs.readFileSync(rp,'utf8');
  const note='## September 23 · Simon evidence revision R2\n\n**Current authority:** [Study 003 protocol](../studies/SIMON-STUDY-003.md), canonical plan version 2, revision `SIMON-003-R2-20260923`. This supersedes earlier same-day Simon training recommendations below, not other athletes. Tuesday retains the first four ladder steps with two-minute very easy recoveries. Thursdays: 5×3, repeat 5×3, 4×4 if recovered, reduced 4×3, then 5K. Oct 27 is easy; Oct 29 is the 5K; a 6–8 km continuous read is a Nov 3-or-later candidate requiring coach approval after recovery. Planned totals are 63 / 67 / 70 / 62 / 52 km, not minimums. No new completed evidence or mark ownership was invented.\n\nHistorical March 25 is 32 broken minutes with a favourable activity report, not a continuous or laboratory test. March 11 remains a partial recording with reason unknown. Historical 45 mi/week is a coach report, not current-volume verification. A better hold with an unchanged 5K is progress. No arbitrary 175-bpm cap, universal drift threshold, fixed threshold-to-half offset or automatic peak mileage is adopted.\n\nThe study reads an explicitly approved publication matching the app assignment; saved snapshots are fallbacks, not authoring sources. Public/private drift returns review_required instead of exposing private updates. Generic paid-plan access remains closed. Release receipts belong in docs/audits/SIMON-STUDY-003-R2-RELEASE.json.\n\nOpen, one operating checklist:\n- [ ] Confirm recent running continuity, comfortable long-run duration and hard HYROX/lower-body load before starting the full dose.\n- [ ] Clarify why March 11 ended and whether another recording exists; reconcile March 3 caption vs moving time.\n- [ ] File Sep 15/22 evidence only if supplied.\n- [ ] Review Oct 29 and recovery, then explicitly author or defer the candidate continuous read.\n- [ ] Confirm Turkey Trot event/distance/registration and Nashville division/day/heat; neither is invented.\n- [ ] Lisa next plan remains parked and separate. Raise the Ceiling stays archived.\n- [ ] Confirm this data revision on the physical iPhone. No app binary change is required for these prescriptions.\n\nSaumur remains May 16, 2027; February 1 anchors the 15-week specific calendar, not pre-approved workout numbers.\n\n';
  if(!road.includes('## September 23 · Simon evidence revision R2')){const nl=road.indexOf('\n');road=road.slice(0,nl+1)+'\n'+note+road.slice(nl+1);fs.writeFileSync(rp,road);}
 }
 console.log(JSON.stringify({revision:pub.revision,version:pub.payload.version.number,totals:pub.payload.weeks.map(w=>w.total_distance),html_sha256:hash(html),images_preserved:beforeImages.length}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
