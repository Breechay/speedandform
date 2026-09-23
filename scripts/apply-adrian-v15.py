"""Materialize the reviewed v1.5 handoffs. No training, account or calendar writes."""
from pathlib import Path
from bs4 import BeautifulSoup as BS
from PIL import Image
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
import json,hashlib
R=Path(__file__).resolve().parents[1];D=R/'plans/adrian-nutrition-phase-01';f=D/'index.html'
s=BS(f.read_text(),'html.parser')
if s.html.get('data-nutrition-version')=='1.5':
 print('v1.5 already materialized');raise SystemExit(0)
assert hashlib.sha256(f.read_bytes()).hexdigest()=='a168a0e6f0edb6e91b9bb7c01aa27bdf937897abf7d9cd1587aa6b05247bb469','Source changed: reconcile before applying.'
def frag(t):return BS(t,'html.parser')
def put(el,t):
 el.clear()
 for x in list(frag(t).contents):el.append(x)
def add(el,t):
 for x in list(frag(t).contents):el.append(x)
def node(time,title,body='',detail='',at=None,id=None):
 attrs=(f' data-at="{at}"' if at is not None else '')+(f' id="{id}"' if id else '')
 return f'<li{attrs}><span class="t">{time}</span><span class="dot" aria-hidden="true"></span><div class="what"><b>{title}</b>'+('<p>'+body+'</p>' if body else '')+detail+'</div></li>'
def detail(title,text):return '<details><summary>'+title+'</summary><p>'+text+'</p></details>'
fork='<div class="fork"><div><span>Lunch finished by 1:30</span>At 3:30: a box or the sandwich.</div><div><span>Later lunch, still full</span>Wait. Keep dinner. Hungry later? Sandwich.</div></div>'
dinner='4 to 6 oz cooked meat, 1½ cups cooked rice, ½ cup beans, 1 cup cooked green beans.'
work=''.join([
 node('Before<small>your run</small>','1 banana','1 medium banana, 20 to 30 minutes before your run. Keep your usual long-run food.'),
 node('Morning','Assigned sessions','Run and lift only as already scheduled.',detail('Hungry between sessions','Eat one slice of your breakfast bread in the gap.')),
 node('After<small>training</small>','Shake at home','1 labeled serving Thorne chocolate whey + 12 fl oz whole milk.',detail('Before your first shake','Send the label and lot photo. Complete the <a href="#powder">product check</a> before first use.')),
 node('By 8:00','Bread, peanut butter, orange','2 slices (about 80 g), 2 tbsp peanut butter (32 g), 1 navel orange. Pack when needed.',at=480),
 node('12:30','Work lunch','Eat the whole meal, not only the meat.',at=750),
 node('3:30','Your pasta box','Carry chilled, then use your work fridge. Stir and reheat to 165°F throughout.',detail('Box crowding out dinner','Tell Brice after your first three boxes. Keep dinner while the portion is reviewed.'),at=930),
 node('6:30','Family dinner',dinner+' Pasta replaces rice and beans.',at=1110),
 node('Evening','Pack tomorrow','Bag in the freezer. Tomorrow’s box in the fridge. Bread and orange ready.',at=1230),
 node('Night','Phone away','First 3 nights: 11:00 phone away, 11:30 lights out. <a href="#sleep">Follow your bedtime steps</a>.',at=1380)])
breakfast='<div class="who"><div><span>At home</span>1 shake, 2 bread slices, 2 tbsp peanut butter, 1 orange.</div><div><span>Out with your parents</span>3 eggs, 2 pancakes, a glass of whole milk.</div></div>'
sat=''.join([
 node('All day','Photo day','Photograph your food and drinks, including gels and restaurant meals.'),
 node('Morning','Your long run','Keep your usual gels, food and water. Drink to thirst. <a href="#sources">Source</a>.',id='long-run'),
 node('After','Breakfast',detail=breakfast+detail('Breakfast out is more than an hour away','Have your shake first. Count it as part of breakfast; no second shake later.')),
 node('Lunch','Burger or Cuban meal','At home: a safe backup box, or <a href="#fallback">the sandwich + milk</a>.'),
 node('3:30','Your afternoon meal',detail=fork,at=930),
 node('6:30','Dinner','Your usual nuggets + 1½ cups cooked rice + 1 cup cooked green beans.',detail('Nugget portion','Follow package cooking instructions. Send the label and plated meal before we set a count.'),at=1110),
 node('Night','Same bedtime step','Keep weekend sleep timing close to your weekday routine.',at=1380)])
