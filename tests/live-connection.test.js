const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createLiveConnection}=require('../live-connection');
test('simultaneous requests for the same channel share one attempt',async()=>{
 let finish,calls=0;
 const connection=createLiveConnection({attempt:()=>{calls++;return new Promise(r=>finish=r);}});
 const one=connection.connect('room'),two=connection.connect('room');
 assert.equal(one,two);assert.equal(calls,1);
 await assert.rejects(connection.connect('other'),/Đang kết nối/);
 finish('connected');assert.equal(await one,'connected');
});
test('WebSocket timeout is retried on a new attempt and then succeeds',async()=>{
 let calls=0;const retries=[];
 const connection=createLiveConnection({attempt:async()=>{if(++calls===1)throw Error('Timed out whilst connecting to WebSocket');return 'connected';},sleep:async()=>{},onRetry:(_,n)=>retries.push(n)});
 assert.equal(await connection.connect('room'),'connected');assert.equal(calls,2);assert.deepEqual(retries,[2]);
});
test('aggregate IPv4/TCP errors are retryable, but offline channels are not',async()=>{
 let calls=0;
 const timeout=createLiveConnection({attempt:async()=>{calls++;throw new AggregateError([Object.assign(Error(),{code:'ETIMEDOUT'})]);},sleep:async()=>{}});
 await assert.rejects(timeout.connect('room'));assert.equal(calls,2);
 calls=0;
 const offline=createLiveConnection({attempt:async()=>{calls++;throw Error('The requested user is not online');}});
 await assert.rejects(offline.connect('room'),/not online/);assert.equal(calls,1);
});
test('refused TCP connection is retried and can recover',async()=>{
 let calls=0;
 const connection=createLiveConnection({attempt:async()=>{if(++calls===1)throw Object.assign(Error('connect ECONNREFUSED 118.69.16.22:443'),{code:'ECONNREFUSED'});return 'connected';},sleep:async()=>{}});
 assert.equal(await connection.connect('room'),'connected');assert.equal(calls,2);
});
test('persistent nested connection refusal stops after the retry limit',async()=>{
 let calls=0;
 const error=new AggregateError([Object.assign(Error(),{code:'ECONNREFUSED'})]);
 const connection=createLiveConnection({attempt:async()=>{calls++;throw error;},sleep:async()=>{}});
 await assert.rejects(connection.connect('room'),e=>e===error);assert.equal(calls,2);
});
test('disconnect cancels pending results and allows a fresh connection',async()=>{
 let finish,calls=0;
 const connection=createLiveConnection({attempt:()=>++calls===1?new Promise(r=>finish=r):Promise.resolve('new')});
 const old=connection.connect('room');const rejected=assert.rejects(old,/Đã hủy/);
 connection.cancel();finish('old');await rejected;
 assert.equal(await connection.connect('other'),'new');
});
