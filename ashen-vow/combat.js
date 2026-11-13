(function(root){
'use strict';
const TAU=Math.PI*2;
function angleDelta(a,b){return ((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;}
function inCone(ax,az,yaw,bx,bz,range,halfAngle){
 const dx=bx-ax,dz=bz-az;
 return dx*dx+dz*dz<=range*range&&Math.abs(angleDelta(Math.atan2(dx,dz),yaw))<=halfAngle;
}
function rollInvulnerable(t){return t>=.08&&t<=.40;}
function guardHit(damage,stamina){
 const cost=damage*.85+5;
 return stamina>=cost?{damage:Math.ceil(damage*.16),stamina:stamina-cost,broken:false}:{damage:damage,stamina:0,broken:true};
}

// Seconds. Active windows start at the END of anticipation; total includes
// committed recovery. Animation and collision consume the same profiles.
const LIGHTS=[
 {windup:.19,active:.16,recovery:.29,stamina:18,damage:25,poise:23,range:3.08,angle:1.13,lunge:.72,hitstop:.048,chainOpen:.31,chainClose:.60,pose:'cut-right'},
 {windup:.21,active:.17,recovery:.29,stamina:19,damage:28,poise:27,range:3.12,angle:1.18,lunge:.84,hitstop:.055,chainOpen:.34,chainClose:.63,pose:'cut-left'},
 {windup:.30,active:.19,recovery:.43,stamina:24,damage:38,poise:38,range:3.28,angle:.95,lunge:1.04,hitstop:.075,chainOpen:.64,chainClose:.88,pose:'finisher'}
];
const HEAVY={windup:.52,active:.21,recovery:.49,stamina:34,damage:52,poise:55,range:3.46,angle:.88,lunge:1.08,hitstop:.095,chainOpen:.91,chainClose:1.18,pose:'cleave'};
function playerAttack(kind='light',combo=0){
 const heavy=kind==='heavy',index=heavy?0:((Math.trunc(Number(combo)||0)%3)+3)%3;
 const p=heavy?HEAVY:LIGHTS[index];
 return {...p,kind:heavy?'heavy':'light',combo:index,total:p.windup+p.active+p.recovery,windows:[[0,p.active,1]]};
}

const BOSS={
 sweep:{windup:1.08,active:.26,recovery:1.08,range:4.45,angle:1.60,damage:27,lunge:2.1,turnLock:.58,windows:[[0,.26,1]]},
 slam:{windup:1.30,active:.24,recovery:1.22,range:4.90,angle:.57,damage:36,lunge:1.4,turnLock:.52,windows:[[0,.24,1]]},
 thrust:{windup:1.04,active:.23,recovery:1.15,range:5.10,angle:.34,damage:31,lunge:4.1,turnLock:.48,windows:[[0,.23,1]]},
 combo:{windup:.96,active:.86,recovery:1.02,range:4.60,angle:1.68,damage:22,lunge:1.9,turnLock:.54,windows:[[0,.20,1],[.54,.78,2]]}
};
const FIRST=['sweep','slam','thrust','sweep','thrust','slam'];
const SECOND=['sweep','slam','combo','thrust','combo','slam'];
function bossAttack(index,phase2){
 const pattern=phase2?SECOND:FIRST,i=((Math.trunc(Number(index)||0)%pattern.length)+pattern.length)%pattern.length;
 const type=pattern[i],p=BOSS[type],speed=phase2?.84:1;
 // Keep a distinct gap between two committed sweeps, allowing another dodge.
 const windup=p.windup*speed,recovery=p.recovery*(phase2?.88:1);
 return {...p,type,windup,recovery,total:windup+p.active+recovery,windows:p.windows.map(w=>w.slice())};
}
const api={angleDelta,inCone,rollInvulnerable,guardHit,playerAttack,bossAttack};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SoulsRules=api;
})(typeof window!=='undefined'?window:globalThis);
