// Run against a disposable production-image stack, simulating its trusted TLS ingress.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
const base = process.env.PHASE9_DEPLOYMENT_URL;
if (process.env.PHASE9_MUTATIONS !== '1' || !base ||
    !['localhost','127.0.0.1'].includes(new URL(base).hostname))
  throw new Error('Require a loopback disposable deployment and PHASE9_MUTATIONS=1.');
const email=process.env.PHASE9_OWNER_EMAIL, password=process.env.PHASE9_OWNER_PASSWORD;
assert.ok(email && password,'Provide synthetic owner credentials.');
const origin=process.env.PHASE9_APP_ORIGIN;
assert.ok(origin?.startsWith('https://'),'Provide the configured HTTPS APP_ORIGIN.');
const sessionFile=process.env.PHASE9_SESSION_FILE;
let passed=0;
async function check(name,run){await run();passed++;console.log('PASS '+name);}
async function call(path,{method='GET',ip='192.0.2.51',body,cookie,requestOrigin=origin}={}){
 const r=await fetch(new URL(path,base),{method,headers:{Origin:requestOrigin,'X-Forwarded-For':ip,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});
 const text=await r.text();let data;try{data=JSON.parse(text);}catch{data=text;}
 return {status:r.status,data,headers:r.headers};
}
const venue=await call('/api/player/venue');
assert.equal(venue.data.venueSlug,'phase9-test-venue','Refusing non-test venue.');
await check('production frontend loads its isolated venue',async()=>assert.equal(venue.status,200));
if(sessionFile&&existsSync(sessionFile)) await check('persisted staff ticket survives container recreation',async()=>{
 const saved=JSON.parse(await readFile(sessionFile,'utf8'));assert.equal((await call('/api/admin/session',{cookie:saved.cookie})).status,200);
 assert.equal((await call('/api/player/bookings/'+saved.code,{cookie:saved.guestCookie})).status,200);
 const proof=await call('/api/admin/payments/'+saved.paymentId+'/proof',{cookie:saved.cookie});assert.equal(proof.status,200);assert.equal(proof.headers.get('Content-Type'),'image/png');
 if(saved.pdfId){
  const pdf=await call('/api/admin/payments/'+saved.pdfId+'/proof',{cookie:saved.cookie});
  assert.equal(pdf.status,200);assert.equal(pdf.headers.get('Content-Type'),'application/pdf');
  assert.match(pdf.headers.get('content-disposition')||'',/attachment/i);
 }
});
await check('staff schedule is private even when a valid date is known',async()=>{
 const date=new Date(Date.now()+3*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Manila'});
 assert.equal((await call('/api/admin/operations/availability?date='+date)).status,401);
});
await check('wrong modifying Origin rejected at production gateway',async()=>{
 assert.equal((await call('/api/admin/session',{method:'POST',body:{email,password},requestOrigin:'https://untrusted.example.test'})).status,403);
});
await check('one client exhausts only its own login rate limit',async()=>{
 const results=[];for(let i=0;i<6;i++)results.push((await call('/api/admin/session',{method:'POST',ip:'192.0.2.52',body:{email,password:'synthetic-wrong-password'}})).status);
 assert.deepEqual(results,[401,401,401,401,401,429]);
});
let cookie, courtId;
await check('another client logs in over trusted HTTPS forwarding on the internal HTTP hop',async()=>{
 const r=await call('/api/admin/session',{method:'POST',body:{email,password}});
 assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.role,'OWNER');
 const set=r.headers.getSetCookie();assert.equal(set.length,3);
 assert.ok(set.every(x=>/; Secure/i.test(x)&&/; HttpOnly/i.test(x)&&/; SameSite=Strict/i.test(x)));
 cookie=set.map(x=>x.split(';')[0]).join('; ');
});
await check('venue customization is disabled for ordinary owner by default',async()=>{
 const current=await call('/api/admin/venue',{cookie});
 assert.equal(current.status,200,JSON.stringify(current.data));
 const edit=await call('/api/admin/venue',{method:'PUT',cookie,body:current.data});
 assert.equal(edit.status,403,'Developer feature gate must remain off even for OWNER');
 const after=await call('/api/admin/venue',{cookie});
 assert.deepEqual(after.data,current.data);
});
await check('authenticated gateway mutation completes real backend CSRF',async()=>{
 const r=await call('/api/admin/courts',{method:'POST',cookie,body:{courtName:'Container Smoke '+crypto.randomUUID(),baseHourlyRate:250,displayOrder:99,isActive:true}});
 assert.equal(r.status,201,JSON.stringify(r.data));courtId=r.data.id;
});
let code, guestCookie, paymentId, pdfId;
await check('production guest cookie hides bearer token and proof uses private storage',async()=>{
 const date=new Date(Date.now()+3*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Manila'});
 const held=await call('/api/player/bookings',{method:'POST',body:{idempotencyKey:crypto.randomUUID(),courtId,date,startsAt:'08:00:00',endsAt:'09:00:00',guestName:'Container Synthetic Guest',guestEmail:'container@phase9.example.test'}});
 assert.equal(held.status,201,JSON.stringify(held.data));assert.equal(held.data.accessToken,undefined);
 code=held.data.booking.bookingCode;
 guestCookie=held.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
 assert.ok(held.headers.getSetCookie().every(x=>/; Secure/i.test(x)&&/; HttpOnly/i.test(x)));
 const form=new FormData();form.set('PaymentMethod','GCASH');form.set('Amount','250');form.set('TransactionReference','CONTAINER-'+crypto.randomUUID());
 form.set('Proof',new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')],{type:'image/png'}),'synthetic.png');
 const payment=await call('/api/player/bookings/'+code+'/payments',{method:'POST',cookie:guestCookie,body:form});assert.equal(payment.status,201,JSON.stringify(payment.data));assert.equal(payment.data.status,'SUBMITTED');paymentId=payment.data.id;
 const proof=await call('/api/admin/payments/'+paymentId+'/proof',{cookie});assert.equal(proof.status,200);assert.equal(proof.headers.get('Content-Type'),'image/png');
 assert.equal((await call('/api/admin/payments/'+paymentId+'/proof')).status,401);
});
await check('PDF receipt remains staff-only and forces attachment download',async()=>{
 const date=new Date(Date.now()+3*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Manila'});
 const held=await call('/api/player/bookings',{method:'POST',body:{
   idempotencyKey:crypto.randomUUID(),courtId,date,startsAt:'09:00:00',endsAt:'10:00:00',
   guestName:'Synthetic PDF Guest',guestEmail:'pdf@phase4.example.test',
 }});
 assert.equal(held.status,201,JSON.stringify(held.data));
 const pdfCode=held.data.booking.bookingCode;
 const pdfCookie=held.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');
 const payload=new FormData();
 payload.set('PaymentMethod','GCASH');payload.set('Amount','250');
 payload.set('TransactionReference','PDF-'+crypto.randomUUID());
 payload.set('Proof',new Blob(['%PDF-1.4\\n1 0 obj\\n<<>>\\nendobj\\n%%EOF'],{
   type:'application/pdf',
 }),'receipt.pdf');
 const payment=await call('/api/player/bookings/'+pdfCode+'/payments',{
   method:'POST',cookie:pdfCookie,body:payload,
 });
 assert.equal(payment.status,201,JSON.stringify(payment.data));pdfId=payment.data.id;
 const proof=await call('/api/admin/payments/'+pdfId+'/proof',{cookie});
 assert.equal(proof.status,200);
 assert.equal(proof.headers.get('Content-Type'),'application/pdf');
 assert.match(proof.headers.get('content-disposition')||'',/attachment/i);
 assert.match(proof.headers.get('Cache-Control')||'',/no-store/i);
 assert.equal((await call('/api/admin/payments/'+pdfId+'/proof')).status,401);
});
if(sessionFile)await writeFile(sessionFile,JSON.stringify({cookie,code,guestCookie,paymentId,pdfId}),{mode:0o600});
console.log(`Deployment scenarios: ${passed} passed, 0 failed`);
