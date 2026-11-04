const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createLiveSupport}=require('../live-support');
test('session counts real coin deltas and ranks supporters independently of merit',()=>{
 const session=createLiveSupport();session.start('room');
 session.record({uniqueId:'a',user:'Alice',coins:2,count:2});
 session.record({uniqueId:'b',user:'Bob',coins:100});
 session.record({uniqueId:'a',user:'Alice',coins:3});
 assert.equal(session.snapshot().coins,105);
 assert.equal(session.snapshot().gifts,4);
 assert.deepEqual(session.snapshot().supporters.map(p=>p.name),['Bob','Alice']);
 session.record({user:'bad',coins:NaN});
 assert.equal(session.snapshot().coins,105);
});
test('same channel reconnect retains the session, switching channels starts fresh',()=>{
 const session=createLiveSupport();session.start('one');
 session.record({user:'Alice',coins:10});session.start('one');
 assert.equal(session.snapshot().coins,10);
 session.start('two');assert.equal(session.snapshot().coins,0);
 assert.deepEqual(session.snapshot().supporters,[]);
});
