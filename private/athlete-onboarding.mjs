// The Console creates one private athlete identity. An invite, training block,
// and athlete-facing release are separate operations with separate receipts.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeInviteEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || normalized.length > 254 || !EMAIL.test(normalized)) {
    throw new Error('Enter the athlete’s verified email address.');
  }
  return normalized;
}

export function athleteSlug(displayName) {
  return String(displayName || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function normalizeNewAthlete(payload = {}) {
  const displayName = String(payload.displayName || '').trim().replace(/\s+/g, ' ');
  const firstName = String(payload.firstName || '').trim().replace(/\s+/g, ' ');
  const slug = athleteSlug(displayName);
  const email = String(payload.email || '').trim().toLowerCase();
  const programName = String(payload.programName || '').trim();
  const accountLabel = String(payload.accountLabel || '').trim();
  const targetEvent = String(payload.targetEvent || '').trim();
  const goalLabel = String(payload.goalLabel || '').trim();

  if (displayName.length < 3 || displayName.length > 120 || !firstName || firstName.length > 80) {
    throw new Error('Enter the athlete’s full name and first name.');
  }
  if (slug.length < 3 || slug.length > 70) {
    throw new Error('This name cannot form a valid athlete record. Check the spelling.');
  }
  if (!programName || programName.length > 120 || !accountLabel || accountLabel.length > 120) {
    throw new Error('Enter a program and a private coaching relationship label.');
  }
  if (email && (email.length > 254 || !EMAIL.test(email))) {
    throw new Error('Enter a verified email, or leave the email blank for now.');
  }
  if (targetEvent.length > 180 || goalLabel.length > 180) {
    throw new Error('Keep the target event and goal brief.');
  }
  return { displayName, firstName, slug, email, programName, accountLabel,
    targetEvent: targetEvent || null, goalLabel: goalLabel || null };
}

export function existingAthleteMatch(athletes, proposed) {
  const name = String(proposed.displayName || '').trim().toLocaleLowerCase();
  return athletes.find(athlete => athlete.slug === proposed.slug ||
    String(athlete.display_name || '').trim().toLocaleLowerCase() === name) || null;
}

// Training weeks are anchored to the New York coaching calendar, even when
// the coach opens the page from another time zone or after midnight UTC.
export function newYorkWeekMonday(at = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(at);
  const day = Object.fromEntries(parts.filter(part => ['year', 'month', 'day'].includes(part.type))
    .map(part => [part.type, part.value]));
  const monday = new Date(`${day.year}-${day.month}-${day.day}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}
