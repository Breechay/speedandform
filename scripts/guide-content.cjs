'use strict';
// The reviewed foundations share the authored Running Basics lessons.
const files=new Set(['easy-run.html','threshold-training.html','long-run-pace.html','running-form-errors.html']);
module.exports=require('./running-lessons-content.cjs').filter(g=>files.has(g.file));
