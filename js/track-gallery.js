/* Progressive enhancement: the underlying links open real files without JavaScript. */
(() => {
  'use strict';
  const el=id=>document.getElementById(id), data=el('track-album'), dialog=el('track-viewer');
  if(!data || !dialog || typeof dialog.showModal!=='function') return;
  let album;
  try { album=JSON.parse(data.textContent); } catch { return; }
  if(!Array.isArray(album.media) || !album.media.length) return;
  const media=album.media, stage=el('viewer-stage'), failure=el('viewer-failure');
  const canonical=document.querySelector('link[rel="canonical"]').href;
  let index=-1, invoking=null, ownsHistory=false, mediaElement=null, pointer=null;
  const frameHash=i=>'#frame-'+media[i].id;
  const fromHash=()=>media.findIndex(m=>'#frame-'+m.id===location.hash);
  const buttons={prev:el('viewer-prev'),next:el('viewer-next'),close:el('viewer-close')};
  const status=(id,text)=>{el(id).textContent=text;};
  function stopMedia(){
    if(mediaElement?.tagName==='VIDEO'){mediaElement.pause();mediaElement.removeAttribute('src');mediaElement.load();}
    mediaElement?.remove();mediaElement=null;
  }
  function show(i,focus=false){
    if(i<0 || i>=media.length)return;
    stopMedia();index=i;const item=media[i];failure.hidden=true;
    el('viewer-title').textContent=item.title;
    el('viewer-album').textContent=album.title.replace(/\.$/,'');
    el('viewer-caption').textContent=item.alt+(item.type==='video'?' Silent film.':'');
    el('viewer-counter').textContent=(i+1)+' / '+media.length;
    buttons.prev.disabled=i===0;buttons.next.disabled=i===media.length-1;
    const download=el('viewer-download');download.hidden=!item.download;
    if(item.download){download.href=item.download.url;download.download='FORM-'+album.slug+'-'+item.id+(item.type==='video'?'.mp4':'.jpg');download.textContent=item.type==='video'?'Save film ↓':'Save photo ↓';}
    el('viewer-share-fallback').hidden=true;status('viewer-status','');
    const node=document.createElement(item.type==='video'?'video':'img');mediaElement=node;
    if(item.type==='video'){node.controls=true;node.playsInline=true;node.preload='metadata';node.poster=item.preview.url;node.setAttribute('aria-label',item.alt);}
    else {node.alt=item.alt;node.decoding='async';}
    node.addEventListener('error',()=>{if(node!==mediaElement)return;node.hidden=true;failure.hidden=false;status('viewer-status','File could not load. Try again or use the save link.');});
    node.src=item.full.url;
    stage.prepend(node);
    if(!dialog.open){dialog.showModal();document.body.style.overflow='hidden';buttons.close.focus();}
    else if(focus)buttons.close.focus();
  }
  function change(i){if(i<0||i>=media.length)return;history.replaceState(history.state,'',frameHash(i));show(i);}
  function closeUI(){
    stopMedia();index=-1;document.body.style.overflow='';if(dialog.open)dialog.close();
    const restore=invoking;invoking=null;if(restore?.isConnected)restore.focus({preventScroll:true});
  }
  function close(){
    if(!dialog.open)return;
    const back=ownsHistory;ownsHistory=false;closeUI();
    if(back)history.back();else history.replaceState(history.state,'',location.pathname+location.search);
  }
  function sync(){
    const i=fromHash();if(i<0){closeUI();return;}
    if(!dialog.open)invoking=document.querySelector('[data-frame="'+media[i].id+'"]');
    show(i);
  }
  document.querySelectorAll('[data-frame]').forEach(link=>link.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const i=media.findIndex(m=>m.id===link.dataset.frame);if(i<0)return;
    event.preventDefault();invoking=link;ownsHistory=true;
    history.pushState({...history.state,trackGallery:true},'',frameHash(i));show(i,true);
  }));
  buttons.close.addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('keydown',event=>{
    if(event.target.tagName==='VIDEO'||event.target.tagName==='INPUT')return;
    if(event.key==='ArrowLeft'){event.preventDefault();change(index-1);}
    if(event.key==='ArrowRight'){event.preventDefault();change(index+1);}
  });
  buttons.prev.addEventListener('click',()=>change(index-1));buttons.next.addEventListener('click',()=>change(index+1));
  el('viewer-retry').addEventListener('click',()=>show(index,true));
  window.addEventListener('popstate',()=>{ownsHistory=Boolean(history.state?.trackGallery);sync();});
  window.addEventListener('hashchange',sync);
  stage.addEventListener('pointerdown',event=>{
    pointer=(event.isPrimary&&event.pointerType!=='mouse'&&media[index]?.type==='photo')?{x:event.clientX,y:event.clientY,id:event.pointerId}:null;
  });
  stage.addEventListener('pointerup',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer=null;
    if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5)change(index+(dx<0?1:-1));
  });
  stage.addEventListener('pointercancel',()=>{pointer=null;});
  async function share(link,title,statusId,boxId){
    status(statusId,'');el(boxId).hidden=true;
    if(navigator.share){
      try{await navigator.share({title,url:link});return;}
      catch(e){if(e.name==='AbortError')return;}
    }
    try{if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(link);status(statusId,'Link copied.');}
    catch{const box=el(boxId),input=box.querySelector('input');box.hidden=false;input.value=link;input.focus();input.select();status(statusId,'Copy the link below to share.');}
  }
  el('share-album').hidden=false;
  el('share-album').addEventListener('click',()=>share(canonical,album.title,'track-status','track-share-fallback'));
  el('viewer-share').addEventListener('click',()=>share(canonical+frameHash(index),album.title+' '+media[index].title,'viewer-status','viewer-share-fallback'));
  // A shared frame belongs to the album, not to a second, disconnected social page.
  sync();
})();