sun=''.join([
 node('Morning','Assigned sessions only','No run today? Eat your banana with breakfast.'),
 node('Breakfast<small>+ lunch</small>','Home or out',detail=breakfast+detail('Lunch','Your usual burger or Cuban meal. At home: a safe box or the sandwich. Restaurant meals replace home meals.')),
 node('Before<small>shopping</small>','Check the freezer','A backup changes this week’s cooking. <a href="#carryover">Choose your path</a>.'),
 node('3:30','Your afternoon meal',detail=fork,at=930),
 node('6:30','Family dinner',dinner+' Pasta replaces rice and beans.',at=1110),
 node('7:30<small>p.m.</small>','Cook this week’s boxes','Follow the freezer check. Label, chill and pack Monday’s breakfast. Start earlier when needed.',at=1170),
 node('Night','Phone away','Use your current <a href="#sleep">bedtime step</a>.',at=1380)])
rail='<section class="rail" id="your-day" aria-labelledby="rail-title"><h2 id="rail-title">Your day, start to finish.</h2><p class="lede">Pick your day. Tap for details.</p><div class="rail-tabs" role="tablist" aria-label="Day type">'
for key,title in [('work','Workday'),('sat','Saturday'),('sun','Sunday')]:rail+=f'<button type="button" role="tab" id="tab-{key}" aria-controls="day-{key}" aria-selected="'+('true' if key=='work' else 'false')+'" tabindex="'+('0' if key=='work' else '-1')+'">'+title+'</button>'
rail+='</div>'
for key,body in [('work',work),('sat',sat),('sun',sun)]:rail+=f'<div class="rail-day" id="day-{key}" role="tabpanel" aria-labelledby="tab-{key}" tabindex="0"'+(' hidden' if key!='work' else '')+'><ol>'+body+'</ol></div>'
rail+='<span id="weekends" class="anchor-alias" aria-hidden="true"></span></section>'
week='''<section class="this-week" id="this-week"><h2>This week</h2><div class="week-actions"><a href="#carryover"><b>Sunday</b><span>Check freezer. Cook 4.</span></a><a href="#raw-beef"><b>Tuesday</b><span>Thaw ½ lb beef.</span></a><a href="#carryover"><b>Wednesday</b><span>Cook 2, unless using backups.</span></a></div><div class="phone-actions"><a class="pill" href="./adrian-prep-reminders.ics">Add prep reminders</a><button type="button" class="pill note-button" data-note="start">Prepare start text</button><button type="button" class="pill note-button" data-note="day7">Prepare day-7 text</button></div><p class="small phone-hint">Safari: Share → Add to Home Screen. Calendar alerts need your approval.</p><div id="text-draft" hidden><label for="note-copy">Choose Brice in Messages, then send.</label><textarea id="note-copy" rows="6" readonly></textarea><div class="phone-actions"><a id="note-sms" class="pill" href="sms:">Open Messages</a><button type="button" class="pill" id="note-copy-button">Copy text</button></div><p id="note-help" class="small" role="status"></p></div></section>'''
# Extract stable existing content before removing the old two-column layout.
recipes=s.select_one('#recipes').extract();foot=s.select_one('.footer-details').extract();end=s.select_one('footer.footer').extract();sleep=s.select_one('#sleep').extract()
s.select_one('.grid').decompose();s.select_one('#weekends').decompose();s.select_one('.anchors').decompose()
for p in s.select('.hero>p:not(.intro)'):p.decompose()
s.select_one('.masthead').insert_after(frag('<p class="whats-new"><b>New in v1.5</b> Your day, cooking cards, freezer check and simpler shopping.</p>').p)
# Recipe cards and images stay, while explanations become actions.
for p in recipes.select(':scope>p'):
 if 'Start with' in p.get_text():put(p,'Start with 01. Next cook, try 02. Then try 03.')
 else:p.decompose()
for card in recipes.select('.recipe-card'):
 card['data-athlete-photo']=card['id'];a=card.figcaption.a.extract();put(card.figcaption,'Photo: ');card.figcaption.append(a)
