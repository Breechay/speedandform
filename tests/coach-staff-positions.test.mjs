import test from 'node:test';
import assert from 'node:assert/strict';
import {STAFF_POSITIONS,staffPosition} from '../coach/ops/staff-positions.mjs';

test('positions have unique memorable codes and accountable remits',()=>{
  assert.equal(new Set(STAFF_POSITIONS.map(x=>x.code)).size,STAFF_POSITIONS.length);
  for(const p of STAFF_POSITIONS){
    assert.match(p.code,/^[A-Z]{2}$/);
    assert.ok(p.title&&p.department&&p.remit);
    assert.ok(['human','agent_function'].includes(p.kind));
  }
  assert.equal(staffPosition('HC').holder,'Brice');
  assert.equal(staffPosition('QR').department,'Product');
  assert.equal(staffPosition('unknown'),null);
});
test('role directory does not assert that an agent is running',()=>{
  assert.ok(STAFF_POSITIONS.every(p=>p.kind==='human'||p.kind==='agent_function'));
  assert.ok(!STAFF_POSITIONS.some(p=>p.status==='running'||p.verified===true));
});
