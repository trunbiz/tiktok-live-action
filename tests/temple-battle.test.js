const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createTempleBattle}=require('../temple-battle');
test('a hero victory resolves and then starts a fresh round',()=>{
 const battle=createTempleBattle({random:()=>.5});
 for(let i=0;i<30&&battle.snapshot().phase==='fighting';i++)battle.tick();
 assert.equal(battle.snapshot().winner,'hero');
 assert.equal(battle.snapshot().wins,1);
 for(let i=0;i<6;i++)battle.tick();
 assert.equal(battle.snapshot().round,2);assert.equal(battle.snapshot().heroHp,100);
 assert.equal(battle.snapshot().winner,null);
});
test('the demon can win and updates losses',()=>{
 let i=0;const sequence=[.1,.5,.5,.5];
 const battle=createTempleBattle({random:()=>sequence[i++%sequence.length]});
 for(let n=0;n<40&&battle.snapshot().phase==='fighting';n++)battle.tick();
 assert.equal(battle.snapshot().winner,'demon');assert.equal(battle.snapshot().losses,1);
});
test('viewer support has a shared cooldown per viewer and a bounded energy meter',()=>{
 let now=0;const battle=createTempleBattle({random:()=>.5,now:()=>now});
 assert.equal(battle.support('Alice','like','a'),true);
 assert.equal(battle.support('Alice','gift','a'),false);
 assert.equal(battle.snapshot().energy,8);
 for(let i=0;i<10;i++)battle.support(`Guest${i}`,'gift',`${i}`);
 assert.equal(battle.snapshot().energy,100);
 assert.equal(battle.tick().action.kind,'ultimate');assert.equal(battle.snapshot().energy,50);
 now=7000;battle.tick();assert.equal(battle.snapshot().supporter,null);
});
test('unassisted seeded battles produce victories for both sides',()=>{
 let seed=287;const battle=createTempleBattle({random:()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}});
 for(let i=0;i<1000;i++)battle.tick();
 const state=battle.snapshot();assert.ok(state.wins>0);assert.ok(state.losses>0);
 assert.ok(state.heroHp>=0&&state.heroHp<=100);
 assert.ok(state.demonHp>=0&&state.demonHp<=100);
});