put(recipes.select_one('#recipe-01 .inside'),'<p><b>Spaghetti + 20 g Parmesan.</b> Half batch: 10 g Parmesan.</p><p><a href="#ingredients">Start with the ingredients and sauce steps</a>.</p><p>Toss cooked pasta, sauce and Parmesan over low heat for 1 minute. Loosen with pasta water, 1 tbsp at a time.</p><p><b>Look for:</b> sauce clinging to the strands.</p>')
put(recipes.select_one('#recipe-02 .label'),'Your Instant Pot · Sauté');put(recipes.select_one('#recipe-02 .caption>p:last-child'),'Make the sauce in your Instant Pot, with the lid off.')
put(recipes.select_one('#recipe-02 .inside'),'<p><b>Penne + ½ cup / 120 mL cream.</b> Half batch: ¼ cup / 60 mL.</p><p><a href="#ingredients">Use the full or half ingredients</a>.</p><ol><li>Select <b>Sauté, lid off</b>. Soften onion, brown beef to 160°F, then add garlic, seasoning and paste.</li><li>Add tomatoes, water, salt and pepper. Simmer gently on low Sauté for 20 minutes; stir often.</li><li>Boil penne separately. Save a mug of pasta water, then drain.</li><li>Press <b>Cancel</b>. Stir cream into sauce, then combine with pasta. Loosen with saved water if needed.</li></ol><p>Keep the lid off. Do not use pressure mode for this recipe.</p>')
put(recipes.select_one('#recipe-03 .inside'),'<p><b>Penne + 112 g shredded cheddar.</b> Half batch: 56 g cheddar.</p><p><a href="#ingredients">Start with the ingredients and sauce steps</a>.</p><p>Combine cooked pasta and sauce. Turn off heat. Stir in cheddar in 3 handfuls, adding pasta water if needed.</p><p><b>Look for:</b> smooth, not oily. Warm gently; never boil the cheese.</p>')
base=recipes.select_one('#recipe-base').extract();base.h3.decompose();put(base.select_one(':scope>p'),'<b>Sunday: 4 portions. Wednesday: 2 portions.</b> Follow the freezer check before cooking.')
names=['Dry pasta','93% lean beef, raw','Crushed tomatoes','Diced onion','Chopped garlic','Tomato paste','Olive oil','Sauce water','Italian seasoning','Fine salt','Black pepper','Recipe finish']
for row,name in zip(base.select('tbody tr'),names):row.td.string=name
for td in base.select('td'):
 text=td.get_text().replace('tablespoons','tbsp').replace('tablespoon','tbsp').replace('teaspoons','tsp').replace('teaspoon','tsp')
 if text.startswith('Use the amount') or text.startswith('Use its half'):text='On your recipe card'
 td.string=text
steps=[('Set up','Chop first','10 min',600,'Onion and garlic chopped before you open the beef.','First cook: ask a parent to show you the knife and stove.'),('1','Soften','5 min',300,'Oil, medium heat, onion. Stir.','Soft and see-through, not black.'),('2','Brown','160°F',None,'Spread beef. Leave 2 minutes, then break into crumbles.','Check a few thick clumps. Color is not the test.'),('3','Build','1 min',60,'Garlic, seasoning, tomato paste. Stir.','Paste darkens a little. No burning.'),('4','Simmer','20 min',1200,'Tomatoes, water, salt, pepper. Gentle bubbles, lid partly open.','Stir every few minutes. Scrape up brown bits.')]
cook='<section class="cook"><div class="cook-bar" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><p class="cook-key">Sauce simmers · pasta boils alongside</p><ol class="cook-steps">'
for num,title,label,secs,body,cue in steps:
 clock=f'<button type="button" class="cook-timer" data-label="{label}" data-seconds="{secs}">Start {label}</button>' if secs else '<span class="clock hot">160°F</span>'
 cook+=f'<li><span class="n">{num}</span><b>{title}</b>{clock}<p>{body}</p><p class="cue">{cue}</p></li>'
