import { renderAthleteWorkspace } from '/athlete/workspace.js';

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export function renderDeliveryOverview(delivery) {
  if (!delivery) return '';
  const receiptTone = delivery.receiptState === 'proven' ? 'proven'
    : delivery.receiptState === 'not_required' ? 'neutral' : 'open';
  return `<section class="consoleDelivery" aria-label="Access and delivery">
    <div><span>Access</span><b>${esc(delivery.accountLabel)}</b></div>
    <div><span>Training</span><b>${esc(delivery.trainingLabel)}</b></div>
    <div><span>Record in</span><b>${esc(delivery.recordingTarget)}</b></div>
    <div class="consoleDelivery__receipt consoleDelivery__receipt--${receiptTone}"><span>Receipt</span><b>${esc(delivery.receiptLabel)}</b></div>
  </section>`;
}

export function renderCoachAthletePreview(record) {
  const html = renderAthleteWorkspace(record, {
    view: 'today',
    email: '',
    fallbackProgram: record.fallbackProgram || null,
    fallbackWeek: 1
  });
  return `<details class="consoleAthletePreview">
    <summary><span>ATHLETE VIEW</span><b>Preview Today</b><em>coach-owned read-only preview · not a sign-in</em></summary>
    <div class="consoleAthletePreview__frame" inert aria-label="Athlete-facing Today preview">${html}</div>
  </details>`;
}
