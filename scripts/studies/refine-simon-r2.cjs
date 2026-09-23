'use strict';
// Final small, idempotent presentation pass; never authors a workout.
module.exports=function refine(html){
  if(!html.includes('STUDY003_TABLET_HEADER'))html=html.replace('</style>',`/* STUDY003_TABLET_HEADER */
@media(min-width:761px) and (max-width:1050px){
 .mast__in{flex-wrap:wrap;gap:12px 18px}
 .mast__nav{order:3;width:100%;justify-content:space-between;border-top:1px solid var(--rule);padding-top:9px}
 .mast__logo{width:96px}.ctl{margin-left:auto}
 .btn-follow{font-size:10px;padding:11px 14px}
}
.keys,.tools>div,.keys>div{min-width:0}.keys .lbl{white-space:normal}
</style>`);
  const start=html.indexOf('const T = '),end=html.indexOf('const MON = ',start);
  if(start<0||end<start)throw Error('Translation source missing');
  const T=JSON.parse(html.slice(start+'const T = '.length,end).trim().replace(/;$/,''));
  T['hx.recorded']=['Recorded intervals','Intervalles enregistrés'];
  T['hx.partial']=['Partial recording','Enregistrement partiel'];
  T['ref.provisional']=['Provisional','Provisoire'];
  html=html.slice(0,start)+'const T = '+JSON.stringify(T,null,1)+';\n'+html.slice(end);
  html=html.replace('<span class="pill ok">Recorded intervals</span>','<span class="pill ok" data-i="hx.recorded">Recorded intervals</span>');
  html=html.replace('<span class="pill wait">Partial recording</span>','<span class="pill wait" data-i="hx.partial">Partial recording</span>');
  html=html.replace('<span class="pill wait">Provisional</span>','<span class="pill wait" data-i="ref.provisional">Provisional</span>');
  return html;
};
