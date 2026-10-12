/* The Strength page (forge-sculpt/index.html) on house rules. Shared checks: tests/app-pages-house.cjs. */
require('./app-pages-house.cjs').check('forge-sculpt/index.html',{name:'Speed & Form: Strength',store:'https://apps.apple.com/us/app/breechay/id6790569283',css:'css/sculpt-landing.css',stray:/\bBreechay(?! Sculpt)\b|FORM running app|BREECHAY/});
console.log('PASS: Strength page names the app, keeps its App Store link, carries the SF emblem and the house type.');
