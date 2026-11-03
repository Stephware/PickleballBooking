// Synthetic API checks only. This intentionally never discovers local venue credentials.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const base = process.env.PHASE9_API_URL;
if (process.env.PHASE9_MUTATIONS !== '1' || !base ||
    !['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname))
  throw new Error('Require PHASE9_MUTATIONS=1 and a loopback PHASE9_API_URL for the disposable venue.');
const email = process.env.PHASE9_OWNER_EMAIL;
const password = process.env.PHASE9_OWNER_PASSWORD;
if (!email || !password) throw new Error('Supply synthetic owner credentials via PHASE9_OWNER_EMAIL/PASSWORD.');
let passed = 0;
async function check(name, run) { await run(); passed++; console.log(`PASS ${name}`); }
const owner = { cookies: new Map(), csrf: '' };
async function call(path, { method = 'GET', body, token, session, csrf = true } = {}) {
  const headers = new Headers();
  if (token) headers.set('X-Booking-Token', token);
  if (session) {
    headers.set('Cookie', [...session.cookies].map(([k,v]) => `${k}=${v}`).join('; '));
    if (csrf && session.csrf && method !== 'GET') headers.set('X-CSRF-TOKEN', session.csrf);
  }
  if (body && !(body instanceof FormData)) { headers.set('Content-Type', 'application/json'); body = JSON.stringify(body); }
  const response = await fetch(new URL(path, base), { method, headers, body, redirect: 'manual' });
  if (session) for (const raw of response.headers.getSetCookie()) {
    const pair = raw.split(';')[0], i = pair.indexOf('=');
    session.cookies.set(pair.slice(0,i), pair.slice(i+1));
  }
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data, headers: response.headers };
}
function status(r, expected) { assert.equal(r.status, expected, `Expected ${expected}; received ${r.status}: ${JSON.stringify(r.data)}`); return r.data; }
async function login(session, loginEmail, loginPassword) {
  session.csrf = status(await call('/api/v1/admin/auth/csrf', {session}), 200).token;
  const profile = status(await call('/api/v1/admin/auth/login', {method:'POST',body:{email:loginEmail,password:loginPassword},session}),200);
  session.csrf = status(await call('/api/v1/admin/auth/csrf', {session}), 200).token;
  return profile;
}
const venue = status(await call('/api/v1/venue'),200);
assert.equal(venue.venueSlug, 'phase9-test-venue', 'Refusing mutations outside the explicitly labelled disposable venue.');
const date = new Date(Date.now()+7*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Manila'});
const courts = status(await call('/api/v1/courts'),200);
assert.ok(courts.length >= 2);
let court, court2;
const request = (courtId,start,end) => ({idempotencyKey:randomUUID(), courtId,date,startsAt:start,endsAt:end,guestName:'Synthetic Phase 9 Guest',guestEmail:'guest@phase9.example.test'});
await check('database readiness',async()=>status(await call('/health/db'),200));
await check('security headers on API responses',async()=>{ const r=await call('/health'); assert.equal(r.headers.get('X-Content-Type-Options'),'nosniff'); assert.match(r.headers.get('Cache-Control'),/(^|,\s*)no-store($|,)/); });
await check('anonymous admin access denied',async()=>status(await call('/api/v1/admin/payments/pending'),401));
await check('owner authenticates with real anonymous and authenticated CSRF',async()=>assert.equal((await login(owner,email,password)).role,'OWNER'));
await check('isolated repeatable court fixtures',async()=>{
 court=status(await call('/api/v1/admin/courts',{method:'POST',session:owner,body:{courtName:'API Test A '+randomUUID(),baseHourlyRate:courts[0].baseHourlyRate,displayOrder:90,isActive:true}}),201).id;
 court2=status(await call('/api/v1/admin/courts',{method:'POST',session:owner,body:{courtName:'API Test B '+randomUUID(),baseHourlyRate:courts[1].baseHourlyRate,displayOrder:91,isActive:true}}),201).id;
});
await check('authenticated mutation missing CSRF denied',async()=>status(await call('/api/v1/admin/operations/blocks',{method:'POST',session:owner,csrf:false,body:{}}),400));
const input=request(court,'08:00:00','09:00:00');
let guest;
await check('guest creates server-priced HELD reservation',async()=>{guest=status(await call('/api/v1/bookings',{method:'POST',body:input}),201); assert.equal(guest.booking.status,'HELD'); assert.equal(guest.booking.totalAmount,courts[0].baseHourlyRate);});
const code=guest.booking.bookingCode, token=guest.accessToken;
await check('idempotent exact replay',async()=>{const replay=status(await call('/api/v1/bookings',{method:'POST',body:input}),201);assert.equal(replay.booking.bookingCode,code);assert.equal(replay.accessToken,token);});
await check('changed request cannot reuse key',async()=>status(await call('/api/v1/bookings',{method:'POST',body:{...input,guestName:'Different Intent'}}),409));
await check('booking code alone grants no guest access',async()=>status(await call(`/api/v1/bookings/${code}`),404));
await check('wrong guest token denied',async()=>status(await call(`/api/v1/bookings/${code}`,{token:'x'.repeat(43)}),404));
await check('two concurrent booking attempts produce one winner',async()=>{
 const race=request(court,'10:00:00','11:00:00');
 const results=await Promise.all([call('/api/v1/bookings',{method:'POST',body:race}),call('/api/v1/bookings',{method:'POST',body:{...race,idempotencyKey:randomUUID()}})]);
 assert.deepEqual(results.map(x=>x.status).sort(),[201,409]);
});
await check('invalid upload rejected by actual content',async()=>{
 const form=new FormData();form.set('PaymentMethod','GCASH');form.set('Amount',String(guest.booking.totalAmount));form.set('TransactionReference','PHASE9-'+randomUUID());form.set('Proof',new Blob(['<html>not an image</html>'],{type:'image/png'}),'fake.png');
 status(await call(`/api/v1/bookings/${code}/payments`,{method:'POST',body:form,token}),400);
});
let payment;
await check('proof creates SUBMITTED payment and AWAITING_REVIEW only',async()=>{
 const form=new FormData();form.set('PaymentMethod','GCASH');form.set('Amount',String(guest.booking.totalAmount));form.set('TransactionReference','PHASE9-'+randomUUID());
 form.set('Proof',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'synthetic.png');
 payment=status(await call(`/api/v1/bookings/${code}/payments`,{method:'POST',body:form,token}),201);
 assert.equal(payment.status,'SUBMITTED');assert.equal(status(await call(`/api/v1/bookings/${code}`,{token}),200).status,'AWAITING_REVIEW');
});
await check('proof unavailable anonymously',async()=>status(await call(`/api/v1/admin/payments/${payment.id}/proof`),401));
await check('staff preview is private and nosniff',async()=>{const r=await call(`/api/v1/admin/payments/${payment.id}/proof`,{session:owner});status(r,200);assert.equal(r.headers.get('Content-Type'),'image/png');assert.match(r.headers.get('Cache-Control'),/(^|,\s*)no-store($|,)/);});
await check('guest cannot bypass financial cancellation review',async()=>status(await call(`/api/v1/bookings/${code}/cancel`,{method:'POST',token,body:{reason:'Synthetic cancel'}}),409));
await check('approval atomically verifies and confirms',async()=>{assert.equal(status(await call(`/api/v1/admin/payments/${payment.id}/approve`,{method:'POST',session:owner,body:{notes:'Synthetic verification'}}),200).status,'VERIFIED');assert.equal(status(await call(`/api/v1/bookings/${code}`,{token}),200).status,'CONFIRMED');});
await check('duplicate approval denied',async()=>status(await call(`/api/v1/admin/payments/${payment.id}/approve`,{method:'POST',session:owner,body:{}}),409));
await check('verified balance derives from payment ledger',async()=>{const summary=status(await call(`/api/v1/admin/payments/bookings/${code}`,{session:owner}),200);assert.equal(summary.verifiedTotal,guest.booking.totalAmount);assert.equal(summary.balanceDue,0);});
await check('maintenance cannot overlap active booking',async()=>status(await call('/api/v1/admin/operations/blocks',{method:'POST',session:owner,body:{courtId:court,date,startsAt:'08:00:00',endsAt:'09:00:00',reason:'Synthetic maintenance'}}),409));
let manual;
await check('staff manual reservation uses shared schedule',async()=>{manual=status(await call('/api/v1/admin/operations/manual-bookings',{method:'POST',session:owner,body:{...request(court2,'08:00:00','09:00:00'),channel:'PHONE'}}),201);assert.equal(manual.booking.status,'CONFIRMED');});
let block;
await check('maintenance blocks and soft removal',async()=>{block=status(await call('/api/v1/admin/operations/blocks',{method:'POST',session:owner,body:{courtId:court2,date,startsAt:'12:00:00',endsAt:'13:00:00',reason:'Synthetic maintenance'}}),201);assert.equal(block.status,'BLOCKED');assert.equal(status(await call(`/api/v1/admin/operations/blocks/${block.id}/remove`,{method:'POST',session:owner,body:{}}),200).status,'CANCELLED');});
await check('staff cancellation preserves verified payment for external refund',async()=>{assert.equal(status(await call(`/api/v1/admin/bookings/${code}/cancel`,{method:'POST',session:owner,body:{reason:'Synthetic refund flow'}}),200).status,'CANCELLED');assert.equal(status(await call(`/api/v1/admin/payments/bookings/${code}`,{session:owner}),200).payments[0].status,'VERIFIED');});
await check('external refund is recorded without erasing transaction reference',async()=>{const refunded=status(await call(`/api/v1/admin/payments/${payment.id}/record-refund`,{method:'POST',session:owner,body:{refundReference:'PHASE9-REFUND-'+randomUUID()}}),200);assert.equal(refunded.status,'REFUNDED');assert.equal(refunded.transactionReference,payment.transactionReference);});
let staff;
const staffPassword='Synthetic-Only-Password9!';
await check('owner creates synthetic STAFF account',async()=>{staff=status(await call('/api/v1/admin/staff',{method:'POST',session:owner,body:{fullName:'Synthetic Staff',email:`staff-${randomUUID()}@phase9.example.test`,password:staffPassword,role:'STAFF'}}),201);});
const staffSession={cookies:new Map(),csrf:''};
await check('STAFF cannot approve payments or manage venue',async()=>{await login(staffSession,staff.email,staffPassword);status(await call(`/api/v1/admin/payments/${payment.id}/approve`,{method:'POST',session:staffSession,body:{}}),403);status(await call('/api/v1/admin/staff',{session:staffSession}),403);});
await check('deactivation invalidates existing staff cookie',async()=>{status(await call(`/api/v1/admin/staff/${staff.id}/active`,{method:'PATCH',session:owner,body:{isActive:false}}),204);status(await call('/api/v1/admin/auth/me',{session:staffSession}),401);});
await check('logout clears staff session',async()=>{status(await call('/api/v1/admin/auth/logout',{method:'POST',session:owner,body:{}}),204);status(await call('/api/v1/admin/auth/me',{session:owner}),401);});
console.log(`API scenarios: ${passed} passed, 0 failed`);
