// Apple wants a client secret JWT, not the .p8 itself. Apple caps the lifetime
// at six months, so this has to be re-run before it lapses or web sign-in stops.
//
//   node scripts/apple-client-secret.mjs <path-to.p8>
//
// Prints nothing but the token. Pipe it to pbcopy; don't paste it around.
import { createSign, createPrivateKey, sign as rawSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const TEAM_ID = 'L5VBZ7L4U2';
const KEY_ID = 'CQ9529MR2K';
const SERVICES_ID = 'com.speedandform.web';
const SIX_MONTHS = 15777000; // Apple's hard ceiling, in seconds

const keyPath = process.argv[2];
if (!keyPath) { console.error('usage: apple-client-secret.mjs <AuthKey_XXXX.p8>'); process.exit(1); }

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);

const header = b64({ alg: 'ES256', kid: KEY_ID });
const payload = b64({
  iss: TEAM_ID,
  iat: now,
  exp: now + SIX_MONTHS,
  aud: 'https://appleid.apple.com',
  sub: SERVICES_ID,
});

const key = createPrivateKey(readFileSync(keyPath));
// ES256 wants the raw r||s pair; Node defaults to DER, which Apple rejects.
const signature = rawSign('sha256', Buffer.from(`${header}.${payload}`), {
  key, dsaEncoding: 'ieee-p1363',
}).toString('base64url');

process.stdout.write(`${header}.${payload}.${signature}`);
