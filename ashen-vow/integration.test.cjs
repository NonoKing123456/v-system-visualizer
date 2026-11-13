const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function boot(){
 const THREE={...require('./vendor/three.min.js')};
 const elements=new Map(),listeners={};
 function element(id){if(elements.has(id))return elements.get(id);const classes=new Set();const e={id,style:{},dataset:{},hidden:true,open:false,textContent:'',classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,f)=>f?classes.add(x):classes.delete(x),contains:x=>classes.has(x)},focus(){},addEventListener(){},querySelector(){return element(id+'-child')},click(){this.onclick?.()},showModal(){this.open=true},close(){this.open=false},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}};elements.set(id,e);return e;}
 THREE.WebGLRenderer=class{constructor(){this.domElement=element('game');this.shadowMap={}}setPixelRatio(){}setSize(){}render(){}getDrawingBufferSize(v){return v.set(1280,720)}};
 THREE.OrbitControls=class{constructor(camera){this.target=new THREE.Vector3();this.mouseButtons={}}update(){}};
 const context={console,THREE,Math,Float32Array,Uint8Array,Map,Set,performance:{now:()=>0},innerWidth:1280,innerHeight:720,devicePixelRatio:1,document:{getElementById:element,body:element('body'),hidden:false},addEventListener:(t,f)=>listeners[t]=f,requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){}};
 context.window=context;context.globalThis=context;vm.createContext(context);
 for(const name of ['combat.js','characters.js','world.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'),context);
 context.AshenPolish={create:()=>({render(){},resize(){}})};
 const source=fs.readFileSync(path.join(__dirname,'game.js'),'utf8').replace(/\}\)\(\);\s*$/, 'globalThis.qa={P,B,hero,warden,world,scene,playerUpdate,bossUpdate,animateKnight,effects,reset,finish,damagePlayer,hitBoss,startAttack,frame,setBossState,setPlayerState,stats,begin,advance(dt){elapsed+=dt;},input(kind){if(kind==="light")pendingLight=true;if(kind==="heavy")pendingHeavy=true;if(kind==="roll")pendingRoll=true;if(kind==="heal")pendingHeal=true;},get flags(){return {dead,won,paused}}};})();');
 vm.runInContext(source,context);return context.qa;
}
test('integrated art builds finite articulated meshes and batched architecture',()=>{
 const q=boot();assert.ok(q.world.stats.staticDraws<=24);let triangles=0;
 q.scene.traverse(o=>{if(!o.geometry)return;for(const a of Object.values(o.geometry.attributes)){for(const v of a.array)assert.ok(Number.isFinite(v));}triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3});assert.ok(triangles>150000&&triangles<350000);
 assert.equal(q.hero.arms.length,2);assert.equal(q.warden.legs.length,2);
 for(let i=0;i<20;i++){q.animateKnight(q.hero,false,.016,i*.016);q.animateKnight(q.warden,true,.016,i*.016);q.effects(.016,i*.016)}
});
test('three light cuts chain only after their committed active time',()=>{
 const q=boot();q.input('light');q.playerUpdate(.016);assert.equal(q.P.combo,0);assert.equal(q.P.state,'light');
 q.advance(.25);q.playerUpdate(.25);q.input('light');q.playerUpdate(.02);assert.equal(q.P.combo,0);q.advance(.06);q.playerUpdate(.06);assert.equal(q.P.combo,1);
 q.advance(.26);q.playerUpdate(.26);q.input('light');q.playerUpdate(.1);assert.equal(q.P.combo,2);assert.equal(q.P.stamina,39);
});
test('roll completes a full turn without spinning backwards during recovery',()=>{
 const q=boot();q.input('roll');q.playerUpdate(.016);assert.equal(q.P.state,'roll');q.P.time=.63;q.animateKnight(q.hero,false,.016,.63);q.playerUpdate(.03);assert.equal(q.P.state,'idle');assert.equal(q.hero.pivot.rotation.x,0);
});
test('healing, damage, restart and boss phase transition preserve game state',()=>{
 const q=boot();q.P.hp=40;q.input('heal');q.playerUpdate(.016);assert.equal(q.P.flasks,2);q.playerUpdate(.72);assert.equal(q.P.hp,88);q.reset();assert.equal(q.P.hp,100);assert.equal(q.P.flasks,3);
 q.B.awake=true;q.B.hp=190;q.bossUpdate(.016);assert.equal(q.B.phase2,true);assert.equal(q.B.state,'phase');q.bossUpdate(2.2);assert.equal(q.B.state,'approach');
 q.P.state='roll';q.P.time=.2;q.damagePlayer(30);assert.equal(q.P.hp,100);q.P.time=.5;q.damagePlayer(30);assert.equal(q.P.hp,70);
 q.reset();assert.equal(q.B.hp,q.B.max);assert.equal(q.B.phase2,false);assert.equal(q.P.buffer,null);
});