cook+='</ol><div class="cook-end"><div><b>Meanwhile: pasta</b>4 quarts water + 2 tsp salt. Half batch: 2 quarts + 1 tsp. Package time. Save a mug of water.</div><div><b>Finish</b>Follow your card: Parmesan, cream or cheddar.</div><div><b>Divide and chill</b>4 equal portions, or 2 for a half batch. Label. Into the fridge within 2 hours, or 1 hour above 90°F.</div></div><p class="small" id="cook-timer-note" role="status">Use your phone timer when leaving this page. Check temperature, not just time.</p><p class="small">Separate raw-beef tools. Wash hands and the probe. Do not rinse raw meat.</p></section>'
put(base.select_one('#base-method'),'<summary>Your sauce, step by step</summary><div class="inside">'+cook+'</div>')
last=base.select('details')[-1]
if 'challenge' in last.summary.get_text():put(last.select_one('.inside'),'<p>Photograph your first batch. Tell Brice one thing you would change next time.</p>')
wrap=frag('<details id="ingredients"><summary>Ingredients and cooking steps</summary><div class="inside"></div></details>').details
for el in list(base.contents):wrap.select_one('.inside').append(el)
recipes.append(wrap)
# Freezer check replaces prose and preserves both hash aliases.
def strip(items):return '<div class="strip">'+''.join('<div><b>'+d+'</b><i class="box '+kind+'" aria-hidden="true"></i><span>'+text+'</span></div>' for d,text,kind in items)+'</div>'
carry='<details id="prep-cycle"><summary>Freezer check</summary><div class="inside"><section class="carry" id="carryover"><h3>Is a backup still frozen?</h3><div class="paths"><div class="path"><b>No</b><p>Cook 4 Sunday, 2 Wednesday. Freeze one new backup.</p>'+strip([('Mon','Sun',''),('Tue','Sun',''),('Wed','Sun',''),('Thu','Wed',''),('Fri','Wed','')])+'</div><div class="path"><b>Yes</b><p>Thaw the backup Sunday for Monday. Cook 4 Sunday; skip Wednesday.</p>'+strip([('Mon','Backup','bk'),('Tue','Fridge',''),('Wed','Fridge',''),('Thu','Frozen','frz'),('Fri','Frozen','frz')])+'<p>Freeze Thursday/Friday boxes promptly Sunday. Move each to the fridge the night before.</p></div></div><p><b>Starting midweek:</b> start breakfast now. Use the <a href="#fallback">sandwich</a> until your next cooking slot.</p><div id="raw-beef"><h3>Tuesday: thaw Wednesday’s beef.</h3><p>Split the second 1 lb pack into two ½ lb / 227 g bags and freeze on shopping day.</p><p>Move one to the fridge Tuesday morning, only when Wednesday cooking is needed.</p><p>Raw beef keeps 1–2 days in the fridge. Thaw on a tray in the fridge, never on the counter.</p></div></section></div></details>'
safety='<details id="food-safety"><summary>Food safety</summary><div class="inside"><div class="safety-numbers"><div><b>160°F</b><span>Ground beef</span></div><div><b>165°F</b><span>Reheated meal</span></div><div><b>40°F</b><span>Fridge maximum</span></div></div><p>Into the fridge within 2 hours, or 1 hour above 90°F. Divide into shallow containers; do not wait for a large pot to cool.</p><p>Cooked portions keep 3–4 days refrigerated. Freeze later meals promptly at 0°F or below.</p><p>Add 1 tbsp water, vent the lid, heat and stir. Check 165°F in several spots with a clean thermometer.</p><p>Never leave the thermometer in a running microwave. Open the lid away from your face. <a href="#sources">Sources</a>.</p></div></details>'
# Existing sleep steps remain, now behind one line.
sleep.attrs.pop('id',None)
for e in sleep.select('.label,h2,.sleep'):e.decompose()
for d in sleep.select('details'):d.summary.decompose();d.unwrap()
# v1.4 has targets but no explicit step table; render the handed-off sequence.
put(sleep,'<table class="ingredient-table"><thead><tr><th>Nights</th><th>Phone away</th><th>Lights out</th></tr></thead><tbody>'+''.join(f'<tr><td>{n}</td><td>{p}</td><td>{l}</td></tr>' for n,p,l in [('1–3','11:00 p.m.','11:30 p.m.'),('4–6','10:30 p.m.','11:00 p.m.'),('7–9','10:00 p.m.','10:30 p.m.'),('10–12','9:30 p.m.','10:00 p.m.'),('13 onward','9:00 p.m.','9:30 p.m.')])+'</tbody></table><p>Move both times earlier every 3 nights. Charge your phone away from bed.</p><p>Lying awake most nights? Hold that step and tell Brice.</p><p>Keep weekend timing close. At 5:30 waking, the target allows 8 hours in bed, not measured sleep.</p>')
sleepwrap=frag('<details id="sleep"><summary>Your bedtime steps</summary><div class="inside"></div></details>').details;sleepwrap.select_one('.inside').append(sleep)
# Check-in timeline replaces the first four paragraphs, without adding tracking.
review=foot.select_one('#review .inside')
for p in review.find_all('p',recursive=False)[:4]:p.decompose()
for p in list(review.find_all('p',recursive=False)):
 if 'At 2 weeks:' in p.get_text():p.decompose()
