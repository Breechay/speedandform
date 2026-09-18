// Custom authorization: single-purpose high-entropy confirmation/opt-out tokens;
// signup is public, gated by server-verified Turnstile and atomic database quotas;
// provider events require a valid timestamped Svix signature. No athlete authority.
import { createHandler } from './core.mjs';
Deno.serve(createHandler({env:Deno.env.toObject()}));
