/* Public reading helpers. No account, tracking, storage or message submission. */
(function(root){'use strict';
 const O='https://speedandform.com',ADDRESS='brice@speedandform.com';
 function draft(text,context){
  text=typeof text==='string'?text.replace(/\r?\n/g,'\r\n').trim():'';
  const safe=context&&typeof context.url==='string'&&/^\/(?!\/)[a-z0-9/\-]+$/.test(context.url)&&typeof context.title==='string'?context:null;
  const body=(safe?'About: '+safe.title+'\r\n'+O+safe.url+'\r\n\r\n':'')+text;
  const subject=safe?'Question about '+safe.title:'A question about running';
  return {body,href:'mailto:'+ADDRESS+'?subject='+encodeURIComponent(subject.replace(/[\r\n]/g,' '))+'&body='+encodeURIComponent(body)};
 }
 if(typeof module==='object'&&module.exports){module.exports={draft};return;}
 const d=root.document;if(!d)return;
 async function copy(value,status){
  const parent=status.parentElement;parent.querySelectorAll('.cn-manual-copy').forEach(e=>e.remove());
  try {if(!navigator.clipboard||!root.isSecureContext)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(value);status.textContent='Copied.';}
  catch(_){status.textContent='Copy the text below.';const t=d.createElement('textarea');t.className='cn-manual-copy';t.readOnly=true;t.value=value;t.setAttribute('aria-label','Text to copy');status.after(t);t.focus();t.select();}
 }
 d.querySelectorAll('[data-copy]').forEach(b=>{b.addEventListener('click',()=>copy(b.dataset.copy,b.parentElement.querySelector('.cn-status')));b.hidden=false;});
 d.querySelectorAll('[data-share]').forEach(b=>{b.addEventListener('click',async()=>{
  const url=d.querySelector('link[rel="canonical"]').href,status=b.parentElement.querySelector('.cn-status');
  if(navigator.share){try {await navigator.share({title:d.querySelector('h1').textContent,url});status.textContent='';return;}catch(e){if(e.name==='AbortError'){status.textContent='';return;}}}
  await copy(url,status);
 });b.hidden=false;});
 const composer=d.getElementById('question-composer');if(!composer)return;
 const input=d.getElementById('question'),link=d.getElementById('question-email'),status=d.getElementById('question-status'),about=d.getElementById('question-context');let context=null;
 function refresh(){composer.querySelectorAll(".cn-manual-copy").forEach(e=>e.remove());const a=draft(input.value,context);link.href=a.href.length<=1800?a.href:'mailto:'+ADDRESS+'?subject=A%20question%20about%20running';status.textContent=a.href.length>1800?'For a longer question, copy the text and paste it into your email.':'';}
 input.addEventListener('input',refresh);d.getElementById('question-copy').addEventListener('click',()=>{const a=draft(input.value,context);if(!a.body){status.textContent='Write a question first, or open a blank email.';input.focus();return;}copy(a.body,status);});
 link.addEventListener('click',()=>{if(draft(input.value,context).href.length<=1800)status.textContent='Review and send in your email app. Nothing has been sent by this page.';});
 // Only this fixed public catalog is loaded. Never use a raw URL/referrer as context.
 const key=new URLSearchParams(root.location.search).get('about');
 composer.hidden=false;refresh();
 if(key&&/^[a-z0-9-]{1,100}$/.test(key))fetch('/js/question-contexts.json',{credentials:'omit',referrerPolicy:'no-referrer'}).then(r=>{if(!r.ok)throw Error('Context unavailable');return r.json();}).then(all=>{if(!Object.prototype.hasOwnProperty.call(all,key))return;context=all[key];about.textContent='About: '+context.title;about.hidden=false;refresh();}).catch(()=>{ /* Email works without page context. */ });
})(typeof window==='object'?window:globalThis);
