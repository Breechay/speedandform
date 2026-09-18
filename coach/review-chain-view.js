import { athleteWording, reviewChainFor } from '../private/review-chain.js';

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export function renderCoachReviewChain(record, completionId) {
  const chain = reviewChainFor(record, completionId);
  if (chain.state === 'unreviewed') {
    return `<section class="coachReviewChain coachReviewChain--open">
      <p class="coachReviewChain__label">Athlete-facing coaching</p>
      <p>No published review is linked to this evidence yet.</p>
      <button type="button" data-review-next="${esc(completionId)}">REVIEW + SET NEXT</button>
    </section>`;
  }

  const review = athleteWording(chain.read);
  const next = chain.direction ? athleteWording(chain.direction) : '';
  return `<section class="coachReviewChain">
    <p class="coachReviewChain__label">Published review</p>
    <p>${esc(review)}</p>
    ${chain.direction
      ? `<div><span>Next instruction</span><strong>${esc(next)}</strong></div>`
      : `<button type="button" data-review-next="${esc(completionId)}">SET NEXT INSTRUCTION</button>`}
  </section>`;
}
