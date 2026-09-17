'use strict';
// PR128 independently shipped the coaching measurement script while Pass5B was
// under review. Preserve that exact upstream revision instead of requiring the
// older, pre-instrumentation bytes. This is a pinned baseline, not an exclusion.
const concurrentRef = 'a8a778a0ce30d8eca12f7ac43efcd84583164bec';
module.exports = function protectedBaseline(file, originalRef) {
  return file === 'js/coaching-measurement.js' ? concurrentRef : originalRef;
};
