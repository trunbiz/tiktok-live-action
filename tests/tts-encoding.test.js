const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const python=path.resolve('.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
test('Windows worker decodes UTF-8 Vietnamese JSON without losing accents',{skip:!fs.existsSync(python)},()=>{
 const text='Cảm ơn bạn. Chúc gia đình bình an.';
 // Exercise the worker's actual I/O and sanitizer without importing the model runtime.
 const script="import runpy,sys,json,types; sys.modules['numpy']=types.SimpleNamespace(ndarray=object); sys.modules['zerotts']=types.SimpleNamespace(ZeroTTS=object,normalize_vi_text=lambda text:text); sys.modules['zerotts.chunking']=types.SimpleNamespace(normalize_punctuation=lambda text:text); worker=runpy.run_path('tts_worker.py',run_name='voice_encoding_test'); req=json.loads(sys.stdin.readline()); print(json.dumps({'encoding':sys.stdin.encoding,'text':worker['clean_and_normalize_text'](req['text'])}))";
 const result=spawnSync(python,['-c',script],{input:JSON.stringify({text})+'\n',encoding:'utf8',timeout:30000,env:{...process.env,PYTHONIOENCODING:'cp1252',PYTHONUTF8:'0'}});
 assert.equal(result.status,0,result.stderr);
 const value=JSON.parse(result.stdout);
 assert.equal(value.encoding,'utf-8');
 assert.equal(value.text,text);
});
