const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function engine(browser = {dispatchEvent(){}}, extras = {}) {
 const sandbox={window:browser,CustomEvent:class {constructor(type, options){this.type=type;this.detail=options.detail;}},localStorage:{getItem:()=>null},Audio:class {constructor(){this.volume=1}},console,setTimeout,clearTimeout,setInterval,clearInterval,AbortSignal,...extras};
 vm.runInNewContext(fs.readFileSync('public/js/audio.js','utf8'),sandbox);
 return new sandbox.window.TempleAudioEngine();
}
test('locked audio keeps speech queued until a user gesture',()=>{
 const audio=engine();
 audio.fetchZeroTtsAudio=async()=>({ok:false});
 audio.enqueueTts('Welcome');
 assert.equal(audio.ttsQueue.length,1);
 assert.equal(audio.ttsPlaying,false);
});
test('missing ZeroTTS falls back to browser speech and restores music ducking',async()=>{
 const audio=engine(); const heard=[]; const duck=[];
 audio.unlocked=true;
 audio.speakBrowser=async text=>heard.push(text);
 audio.setBgDucking=value=>duck.push(value);
 audio.ttsQueue.push({text:'Welcome',createdAt:Date.now(),fetchPromise:Promise.resolve({ok:false})});
 await audio.processTtsQueue();
 assert.deepEqual(heard,['Welcome']);
 assert.deepEqual(duck,[true,false]);
 assert.equal(audio.ttsPlaying,false);
});
test('zero music volume stays silent during speech',()=>{
 const audio=engine();audio.bgBaseVolume=0;
 assert.equal(audio.getDuckedVolume(),0);
});

function browserVoices(voices) {
 const spoken=[], notices=[];
 const browser={SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},dispatchEvent:e=>notices.push(e.detail),speechSynthesis:{getVoices:()=>voices,addEventListener(){},removeEventListener(){},cancel(){},speak:speech=>{spoken.push(speech);speech.onend();}}};
 return {browser,spoken,notices};
}
test('only a Vietnamese voice can read fallback text',async()=>{
 const f=browserVoices([{name:'English',lang:'en-US'},{name:'Vietnamese',lang:'vi-VN'}]);
 await engine(f.browser).speakBrowser('Xin chao');
 assert.equal(f.spoken.length,1);
 assert.equal(f.spoken[0].voice.lang,'vi-VN');
});
test('English default is never used when Vietnamese voice is unavailable',async()=>{
 const f=browserVoices([{name:'English',lang:'en-US'}]);
 await engine(f.browser).speakBrowser('Xin chao');
 assert.equal(f.spoken.length,0);
 assert.ok(f.notices.length);
});
test('Vietnamese voice can arrive after voiceschanged',async()=>{
 const f=browserVoices([]);let changed;let voices=[];
 f.browser.speechSynthesis.getVoices=()=>voices;
 f.browser.speechSynthesis.addEventListener=(event,fn)=>{changed=fn;};
 const speech=engine(f.browser).speakBrowser('Xin chao');
 voices=[{name:'Vietnamese',lang:'vi_VN'}];changed();await speech;
 assert.equal(f.spoken[0].voice.lang,'vi_VN');
});


test('named thanks goes ahead of queued routine speech',()=>{
 const audio=engine();audio.fetchZeroTtsAudio=async()=>({ok:false});
 audio.enqueueTts('Routine narration');audio.enqueueTts('Thanks Alice',{priority:true});
 assert.equal(audio.ttsQueue[0].text,'Thanks Alice');assert.equal(audio.ttsQueue[1].text,'Routine narration');
});

test('locked audio does not consume worker requests before permission to play',()=>{
 const audio=engine();let requests=0;
 audio.fetchZeroTtsAudio=async()=>{requests++;return {ok:false};};
 audio.enqueueTts('Thanks Alice',{priority:true});
 assert.equal(requests,0);assert.equal(audio.ttsQueue.length,1);
});
test('startup response is retried until the Vietnamese worker is ready',async()=>{
 let requests=0;
 const audio=engine(undefined,{fetch:async()=>({json:async()=>++requests===1?{ok:false,retryable:true}:{ok:true,url:'/tts-cache/test.wav'}}),setTimeout:fn=>{queueMicrotask(fn);return 1;}});
 const result=await audio.fetchZeroTtsAudio('Thanks Alice');
 assert.equal(requests,2);assert.equal(result.url,'/tts-cache/test.wav');
});

test('autoplay blocked stays locked and a later resume starts waiting speech',async()=>{
 let allow;
 class Context {
   constructor(){this.state='suspended';}
   resume(){return new Promise(resolve=>{allow=()=>{this.state='running';this.onstatechange();resolve();};});}
 }
 const notices=[];
 const audio=engine({AudioContext:Context,dispatchEvent:e=>notices.push(e.detail)});
 audio.bgMusicEnabled=false;
 let queueStarts=0;audio.processTtsQueue=()=>queueStarts++;
 audio.ensureContext();
 assert.equal(audio.unlocked,false);assert.equal(queueStarts,0);
 allow();await Promise.resolve();
 assert.equal(audio.unlocked,true);assert.ok(queueStarts>0);
 assert.ok(notices.includes(false));assert.ok(notices.includes(true));
});

test('permitted autoplay opens the audio queue without a user gesture',()=>{
 const audio=engine({AudioContext:class{constructor(){this.state='running';}},dispatchEvent(){}});
 audio.bgMusicEnabled=false;
 let queueStarts=0;audio.processTtsQueue=()=>queueStarts++;
 audio.ensureContext();
 assert.equal(audio.unlocked,true);assert.equal(queueStarts,1);
});
