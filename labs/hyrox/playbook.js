(function () {
  'use strict';
  function duration(s){if(typeof s!=='string'||!/^\d+:\d{2}(?::\d{2})?$/.test(s.trim()))return null;const p=s.trim().split(':').map(Number);if(p.at(-1)>59||(p.length===3&&p[1]>59))return null;const n=p.reduce((a,v)=>a*60+v,0);return Number.isSafeInteger(n)?n:null;}
  function composition(values) {
    const times = values.map(duration);
    if (times.some(v => v === null) || times[0] <= 0 || times[1] <= 0) return null;
    times[0] *= 8;
    const total = times.reduce((a, b) => a + b, 0);
    return times.map(seconds => ({ seconds, fraction: seconds / total }));
  }
  function trade(save, loss) { return Number(loss) - Number(save); }
  if (typeof module !== 'undefined' && module.exports) { module.exports = {duration, composition, trade}; return; }
  const el = id => document.getElementById(id);
  const clock = n => Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
  function updateCost() {
    const save = Number(el('cost-save').value), loss = Number(el('cost-loss').value);
    for (const [name, value] of [['save', save], ['loss', loss]]) {
      el('cost-' + name + '-label').textContent = value + ' sec';
      el('cost-' + name + '-time').textContent = value + 's';
      el('cost-' + name + '-bar').style.width = (value / 90 * 100) + '%';
    }
    const net = trade(save, loss), result = el('cost-verdict');
    result.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = net === 0 ? 'No time gained.' : Math.abs(net) + ' second' + (Math.abs(net) === 1 ? '' : 's') + (net > 0 ? ' slower.' : ' faster.');
    const note = document.createElement('span');
    note.textContent = net > 0 ? 'The faster station cost more than it saved. Try a more controlled effort.' : net < 0 ? 'This change gained time in the costs you entered. Check that you included the rest of the race.' : 'The later cost used up the station saving. No overall saving in this example.';
    result.append(strong, note);
  }
  ['cost-save','cost-loss'].forEach(id => el(id).addEventListener('input', updateCost));
  updateCost();
  const budgetIds = ['budget-pace','budget-stations','budget-rox','budget-penalties'];
  function updateBudget() {
    const parts = composition(budgetIds.map(id => el(id).value));
    const stack = el('budget-stack'), key = el('budget-key');
    stack.replaceChildren(); key.replaceChildren();
    if (!parts) { key.textContent = 'Enter all four times as m:ss or h:mm:ss to see your race budget.'; return; }
    const names = ['Running','Stations','Roxzone','Penalties'], colors = ['#c5ff32','#f4f6f1','#819086','#d8a66a'];
    parts.forEach((part, i) => {
      if (part.seconds) { const bar = document.createElement('span'); bar.style.flexGrow = part.fraction; bar.style.background = colors[i]; stack.append(bar); }
      const label = document.createElement('span'); label.className = 'budget-key-item';
      const dot = document.createElement('i'); dot.style.background = colors[i];
      label.append(dot, document.createTextNode(names[i] + ' ' + clock(part.seconds))); key.append(label);
    });
  }
  budgetIds.forEach(id => el(id).addEventListener('input', updateBudget)); updateBudget();
  function showWeek(week) {
    document.querySelectorAll('[data-week]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.week === week)));
    document.querySelectorAll('.training-week').forEach(panel => panel.hidden = panel.id !== 'training-week-' + week);
  }
  document.querySelectorAll('[data-week]').forEach(button => button.addEventListener('click', () => showWeek(button.dataset.week)));
  function linkedWeek() { const match = location.hash.match(/^#training-week-([123])$/); if (match) showWeek(match[1]); }
  showWeek('1'); linkedWeek(); window.addEventListener('hashchange', linkedWeek);
}());
