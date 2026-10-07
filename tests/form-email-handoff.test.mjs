import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const helperSource = readFileSync(new URL('../auth/record-callback/session-handoff.js', import.meta.url), 'utf8');
const { acceptImplicitReturn } = await import(`data:text/javascript;base64,${Buffer.from(helperSource).toString('base64')}`);
const callbackSource = readFileSync(new URL('../auth/record-callback/callback.js', import.meta.url), 'utf8').replace(/^import .*;\n/gm, '');
const landingSource = readFileSync(new URL('../auth/app-signin/app-signin.js', import.meta.url), 'utf8');
const authSource = readFileSync(new URL('../private/auth.js', import.meta.url), 'utf8');
const callbackHtml = readFileSync(new URL('../auth/record-callback/index.html', import.meta.url), 'utf8');
const callbackCss = readFileSync(new URL('../auth/record-callback/callback.css', import.meta.url), 'utf8');
const authEmailTemplates = ['magic_link','confirmation','recovery','invite'].map(name => readFileSync(new URL('../supabase/templates/' + name + '.html', import.meta.url), 'utf8'));
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

test('private auth surfaces follow the cream house system', () => {
  assert.ok(callbackHtml.includes('content="#e8e3d9"'));
  assert.ok(callbackHtml.includes('sf-emblem-ink.svg'));
  assert.ok(callbackHtml.includes('callback.css?v=1'));
  assert.ok(!callbackHtml.includes('graphite.css'));
  assert.ok(callbackCss.includes('--paper:#e8e3d9'));
  assert.ok(callbackCss.includes('--ink:#161916'));
  for (const template of authEmailTemplates) {
    assert.ok(template.includes('#e8e3d9'));
    assert.ok(template.includes('sf-emblem-ink.png'));
    assert.ok(template.includes('Speed &amp; Form'));
    assert.ok(!template.includes('#c8ff2e'));
    assert.ok(!template.includes('#9acb19'));
  }
});
test('coach magic links never create a new identity', () => {
  assert.ok(authSource.includes("shouldCreateUser: !destination.startsWith('/coach/')"));
});
test('Operating Console callback rejects a non-owner session', () => {
  assert.ok(callbackSource.includes("destination.startsWith('/coach/ops/')"));
  assert.ok(callbackSource.includes("rpc('operating_console_owner')"));
  assert.ok(callbackSource.includes('supabase.auth.signOut'));
});

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

