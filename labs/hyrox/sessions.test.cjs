const assert=require('node:assert/strict');const {budget,duration}=require('./sessions.js');
assert.deepEqual(budget('3:55','24:00','4:00','0:00'),{run:1880,total:3560,margin:40});
assert.equal(budget('3:40','24:00','4:00','0:00').run,1760);
assert.equal(budget('4:00','24:00','4:00','0:00').margin,0);
assert.equal(budget('4:10','24:00','4:00','0:00').margin,-80);
assert.equal(budget('3:55','','4:00','0:00'),null);
assert.equal(budget('3:55','24:00','4:00',''),null);
assert.equal(duration('3:99'),null);assert.equal(duration('-1:00'),null);assert.equal(duration('1:22:16'),4936);
console.log('Session budget: all checks passed');
