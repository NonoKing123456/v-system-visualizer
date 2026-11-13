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
test('guard succeeds at the exact threshold and breaks immediately below it',()=>{
 const cost=28*.85+5;
 assert.deepEqual(R.guardHit(28,cost),{damage:5,stamina:0,broken:false});
 assert.deepEqual(R.guardHit(28,cost-.001),{damage:28,stamina:0,broken:true});
});

test('a three-cut chain offers faster cuts followed by a stronger committed finisher',()=>{
 const cuts=[0,1,2].map(i=>R.playerAttack('light',i)),heavy=R.playerAttack('heavy');
 assert.deepEqual(cuts.map(p=>p.pose),['cut-right','cut-left','finisher']);
 assert.ok(cuts[2].damage>cuts[1].damage&&cuts[1].damage>cuts[0].damage);
 assert.ok(cuts[2].total>cuts[0].total&&cuts[2].stamina>cuts[0].stamina);
 assert.ok(heavy.windup>cuts[2].windup&&heavy.poise>cuts[2].poise&&heavy.damage>cuts[2].damage);
 assert.deepEqual(R.playerAttack('light',3),cuts[0]);
 assert.deepEqual(R.playerAttack('light',-1),cuts[2]);
 for(const p of [...cuts,heavy]){
  assert.ok(p.windup>0&&p.active>0&&p.recovery>0);
  assert.equal(p.total,p.windup+p.active+p.recovery);
  assert.ok(p.chainOpen>=p.windup&&p.chainClose<=p.total&&p.chainOpen<p.chainClose);
  assert.ok(p.stamina>0&&p.stamina<100&&p.range>0&&p.angle>0);
 }
});

test('boss patterns cover four readable attacks with a fair faster second phase',()=>{
 const one=Array.from({length:6},(_,i)=>R.bossAttack(i,false));
 const two=Array.from({length:6},(_,i)=>R.bossAttack(i,true));
 assert.deepEqual(new Set(one.map(p=>p.type)),new Set(['sweep','slam','thrust']));
 assert.deepEqual(new Set(two.map(p=>p.type)),new Set(['sweep','slam','combo','thrust']));
 assert.equal(two[2].type,'combo');
 for(const p of one)assert.ok(p.windup>=1&&p.recovery>=1);
 for(const p of two){assert.ok(p.windup>.75&&p.recovery>.85);assert.equal(p.total,p.windup+p.active+p.recovery);}
 for(const i of [0,1,3])assert.ok(two[i].windup<one[i].windup);
 assert.ok(one.find(p=>p.type==='thrust').angle<one[0].angle/3);
 assert.ok(one.find(p=>p.type==='slam').recovery>one[0].recovery);
});

test('active windows are ordered, bounded, unique and leave a second dodge gap',()=>{
 for(let phase=0;phase<2;phase++)for(let i=0;i<6;i++){
  const p=R.bossAttack(i,phase===1);let previousEnd=-1,mask=0;
  for(const [lo,hi,id]of p.windows){
   assert.ok(lo>=0&&hi>lo&&hi<=p.active&&lo>previousEnd);
   assert.equal(mask&id,0);mask|=id;previousEnd=hi;
  }
 }
 const p=R.bossAttack(2,true),gap=p.windows[1][0]-p.windows[0][1];
 assert.ok(gap>=.32&&p.windows[1][2]!==p.windows[0][2]);
 p.windows[0][0]=999;
 assert.equal(R.bossAttack(2,true).windows[0][0],0);
});