test('hosted email templates are house-branded and verifier-independent',()=>{
 const magic=readFileSync(new URL('../supabase/templates/magic_link.html',import.meta.url),'utf8');
 const confirmation=readFileSync(new URL('../supabase/templates/confirmation.html',import.meta.url),'utf8');
 for(const template of [magic,confirmation]){
   assert.match(template,/sf-emblem-ink\.png/);
   assert.match(template,/#e8e3d9/);
   assert.match(template,/#161916/);
   assert.match(template,/\{\{ \.RedirectTo \}\}&amp;token_hash=\{\{ \.TokenHash \}\}&amp;type=email/);
   assert.doesNotMatch(template,/\.ConfirmationURL/);
 }
});
test('callback failure returns to the requested coach door and hides raw PKCE detail',()=>{
 const callback=readFileSync(new URL('../auth/record-callback/callback.js',import.meta.url),'utf8');
 const auth=readFileSync(new URL('../private/auth.js',import.meta.url),'utf8');
 assert.match(callback,/failedReturnDestination/);
 assert.match(callback,/startsWith\('\/coach\/'\)/);
 assert.match(auth,/pkce\|code verifier/i);
});

test('the whole auth email family obeys the October paper-room contract',()=>{
 const files=[
  'magic_link.html','confirmation.html','invite.html','recovery.html','email_change.html','reauthentication.html',
  'password_changed_notification.html','email_changed_notification.html','phone_changed_notification.html',
  'identity_linked_notification.html','identity_unlinked_notification.html',
  'mfa_factor_enrolled_notification.html','mfa_factor_unenrolled_notification.html'
 ];
 for(const name of files){
   const template=readFileSync(new URL('../supabase/templates/'+name,import.meta.url),'utf8');
   assert.match(template,/sf-emblem-ink\.png/,name+' uses the SF emblem');
   assert.match(template,/#e8e3d9/,name+' uses bone');
   assert.match(template,/#161916/,name+' uses ink');
   assert.match(template,/#5e625b/,name+' uses quiet text');
   assert.doesNotMatch(template,/FORM<span|#9acb19|#c8ff2e|border-radius:\s*(?:12|20|22)px/i,name+' has no retired FORM/green/card treatment');
   assert.doesNotMatch(template,/Your record is one tap away|Open my record/i,name+' has no old record-specific copy');
   assert.match(template,/display:none;max-height:0/,name+' has a useful inbox preheader');
 }
});
test('account action emails use one direct secure action',()=>{
 const cases=[
  ['magic_link.html','type=email'],
  ['confirmation.html','type=email'],
  ['recovery.html','type=recovery'],
  ['email_change.html','type=email_change']
 ];
 for(const [name,type] of cases){
   const template=readFileSync(new URL('../supabase/templates/'+name,import.meta.url),'utf8');
   assert.match(template,/\{\{ \.RedirectTo \}\}&amp;token_hash=\{\{ \.TokenHash \}\}/,name+' uses token hash');
   assert.ok(template.includes(type),name+' keeps the correct OTP type');
   assert.equal((template.match(/<a href=/g)||[]).length,2,name+' has one primary action plus one support link');
 }
});
test('auth email documentation names the current sender and house',()=>{
 const readme=readFileSync(new URL('../supabase/templates/README.md',import.meta.url),'utf8');
 const standard=readFileSync(new URL('../docs/marketing/EMAIL_EXPERIENCE_STANDARD_2026-09-16.md',import.meta.url),'utf8');
 const config=readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8');
 for(const text of [readme,standard,config]){
   assert.match(text,/Speed & Form/, 'house name is explicit');
 }
 assert.match(readme,/access@send\.speedandform\.com/);
 assert.match(config,/admin_email = "access@send\.speedandform\.com"/);
 assert.match(config,/sender_name = "Speed & Form"/);
});

test('native app sign-in handoff follows the October paper-room contract',()=>{
 const html=readFileSync(new URL('../auth/app-signin/index.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../auth/app-signin/app-signin.css',import.meta.url),'utf8');
 const js=readFileSync(new URL('../auth/app-signin/app-signin.js',import.meta.url),'utf8');
 assert.match(html,/sf-emblem-ink\.svg/);
 assert.match(html,/app-signin\.css\?v=3/);
 assert.match(html,/app-signin\.js\?v=3/);
 assert.match(css,/--paper:#e8e3d9/);
 assert.match(css,/--ink:#161916/);
 assert.match(css,/--muted:#5e625b/);
 assert.doesNotMatch(css,/#c8ff2e|--lime|border-radius:12px|border-radius:19px/i);
 assert.doesNotMatch(html,/class="brand"|class="app-icon"|FORM<span>/);
 assert.match(js,/Continue once to verify your account\. FORM will open next\./);
 assert.match(js,/Request a new Speed & Form sign-in email\./);
});

test('native coaching email uses the house sender and scanner-safe one-time handoff',()=>{
 const source=readFileSync(new URL('../supabase/functions/coaching-email-signin/index.ts',import.meta.url),'utf8');
 assert.match(source,/Speed & Form <access@send\.speedandform\.com>/);
 assert.match(source,/Your Speed & Form sign-in link/);
 assert.match(source,/reply_to: REPLY_TO/);
 assert.match(source,/sf-emblem-ink\.png/);
 assert.match(source,/#e8e3d9/);
 assert.match(source,/#161916/);
 assert.match(source,/HANDOFF_BASE.*auth\/app-signin/);
 assert.match(source,/encodeURIComponent\(actionLink\)/);
 assert.match(source,/coaching_magic_link_admit/);
 assert.match(source,/generateLink/);
 assert.doesNotMatch(source,/FORM <no-reply@send\.speedandform\.com>|#c8ff2e|Back to your training|One tap and you/);
});