ci='<section class="ci"><div class="weigh"><p><b>Weigh in 3 to 4 mornings.</b><small>After the bathroom, before food, same scale. Use the weekly average.</small></p><div class="dots" role="img" aria-label="Monday, Wednesday, Friday; Saturday optional">'+''.join('<span class="'+('on' if day in ['Mon','Wed','Fri'] else 'opt' if day=='Sat' else '')+'"><i></i>'+day+'</span>' for day in ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])+'</div></div><ol><li><b>Day 1</b><p>Text “Started” and the date. Send your powder label and lot before the first shake.</p></li><li><b>Week 1</b><p>One workday and Saturday: photograph everything you eat and drink, gels included.</p></li><li><b>Day 7</b><p>Send your note:</p><div class="chips">'+''.join('<span>'+t+'</span>' for t in ['Breakfasts eaten','3:30 meals','Bed and wake','Hunger','Dinner appetite','Digestion','Soreness','Runs felt','First-cook photo'])+'</div></li><li><b>Day 14</b><p>Brice reviews meals, weight averages, sleep and running. If needed, he gives you one food change.</p></li></ol></section>'
review.insert(0,frag(ci).section)
put(foot.select_one('#fallback .inside'),'<p><b>No prepared box:</b> 2 bread slices, 2 tbsp peanut butter, 1 tbsp jam, 8 fl oz whole milk.</p><p><b>Frozen box:</b> thaw overnight in the fridge. Or microwave-defrost, then immediately reheat to 165°F throughout.</p><p><b>Missed Wednesday cook:</b> backup Thursday, sandwich Friday. Never keep Sunday’s refrigerated pasta until Friday.</p><p><b>No cold transport:</b> carry the sandwich. Buy milk cold at mealtime.</p><p><b>Evening training:</b> have Brice move the large meal away from the session. Keep regular meals on rest days.</p>')
put(foot.select_one('#powder .inside'),'<p><b>Thorne Whey Protein Isolate, Chocolate.</b> One labeled serving: 30.2 g, 21 g protein, 100 calories. Follow your tub.</p><p><a href="https://www.thorne.com/products/dp/whey-protein-isolate-chocolate" target="_blank" rel="noopener">Exact powder</a> · <a href="https://www.nsfsport.com/certified-products/listing-detail.php?id=1513727" target="_blank" rel="noopener">NSF lot check</a></p><p>Send the label and lot photo before first use. No matching lot? Leave out powder until checked; eat breakfast.</p><p>Contains milk. Do not use with an allergy to any ingredient. Review medicines or medical restrictions with a clinician/pharmacist before use.</p><p>Try it after a normal weekday session. Stop a new powder if it causes a reaction.</p><p>Trouble breathing or swelling of lips, tongue or throat needs emergency help.</p>')
pref=foot.select_one('#preferences .inside');lists=pref.select('.prefs ul');likes=[x.get_text(strip=True).rstrip('.') for x in lists[0].select('li')];dislikes=[x.get_text(strip=True).rstrip('.') for x in lists[1].select('li')]
put(pref,'<p><b>Foods you like:</b> '+'; '.join(likes)+'.</p><p><b>Leave out:</b> '+', '.join(dislikes)+'.</p><p><b>Accepted:</b> whole milk and fruit.</p><p>Bananas, navel oranges and chocolate whey are coaching choices. Tell Brice what to add or remove.</p>')
# Purchase pages, in both repeated link locations, with explicit quantities.
urls={'https://www.rubbermaid.com/food-storage/meal-prep-containers/brilliance-food-storage-salad-container-medium-deep-4.7-cup-clear/SP_2551583.html':'https://www.target.com/p/-/A-52119450','https://packit.com/products/freezable-hampton-lunch-bag':'https://www.target.com/p/-/A-94740609','https://www.blenderbottle.com/products/classic':'https://www.amazon.com/dp/B07TK681SZ'}
for a in foot.select('a[href]'):
 if a['href'] in urls:a['href']=urls[a['href']]
