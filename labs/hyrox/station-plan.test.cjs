const a=require('node:assert/strict'),{parse,compare,total}=require('./station-plan.js');
a.equal(total(['3:50','2:00','3:00','3:00','3:50','1:30','3:00','3:50']),1440);
a.equal(compare('3:00','2:40'),20);a.equal(compare('3:00','3:10'),-10);a.equal(compare('3:00',''),null);a.equal(compare('','2:40'),null);a.equal(parse('0:00'),null);a.equal(parse('2:99'),null);a.equal(total(Array(7).fill('3:00')),null);a.equal(total(['',...Array(7).fill('3:00')]),null);console.log('PASS station budget, signed allowance and incomplete inputs');
