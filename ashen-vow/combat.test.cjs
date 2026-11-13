const test=require('node:test');
const assert=require('node:assert/strict');
const R=require('./combat.js');
test('front-facing attacks hit within reach and miss behind the attacker',()=>{
 assert.equal(R.inCone(0,0,0,0,2,3,Math.PI/3),true);
 assert.equal(R.inCone(0,0,0,0,-2,3,Math.PI/3),false);
 assert.equal(R.inCone(0,0,0,0,3.1,3,Math.PI/3),false);
 assert.equal(R.inCone(0,0,Math.PI,0,-2,3,Math.PI/3),true);
});
test('angle wrapping remains continuous across negative and positive pi',()=>{
 assert.ok(Math.abs(R.angleDelta(-Math.PI+.05,Math.PI-.05)-.1)<1e-9);
 assert.ok(Math.abs(R.angleDelta(Math.PI-.05,-Math.PI+.05)+.1)<1e-9);
});
test('dodge has vulnerable startup and recovery with a protected middle',()=>{
 assert.equal(R.rollInvulnerable(.04),false);
 assert.equal(R.rollInvulnerable(.08),true);
 assert.equal(R.rollInvulnerable(.25),true);
 assert.equal(R.rollInvulnerable(.4),true);
 assert.equal(R.rollInvulnerable(.55),false);
});
test('shield absorbs most damage at a stamina cost and breaks when exhausted',()=>{
 const block=R.guardHit(28,100);assert.equal(block.damage,5);assert.equal(block.broken,false);assert.ok(block.stamina<100&&block.stamina>0);
 const broken=R.guardHit(28,20);assert.deepEqual(broken,{damage:28,stamina:0,broken:true});
});
test('boss phases retain visible anticipation and recoverable attack windows',()=>{
 for(let i=0;i<6;i++){const p=R.bossAttack(i,false),q=R.bossAttack(i,true);assert.ok(p.windup>=1);assert.ok(q.windup>.55);assert.ok(q.recovery>.6);assert.ok(q.windup<p.windup);assert.ok(p.range>=4);}
 assert.equal(R.bossAttack(2,true).type,'combo');assert.equal(R.bossAttack(1,false).type,'slam');
});