shop=foot.select_one('.shop');shop['data-shopping-revision']='1.5';shop.select_one('.shop-plan').decompose();put(shop.select_one('.shop-intro'),'<p>Check home first. Tick what you have or put in the basket.</p>')
for tile in shop.select('.shop-day'):
 tile.strong.decompose();note=tile.select_one('span');day=tile.b.get_text()
 if day=='Sun':put(note,'Cook 4<br>Freeze 1');note['class']=['cook-tag']
 elif day=='Wed':put(note,'Cook 2');note['class']=['cook-tag']
 elif day=='Tue':put(note,'Thaw ½ lb')
 elif day=='Sat':put(note,'Family')
 else:note.decompose()
for e in shop.select('.shop-mobile-events,.shop-legend'):e.decompose()
put(shop.select_one('.shop-cycle'),'Start with a Sunday batch before Monday. Next Sunday: <a href="#prep-cycle">check the backup</a>.')
bar=frag('<progress id="shop-progress" value="0" max="20" aria-label="Shopping progress"></progress>').progress;shop.select_one('.shop-toolbar').insert_before(bar);shop.select_one('#shop-clear').string='Clear'
notes={'bread':('22 slices','Workdays, weekend home breakfasts and four backups.'),'pb':('352 g','Check your jar before buying another.'),'bananas':('7','Before ordinary runs; keep your usual long-run food.'),'oranges':('7','Unused weekend fruit carries forward.'),'milk':('1 gallon','For shakes and four backups; household use is separate.'),'jam':('1 small jar','For the backup sandwich.'),'whey':('7 servings','Check the tub label and lot before first use.'),'spaghetti':('16 oz','Use the full box Sunday.'),'penne':('16 oz','Use half Wednesday; store the rest dry.'),'beef':('2 × 1 lb','Freeze the second pack as two ½ lb bags.'),'tomatoes':('2 × 28 oz','Use 1½ cans; freeze the unused half promptly.'),'onion':('2','Use 1 Sunday, ½ Wednesday.'),'garlic':('1 bulb','At least 6 cloves.'),'paste':('1 tube or can','Use 4½ tbsp; freeze remaining paste in portions.'),'oil':('1½ tbsp','Check home before buying a bottle.'),'seasoning':('Check home','Italian seasoning, fine salt and black pepper.'),'parmesan':('20 g','Sunday’s Recipe 01.'),'cream':('¼ cup','Wednesday’s Recipe 02; refrigerate per label.'),'beans':('7 cooked cups','Frozen is fine; follow the bag instructions.'),'cheddar':('112 g / 56 g','Full / half batch, only when choosing Recipe 03.')}
for row in shop.select('.shop-item'):
 amount,note=notes[row.input['data-shop-key']];row.select_one('.shop-icon').decompose();row.select_one('.shop-item-line>span').string=amount;row.small.string=note
shop.select('.shop-kit-grid>a')[-1].decompose()
for a,label in zip(shop.select('.shop-kit-grid>a'),['Order 5 · Target ↗','Buy 1 · Target ↗','Buy 1 · ThermoWorks ↗','Buy 1 · Amazon ↗']):a.span.string=label
put(shop.select_one('.shop-reminder p'),'<b>Your usual gels stay.</b> Work lunch and family dinners stay too.')
kit=foot.select_one('#kit').extract();kit.summary.string='Kit details';put(kit.select_one('.inside'),'<p><b>Containers:</b> order 5 individual 4.7-cup plastic boxes with lids. Vent latches when microwaving.</p><p><b>Bag:</b> freeze empty overnight. Carry chilled food; transfer the box to your work fridge.</p><p><b>Before first use:</b> fit the closed box inside the bag. Clean the thermometer and wash the shaker.</p><p><b>Home essentials:</b> tape, marker, freezer bags, scale, measuring tools, knife, board, spoon, colander and pasta pot.</p>');foot.select_one('#shopping .inside').append(kit)
# Merge record and sources; keep source numbering and all link targets.
source=foot.select_one('#sources').extract();source.summary.decompose();source.name='div';source.attrs={'id':'sources'}
for li in source.select('li'):
 links=li.find_all('a',recursive=False)
 if links:put(li,' · '.join(str(a) for a in links))
