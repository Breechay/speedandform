import { loadPublication } from '/private/data.js';
import { escapeHtml, formatDate } from '/private/record.js';

const share = document.getElementById('share');
const parts = location.pathname.split('/').filter(Boolean);
const slug = parts[1] || new URLSearchParams(location.search).get('record');

try {
  const publication = slug ? await loadPublication(slug) : null;
  if (!publication) {
    share.innerHTML = '<section class="share-card"><p class="eyebrow">FORM Athlete Record</p><h1>This excerpt is not available.</h1><p class="share-summary">A public record appears only after the athlete approves the exact excerpt.</p></section>';
  } else {
    document.title = `${publication.athlete_display_name} · FORM Athlete Record`;
    share.innerHTML = `<article class="share-card"><p class="eyebrow">FORM Athlete Record · ${escapeHtml(formatDate(publication.published_at, { month: 'long', year: 'numeric' }))}</p><h1>${escapeHtml(publication.athlete_display_name)}</h1><p>${escapeHtml(publication.headline)}</p><div class="share-mark">${escapeHtml(publication.mark_value)}</div><p class="eyebrow">${escapeHtml(publication.mark_label)}</p><p class="share-summary">${escapeHtml(publication.summary)}</p></article>`;
  }
} catch {
  share.innerHTML = '<section class="share-card"><p class="eyebrow">FORM Athlete Record</p><h1>This excerpt could not open.</h1><p class="share-summary">Try the link again.</p></section>';
}

