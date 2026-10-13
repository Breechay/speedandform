/* Site menu: enhances the :target panel with a real open state, focus handling, Escape and scroll lock. Never stores or sends anything. */
(function(){"use strict";
var menu=document.getElementById("site-menu");if(!menu)return;
var toggles=[].slice.call(document.querySelectorAll('[aria-controls="site-menu"]')),panel=menu.querySelector(".sf-menu-panel"),close=menu.querySelector(".sf-menu-close"),scrim=menu.querySelector(".sf-menu-scrim"),root=document.documentElement,last=null,background=[],closingTimer=null;
function focusables(){return [].slice.call(panel.querySelectorAll("a[href],button,input")).filter(function(e){return !e.disabled&&e.offsetParent!==null;});}
function isolate(on){
 if(on){background=[].slice.call(document.body.children).filter(function(e){return e!==menu&&!/^(SCRIPT|STYLE|LINK)$/.test(e.tagName);}).map(function(e){var prior=e.inert;e.inert=true;return {element:e,prior:prior};});}
 else{background.forEach(function(item){item.element.inert=item.prior;});background=[];}
}
function finishClose(){
 clearTimeout(closingTimer);closingTimer=null;menu.classList.remove("is-closing");menu.inert=false;
 root.classList.remove("sf-menu-locked");isolate(false);
 if(last&&last.isConnected&&last.focus)last.focus({preventScroll:true});
}
function open(from){
 if(menu.classList.contains("is-open"))return;
 if(menu.classList.contains("is-closing")){clearTimeout(closingTimer);menu.classList.remove("is-closing");}else{isolate(true);last=from||document.activeElement;}
 menu.inert=false;menu.classList.add("is-open");menu.removeAttribute("aria-hidden");root.classList.add("sf-menu-locked");
 toggles.forEach(function(t){t.setAttribute("aria-expanded","true");});close.focus({preventScroll:true});
 // WebKit can defer focus while a previously hidden drawer and inert backdrop
 // are being resolved. Retry after layout only if focus is still outside it.
 requestAnimationFrame(function(){if(menu.classList.contains("is-open")&&!menu.contains(document.activeElement))close.focus({preventScroll:true});});
}
function shut(immediate){
 if(!menu.classList.contains("is-open")){if(immediate&&menu.classList.contains("is-closing"))finishClose();return;}
 menu.classList.remove("is-open");menu.setAttribute("aria-hidden","true");menu.inert=true;
 toggles.forEach(function(t){t.setAttribute("aria-expanded","false");});
 if(location.hash==="#site-menu")history.replaceState(null,"",location.pathname+location.search);
 if(immediate||matchMedia("(prefers-reduced-motion: reduce)").matches){finishClose();return;}
 menu.classList.add("is-closing");closingTimer=setTimeout(finishClose,450);
}
panel.addEventListener("transitionend",function(e){if(e.target===panel&&e.propertyName==="transform"&&menu.classList.contains("is-closing"))finishClose();});
toggles.forEach(function(t){t.setAttribute("role","button");t.setAttribute("aria-expanded","false");t.addEventListener("click",function(e){e.preventDefault();open(t);});t.addEventListener("keydown",function(e){if(e.key===" "){e.preventDefault();if(!e.repeat)open(t);}});});
close.addEventListener("click",function(e){e.preventDefault();shut();});
scrim.addEventListener("click",function(e){e.preventDefault();shut();});
menu.addEventListener("keydown",function(e){if(e.key==="Escape"){e.preventDefault();shut();return;}
 if(e.key!=="Tab")return;var f=focusables();if(!f.length)return;var first=f[0],end=f[f.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}});
panel.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(a&&a!==close&&a.getAttribute("href")!=="#site-menu")shut(true);});
root.classList.add("sf-menu-enhanced");menu.setAttribute("aria-hidden","true");
window.addEventListener("pageshow",function(e){if(e.persisted)shut(true);});
window.addEventListener("hashchange",function(){if(location.hash==="#site-menu")open(toggles[0]);else shut();});
if(location.hash==="#site-menu"){history.replaceState(null,"",location.pathname+location.search);open(toggles[0]);}
}());
