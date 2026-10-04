'use strict';
// Compatibility entry point. The connected publication builder supersedes R2.
if (!process.argv.includes('--refresh-only')) throw Error('R2 builder retired. Use build-paired-study.cjs.');
require('./build-paired-study.cjs').build().catch(e=>{console.error(e);process.exitCode=1;});