for p in source.select('.small'):p.decompose()
add(source.select_one('ol'),'<li><a href="https://instantpot.com/pages/frequently-asked-questions">Instant Pot operation and release safety</a></li>')
scope=foot.select_one('#scope');scope.summary.string='For Brice: plan record and sources';put(scope.select_one('.inside'),'<p><b>v1.5 · 22 September 2026.</b> First nutrition phase; actual start pending. Reported mass: 156 lb, not a standardized baseline.</p><p>Forge assignments and gels are unchanged. <a href="./review-context.json">Authored program references</a> remain separate from completed workouts.</p><p>Clock tags guide timing, never meals eaten. Checks remain browser-local. Calendar imports require approval.</p><p>Publisher photos remain until Adrian supplies dated batches. Recipe adaptations are not kitchen-tested or nutritionally identical.</p><p>Full intake, powder tolerance, weight trend, sleep, recovery and nugget portions remain under review.</p><p><a href="/labs/adrian-runner-mass/#intake-20260922">Dated study update</a></p>');scope.select_one('.inside').append(source)
for key,title in [('shopping','Shopping list'),('preferences','Your food preferences'),('powder','Protein powder'),('fallback','When a meal falls through'),('review','Check-in')]:foot.select_one('#'+key+'>summary').string=title
ordered=[foot.select_one('#shopping').extract(),frag(carry).details,frag(safety).details,foot.select_one('#powder').extract(),foot.select_one('#fallback').extract(),foot.select_one('#review').extract(),sleepwrap,foot.select_one('#preferences').extract(),scope.extract()];foot.clear()
for el in ordered:foot.append(el)
main=s.select_one('main');add(main,rail+week);main.append(recipes);main.append(foot);main.append(end)
for script in s.select('script:not([src])'):script.decompose()
for t in s.find_all(string=True):
 if t.parent.name not in ['script','style']:
  new=str(t).replace('v1.4','v1.5').replace('Version 1.4','Version 1.5').replace('—',': ')
  if new!=str(t):t.replace_with(new)
for link in s.select('link[href*="shopping.css"]'):link['href']='./shopping.css?v=1.5'
for js in s.select('script[src*="shopping.js"]'):js['src']='./shopping.js?v=1.5'
add(s.head,'<link rel="stylesheet" href="./visual.css?v=1.5"><link rel="manifest" href="./manifest.webmanifest"><link rel="apple-touch-icon" sizes="180x180" href="./fuel-180.png"><meta name="apple-mobile-web-app-title" content="Adrian · Fuel">')
add(s.body,'<script src="./visual.js?v=1.5" defer></script>');s.html['data-nutrition-version']='1.5'
for d in s.select('details'):d.attrs.pop('open',None)
ids=[e['id'] for e in s.select('[id]')];assert len(ids)==len(set(ids))
for a in s.select('a[href^="#"]'):assert a['href'][1:] in ids,a['href']
f.write_text(str(s)+'\n')
ctx=json.loads((D/'review-context.json').read_text());ctx['nutrition_revision']='1.5';ctx['confirmed_for_this_revision']['instant_pot_owned']='Coach confirmed; model/capacity not specified.';ctx['nutrition_delivery']['recipes'][1]='Creamy tomato penne, Instant Pot Sauté lid-off sauce and separately boiled pasta';ctx['recipe_references'][1]['adaptation']='Sauté with lid off; no pressure cooking or quick release.';ctx['nutrition_delivery']['carryover']='Backup: thaw Sunday for Monday, cook four Sunday, refrigerate Tue/Wed, freeze Thu/Fri, skip Wednesday cook.';ctx['shopping']['revision']='1.5';ctx['shopping']['storage_key']='form.adrian.nutrition.1.4.shopping';ctx['visual_delivery']={'next_marker':'Clock guidance, never completion','eaten_log':False,'sms_recipient':None,'sms_status':'Prepared draft and copy fallback; choose Brice until a verified number is provided.','calendar':'Four optional weekly ICS alerts in America/New_York. Tuesday and Wednesday check for a backup week. No calendar writes.','athlete_photos':'Only approved local dated batches replace publisher photos. Slots start empty.','editorial_trim':'Further trim is a separate editorial pass.'};ctx['purchase_links']={'checked_on':'2026-09-22','containers':'https://www.target.com/p/-/A-52119450','container_quantity':5,'bag':'https://www.target.com/p/-/A-94740609','thermometer':'https://www.thermoworks.com/products/thermopop-2','shaker':'https://www.amazon.com/dp/B07TK681SZ','verification':'Identity and purchase controls checked; no cart or checkout executed.'};(D/'review-context.json').write_text(json.dumps(ctx,indent=2)+'\n')
(D/'page-config.json').write_text(json.dumps({'version':'1.5','coachSmsRecipient':None,'athletePhotos':{'recipe-01':None,'recipe-02':None,'recipe-03':None}},indent=2)+'\n')
manifest={'id':'/plans/adrian-nutrition-phase-01/','name':'Adrian · Fuel','short_name':'Fuel','start_url':'/plans/adrian-nutrition-phase-01/#your-day','scope':'/plans/adrian-nutrition-phase-01/','display':'standalone','background_color':'#f4f1e9','theme_color':'#f4f1e9','icons':[{'src':f'./fuel-{size}.png','sizes':f'{size}x{size}','type':'image/png'} for size in [192,512]]};(D/'manifest.webmanifest').write_text(json.dumps(manifest,indent=2)+'\n')
im=Image.open(R/'apple-touch-icon.png').convert('RGBA')
for size in [180,192,512]:im.resize((size,size),Image.Resampling.LANCZOS).save(D/f'fuel-{size}.png')
now=datetime.now(ZoneInfo('America/New_York'))
def nxt(days,h,m):
 for offset in range(8):
  t=(now+timedelta(days=offset)).replace(hour=h,minute=m,second=0,microsecond=0)
  if t>now and t.weekday() in days:return t.strftime('%Y%m%dT%H%M%S')
