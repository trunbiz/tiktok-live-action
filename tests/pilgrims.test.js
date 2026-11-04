const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(){
 function node(tag='div'){
  const el={tag,children:[],dataset:{},style:{},textContent:'',className:'',parent:null};
  const classes=new Set();el.classList={add:k=>classes.add(k),toggle(k,on){if(on)classes.add(k);else classes.delete(k);},contains:k=>classes.has(k)};
  el.appendChild=child=>{child.parent=el;el.children.push(child);};el.append=(...children)=>children.forEach(el.appendChild);
  el.remove=()=>{if(el.parent)el.parent.children=el.parent.children.filter(c=>c!==el);};
  el.querySelectorAll=tag=>el.children.flatMap(c=>[...(c.tag===tag?[c]:[]),...c.querySelectorAll(tag)]);
  return el;
 }
 const context={window:{},document:{hidden:false,createElement:node},performance:{now:()=>0}};
 vm.runInNewContext(fs.readFileSync('public/js/pilgrims.js','utf8'),context);
 let time=0;const layer=node();const pilgrims=new context.window.TemplePilgrims(layer,{autoStart:false,now:()=>time});
 return {pilgrims,layer,advance(ms){time+=ms;pilgrims.tick(time);}};
}
test('idle scenery is labeled and never spawns until the quiet threshold',()=>{
 const f=fixture();f.advance(11999);assert.equal(f.layer.children.length,0);
 f.advance(40);assert.equal(f.pilgrims.actors.length,1);
 assert.equal(f.pilgrims.actors[0].ambient,true);
 assert.notEqual(f.pilgrims.actors[0].node.children[2].textContent,'Nhân vật nền');
 assert.equal(f.pilgrims.actors[0].node.children[3].textContent,'Khách mô phỏng');
 f.pilgrims.setAmbient(false);assert.equal(f.layer.children.length,0);
 f.advance(30000);assert.equal(f.layer.children.length,0);
});
test('real visitors have independent poses and duplicates keep one actor',()=>{
 const f=fixture();f.pilgrims.visit({user:'Alice',uniqueId:'a'});f.advance(3000);
 f.pilgrims.visit({user:'Bob',uniqueId:'b'});f.advance(3500);
 assert.equal(f.pilgrims.actors.length,2);
 assert.equal(f.pilgrims.actors[0].node.classList.contains('offering'),true);
 assert.equal(f.pilgrims.actors[1].node.classList.contains('offering'),false);
 f.pilgrims.visit({user:'Alice',uniqueId:'a'});assert.equal(f.pilgrims.actors.length,2);
 assert.equal(f.pilgrims.actors[0].node.classList.contains('acknowledged'),true);
});
test('real visitors replace ambient actors and queue remains bounded',()=>{
 const f=fixture();f.pilgrims.visit({}, {ambient:true});
 for(let i=0;i<8;i++)f.pilgrims.visit({user:`Guest ${i}`,uniqueId:`${i}`});
 assert.equal(f.pilgrims.actors.length,8);
 assert.equal(f.pilgrims.actors.some(a=>a.ambient),false);
 for(let i=8;i<50;i++)f.pilgrims.visit({user:`Guest ${i}`,uniqueId:`${i}`});
 assert.equal(f.pilgrims.queue.length,24);
 f.advance(22000);assert.equal(f.pilgrims.actors.length,8);
 assert.equal(f.pilgrims.queue.length,16);
});


test('ambient names do not repeat until all 288 combinations have been used',()=>{
 const f=fixture();const names=new Set();
 for(let i=0;i<288;i++) names.add(f.pilgrims.nextAmbientName());
 assert.equal(names.size,288);
 assert.ok(f.pilgrims.nextAmbientName());
});
