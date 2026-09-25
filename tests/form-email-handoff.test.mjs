import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const helperSource = readFileSync(new URL('../auth/record-callback/session-handoff.js', import.meta.url), 'utf8');
const { acceptImplicitReturn } = await import(`data:text/javascript;base64,${Buffer.from(helperSource).toString('base64')}`);
const callbackSource = readFileSync(new URL('../auth/record-callback/callback.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
const landingSource = readFileSync(new URL('../auth/app-signin/app-signin.js', import.meta.url), 'utf8');
const base = 'https://speedandform.com/auth/record-callback/';
const returned = '#access_token=test-access&refresh_token=test-refresh&type=magiclink';
const newSession = { access_token: 'test-access', refresh_token: 'test-refresh', user: { id: 'new-user' } };
function authMock(options = {}) {
  const calls = [];
  return {
    calls,
    async setSession(tokens) {
      calls.push(['setSession', tokens]);
      if (options.throwSet) throw new Error('network detail must not leak');
      return options.result ?? { data: { session: newSession }, error: null };
    },
    async getUser(token) {
      calls.push(['getUser', token]);
      return { data: { user: { id: options.userID || 'new-user' } }, error: options.userError || null };
    }
  };
}
function element() {
  return { textContent: '', hidden: true, href: '#', className: '', listeners: {}, attributes: {},
    setAttribute(k,v) { this.attributes[k] = v; },
    addEventListener(k, cb) { this.listeners[k] = cb; }
  };
}
function landing(action, storageFails = false) {
  const nodes = Object.fromEntries(['handoffTitle','handoffStatus','handoffRetry'].map(k => [k,element()]));
  const navigations = [], cleaned = [], stored = new Map();
  const window = {
    location: { hash: `#continue=${encodeURIComponent(action)}`, replace: x => navigations.push(x) },
    history: { replaceState: (a,b,c) => cleaned.push(c) },
    sessionStorage: {
      setItem(k,v) { if (storageFails) throw new Error('disabled'); stored.set(k,v); },
      getItem: k => stored.get(k)
    }
  };
  vm.runInNewContext(landingSource, { window, document: { getElementById: k => nodes[k] }, URL, URLSearchParams, Set });
  const click = () => nodes.handoffRetry.listeners.click?.({ preventDefault() {} });
  return { nodes, navigations, cleaned, stored, click };
}
function actionURL(changes = {}) {
  const url = new URL('https://pbgsjjegycacodiltbhn.supabase.co/auth/v1/verify');
  url.searchParams.set('token','test-one-use-token');
  url.searchParams.set('type','magiclink');
  url.searchParams.set('redirect_to', base);
  for (const [k,v] of Object.entries(changes)) url.searchParams.set(k,v);
  return url.toString();
}
async function callback({ suffix = returned, oldSession = null, setError = false, userID = 'new-user', app = true } = {}) {
  const nodes = Object.fromEntries(['callbackTitle','callbackStatus','callbackRetry','callbackStoreWrap'].map(k => [k,element()]));
  const calls = [], navigation = [];
  let session = oldSession;
  const window = {
    location: { href: base + suffix, origin: 'https://speedandform.com', replace: x => navigation.push(x) },
    history: { replaceState(a,b,c) { calls.push('clean'); window.location.href = String(c); } },
    sessionStorage: { getItem: () => app ? '1' : null, removeItem() { calls.push('clear-marker'); } }
  };
  const supabase = { auth: {
    async setSession() { calls.push('set'); if (setError) return { error: new Error('invalid') }; session = newSession; return { data: { session }, error: null }; },
    async getUser() { calls.push('verify-user'); return { data: { user: { id: userID } } }; }
  } };
  const finishAuthCallback = async () => { calls.push('claim'); if (!session) throw new Error('That sign-in link has expired.'); return '/athlete/'; };
  const getSession = async () => session;
  const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
  await new AsyncFunction('window','document','supabase','acceptImplicitReturn','finishAuthCallback','getSession','authErrorMessage','setPassword',callbackSource)(
    window, { getElementById: k => nodes[k] }, supabase, acceptImplicitReturn, finishAuthCallback, getSession, e => e.message, async()=>{}
  );
  return { nodes, calls, navigation, window };
}

test('implicit return is restored, server-verified and cleaned before claiming', async () => {
  const auth = authMock(), cleaned = [];
  const result = await acceptImplicitReturn(auth, base + returned, x => cleaned.push(x));
  assert.deepEqual(result, { restored: true, type: 'magiclink' });
  assert.equal(cleaned[0], base);
  assert.deepEqual(auth.calls.map(c=>c[0]), ['setSession','getUser']);
});
test('clean URL happens before the first network request', async () => {
  let cleaned = false;
  const auth = authMock(); const original = auth.setSession;
  auth.setSession = async t => { assert.equal(cleaned,true); return original(t); };
  await acceptImplicitReturn(auth, base+returned, ()=>{cleaned=true;});
});
for (const [label,suffix] of [
  ['missing refresh','#access_token=a'], ['missing access','#refresh_token=r'],
  ['empty access','#access_token=&refresh_token=r'], ['empty refresh','#access_token=a&refresh_token='],
  ['duplicate access','#access_token=a&access_token=b&refresh_token=r'],
  ['duplicate refresh','#access_token=a&refresh_token=r&refresh_token=s'],
  ['mixed PKCE','?code=abc'+returned], ['mixed OTP','?token_hash=abc&type=invite'+returned]
]) test(`rejects ${label} without claiming or restoring an old account`, async () => {
  const auth = authMock(); await assert.rejects(acceptImplicitReturn(auth,base+suffix,()=>{}),/incomplete/);
  assert.equal(auth.calls.length,0);
});
test('explicit expired/reused error never falls back to a cached session', async () => {
  const result = await callback({suffix:'#error=access_denied&error_code=otp_expired',oldSession:{user:{id:'old'}}});
  assert.equal(result.nodes.callbackTitle.textContent,'That link did not open.');
  assert.ok(!result.calls.includes('claim')); assert.ok(!result.nodes.callbackRetry.href.startsWith('form:'));
});
test('network error is not called token expiry', async () => {
  await assert.rejects(acceptImplicitReturn(authMock({throwSet:true}),base+returned,()=>{}),/connection/);
});
test('invalid setSession response cannot claim', async () => {
  const result = await callback({setError:true,oldSession:{user:{id:'old'}}});
  assert.ok(!result.calls.includes('claim')); assert.equal(result.nodes.callbackTitle.textContent,'That link did not open.');
});
test('server user mismatch fails closed', async () => {
  const result = await callback({userID:'different-user'});
  assert.ok(!result.calls.includes('claim')); assert.equal(result.nodes.callbackTitle.textContent,'That link did not open.');
});
for (const suffix of ['?code=pkce-code','?token_hash=hash&type=invite','']) test(`non-implicit route remains delegated: ${suffix || 'stored session'}`,async()=>{
  const auth=authMock(),clean=[];
  assert.deepEqual(await acceptImplicitReturn(auth,base+suffix,x=>clean.push(x)),{restored:false,type:null});
  assert.equal(auth.calls.length,0); assert.equal(clean.length,0);
});
test('callback now produces the exact native handoff instead of false expiry', async () => {
  const r=await callback();
  assert.deepEqual(r.calls.slice(0,4),['clean','set','verify-user','claim']);
  assert.equal(r.nodes.callbackTitle.textContent,'Signed in.');
  const url=new URL(r.nodes.callbackRetry.href);
  assert.equal(url.protocol,'form:');assert.equal(url.hostname,'coaching-auth');
  assert.equal(url.search,'');assert.equal(new URLSearchParams(url.hash.slice(1)).get('refresh_token'),'test-refresh');
  assert.equal(r.nodes.callbackRetry.hidden,false);assert.equal(r.navigation.length,0);
});
test('an existing browser account is replaced before the app handoff', async()=>{
  const r=await callback({oldSession:{access_token:'old-access',refresh_token:'old-refresh',user:{id:'old'}}});
  assert.ok(r.nodes.callbackRetry.href.includes('test-access')); assert.ok(!r.nodes.callbackRetry.href.includes('old-access'));
});
test('email preview consumes nothing; explicit Continue navigates exactly once',()=>{
  const r=landing(actionURL());assert.equal(r.navigations.length,0);assert.equal(r.cleaned[0],'/auth/app-signin/');
  assert.equal(r.nodes.handoffRetry.hidden,false);r.click();r.click();
  assert.equal(r.navigations.length,1);assert.equal(r.stored.get('form-app-signin-handoff'),'1');
});
for (const [label,action] of [
 ['foreign host', actionURL().replace('pbgsjjegycacodiltbhn.supabase.co','evil.example')],
 ['external redirect',actionURL({redirect_to:'https://evil.example/'})],
 ['password reset',actionURL({type:'recovery'})],
 ['missing token',actionURL({token:''})],
 ['malformed URL','not-a-url']
]) test(`landing refuses ${label}`,()=>{
 const r=landing(action);assert.equal(r.nodes.handoffRetry.hidden,true);r.click();assert.equal(r.navigations.length,0);
});
test('blocked browser storage cannot consume a token and lose the app route',()=>{
 const r=landing(actionURL(),true);r.click();assert.equal(r.navigations.length,0);assert.match(r.nodes.handoffStatus.textContent,/Safari/);
});
test('recovery fragment is considered before session restoration cleans the URL',()=>{
 assert.match(callbackSource,/returnedFragment.get\('type'\) === 'recovery'/);
 assert.ok(callbackSource.indexOf('const recovery') < callbackSource.indexOf('await acceptImplicitReturn'));
});
