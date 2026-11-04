const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createEngagement } = require('../engagement');
function fixture() {
  let time = 0;
  const events = [], settings = {};
  let live = true;
  const host = createEngagement({ emit: e => events.push(e), getSettings: () => settings, isLive: () => live, now: () => time });
  return { host, events, settings, advance: ms => time += ms, offline: () => live = false };
}
test('named thanks takes priority and merges likes and comments for the same person', () => {
  const f = fixture();
  f.host.join({user:'Bob',uniqueId:'b'});
  f.host.like({user:'Alice',uniqueId:'a'},7);
  f.host.like({user:'Alice',uniqueId:'a'},3);
  f.host.comment({user:'Alice',uniqueId:'a'});
  f.host.tick();
  assert.equal(f.events.length,1);
  assert.equal(f.events[0].type,'viewerThanks');
  assert.equal(f.events[0].count,10);
  assert.match(f.events[0].ttsText,/Alice/);
  assert.match(f.events[0].ttsText,/bình luận và thả tim/);
  f.advance(12000);f.host.tick();
  assert.equal(f.events[1].type,'welcome');
});
test('thanks waits through voice cooldown instead of being silently discarded',()=>{
  const f=fixture();f.host.join({user:'Bob'});f.host.tick();
  f.host.like({user:'Alice'},5);f.host.tick();
  assert.equal(f.events.length,1);
  f.advance(12000);f.host.tick();
  assert.match(f.events[1].ttsText,/Alice/);
  f.host.like({user:'Alice'},5);f.advance(12000);f.host.tick();
  assert.equal(f.events.length,2);
  f.advance(8000);f.host.like({user:'Alice'},1);f.host.tick();
  assert.equal(f.events.length,3);
});
test('busy rooms read batches of two names and retain remaining people',()=>{
  const f=fixture();
  ['Alice','Bob','Carol'].forEach(user=>f.host.comment({user}));
  f.host.tick();assert.match(f.events[0].ttsText,/Alice.*Bob/);
  f.advance(12000);f.host.tick();assert.match(f.events[1].ttsText,/Carol/);
});
test('prompts require a live room, quiet period, and honor settings', () => {
  const f = fixture();
  f.advance(65000); f.host.tick();
  assert.equal(f.events[0].type, 'hostPrompt');
  f.advance(65000); f.settings.autoHostEnabled = false; f.host.tick();
  assert.equal(f.events.length, 1);
  f.settings.autoHostEnabled = true; f.offline(); f.host.tick();
  assert.equal(f.events.length, 1);
});
test('welcome and like controls discard queued events; reset permits fresh session', () => {
  const f = fixture();
  f.host.join({ user: 'Alice' }); f.host.like({ user: 'Alice' }, 1);
  f.settings.welcomeEnabled = f.settings.likeThanksEnabled = false;
  f.host.tick(); assert.equal(f.events.length, 0);
  f.settings.welcomeEnabled = true;
  f.host.reset(); f.host.join({ user: 'Alice' }); f.host.tick();
  assert.equal(f.events.length, 1);
});

test('comment thanks can be disabled without disabling like thanks',()=>{
 const f=fixture();f.settings.commentThanksEnabled=false;
 f.host.comment({user:'Alice'});f.host.like({user:'Bob'},2);f.host.tick();
 assert.equal(f.events.length,1);assert.match(f.events[0].ttsText,/Bob/);assert.doesNotMatch(f.events[0].ttsText,/Alice/);
});
