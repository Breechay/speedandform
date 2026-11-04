/* Publication gate for the public study pages.
   Rule (Brice, Nov 1 2026): a study plan is shown ONLY from a response verified in this page view as
   state "published". A committed snapshot is never a fallback. An explicitly unavailable (revoked)
   publication, a publication awaiting a matching update, and anything that cannot be verified
   (network failure, timeout, HTTP error, malformed or unexpected response) all show NO plan content. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FORMPublicationGate=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KNOWN=['published','unavailable','review_required'];
/* One entry per athlete → {state, entry}. state: published | unavailable | review_required | unverified | checking.
   `entry` carries a payload only when state === 'published'. */
function gate(entry){
  if(!entry||typeof entry!=='object'||!KNOWN.includes(entry.state))return {state:'unverified',entry:null};
  if(entry.state!=='published')return {state:entry.state,entry:{state:entry.state}};   // never forward a payload
  if(!entry.payload||typeof entry.payload!=='object')return {state:'unverified',entry:null};
  return {state:'published',entry};
}
/* checked=false until the first live attempt has finished. */
function forAthlete(live,athlete,checked){
  if(!live){return {state:checked?'unverified':'checking',entry:null};}
  return gate(live.athletes&&live.athletes[athlete]);
}
const displayable=g=>!!g&&g.state==='published'&&!!g.entry&&!!g.entry.payload;
const MESSAGES={
 checking:{en:'Checking the publication status…',fr:'Vérification de l’état de la publication…'},
 unverified:{en:'The plan’s publication status could not be verified, so it is not shown. Try again.',fr:'L’état de publication du plan n’a pas pu être vérifié ; il n’est donc pas affiché. Réessaie.'},
 unavailable:{en:'This plan is not currently published.',fr:'Ce plan n’est pas publié actuellement.'},
 review_required:{en:'This plan is being updated and is not shown until the new publication is approved.',fr:'Ce plan est en cours de mise à jour et ne sera affiché qu’après l’approbation de la nouvelle publication.'},
 live:{en:'Approved plan checked against the dated FORM sessions.',fr:'Plan publié vérifié avec les séances datées de FORM.'}
};
function message(state,lang){const m=MESSAGES[state]||MESSAGES.unverified;return lang==='fr'?m.fr:m.en;}
return {gate,forAthlete,displayable,message,MESSAGES};
});
