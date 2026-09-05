// Review-package stub for /private/auth.js.
//
// The package never authenticates. It answers the one question labs.js asks at
// boot — "who is this and which athletes may they see" — with a coach who can
// see everyone, because the package's whole purpose is to look at the surface.
export async function getAccessContext() {
  return { session: { user: { id: 'design-review' } }, coachMemberships: [{ athlete_id: 'design-review' }] };
}
export function authErrorMessage(error) { return String(error?.message || error); }
