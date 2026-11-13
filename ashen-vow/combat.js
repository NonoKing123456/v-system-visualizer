(function(root){
'use strict';
const TAU=Math.PI*2;
function angleDelta(a,b){return ((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;}
function inCone(ax,az,yaw,bx,bz,range,halfAngle){const dx=bx-ax,dz=bz-az;return dx*dx+dz*dz<=range*range&&Math.abs(angleDelta(Math.atan2(dx,dz),yaw))<=halfAngle;}
function rollInvulnerable(t){return t>=.08&&t<=.40;}
function guardHit(damage,stamina){const cost=damage*.85+5;return stamina>=cost?{damage:Math.ceil(damage*.16),stamina:stamina-cost,broken:false}:{damage:damage,stamina:0,broken:true};}
function bossAttack(index,phase2){const speed=phase2?.82:1;const type=phase2&&index%3===2?'combo':index%3===1?'slam':'sweep';const p=type==='slam'?{windup:1.24,active:.20,recovery:1.12,range:4.9,angle:.64,damage:36}:type==='combo'?{windup:.76,active:.85,recovery:.8,range:4.7,angle:1.8,damage:23}:{windup:1.0,active:.24,recovery:1.02,range:4.45,angle:1.65,damage:28};return {...p,type,windup:p.windup*speed,recovery:p.recovery*speed};}
const api={angleDelta,inCone,rollInvulnerable,guardHit,bossAttack};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SoulsRules=api;
})(typeof window!=='undefined'?window:globalThis);
