import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceRejection} from '../netlify/edge-functions/garmin-ingress.js';
test('only addresses inside complete trusted ranges pass',()=>{
 const ranges='192.0.2.0/24,198.51.100.16/28';
 for(const ip of ['192.0.2.0','192.0.2.255','198.51.100.16','198.51.100.31','::ffff:192.0.2.1']) assert.equal(sourceRejection(ip,ranges),null);
 for(const ip of ['192.0.1.255','198.51.100.32','192.0.2.267','', '::1']) assert.ok(sourceRejection(ip,ranges));
 assert.ok(sourceRejection('192.0.2.3',ranges+',bad'));
});
