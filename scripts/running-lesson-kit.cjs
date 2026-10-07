'use strict';
const ref=n=>`<a class="guide-ref" href="#source-${n}" aria-label="Source ${n}">[${n}]</a>`;
const section=(id,title,html)=>({id,title,html});
const detail=(question,answer,id='')=>`<details class="guide-detail"${id?` id="${id}"`:''}><summary>${question}</summary><div>${answer}</div></details>`;
const steps=items=>`<ol class="guide-steps">${items.map(([n,title,text])=>`<li><span class="guide-step-number">${n}</span><div><h3>${title}</h3><p>${text}</p></div></li>`).join('')}</ol>`;
const decisions=items=>`<dl class="guide-decisions">${items.map(([title,text])=>`<div><dt>${title}</dt><dd>${text}</dd></div>`).join('')}</dl>`;
const table=(caption,head,rows)=>`<div class="lesson-table-wrap"><table class="lesson-table"><caption>${caption}</caption><thead><tr>${head.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(([first,...rest])=>`<tr><th scope="row">${first}</th>${rest.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
// Written memory cues. Only measured examples become diagrams.
function picture(kind,title,text,caption){return `<figure class="lesson-picture"><p class="lesson-label">One picture to remember</p><blockquote><h3>${title}</h3><p>${text}</p></blockquote>${caption?`<figcaption>${caption}</figcaption>`:''}</figure>`;}
const sources={
 talk:['Persinger et al. (2004)','Consistency of the talk test for exercise prescription','https://pubmed.ncbi.nlm.nih.gov/15354048/','Speech comfort is a useful effort cue, not an exact zone measurement.'],
 speech:['Rotstein et al. (2004)','Perceived speech difficulty during exercise','https://pubmed.ncbi.nlm.nih.gov/15221401/','Speech responses vary between runners.'],
 easy:['Esteve-Lanao et al. (2007)','Impact of training intensity distribution on performance in endurance athletes','https://pubmed.ncbi.nlm.nih.gov/17685689/','A small study in subelite runners supports substantial easier training, not a universal percentage.'],
 threshold:['Faude, Kindermann & Meyer (2009)','Lactate threshold concepts: how valid are they?','https://pubmed.ncbi.nlm.nih.gov/19453206/','Threshold definitions and tests identify different boundaries.'],
 lactate:['Emhoff et al. (2013)','Direct and indirect lactate oxidation in trained and untrained men','https://pubmed.ncbi.nlm.nih.gov/23788576/','Lactate is used as an exercise fuel. Blood concentration is not a direct clearance measurement.'],
 heat:['Racinais et al. (2015)','Consensus recommendations on training and competing in the heat','https://pubmed.ncbi.nlm.nih.gov/26069301/','Hot conditions add strain and require adjustments.'],
 load:['Meeusen et al. (2013)','ECSS and ACSM consensus on training, recovery and overtraining','https://pubmed.ncbi.nlm.nih.gov/23247672/','Excessive load and inadequate recovery need attention; a watch cannot diagnose the cause of persistent symptoms.'],
 injury:['NHS','Knee pain and other running injuries','https://www.nhs.uk/live-well/exercise/knee-pain-and-other-running-injuries/','General guidance on painful running and getting assessment.'],
 progression:['Buist et al. (2008)','No effect of a graded training program on running-related injuries in novice runners','https://pubmed.ncbi.nlm.nih.gov/17940147/','A novice-runner trial did not find injury reduction from its program based on the 10% rule. No weekly percentage is a safety guarantee.'],
 intervals:['Seiler & Sjursen (2004)','Effect of work duration on responses during self-paced interval training','https://pubmed.ncbi.nlm.nih.gov/15387806/','Work duration changes the response. A short repetition is not automatically a particular physiological zone.'],
 long:['Unhjem (2024)','Changes in running economy and attainable maximal oxygen consumption in response to prolonged running','https://pubmed.ncbi.nlm.nih.gov/38671555/','Responses during a one-hour laboratory run differed with training status. This is not a prescribed long-run length.'],
 food:['Thomas, Erdman & Burke (2016)','Nutrition and Athletic Performance','https://pubmed.ncbi.nlm.nih.gov/26920240/','Exercise food and drink need to fit the athlete and the work.'],
 cadence:['Heiderscheit et al. (2011)','Effects of step rate manipulation on joint mechanics during running','https://pubmed.ncbi.nlm.nih.gov/20581720/','Small step-rate changes altered joint loading at a fixed speed; this does not prove injury prevention.'],
 foot:['Zhang et al. (2025)','Effects of habitual foot strike patterns on patellofemoral joint and Achilles tendon loading','https://pubmed.ncbi.nlm.nih.gov/39701021/','Habitual foot strikes distributed load differently. Switching is not automatically an improvement.'],
 rhythm:['Snyder & Farley (2011)','Energetically optimal stride frequency in running','https://pubmed.ncbi.nlm.nih.gov/21613526/','Preferred step frequency and energy cost depend on the running task.'],
 daniels:['Jack Daniels','The basic laws of running, from Daniels’ Running Formula','https://us.humankinetics.com/blogs/excerpt/the-basic-laws-of-running-according-to-jack-daniels','Coaching context: understand each workout’s purpose, adjust to the individual, and include food and rest.'],
 endurance:['Joyner & Coyle (2008)','Endurance exercise performance: the physiology of champions','https://pubmed.ncbi.nlm.nih.gov/17901124/','Maximal oxygen uptake, sustainable intensity and economy are related, distinct parts of endurance performance.'],
 sleep:['Walsh et al. (2021)','Sleep and the athlete: narrative review and 2021 expert consensus recommendations','https://pubmed.ncbi.nlm.nih.gov/33144349/','Sleep duration, quality and individual needs matter.']
};
module.exports={ref,section,detail,steps,decisions,table,picture,sources};
