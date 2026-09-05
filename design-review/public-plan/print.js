// THE PRINT EDITION — the whole plan on four landscape pages.
//
// Same plan, same notation module, different medium. A screen shows a window
// because you can move it; paper cannot move, so paper gets all fifteen weeks.
//
// Deliberately absent: the THIS WEEK mark. A printed sheet has no idea what
// week it is, and one pinned to a wall in November must not still be pointing
// at September.

import { publishedPlan } from './source.js';
import { notation } from './notation.js';

const plan = await publishedPlan('race-pace-durability');
const { read } = notation(plan);

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const PER_PAGE = 5;
const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const weekOne = new Date(`${plan.running.starts_on}T00:00:00`);
const raceOn = new Date(`${plan.running.race_on}T00:00:00`);
const startOf = (week) => {
  const d = new Date(weekOne);
  d.setDate(d.getDate() + (week - 1) * 7);
  return d;
};
const show = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const pad = (n) => String(n).padStart(2, '0');

const version = `v${plan.version?.version_number ?? 1}`;
const title = plan.plan.name;
const discipline = plan.plan.discipline.replace(/_/g, ' ').toUpperCase();

function cell(week, day) {
  const r = read(week.sessions.find((s) => s.day === day));
  const last = r.lines[r.lines.length - 1];
  const total = last && /mi total$/.test(last) ? last : '';
  const details = total ? r.lines.slice(0, -1) : r.lines;
  return `<div class="cell${r.kind === 'rest' ? ' rest' : ''}">
    <div class="s-title${r.racePace ? ' race' : ''}">${esc(r.label)}</div>
    <div class="primary">${esc(r.head)}</div>
    ${details.map((l) => `<div class="detail">${esc(l)}</div>`).join('')}
    ${total ? `<div class="total">${esc(total)}</div>` : ''}
  </div>`;
}

function spread(weeks) {
  const first = weeks[0].week_number, last = weeks[weeks.length - 1].week_number;
  const head = '<th>DAY</th>' + weeks.map((w) =>
    `<th>W${w.week_number}<span class="date">${esc(show(startOf(w.week_number)))}</span></th>`).join('');
  const body = DAYS.map((day) =>
    `<tr><th>${day[0] + day.slice(1).toLowerCase()}</th>` +
    weeks.map((w) => `<td>${cell(w, day)}</td>`).join('') + '</tr>').join('') +
    '<tr class="week-total"><th>TOTAL</th>' + weeks.map((w) =>
      `<td><div class="cell"><div class="primary">${esc(+w.total_distance)} mi</div></div></td>`)
      .join('') + '</tr>';
  return `<section class="page plan-page">
    <div class="plan-head">
      <div class="plan-title">${esc(title.toUpperCase())}</div>
      <div class="range">WEEKS ${pad(first)}–${pad(last)}</div>
    </div>
    <div class="table-wrap"><table>
      <colgroup><col class="day">${weeks.map(() => '<col>').join('')}</colgroup>
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table></div>
    <div class="page-foot">
      <div class="brand">FORM <span>LABS</span></div>
      <div>${esc(title)} · ${esc(version)}</div>
    </div>
  </section>`;
}

const spreads = [];
for (let i = 0; i < plan.weeks.length; i += PER_PAGE) {
  spreads.push(plan.weeks.slice(i, i + PER_PAGE));
}

document.getElementById('edition').innerHTML = `
  <section class="page cover">
    <div class="brand">FORM <span>LABS</span></div>
    <div>
      <h1>${esc(title)}</h1>
      <div class="sub">${esc(discipline)} · ${plan.weeks.length} WEEKS</div>
    </div>
    <div class="meta">
      <div>FORM LABS</div>
      <div>${esc(version)} · ${esc(show(weekOne))} – ${esc(raceOn.toLocaleDateString('en-US',
        { month: 'short', day: 'numeric', year: 'numeric' }))}</div>
    </div>
  </section>` + spreads.map(spread).join('');

// The file the browser offers to save is named by the print job's title.
document.title = `${title} · ${version}`;

// Opened to be printed. The fonts must be down before the dialog measures the
// page, or the first print lays out in a fallback and the columns move.
// `#preview` renders the edition without opening the print dialog — the hash,
// not a query string, because the dev server rewrites `.html` and drops the
// query on the way through.
if (!location.hash.includes('preview')) {
  await document.fonts.ready;
  requestAnimationFrame(() => window.print());
}
