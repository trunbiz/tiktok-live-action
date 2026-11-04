const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const {EventEmitter}=require('node:events');
function fixture(){
 const routes={}, messages=[];
 const app={use(){},get(){},all(){},post(path,handler){routes[path]=handler;}};
 const express=()=>app;express.json=express.static=()=>()=>{};
 class SocketServer extends EventEmitter{constructor(){super();this.clients=new Set([{readyState:1,send:text=>messages.push(JSON.parse(text))}]);}}
 let connection;
 class Connection extends EventEmitter{constructor(){super();connection=this;}connect(){return Promise.resolve({roomId:'test'});}disconnect(){}}
 const webcast=Object.fromEntries(['ROOM_USER','MEMBER','CHAT','LIKE','FOLLOW','SHARE','SOCIAL','GIFT'].map(k=>[k,k]));
 const control=Object.fromEntries(['CONNECTED','DISCONNECTED','ERROR'].map(k=>[k,k]));
 const overrides={express,http:{createServer:()=>({listen(){}})},fs:{mkdirSync(){},existsSync:()=>false},cors:()=>()=>{},ws:{WebSocketServer:SocketServer},child_process:{spawn:()=>{const proc=new EventEmitter();proc.stdout=new EventEmitter();proc.stderr=new EventEmitter();proc.stdin={write(){}};return proc;}},'tiktok-live-connector':{TikTokLiveConnection:Connection,WebcastEvent:webcast,ControlEvent:control}};
 vm.runInNewContext(fs.readFileSync('server.js','utf8'),{require:name=>overrides[name]||require(name.startsWith('./')?'../'+name.slice(2):name),__dirname:require('node:path').resolve('.'),process:{env:{},platform:'win32'},console:{log(){},warn(){},error(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>({unref(){}}),clearInterval(){},fetch:()=>{throw Error('Unexpected network');}});
 return {messages,async connect(username='test'){await routes['/rpc']({body:{method:'live.connect',params:{username}}},{json(){},status(){return this;}});return connection;}};
}
test('TikTok likes and joins immediately notify the scene, without waiting for speech',async()=>{
 const f=fixture(), c=await f.connect();f.messages.length=0;
 c.emit('LIKE',{uniqueId:'alice',nickname:'Alice',likeCount:12});
 assert.equal(f.messages[0].method,'temple.reaction');
 assert.equal(f.messages[0].params.type,'like');
 assert.equal(f.messages[0].params.count,12);
 assert.equal(f.messages[1].params.event.fromLike,true);
 c.emit('MEMBER',{uniqueId:'bob',nickname:'Bob'});
 assert.ok(f.messages.some(m=>m.method==='temple.reaction'&&m.params.type==='enter'));
});
test('chat is sanitized before on-screen feedback and still triggers a ritual',async()=>{
 const f=fixture(), c=await f.connect();f.messages.length=0;
 c.emit('CHAT',{uniqueId:'alice',nickname:'Alice',comment:'xin xam'});
 assert.equal(f.messages[0].params.type,'comment');
 assert.ok(f.messages.some(m=>m.params?.event?.type==='drawFortune'));
 const count=f.messages.length;
 c.emit('CHAT',{uniqueId:'spam',nickname:'Spam',comment:'telegram'});
 assert.equal(f.messages.length,count);
});

test('events from a replaced connection cannot affect the new room',async()=>{
 const f=fixture();const old=await f.connect('one');const current=await f.connect('two');
 f.messages.length=0;
 old.emit('CHAT',{uniqueId:'a',nickname:'Alice',comment:'hello'});
 old.emit('DISCONNECTED');assert.equal(f.messages.length,0);
 current.emit('CHAT',{uniqueId:'b',nickname:'Bob',comment:'hello'});
 assert.ok(f.messages.some(m=>m.method==='temple.reaction'&&m.params.user==='Bob'));
});

