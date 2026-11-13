/* Original procedural architecture for Ashen Vow. No downloaded art or image backdrops. */
(function(global){
'use strict';
function create({THREE:T,scene,renderer,M}){
 const PI=Math.PI,TAU=PI*2,lerp=T.MathUtils.lerp;
 let randomState=986213;const random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296;};
 const root=new T.Group(),staticRoot=new T.Group(),dynamic=new T.Group();root.name='The Sepulchre of the Last Vow';scene.add(root);root.add(staticRoot,dynamic);
 const obstacles=[],flames=[],fireLights=[],banners=[],textures=[],ownedMaterials=[];
 function material(color,metal=0,rough=.9){const m=new T.MeshStandardMaterial({color,metalness:metal,roughness:rough});m.color.convertSRGBToLinear();ownedMaterials.push(m);return m;}
 const stone=[material('#747b7b'),material('#676f70'),material('#7d817d'),material('#565f63'),material('#8a8981')];
 const dark=material('#343f45'),edge=material('#93958a'),mortar=material('#273138'),bronze=material('#8d7950',.65,.5),moss=material('#454c3d'),wood=material('#363d3b'),wax=material('#bab59c'),bone=material('#9a998a');
 const distant=material('#253540'),mountainA=material('#21313e'),mountainB=material('#1c2a36'),mountainC=material('#192732');
 const ember=new T.MeshBasicMaterial({color:'#ffad58'}),core=new T.MeshBasicMaterial({color:'#fff0bf'});ownedMaterials.push(ember,core);
 const stoneNoise=new Uint8Array(128*128*4);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const k=(y*128+x)*4,grain=random()*52+(Math.sin(x*.25+y*.06)*Math.sin(y*.39)*12),v=112+grain;stoneNoise[k]=stoneNoise[k+1]=stoneNoise[k+2]=v;stoneNoise[k+3]=255;}
 const bump=new T.DataTexture(stoneNoise,128,128,T.RGBAFormat);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.magFilter=T.LinearFilter;bump.minFilter=T.LinearMipMapLinearFilter;bump.generateMipmaps=true;bump.needsUpdate=true;textures.push(bump);
 for(const m of stone.concat([dark,edge,bone])){m.bumpMap=bump;m.bumpScale=.027;}
 function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
 function mesh(parent,g,m,x=0,y=0,z=0,cast=true){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o;}
 function box(p,x,y,z,w,h,d,m=stone[0],cast=true){return mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z,cast);}
 function cylinder(p,x,y,z,r,h,m=stone[0],n=12,rt=r,cast=true){return mesh(p,new T.CylinderGeometry(rt,r,h,n),m,x,y,z,cast);}
 function sphere(p,x,y,z,rx,ry,rz,m=stone[0],n=14){const o=mesh(p,new T.SphereGeometry(1,n,Math.max(6,n/2|0)),m,x,y,z);o.scale.set(rx,ry,rz);return o;}
 function tube(p,points,r,m=stone[0],segments=points.length*4,sides=5){const curve=new T.CatmullRomCurve3(points.map(q=>new T.Vector3(...q)));return mesh(p,new T.TubeGeometry(curve,segments,r,sides,false),m);}
 function beam(p,a,b,r,m=stone[0],n=7){a=new T.Vector3(...a);b=new T.Vector3(...b);const o=cylinder(p,...a.clone().add(b).multiplyScalar(.5).toArray(),r,a.distanceTo(b),m,n);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());return o;}
 function torus(p,x,y,z,r,t,m=bronze,n=64){return mesh(p,new T.TorusGeometry(r,t,5,n),m,x,y,z);}
 function stoneChoice(){return stone[Math.floor(random()*stone.length)];}
 function arcPoints(width,base,height,count=32){const points=[];for(let i=0;i<=count;i++){const t=i/count,x=(t-.5)*width,y=base+height*Math.pow(Math.sin(PI*t),.73);points.push(new T.Vector3(x,y,0));}return points;}
 function pointed(p,width,base,height,z=0,thickness=.13,broken=0,material=edge){const points=arcPoints(width,base,height,38);for(let i=0;i<points.length-1;i++){if(broken&&i>13&&i<13+broken)continue;const a=points[i],b=points[i+1],delta=b.clone().sub(a),at=a.clone().add(b).multiplyScalar(.5);const o=box(p,at.x,at.y,z,thickness,delta.length()+.014,thickness*1.25,material);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}}
 function stoneArch(p,width,base,height,z=0,thickness=.35,depth=.8,broken=0){const points=arcPoints(width,base,height,34);for(let i=0;i<points.length-1;i++){if(broken&&i>13&&i<13+broken)continue;const a=points[i],b=points[i+1],delta=b.clone().sub(a),at=a.clone().add(b).multiplyScalar(.5);const o=box(p,at.x,at.y,z,thickness,delta.length()*.97,depth,stoneChoice());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}}
 function quatrefoil(p,x,y,z,r,m=edge){const q=group(p,x,y,z);for(let i=0;i<4;i++){const a=i/4*TAU;torus(q,Math.sin(a)*r*.51,Math.cos(a)*r*.51,0,r*.49,.035,m,24);}return q;}

 // Individually chipped flagstones: each slab has its own silhouette and bevel.
 cylinder(staticRoot,0,-.24,0,15.05,.58,dark,96,14.87);
 cylinder(staticRoot,0,.01,0,14.62,.10,mortar,96);
 const slabGeo=(w,d,h)=>{const inset=.035,pts=[[-w/2+random()*.05,-d/2+random()*.05],[w/2-random()*.05,-d/2+random()*.05],[w/2-random()*.05,d/2-random()*.05],[-w/2+random()*.05,d/2-random()*.05]];const s=new T.Shape();s.moveTo(...pts[0]);pts.slice(1).forEach(v=>s.lineTo(...v));s.closePath();const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:inset,bevelThickness:.018,curveSegments:1});g.rotateX(-PI/2);return g;};
 for(let row=-13;row<=13;row++)for(let col=-13;col<=13;col++){const x=col*1.07+(row%2)*.53,z=row*1.07;if(Math.hypot(x,z)>14.0)continue;const o=mesh(staticRoot,slabGeo(1.015,1.01,.065),stoneChoice(),x,.082+random()*.012,z);o.rotation.y=(random()-.5)*.012;}
 // A carved compass rose remains visible under the accumulated weathering.
 for(const r of [1.4,5.20,10.65,13.88]){const ring=torus(staticRoot,0,.164,0,r,r>13?.026:.013,bronze,128);ring.rotation.x=-PI/2;}
 cylinder(staticRoot,0,.143,0,1.39,.038,dark,64);
 for(let i=0;i<16;i++){const a=i/16*TAU,q=group(staticRoot,Math.sin(a)*12.2,.17,Math.cos(a)*12.2);q.rotation.y=a;const length=i%2?.31:.52;beam(q,[0,0,-length],[0,0,length],.013,bronze,4);beam(q,[0,0,.17],[-.10,0,-.03],.011,bronze,4);beam(q,[0,0,.17],[.10,0,-.03],.011,bronze,4);}
 for(let i=0;i<8;i++){const a=i/8*TAU,outline=new T.Shape();outline.moveTo(0,1.1);outline.lineTo(.11,.23);outline.lineTo(0,.43);outline.lineTo(-.11,.23);outline.closePath();const o=mesh(staticRoot,new T.ShapeGeometry(outline),bronze);o.rotation.set(-PI/2,0,-a);o.position.y=.171;}
 for(let i=0;i<55;i++){const r=2+random()*11,a=random()*TAU,q=group(staticRoot,Math.sin(a)*r,.172,Math.cos(a)*r);q.rotation.y=random()*TAU;const points=[[-.25,0,0],[0,0,.04],[.28,0,-.02],[.45,0,.12]];tube(q,points,.007,mortar,5,3);if(i%3===0)tube(q,[[0,0,.04],[.04,0,.18],[.12,0,.25]],.005,mortar,3,3);}

 function clusteredColumn(p,x,z,height=6.3,broken=false){
  const q=group(p,x,0,z);box(q,0,.18,0,1.32,.36,1.32,dark);box(q,0,.43,0,1.18,.16,1.18,edge);box(q,0,.56,0,1.01,.10,1.01,stone[0]);
  cylinder(q,0,.66+height*.5,0,.31,height,stone[0],12,.27);
  for(let i=0;i<8;i++){const a=i/8*TAU,r=.31,xx=Math.sin(a)*r,zz=Math.cos(a)*r;cylinder(q,xx,.71+height*.5,zz,.075,height,edge,7,.058);for(const y of [.76,1.01,height+.58])cylinder(q,xx,y,zz,.094,.07,dark,8);}
  for(let k=0;k<3;k++){cylinder(q,0,height+.65+k*.095,0,.43+k*.075,.11,k%2?dark:edge,8);}
  if(!broken){box(q,0,height+1.0,0,1.25,.16,1.25,edge);for(let i=0;i<4;i++){const a=i/4*TAU;const leaf=sphere(q,Math.sin(a)*.39,height+.78,Math.cos(a)*.39,.16,.24,.075,stone[2],10);leaf.rotation.y=a;leaf.rotation.x=.4;}}
  obstacles.push({x:q.getWorldPosition(new T.Vector3()).x,z:q.getWorldPosition(new T.Vector3()).z,r:.74});return q;
 }
 // A broken ring of cloister arcades. The entry side is deliberately open.
 for(let i=0;i<14;i++){
  const a=(i/14-.5)*TAU,r=15.65,x=Math.sin(a)*r,z=-Math.cos(a)*r;if(z>10&&Math.abs(x)<8)continue;
  const broken=i%4===1,height=broken?2.1+random()*1.0:5.3+random()*.6;clusteredColumn(staticRoot,x,z,height,broken);
  if(i<13&&z<10){const a2=((i+1)/14-.5)*TAU,x2=Math.sin(a2)*r,z2=-Math.cos(a2)*r;const dx=x2-x,dz=z2-z,width=Math.hypot(dx,dz),q=group(staticRoot,(x+x2)*.5,0,(z+z2)*.5);q.rotation.y=-Math.atan2(dz,dx);stoneArch(q,width,5.8,2.8,0,.40,.65,broken?10:0);pointed(q,width-.30,5.87,2.66,.41,.066,broken?10:0);if(i%3===0){pointed(q,width-.95,5.95,2.23,-.21,.055,5);}}
 }

 // Main reliquary gate: nested pointed vaults, a rose window, spires and flying buttresses.
 const facade=group(staticRoot,0,0,-17.4);
 for(const side of [-1,1]){
  const x=side*6.0;clusteredColumn(facade,x,0,9.1,false);box(facade,side*8.1,4.3,-.7,3.1,8.7,1.8,dark);box(facade,side*8.1,8.83,-.7,3.5,.30,2.2,edge);
  for(let level=0;level<9;level++){box(facade,side*8.1,.55+level*.98,.23,3.0,.04,.05,stone[3]);}
  for(const xx of [side*7.25,side*8.95]){const w=group(facade,xx,0,.25);for(const v of [-.36,.36])cylinder(w,v,3.6,0,.065,2.7,edge,8);pointed(w,.72,4.95,1.12,0,.075);box(w,0,3.5,.02,.033,2.9,.05,edge);quatrefoil(w,0,4.92,.06,.22);}
  const p=group(facade,side*9.4,0,-.5);box(p,0,5.2,0,.92,10.4,1.6,stone[1]);box(p,0,10.5,0,1.22,.24,1.8,edge);cylinder(p,0,11.45,0,.66,1.75,dark,4,0).rotation.y=PI/4;cylinder(p,0,12.6,0,.045,1.0,bronze,6,0);
  const b=group(staticRoot,side*11.9,0,-16.5);box(b,0,2.8,0,1.6,5.6,1.8,dark);box(b,0,5.75,0,2.0,.25,2.2,edge);const arch=group(staticRoot,side*9.3,0,-16.5);stoneArch(arch,5.2,5.9,2.5,0,.4,.65,side<0?5:0);cylinder(b,0,6.45,0,.80,1.1,stone[2],4,0).rotation.y=PI/4;
 }
 stoneArch(facade,12,9.55,5.6,0,.76,1.2,5);pointed(facade,11.14,9.65,4.84,.65,.125,5);pointed(facade,10.44,9.75,4.12,.68,.075,5);
 // An incomplete rose casts a strong, recognizable cathedral silhouette.
 const rose=group(facade,.4,10.5,-1.0);for(const rr of [2.0,2.22,2.40]){const ring=torus(rose,0,0,0,rr,rr>2.3?.14:.07,edge,64);ring.rotation.z=.15;}
 for(let i=0;i<10;i++){const a=i/10*TAU;if(i===2||i===3)continue;beam(rose,[Math.cos(a)*.29,Math.sin(a)*.29,0],[Math.cos(a)*2.05,Math.sin(a)*2.05,0],.045,edge);const q=quatrefoil(rose,Math.cos(a)*1.35,Math.sin(a)*1.35,.03,.50,stone[2]);q.rotation.z=-a;}
 torus(rose,0,0,0,.36,.07,edge,24);
 // Rear altar and processional steps, safely beyond the combat boundary.
 for(let i=0;i<4;i++)box(staticRoot,0,.10+i*.13,-14.7-i*.55,7.8-i*.45,.20,.92,dark);
 box(staticRoot,0,.89,-17.7,3.2,1.24,1.3,stone[1]);box(staticRoot,0,1.57,-17.7,3.65,.18,1.65,edge);
 for(const x of [-1.25,-.65,0,.65,1.25]){const r=group(staticRoot,x,0,-17.0);pointed(r,.42,.55,.58,.03,.035);}

 function mourner(x,z,scale=1,broken=false){
  const q=group(staticRoot,x,0,z);q.scale.setScalar(scale);box(q,0,.20,0,1.70,.4,1.6,dark);box(q,0,.48,0,1.38,.20,1.3,edge);
  const profile=[new T.Vector2(.62,.57),new T.Vector2(.56,.78),new T.Vector2(.44,1.3),new T.Vector2(.37,1.8),new T.Vector2(.41,2.3),new T.Vector2(.30,2.55)];mesh(q,new T.LatheGeometry(profile,22),stone[2]);
  for(let i=0;i<10;i++){const a=i/10*TAU;const r=.47,tubePoints=[[Math.cos(a)*.55,.65,Math.sin(a)*.55],[Math.cos(a)*.43,1.35,Math.sin(a)*.43],[Math.cos(a)*.32,2.3,Math.sin(a)*.32]];tube(q,tubePoints,.035,stone[i%2?1:4],8,4);}
  if(!broken){sphere(q,0,2.87,0,.24,.34,.23,stone[2]);const hood=mesh(q,new T.SphereGeometry(.36,16,12,0,TAU,0,PI*.67),stone[0],0,2.94,-.04);hood.scale.set(1,1.10,1);sphere(q,0,2.84,.20,.15,.21,.045,dark,12);beam(q,[-.34,2.36,0],[-.44,1.93,.33],.12,stone[2]);beam(q,[.34,2.36,0],[.31,1.98,.42],.12,stone[2]);beam(q,[-.44,1.93,.33],[-.08,2.08,.50],.085,stone[2]);beam(q,[.31,1.98,.42],[.08,2.08,.50],.085,stone[2]);sphere(q,0,2.06,.53,.12,.12,.12,bone);}
  return q;
 }
 mourner(-11.7,-10.5,1.22);mourner(11.8,-10.6,1.22,true);mourner(-17.4,1.2,.86,true);mourner(18,-2,.9);
 // A fallen sculpted head and severed crown reward closer camera inspection.
 const head=group(staticRoot,12.6,.53,-8.7);head.rotation.set(-.35,.8,-.8);sphere(head,0,0,0,.37,.48,.35,stone[2],18);sphere(head,0,-.02,.3,.25,.28,.14,stone[4],14);box(head,0,.15,.40,.55,.07,.1,dark);sphere(head,0,-.05,.46,.045,.13,.05,stone[4],10);for(let i=0;i<5;i++){const a=i/5*TAU;cylinder(head,Math.sin(a)*.32,.5,Math.cos(a)*.32,.055,.24,bronze,5,.005);}

 // Rubble is concentrated where the masonry actually breaks.
 for(let i=0;i<220;i++){const a=random()*TAU,r=13.5+Math.pow(random(),2)*7.5;const x=Math.sin(a)*r,z=Math.cos(a)*r;if(z>10&&Math.abs(x)<4)continue;const size=.10+Math.pow(random(),2)*.53;const o=box(staticRoot,x,size*.22,z,size*1.8,size*.7,size,stoneChoice());o.rotation.set((random()-.5)*.4,random()*TAU,(random()-.5)*.4);}
 for(let i=0;i<26;i++){const a=random()*TAU,r=17+random()*7,q=group(staticRoot,Math.sin(a)*r,0,Math.cos(a)*r);q.rotation.y=random()*TAU;q.rotation.z=(random()-.5)*.32;const h=.45+random()*.65;box(q,0,h*.5,0,.37,h,.13,stone[3]);sphere(q,0,h,0,.185,.16,.068,stone[1],10);if(i%3===0){box(q,0,h*.71,.08,.035,.25,.025,edge);box(q,0,h*.77,.08,.17,.035,.025,edge);}box(q,0,.045,.35,.48,.09,.90,dark);}
 // Twisted roots and skeletal ash trees use tapered curves, not billboard cards.
 function tree(x,z,s=1){const q=group(staticRoot,x,0,z);q.scale.setScalar(s);const trunk=[[0,0,0],[.24,1.0,0],[-.09,2.5,.14],[.22,3.8,.11],[-.15,5.3,.06]];tube(q,trunk,.18,wood,25,8);for(let i=0;i<7;i++){const a=i*2.3,len=1.1+random()*1.5,yy=2.0+i*.38;const points=[[.05,yy,.07],[Math.cos(a)*len*.5,yy+.35,Math.sin(a)*len*.5],[Math.cos(a)*len,yy+1.3,Math.sin(a)*len]];tube(q,points,.07,wood,10,5);const end=points[2];tube(q,[end,[end[0]*1.2,end[1]+.6,end[2]*1.2]],.027,wood,4,4);}for(let i=0;i<5;i++){const a=i/5*TAU;tube(q,[[0,.18,0],[Math.cos(a)*.45,.09,Math.sin(a)*.45],[Math.cos(a)*1.25,.02,Math.sin(a)*1.25]],.085,wood,7,5);}}
 for(const [x,z,s]of [[-21,-6,1.1],[22,5,1.2],[-19,14,.85],[20,-17,1.25],[-15,-23,.8]])tree(x,z,s);
 for(let i=0;i<20;i++){const a=random()*TAU,r=14.3+random()*2.5,x=Math.sin(a)*r,z=Math.cos(a)*r;const q=group(staticRoot,x,.14,z);q.rotation.y=a;tube(q,[[0,0,0],[.3,.03,.8],[.17,.02,1.4],[.6,0,1.9]],.033,wood,12,5);for(let k=0;k<2;k++)tube(q,[[.25,.02,.7+k*.6],[-.15,.02,.85+k*.6],[-.24,0,1.1+k*.6]],.015,wood,5,4);}
 // Small grass tufts have real blades and lean toward the prevailing wind.
 const grassMat=material('#64664c',0,1);for(let i=0;i<160;i++){const a=random()*TAU,r=12.9+random()*6.5,q=group(staticRoot,Math.sin(a)*r,.13,Math.cos(a)*r);for(let k=0;k<3;k++){const y=.18+random()*.35,o=mesh(q,new T.ConeGeometry(.015,y,3),grassMat,(random()-.5)*.24,y*.5,(random()-.5)*.24);o.rotation.z=(random()-.5)*.7;o.rotation.x=.17;}}

 function flame(parent,x,y,z,size=1){const q=group(dynamic,x,y,z);if(parent!==staticRoot&&parent!==dynamic){parent.updateMatrixWorld(true);q.position.applyMatrix4(parent.matrixWorld);}for(let i=0;i<3;i++){const profile=[new T.Vector2(0,-.08),new T.Vector2(.13,0),new T.Vector2(.115,.20),new T.Vector2(.045,.40),new T.Vector2(0,.68)];const o=mesh(q,new T.LatheGeometry(profile,7),i===1?core:ember,(i-1)*.055,0,0,false);o.scale.setScalar(size*(i===1?.62:1));o.rotation.z=(i-1)*.20;flames.push({mesh:o,phase:random()*TAU,base:o.scale.clone()});}return q;}
 function brazier(x,z){const q=group(staticRoot,x,0,z);cylinder(q,0,.21,0,.58,.42,dark,12);cylinder(q,0,.47,0,.46,.11,edge,12);cylinder(q,0,1.12,0,.14,1.2,bronze,10,.10);for(let i=0;i<4;i++){const a=i/4*TAU;tube(q,[[Math.cos(a)*.34,.48,Math.sin(a)*.34],[Math.cos(a)*.23,1.0,Math.sin(a)*.23],[Math.cos(a)*.39,1.48,Math.sin(a)*.39]],.035,bronze,10,5);}cylinder(q,0,1.53,0,.40,.23,dark,12,.48);torus(q,0,1.67,0,.47,.025,bronze,32).rotation.x=PI/2;for(let i=0;i<7;i++){const a=i/7*TAU;beam(q,[Math.sin(a)*.42,1.59,Math.cos(a)*.42],[Math.sin(a)*.50,1.98,Math.cos(a)*.50],.025,bronze,5);}flame(dynamic,x,1.67,z,1.1);const l=new T.PointLight('#f8b065',33,10,2);l.position.set(x,2.10,z);dynamic.add(l);fireLights.push(l);obstacles.push({x,z,r:.58});}
 for(const [x,z]of [[-7.0,-9.0],[7.0,-9.0],[-11.7,4.8],[11.7,4.8]])brazier(x,z);
 const camp=group(staticRoot,-4.3,0,9.3);cylinder(camp,0,.18,0,.80,.22,dark,18);for(let i=0;i<10;i++){const a=i/10*TAU;const o=sphere(camp,Math.sin(a)*.70,.27,Math.cos(a)*.70,.17,.13,.15,stoneChoice(),8);o.rotation.y=a;}
 const campSword=group(camp,0,.65,0);const swordShape=new T.Shape();swordShape.moveTo(-.035,-.42);swordShape.lineTo(-.035,.35);swordShape.lineTo(0,.43);swordShape.lineTo(.035,.35);swordShape.lineTo(.035,-.42);swordShape.closePath();mesh(campSword,new T.ExtrudeGeometry(swordShape,{depth:.022,bevelEnabled:false}),M.steel);box(campSword,0,.43,.012,.35,.055,.055,bronze);cylinder(campSword,0,.55,.012,.035,.23,wood,8);sphere(campSword,0,.70,.012,.05,.06,.05,bronze,10);flame(dynamic,-4.3,.34,9.3,.7);
 const campLight=new T.PointLight('#ffb970',24,7,2);campLight.position.set(-4.3,1,9.3);dynamic.add(campLight);
 function candle(x,z,h=.23){cylinder(staticRoot,x,.17+h*.5,z,.034,h,wax,7);sphere(staticRoot,x,.17+h,z,.037,.015,.037,wax,8);const f=sphere(dynamic,x,.20+h,z,.024,.065,.024,core,7);f.castShadow=false;flames.push({mesh:f,phase:random()*TAU,base:f.scale.clone()});}
 for(const side of [-1,1])for(let i=0;i<10;i++)candle(side*(2.4+random()*.6),9.5-i*.75,.14+random()*.19);
 for(let i=0;i<24;i++)candle((random()-.5)*6.2,-15.7-random()*2,.14+random()*.28);

 // A translucent fog curtain sits in the physical doorway, with a depth-correct edge.
 const veilMaterial=new T.MeshBasicMaterial({color:'#99afb0',transparent:true,opacity:.17,side:T.DoubleSide,depthWrite:false});ownedMaterials.push(veilMaterial);
 const veil=mesh(dynamic,new T.PlaneGeometry(8.8,8.0,16,20),veilMaterial,0,4.65,-17.05,false);veil.renderOrder=1;
 const cloth=material('#3e2529',.02,.97);cloth.side=T.DoubleSide;
 for(const side of [-1,1])for(let i=0;i<2;i++){
  const q=group(dynamic,side*(7.1+i*5.6),7.6-i*2.4,-16.1+i*8.8);q.rotation.y=side*.15;
  const pole=beam(staticRoot,[q.position.x-.72,q.position.y+.18,q.position.z],[q.position.x+.72,q.position.y+.18,q.position.z],.035,bronze,6);
  const geo=new T.PlaneGeometry(1.24,2.6,8,14),pa=geo.attributes.position;const original=pa.array.slice();for(let j=0;j<pa.count;j++){const yy=pa.getY(j),xx=pa.getX(j);if(yy<-.9)pa.setY(j,yy+.13*Math.sin(xx*20)+.08*Math.cos(xx*43));}const flag=mesh(q,geo,cloth,0,-1.15,0,false);banners.push({mesh:flag,base:original,phase:i+side});
  const emblem=torus(q,0,-.78,.03,.21,.012,bronze,28);emblem.scale.set(.75,1,1);
 }

 // Distant terrain is three nested rings of modeled cliffs and hills.
 function terrainRing(radius,height,material,phase){const positions=[],normals=[],uv=[],indices=[],n=64;for(let i=0;i<=n;i++){const a=i/n*TAU,crest=height*(.55+.25*Math.sin(a*5+phase)+.18*Math.sin(a*11+.6*phase));for(const row of [0,1,2]){const r=radius+row*14;const y=row===0?-4:row===1?crest:-5;positions.push(Math.sin(a)*r,y,Math.cos(a)*r);uv.push(i/n,row*.5);}}for(let i=0;i<n;i++)for(let j=0;j<2;j++){const a=i*3+j,b=a+3;indices.push(a,b,a+1,a+1,b,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const o=mesh(staticRoot,g,material,0,0,0,false);o.material.side=T.DoubleSide;}
 terrainRing(31,12,mountainA,.7);terrainRing(51,21,mountainB,2.5);terrainRing(73,29,mountainC,1.8);
 // The ruined city is not a row of identical towers: clustered roofs, transepts and pinnacles.
 function tower(x,z,h,r=1.4,spire=true){cylinder(staticRoot,x,h*.5-1,z,r,h,distant,8,r*.9,false);cylinder(staticRoot,x,h-1,z,r*1.17,.34,distant,8,r*1.17,false);for(let k=0;k<8;k++){const a=k/8*TAU;box(staticRoot,x+Math.cos(a)*r*.85,h-.35,z+Math.sin(a)*r*.85,.34,.70,.34,distant,false);}if(spire){cylinder(staticRoot,x,h+1.8,z,r*1.23,4.5,distant,8,0,false);cylinder(staticRoot,x,h+4.4,z,.045,1.4,distant,6,0,false);}}
 for(let i=0;i<18;i++){const x=-35+i*4.2,z=-39-random()*10,h=6+random()*10;tower(x,z,h,.8+random()*1.3,i%3!==0);if(i<17)box(staticRoot,x+2.0,h*.38-1,z,3.6,h*.66,1.7,distant,false);}
 const city=group(staticRoot,-18,0,-49);box(city,0,6.8,0,12,13.6,5,distant,false);const roof=mesh(city,new T.CylinderGeometry(0,4.3,5.3,4),distant,0,16,0,false);roof.scale.set(1.75,1,1);roof.rotation.y=PI/4;tower(-24,-50,23,1.6);tower(-12,-50,19,1.4);

 // Genuine atmospheric particles, plus a restrained moon halo.
 const moon=mesh(dynamic,new T.SphereGeometry(3.0,32,20),new T.MeshBasicMaterial({color:'#c6cecb'}),-19,28,-66,false);moon.material.fog=false;ownedMaterials.push(moon.material);
 const haloMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{color:{value:new T.Color('#99aebe')}},vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 n;varying vec3 v;uniform vec3 color;void main(){float a=pow(max(0.,dot(normalize(n),normalize(v))),2.5)*.095;gl_FragColor=vec4(color,a);}'});ownedMaterials.push(haloMat);mesh(dynamic,new T.SphereGeometry(4.8,24,16),haloMat,-19,28,-66,false);
 const ashGeo=new T.BufferGeometry(),ashArray=new Float32Array(160*3);for(let i=0;i<160;i++){ashArray[i*3]=(random()-.5)*44;ashArray[i*3+1]=random()*14;ashArray[i*3+2]=(random()-.5)*42;}ashGeo.setAttribute('position',new T.BufferAttribute(ashArray,3));const ashMat=new T.PointsMaterial({color:'#a8b4b3',size:.030,transparent:true,opacity:.31,depthWrite:false});dynamic.add(new T.Points(ashGeo,ashMat));ownedMaterials.push(ashMat);
 const starPos=[];for(let i=0;i<110;i++){const a=random()*TAU,polar=.12+random()*.66,r=100;starPos.push(Math.sin(a)*Math.cos(polar)*r,Math.sin(polar)*r,Math.cos(a)*Math.cos(polar)*r);}const stars=new T.BufferGeometry();stars.setAttribute('position',new T.Float32BufferAttribute(starPos,3));const starMat=new T.PointsMaterial({color:'#a5b6ca',size:.12,transparent:true,opacity:.26,fog:false,depthWrite:false});dynamic.add(new T.Points(stars,starMat));ownedMaterials.push(starMat);

 // One draw per material/shadow mode for all static masonry, foliage and terrain.
 staticRoot.updateMatrixWorld(true);const buckets=new Map(),old=[];staticRoot.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);const key=o.material.uuid+(o.castShadow?'1':'0');if(!buckets.has(key))buckets.set(key,{material:o.material,cast:o.castShadow,p:[],n:[],uv:[]});const b=buckets.get(key);b.p.push(g.attributes.position.array);b.n.push(g.attributes.normal.array);b.uv.push(g.attributes.uv?g.attributes.uv.array:new Float32Array(g.attributes.position.count*2));old.push(o);g.dispose();});
 const concat=arrays=>{const total=arrays.reduce((n,a)=>n+a.length,0),out=new Float32Array(total);let offset=0;for(const a of arrays){out.set(a,offset);offset+=a.length;}return out;};
 for(const b of buckets.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(concat(b.p),3));g.setAttribute('normal',new T.BufferAttribute(concat(b.n),3));g.setAttribute('uv',new T.BufferAttribute(concat(b.uv),2));g.computeBoundingSphere();const o=mesh(root,g,b.material,0,0,0,b.cast);o.name='Batched cloister '+b.material.color.getHexString();}
 for(const o of old){o.parent.remove(o);o.geometry.dispose();}root.remove(staticRoot);
 const stats={staticDraws:buckets.size,staticTriangles:0};root.traverse(o=>{if(o.isMesh&&!o.geometry.index)stats.staticTriangles+=o.geometry.attributes.position.count/3;});
 return {root,obstacles,flames,fireLights,campLight,veilMaterial,veil,ashGeo,ashArray,moon,stats,
  update(dt,t){for(const b of banners){const p=b.mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=b.base[i*3+1],x=b.base[i*3];const u=(1.3-y)/2.6;p.setZ(i,Math.sin(t*1.6+x*2.4+y*1.8+b.phase)*.11*u+Math.sin(t*2.7+y*3.5)*.022*u);}p.needsUpdate=true;b.mesh.geometry.computeVertexNormals();}},
  dispose(){const seen=new Set();root.traverse(o=>{if(o.geometry&&!seen.has(o.geometry)){seen.add(o.geometry);o.geometry.dispose();}});for(const m of ownedMaterials)m.dispose();for(const t of textures)t.dispose();scene.remove(root);}
 };
}
global.AshenWorld={create};
})(typeof window!=='undefined'?window:globalThis);
