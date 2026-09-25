import { makeHandler } from './handler.mjs';

// Every POST verifies the signed-in session with Auth /user, then fresh Apple proof.
Deno.serve(makeHandler({
  url: Deno.env.get('SUPABASE_URL'),
  publishableKey: Deno.env.get('SUPABASE_ANON_KEY'),
  serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
}));
