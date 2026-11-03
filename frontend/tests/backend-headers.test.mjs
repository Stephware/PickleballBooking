import assert from 'node:assert/strict';
import test from 'node:test';
import { backendHeaders } from '../lib/backend-headers.ts';

test('upstream scheme comes from configured public origin, not request headers',()=>{
 const headers=backendHeaders(new Headers({'X-Forwarded-Proto':'http'}),{APP_ORIGIN:'https://venue.example.test'});
 assert.equal(headers.get('X-Forwarded-Proto'),'https');
});
test('client IP is ignored unless trusted ingress is explicitly configured',()=>{
 const input=new Headers({'X-Forwarded-For':'192.0.2.5'});
 assert.equal(backendHeaders(input,{}).get('X-Forwarded-For'),null);
 assert.equal(backendHeaders(input,{TRUST_PROXY_HEADERS:'1'}).get('X-Forwarded-For'),'192.0.2.5');
});
test('trusted ingress must replace the IP header with one valid address',()=>{
 for(const value of ['garbage','192.0.2.1, 192.0.2.2','192.0.2.1:80'])
   assert.equal(backendHeaders(new Headers({'X-Forwarded-For':value}),{TRUST_PROXY_HEADERS:'1'}).get('X-Forwarded-For'),null);
 assert.equal(backendHeaders(new Headers({'X-Forwarded-For':'2001:db8::5'}),{TRUST_PROXY_HEADERS:'1'}).get('X-Forwarded-For'),'2001:db8::5');
});
