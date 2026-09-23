// Scoped, idempotent source authoring. No athlete assignment or completed record writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../plans/adrian-nutrition-phase-01');
const file=path.join(dir,'index.html'); let html=fs.readFileSync(file,'utf8');
if(html.includes('data-shopping-revision="1.4"')){console.log('Adrian shopping v1.4 already authored');process.exit(0);}
assert(html.includes('v1.4'),'Expected reviewed v1.4 source');
const icons={bread:'<path d="M6 10C2 5 7 2 16 2s14 3 10 8v18H6Z"/><path d="M10 11v12m6-12v12m6-12v12"/>',jar:'<rect x="7" y="8" width="18" height="21" rx="4"/><path d="M9 8V3h14v5M7 14h18M7 23h18"/>',fruit:'<path d="M16 10C5 3 1 16 9 27c3 4 6 0 7 1 1-1 4 3 7-1 8-11 4-24-7-17Zm0 0c-1-5 1-7 4-8m-4 5C9 7 9 3 9 3s6-1 7 4Z"/>',milk:'<path d="M8 10 12 3h11l3 7v19H8ZM8 10h18M12 3l3 7v19m0-19 8-7"/>',pasta:'<rect x="6" y="3" width="20" height="26" rx="2"/><path d="M10 10h12m-12 5h12m-12 5h12m-12 5h12"/>',beef:'<path d="M6 12c1-6 11-10 17-6s6 13 0 19S6 29 4 22s1-7 2-10Z"/><path d="m10 14 3 5 6-8m-7 13 7-7m-1 10 6-6"/>',can:'<ellipse cx="16" cy="5" rx="10" ry="3"/><path d="M6 5v21c0 4 20 4 20 0V5M6 13h20M6 23h20"/>',leaf:'<path d="M7 26C-1 15 12 3 28 4c0 17-11 27-21 22ZM6 28 24 9M12 21l-1-9m7 3 7 1"/>',box:'<rect x="4" y="9" width="24" height="18" rx="3"/><path d="M3 9V5h26v4M10 15h12m-12 5h8"/>',bag:'<path d="M6 11h20l3 17H3ZM11 11V7a5 5 0 0 1 10 0v4M9 17h14"/>',thermo:'<path d="M13 19V5a3 3 0 0 1 6 0v14a6 6 0 1 1-6 0ZM16 8v14m7-14h4m-4 6h4"/>',shaker:'<path d="m7 9 3 20h12l3-20ZM7 9V5h18v4M17 5V2h6v3M12 16h8m-7 6h6"/>',fork:'<path d="M6 3v9c0 5 8 5 8 0V3M10 3v26M25 3v26m0-26c-6 5-6 14 0 14"/>',snow:'<path d="M16 2v28M4 9l24 14M4 23 28 9M12 5l4 4 4-4m-8 22 4-4 4 4M5 14l5-1-1-5m18 10-5 1 1 5M5 18l5 1-1 5m18-10-5-1 1-5"/>'};
const icon=n=>`<svg class="shop-icon" viewBox="0 0 32 32" aria-hidden="true"><use href="#shop-${n}"/></svg>`;
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const groups=[['Breakfast + backup sandwiches','Stock your first week. Restaurant breakfasts replace home breakfasts.',[
['bread','bread','Bread','22 slices','10 workday + 4 weekend breakfast slices + 8 for four backup sandwiches. Freeze surplus.'],
['pb','jar','Peanut butter','At least 352 g','One usual jar can cover this; check what is already at home.'],
['bananas','fruit','Bananas','7','Keep your established pre-long-run food rather than adding this twice.'],
['oranges','fruit','Navel oranges','7','Unused weekend fruit carries forward.'],
['milk','milk','Whole milk','1 gallon','Up to 7 shakes + four 8 fl oz backups use 116 of 128 fl oz. Restock separately for household use.'],
['jam','jar','Jam','1 small jar','For the sandwich backup; no extra long-run toast is prescribed.'],
['whey','shaker','Thorne chocolate whey','Up to 7 servings','One container lasts beyond this week. Check label and lot before first use.']]],
['Your first two cooks','Sunday: Recipe 01, four portions. Wednesday: Recipe 02, two portions.',[
['spaghetti','pasta','Dry spaghetti','1 × 16 oz box','Use the full box Sunday.'],
['penne','pasta','Dry penne','1 × 16 oz box','Use half Wednesday; keep the other half dry in the cupboard.'],
['beef','beef','93% lean ground beef','2 × 1 lb packages','Cook 1 lb Sunday. Split and freeze the second package into two ½ lb portions. Thaw one in the fridge Tuesday morning.'],
['tomatoes','can','Crushed tomatoes','2 × 28 oz cans','One can Sunday; half a can Wednesday. Freeze the unused half promptly in a food-safe container.'],
['onion','fruit','Yellow onions','2 medium','Use 1 Sunday and ½ Wednesday.'],
['garlic','leaf','Garlic','1 bulb; at least 6 cloves','Use 4 cloves Sunday and 2 Wednesday.'],
['paste','can','Tomato paste','1 small tube or can','At least 4½ tablespoons for the two cooks. Freeze remaining paste in tablespoon portions.'],
['oil','jar','Olive oil','Have 1½ tbsp available','Check home before buying a bottle.'],
['seasoning','leaf','Italian seasoning, salt + pepper','Check the cupboard','Two cooks use 1½ tsp seasoning; follow the recipe table for salt and pepper.'],
['parmesan','can','Finely grated Parmesan','At least 20 g','Recipe 01 Sunday. Save the rest according to its label.'],
['cream','milk','Heavy cream','Small carton; use ¼ cup','60 mL for Wednesday’s half batch. Follow the opened-carton storage label.']]],
['Dinner + the next variation','Keep the household meals. Only buy the finish for the recipe you will cook.',[
['beans','leaf','Green beans','7 cooked cups','Frozen is fine. Follow the bag’s cooking instructions.'],
['cheddar','can','Cheddar — when you choose Recipe 03','112 g full / 56 g half','Not needed for your first two cooks. Leave this unchecked until you need it.']]]];
const days=[['Mon','box','One box','Sunday batch','solid'],['Tue','box','One box','Thaw ½ lb beef','solid'],['Wed','box','One box','Cook 2 tonight','solid'],['Thu','box','One box','Wednesday batch','outline'],['Fri','box','One box','Wednesday batch','outline'],['Sat','fork','Family meals','Usual gel routine','family'],['Sun','fork','Family meals','Check next prep','family']];
const kit=[['box','Brilliance 4.7-cup','5 main containers + lids','https://www.rubbermaid.com/food-storage/meal-prep-containers/brilliance-food-storage-salad-container-medium-deep-4.7-cup-clear/SP_2551583.html'],['bag','PackIt Hampton','1 freezable bag','https://packit.com/products/freezable-hampton-lunch-bag'],['thermo','ThermoPop 2','1 food thermometer','https://www.thermoworks.com/products/thermopop-2'],['shaker','BlenderBottle Classic','1 × 28 oz shaker','https://www.blenderbottle.com/products/classic']];
const shopping=`<details id="shopping"><summary>Your shopping list · first week</summary><div class="inside shop-wide"><section class="shop" data-shopping-revision="1.4" aria-label="Your shopping list">
<svg class="shop-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="0" height="0"><defs>${Object.entries(icons).map(([k,v])=>`<symbol id="shop-${k}" viewBox="0 0 32 32">${v}</symbol>`).join('')}</defs></svg>
<div class="shop-intro"><p class="label">Check home. Buy the gaps.</p><p>Check the fridge, freezer and cupboards with your parents first. Tick anything you already have or put in your basket.</p></div>
<div class="shop-plan"><div><span>Before Monday</span><strong>Sunday · cook 4</strong><p>3 workday boxes + 1 frozen backup.</p></div><div><span>Midweek</span><strong>Wednesday · cook 2</strong><p>Half batch for Thursday + Friday.</p></div></div>
<div class="shop-week" aria-label="First week meal and preparation map">${days.map(([day,ic,title,note,cls])=>`<div class="shop-day ${cls}"><b>${day}</b>${icon(ic)}<strong>${title}</strong><span>${note}</span></div>`).join('')}</div>
<div class="shop-legend"><span><i class="shop-dot solid"></i> Sunday batch</span><span><i class="shop-dot"></i> Wednesday batch</span><span>${icon('snow')} 1 backup, not an extra required meal</span></div>
<p class="shop-mobile-events"><strong>Tuesday morning:</strong> thaw ½ lb beef in the fridge. <strong>Wednesday evening:</strong> cook two boxes. <strong>Sunday:</strong> check your backup before the next cook.</p>
<p class="shop-cycle">This strip is your first cycle. A backup still in the freezer changes the next cook: <a href="#prep-cycle">open the carryover rule</a>.</p>
<div class="shop-toolbar"><p id="shop-status" role="status" aria-live="polite">Tick items as you check home or shop.</p><button type="button" id="shop-clear">Clear checks</button></div><p class="shop-storage" id="shop-storage-note">Checks stay on this browser only. They do not send a check-in to Brice or sync with Forge.</p>
${groups.map(([title,intro,items])=>`<fieldset class="shop-group"><legend>${title}</legend><p>${intro}</p><div class="shop-items">${items.map(([key,ic,title,amount,note])=>`<label class="shop-item" for="shop-check-${key}"><input id="shop-check-${key}" type="checkbox" data-shop-key="${key}">${icon(ic)}<span class="shop-item-copy"><span class="shop-item-line"><strong>${esc(title)}</strong><span>${esc(amount)}</span></span><small>${esc(note)}</small></span></label>`).join('')}</div></fieldset>`).join('')}
<div class="shop-reminder">${icon('fork')}<p><strong>Keep your existing gels.</strong> No GU switch or new gel schedule. Work lunch and family dinner stay in place; replenish backup ingredients after using them.</p></div>
<div class="shop-kit"><h3>Buy once. Use what you already own.</h3><p>Tap a product for its exact page. Check the <a href="#kit">fit and use instructions</a> before buying.</p><div class="shop-kit-grid">${kit.map(([ic,name,qty,url])=>`<a href="${url}" target="_blank" rel="noopener">${icon(ic)}<strong>${name}</strong><span>${qty} ↗</span></a>`).join('')}<a href="#kit">${icon('jar')}<strong>Home essentials</strong><span>Tape, marker, freezer bags + cooking tools ↓</span></a></div></div>
<noscript><p>Your list still works without JavaScript, but checks will not be saved after a reload.</p></noscript></section></div></details>`;
function replaceOne(a,b){assert.equal(html.split(a).length-1,1,'Missing/duplicate anchor: '+a.slice(0,90));html=html.replace(a,b);}
replaceOne('</head>','<link rel="stylesheet" href="./shopping.css?v=1.4">\n</head>');
replaceOne('</body>','<script src="./shopping.js?v=1.4" defer></script>\n</body>');
replaceOne('<p>Eat consistently. Learn to cook food you look forward to. Keep your family meals.</p>','<p>Eat consistently. Learn to cook food you look forward to. Keep your family meals.</p><p class="pills"><a class="pill" href="#recipes">See the 3 recipes ↓</a><a class="pill" href="#shopping">Open shopping checklist ↓</a></p>');
replaceOne('https://eatinginaninstant.com/wp-content/uploads/2023/02/ip-ground-beef-pasta-3-1200.jpg','https://eatinginaninstant.com/wp-content/uploads/2023/02/ip-ground-beef-pasta-1200-768x1083.jpg');
replaceOne('rather than delaying all food.</p>','rather than delaying all food.</p><p class="small">Before your first new powder serving, complete the <a href="#powder">label, lot and ingredient check</a>. Keep breakfast even if the powder is not ready.</p>');
replaceOne('<details id="base-method" open><summary>The six steps that make the sauce</summary>','<details id="base-method"><summary>Four steps that make the sauce</summary>');
replaceOne('Make the sauce using the six shared steps below.','Make the sauce using <a href="#base-method">the four shared steps below</a>.');
html=html.replaceAll('Make the shared sauce.','Make <a href="#base-method">the shared sauce</a>.');
const oldSteps='<li><strong>Cook pasta.</strong> While sauce simmers, bring a separate pot of water to a boil. Use 4 quarts water + 2 teaspoons fine table salt for a full batch, or 2 quarts + 1 teaspoon for a half. Follow the pasta package time. Save a mug of pasta water before draining.</li><li><strong>Finish.</strong> Follow your chosen recipe card. Taste using a clean spoon. If thick, add water a tablespoon at a time. If watery, simmer a little longer before adding cream or cheese. Add extra salt only a small pinch at a time after tasting.</li></ol>';
replaceOne(oldSteps,'</ol><p><strong>Then follow your chosen recipe card.</strong> For its separate pasta step, use 4 quarts boiling water + 2 teaspoons fine table salt for a full batch, or 2 quarts + 1 teaspoon for a half. Follow the pasta package time and save a mug of cooking water before draining.</p><p><strong>Taste and adjust:</strong> use a clean spoon. If the sauce is too thick, add water a tablespoon at a time. If watery, simmer longer before adding cream or cheese. Add extra salt only a small pinch at a time after tasting.</p>');
assert.equal((html.match(/<details id="shopping">/g)||[]).length,1);
html=html.replace(/<details id="shopping">[\s\S]*?<\/details>/,shopping);
fs.writeFileSync(file,html);
const manifestFile=path.join(dir,'review-context.json'),manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
manifest.shopping={revision:'1.4',static_html:true,check_state:'Browser-local only; no Forge sync or adherence receipt',first_cycle:'Five workday meals and one frozen backup; not eight mandatory meals',starting_stock:{bread_slices:22,peanut_butter_g:352,milk_fl_oz:128,maximum_prescribed_home_shakes_fl_oz:84,four_backup_milk_fl_oz:32},existing_gels_unchanged:true};
fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
console.log('Authored Adrian static shopping, four-step sauce method and unchanged training-source manifest.');
