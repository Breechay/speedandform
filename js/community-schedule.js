/* Canonical public community schedule for FORM.
   Change recurring Thursday logistics here first. Pages should render from this
   object rather than hard-coding time/location/session rotation. */
(function (global) {
  'use strict';

  global.FORM_COMMUNITY_SCHEDULE = Object.freeze({
    version: '2026-09-22',
    thursday: Object.freeze({
      weekday: 'Thursday',
      dayLabel: 'Thursdays',
      time: '6:00 AM',
      time24: '06:00',
      whenLabel: 'Thursdays · 6:00 AM',
      locationName: 'Flamingo Park Track',
      locationCity: 'Miami Beach',
      locationDetail: 'track entrance on 11th St',
      mapUrl: 'https://maps.google.com/?q=Flamingo+Park+Track,+Miami+Beach,+FL',
      audience: 'all levels',
      sessions: Object.freeze([
        Object.freeze({ session:'01', name:'Nice and Easy', nameBreak:'Nice and<br>Easy' }),
        Object.freeze({ session:'02', name:'Pyramid Intervals', nameBreak:'Pyramid<br>Intervals' }),
        Object.freeze({ session:'03', name:'Gauntlet', nameBreak:'Gauntlet' }),
        Object.freeze({ session:'04', name:'Speed Demons', nameBreak:'Speed<br>Demons' }),
        Object.freeze({ session:'05', name:'Death', nameBreak:'Death' }),
        Object.freeze({ session:'06', name:'Resurrection', nameBreak:'Resurrection' })
      ]),
      authored: Object.freeze([
        Object.freeze({ date:'2026-09-17', idx:3 }),
        Object.freeze({ date:'2026-09-24', idx:2 }),
        Object.freeze({ date:'2026-10-01', optional:true })
      ])
    }),
    longRun: Object.freeze({
      cadence: 'About once a month',
      locationPolicy: 'Changing routes around Miami',
      announcementUrl: 'https://www.instagram.com/form.practice/'
    })
  });
}(window));
