/* Public learning paths, shared by static pages and the search index. */
(function(root){
 const movement=[
  {title:'Lessons · Understand',urls:['/strength','/running-form-errors','/ghost/cues','/mechanics-map','/library/physique-volume/','/library/why-phases/']},
  {title:'Routines · Do',urls:['/strength-activation','/strength-routine','/anti-rotation','/mobility','/ghost']}
 ];
 const families={movement:{title:'Strength & movement',anchor:'/library#movement',groups:movement}};
 if(typeof module==='object'&&module.exports)module.exports=families;
 else root.FORM_LIBRARY_FAMILIES=families;
})(typeof window==='object'?window:globalThis);
