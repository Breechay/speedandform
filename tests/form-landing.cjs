/* The Running page (form/index.html) on house rules. Shared checks: tests/app-pages-house.cjs. */
require('./app-pages-house.cjs').check('form/index.html',{name:'Speed & Form: Running',store:'https://apps.apple.com/us/app/form-running-plans/id6761313085',css:'css/form-landing.css',stray:/\bFORM app\b|View FORM|Inside FORM|Breechay Sculpt/});
console.log('PASS: Running page names the app, keeps its App Store link, carries the SF emblem and the house type.');
