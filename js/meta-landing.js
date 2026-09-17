(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('meta-paid')) return;

  var hero = document.querySelector('.hero');
  if (!hero) return;

  hero.setAttribute('data-landing-variant', 'meta-paid-v1');
  window.formLandingVariant = 'meta-paid-v1';

  var poster = hero.querySelector(':scope > img');
  if (poster) poster.src = '/media/practice.jpg?v=rd26';

  var film = document.getElementById('filmA');
  if (film) film.setAttribute('data-src', '/media/practice.mp4?v=rd16');

  var kicker = hero.querySelector('.hero-kicker');
  if (kicker) kicker.textContent = 'Run Development · Brice · Miami';

  var heading = hero.querySelector('h1');
  if (heading) heading.innerHTML = 'Run better.<br>Get faster.<br>Run farther.';

  var intro = hero.querySelector('.hero-sub > p');
  if (intro) intro.textContent = 'Individual running coaching built around how you run now and where you want to go.';

  var offerLabel = hero.querySelector('.offer small');
  if (offerLabel) offerLabel.textContent = 'Individual coaching';

  var begin = hero.querySelector('.begin');
  if (begin) begin.innerHTML = 'Tell me about your running <span aria-hidden="true">→</span>';

  var reassurance = hero.querySelector('.hero-reassurance');
  if (reassurance) reassurance.innerHTML = 'First Miami track assessment complimentary.<br>No payment today.';

  var result = document.getElementById('simon');
  if (result) {
    result.classList.add('meta-result');
    var resultHeading = result.querySelector('h2');
    if (resultHeading) resultHeading.innerHTML = '<span>1:30:46</span><i aria-hidden="true">→</i><span>1:26:15</span>';
    var resultGoal = result.querySelector('.result-goal');
    if (resultGoal) resultGoal.textContent = '4:31 faster.';
    var resultNote = result.querySelector('.result-note');
    if (resultNote) resultNote.textContent = 'Half-marathon progression. Moving time and average pace from Simon’s Strava activity.';
  }
})();