def esc(t):return t.replace('\\','\\\\').replace(';','\\;').replace(',','\\,').replace('\n','\\n')
def fold(t):
 out=[];line=''
 for ch in t:
  if len((line+ch).encode())>75:out.append(line);line=' '+ch
  else:line+=ch
 return '\r\n'.join(out+[line])
lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FORM//Adrian Fuel v1.5//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Adrian prep reminders','X-WR-TIMEZONE:America/New_York','BEGIN:VTIMEZONE','TZID:America/New_York','BEGIN:DAYLIGHT','DTSTART:20070311T020000','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU','TZOFFSETFROM:-0500','TZOFFSETTO:-0400','TZNAME:EDT','END:DAYLIGHT','BEGIN:STANDARD','DTSTART:20071104T020000','RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU','TZOFFSETFROM:-0400','TZOFFSETTO:-0500','TZNAME:EST','END:STANDARD','END:VTIMEZONE']
events=[('sunday',[6],19,30,'SU','Freezer check, then cook','Check your frozen backup. Cook four using the correct freezer path. Start earlier when needed to protect bedtime.'),('beef',[1],5,35,'TU','Check Wednesday, then thaw beef','Only when Wednesday cooking is needed: move one half-pound raw beef portion to the fridge. Skip when using frozen meal backups.'),('wednesday',[2],19,30,'WE','Cook two, or use your backups','Cook two only when needed. Using frozen Thursday and Friday meals? Skip cooking; move Thursday’s box to the fridge.'),('pack',[6,0,1,2,3],20,30,'SU,MO,TU,WE,TH','Pack tomorrow','Freeze the empty bag. Tomorrow’s meal in the fridge. Bread and orange ready. Thaw a frozen meal when needed.')]
for uid,days,h,m,by,title,desc in events:lines+=['BEGIN:VEVENT','UID:adrian-fuel-'+uid+'-v1@speedandform.com','DTSTAMP:'+now.astimezone(ZoneInfo('UTC')).strftime('%Y%m%dT%H%M%SZ'),'DTSTART;TZID=America/New_York:'+nxt(days,h,m),'DURATION:PT5M','RRULE:FREQ=WEEKLY;BYDAY='+by,'SUMMARY:'+esc(title),'DESCRIPTION:'+esc(desc)+'\\nhttps://speedandform.com/plans/adrian-nutrition-phase-01/','URL:https://speedandform.com/plans/adrian-nutrition-phase-01/','TRANSP:TRANSPARENT','BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT0M','DESCRIPTION:'+esc(title),'END:VALARM','END:VEVENT']
lines+=['END:VCALENDAR'];(D/'adrian-prep-reminders.ics').write_bytes(('\r\n'.join(map(fold,lines))+'\r\n').encode())
print('Materialized visual v1.5; no training or completed records changed.')
