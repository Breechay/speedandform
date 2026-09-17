'use strict';
// Reconcile historical release guards with exact later approved revisions.
// This module never accepts a file by path alone: every owned file is verified
// against a dedicated receipt or deterministic later-release state.
const guide=require('./guide-state.cjs');
const contact=require('./contact-notes-state.cjs');
const polish=require('./app-preview-polish.cjs');
const method=require('./run-development-method-state.cjs');
const laterRuntime=require('./later-runtime-state.cjs');

function verify(file,text){
  if(method.verify(file,text))return true;
  if(laterRuntime.verify(file,text))return true;
  if(contact.verify(file,text))return true;
  if(polish.verify(file,text))return true;
  if(file.endsWith('.html')&&guide.verify(file,text))return true;
  return false;
}
module.exports={verify};
