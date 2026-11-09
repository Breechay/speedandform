// The Console creates one private athlete identity. An invite, training block,
// and athlete-facing release are separate operations with separate receipts.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
