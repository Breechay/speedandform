const assert = require('node:assert/strict');
const {duration, composition, trade} = require('./playbook.js');
assert.equal(trade(10,25),15); assert.equal(trade(25,10),-15); assert.equal(trade(10,10),0);
assert.equal(duration('4:60'),null); assert.equal(duration(''),null); assert.equal(duration('4:00'),240);
assert.equal(composition(['','24:00','4:00','0:00']),null);
assert.equal(composition(['0:00','24:00','4:00','0:00']),null);
const parts=composition(['3:55','24:00','4:00','0:00']);
assert.equal(parts.reduce((a,p)=>a+p.seconds,0),3560);
assert.ok(Math.abs(parts.reduce((a,p)=>a+p.fraction,0)-1)<1e-12);
assert.equal(parts[3].fraction,0);
console.log('Playbook arithmetic: passed');

assert.equal(duration('1:00:00'),3600); assert.equal(composition(['4:00','0:00','0:00','0:00']),null);
assert.equal(composition(['4:00','1:00:00','4:00','0:00'])[1].seconds,3600);
