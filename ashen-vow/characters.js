(function (global) {
'use strict';

// Original articulated character art. Every visible surface is real mesh geometry.
// Local forward is +Z. The stable joint names match the game's animation layers.
function createKnight({ THREE:T, scene, M, isBoss=false, variant='' }) {
  const PI=Math.PI, TAU=PI*2, boss=isBoss, sentinel=variant==='sentinel';
  const root=new T.Group();scene.add(root);
  const pivot=new T.Group();pivot.position.y=.95;root.add(pivot);
  const model=new T.Group();model.position.y=-.95;pivot.add(model);
  const assemblies=[];
  const armor=boss?M.boss:M.hero, dark=M.leather, gold=M.gold, steel=M.steel;
  const custom=(color,metal=.6,rough=.4)=>{const m=new T.MeshStandardMaterial({color,metalness:metal,roughness:rough});m.color.convertSRGBToLinear();return m;};
  const pale=custom(boss?'#b4a37e':'#bbc4c5',.72,.38);
  const trim=custom(boss?'#a78a4d':'#9c8960',.7,.34);
  const clothMat=custom(boss?'#1c333e':sentinel?'#47514b':'#60333a',.02,.96);clothMat.side=T.DoubleSide;
  const chainMat=custom('#3a4247',.65,.69);
  const socket=custom('#101a20',.18,.88);
  const eyeMat=new T.MeshStandardMaterial({color:boss?'#c79f5a':'#b9c4b9',emissive:boss?'#de8134':'#c4d9ca',emissiveIntensity:boss?1.8:.22,roughness:.4});

  // Fine forged-metal relief and woven cloth, generated without external textures.
  const texSize=64, grain=new Uint8Array(texSize*texSize*4), weave=new Uint8Array(texSize*texSize*4);
  for(let y=0;y<texSize;y++)for(let x=0;x<texSize;x++){
    const k=(y*texSize+x)*4,n=((x*73+y*151+x*y*17)%31);
    const v=125+n+(x%5===0?12:0);grain[k]=grain[k+1]=grain[k+2]=v;grain[k+3]=255;
    const w=118+((x+y)%3===0?19:0)+(x%2?4:-4);weave[k]=weave[k+1]=weave[k+2]=w;weave[k+3]=255;
  }
  const bump=new T.DataTexture(grain,texSize,texSize,T.RGBAFormat);bump.wrapS=bump.wrapT=T.RepeatWrapping;bump.repeat.set(3,5);bump.needsUpdate=true;
  const clothBump=new T.DataTexture(weave,texSize,texSize,T.RGBAFormat);clothBump.wrapS=clothBump.wrapT=T.RepeatWrapping;clothBump.repeat.set(4,6);clothBump.needsUpdate=true;clothMat.bumpMap=clothBump;clothMat.bumpScale=.006;
  pale.bumpMap=bump;pale.bumpScale=.004;trim.bumpMap=bump;trim.bumpScale=.003;
  armor.bumpMap=bump;armor.bumpScale=.0035;armor.needsUpdate=true;

  function joint(parent,x=0,y=0,z=0,name=''){const g=new T.Group();g.position.set(x,y,z);g.name=name;g.userData.artJoint=true;parent.add(g);assemblies.push(g);return g;}
  function add(parent,geometry,material,x=0,y=0,z=0,scale=null){const o=new T.Mesh(geometry,material);o.position.set(x,y,z);if(scale)o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function ellipsoid(p,x,y,z,rx,ry,rz,m){return add(p,new T.SphereGeometry(1,18,12),m,x,y,z,[rx,ry,rz]);}
  function cylinder(p,x,y,z,r,h,m,n=14,top=r){return add(p,new T.CylinderGeometry(top,r,h,n),m,x,y,z);}
  function line(p,points,r,m){const curve=new T.CatmullRomCurve3(points.map(q=>new T.Vector3(...q)));return add(p,new T.TubeGeometry(curve,Math.max(4,points.length*3),r,5,false),m);}
  function ring(p,x,y,z,r,t,m,sx=1,sz=1){const o=add(p,new T.TorusGeometry(r,t,5,22),m,x,y,z);o.rotation.x=PI/2;o.scale.set(sx,sz,1);return o;}

  // Smooth elliptical lofts describe breastplates and vambraces. The forward keel
  // changes the surface cross-section, giving polished armor a readable highlight.
  function loft(rings,sides=18,keel=0,arcStart=0,arcLength=TAU,cap=true){
    const pos=[],uv=[],indices=[];const count=rings.length,ascending=rings[count-1][0]>=rings[0][0];
    for(let j=0;j<count;j++){const q=rings[j];for(let i=0;i<=sides;i++){const a=arcStart+i/sides*arcLength,s=Math.sin(a),c=Math.cos(a);const front=Math.max(0,s);pos.push(c*q[1],q[0],s*q[2]+(q[3]||0)+keel*Math.pow(front,9));uv.push(i/sides,j/(count-1));}}
    const row=sides+1;for(let j=0;j<count-1;j++)for(let i=0;i<sides;i++){const a=j*row+i,b=a+row;if(ascending)indices.push(a,b,a+1,a+1,b,b+1);else indices.push(a,a+1,b,a+1,b+1,b);}
    if(cap&&arcLength>TAU-.01){for(const j of [0,count-1]){const center=pos.length/3;pos.push(0,rings[j][0],rings[j][3]||0);uv.push(.5,.5);for(let i=0;i<sides;i++){const a=j*row+i;const bottom=(j===0)===ascending;if(bottom)indices.push(center,a,a+1);else indices.push(center,a+1,a);}}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  function plate(p,rings,m,keel=.015,sides=18){return add(p,loft(rings,sides,keel),m);}
  function shell(p,x,y,z,rx,ry,rz,m,phiStart=0,phiLength=TAU,thetaStart=0,thetaLength=PI){return add(p,new T.SphereGeometry(1,22,13,phiStart,phiLength,thetaStart,thetaLength),m,x,y,z,[rx,ry,rz]);}
  function strap(p,points,width,m=trim){return line(p,points,width,m);}
  function stud(p,x,y,z,size=.018,m=trim){return ellipsoid(p,x,y,z,size,size,size*.5,m);}
  function taperedHorn(p,points,radii,m){const curve=new T.CatmullRomCurve3(points.map(q=>new T.Vector3(...q)));const frames=curve.computeFrenetFrames(16,false),pos=[],uv=[],ind=[];
    for(let j=0;j<=16;j++){const t=j/16,at=curve.getPointAt(t),f=t*(radii.length-1),lo=Math.floor(f),r=T.MathUtils.lerp(radii[lo],radii[Math.min(lo+1,radii.length-1)],f-lo);for(let i=0;i<=8;i++){const a=i/8*TAU,off=frames.normals[j].clone().multiplyScalar(Math.cos(a)*r).addScaledVector(frames.binormals[j],Math.sin(a)*r);pos.push(at.x+off.x,at.y+off.y,at.z+off.z);uv.push(i/8,t);}}
    for(let j=0;j<16;j++)for(let i=0;i<8;i++){const a=j*9+i,b=a+9;ind.push(a,a+1,b,a+1,b+1,b);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return add(p,g,m);
  }

  const body=joint(model,0,.96,0,'cuirass');
  // An anatomical waist, narrow lower ribs and a broad shoulder line replace a box torso.
  plate(body,[[-.03,.18,.14],[.08,.20,.155],[.22,boss?.31:.26,.18],[.43,boss?.37:.31,.205],[.62,boss?.32:.27,.17],[.70,.20,.135]],dark,.01);
  const torsoRings=[[.12,.20,.155],[.25,boss?.31:.265,.19],[.44,boss?.37:.31,.22],[.58,boss?.33:.29,.20],[.66,.205,.14]];
  plate(body,torsoRings,armor,boss?.055:.035,24);
  // Overlapping lower cuirass lames, with rolled edges and inset seams.
  for(let i=0;i<3;i++){const y=.02+i*.071,rx=.22+i*.015,rz=.161+i*.014;plate(body,[[y-.035,rx,rz],[y+.035,rx+.005,rz+.009]],i%2?armor:pale,.014);ring(body,0,y+.028,0,rx,.007,trim,1,rz/rx);}
  line(body,[[-.26,.56,.17],[-.14,.61,.215],[0,.64,.155],[.14,.61,.215],[.26,.56,.17]],.012,trim);
  line(body,[[0,.61,.25],[0,.42,.28],[0,.24,.21]],.008,trim);
  if(boss){
    // The Warden wears a cracked reliquary instead of a painted letter on his chest.
    const reliquary=add(body,new T.OctahedronGeometry(.135,0),trim,0,.43,.285);reliquary.scale.set(.76,1.18,.28);
    line(body,[[-.24,.58,.22],[-.10,.51,.28],[0,.43,.32],[.12,.52,.27],[.25,.59,.22]],.011,pale);
    for(let i=0;i<4;i++)line(body,[[-.21+i*.13,.62,.19],[-.15+i*.11,.45,.26],[-.17+i*.12,.25,.19]],.004,socket);
  }else{
    // Etched ash branch crest, legible at the gameplay camera.
    for(const s of [-1,1])for(let i=0;i<3;i++)line(body,[[0,.30+i*.075,.265],[s*(.055+i*.012),.34+i*.075,.25],[s*(.073+i*.017),.375+i*.075,.224]],.0045,trim);
  }
  // A genuine leather belt and miniature buckle, not another armor cube.
  plate(body,[[-.027,.229,.18],[.024,.229,.18]],dark,0,22);
  const buckle=add(body,new T.TorusGeometry(.040,.009,5,14),trim,0,-.002,.192);buckle.scale.set(1.15,.7,1);
  for(const s of [-1,1]){
    const tasset=plate(body,[[-.06,.11,.055],[-.16,.145,.071],[-.32,.13,.08],[-.39,.09,.075]],armor,.018,14);tasset.position.set(s*.14,0,.12);tasset.rotation.z=s*.13;
    line(body,[[s*.03,-.08,.19],[s*.14,-.11,.215],[s*.25,-.10,.19]],.007,trim);
    const pouch=ellipsoid(body,s*.23,-.12,-.07,.087,.13,.08,dark);pouch.rotation.z=s*.14;
  }

  // A sheathed secondary blade and rear harness make the wayfarer readable from
  // the gameplay camera. The Warden carries a long torn ceremonial tabard instead.
  if(!boss){
    const scabbard=joint(body,-.28,-.07,-.08,'scabbard');scabbard.rotation.z=-.28;scabbard.rotation.x=-.13;
    plate(scabbard,[[.08,.050,.038],[-.10,.048,.036],[-.54,.038,.030],[-.69,.025,.023]],dark,.004,12);
    for(const y of [.02,-.53,-.66])ring(scabbard,0,y,0,y<-.6?.027:.049,.008,trim,1,.78);
    line(body,[[-.24,.02,.12],[-.30,-.01,.02],[-.29,-.09,-.12]],.018,dark);
    const strapPlate=plate(body,[[.17,.025,.012],[-.04,.026,.012]],trim,0,8);strapPlate.position.set(-.265,0,-.02);strapPlate.rotation.z=-.28;
  }else{
    const tg=new T.PlaneGeometry(.35,.67,6,9),tp=tg.attributes.position;
    for(let i=0;i<tp.count;i++){const x=tp.getX(i),y=tp.getY(i),fall=(.34-y)/.67;tp.setZ(i,.025*Math.cos(x*29)*fall);if(y<-.27)tp.setY(i,y-(i%3)*.032);}
    tg.computeVertexNormals();add(body,tg,clothMat,.025,-.30,.21);
    for(const s of [-1,1])line(body,[[s*.10,.01,.20],[s*.13,-.10,.235],[s*.08,-.21,.24]],.009,trim);
  }

  const neck=joint(body,0,.80,0,'gorget');
  plate(neck,[[-.13,.18,.16],[-.06,.14,.13],[.07,.112,.105]],armor,.012,20);
  ring(neck,0,-.105,0,.174,.011,trim,1,.9);
  const head=joint(neck,0,.22,0,'helmet');
  // Closed sallet helmet: a smooth dome, downturned brow and pointed bevor.
  shell(head,0,.035,-.012,.197,.245,.197,armor);
  plate(head,[[-.21,.115,.105],[-.14,.165,.155],[-.055,.180,.191]],armor,.015,20);
  const visor=plate(head,[[-.12,.13,.172],[-.055,.181,.197],[.01,.183,.195],[.047,.168,.169]],boss?dark:pale,.035,22);visor.position.z=.018;
  // Two narrow recessed slits avoid the old single luminous rectangular eye.
  for(const s of [-1,1]){
    line(head,[[s*.02,.015,.247],[s*.085,.025,.239],[s*.149,.013,.213]],.013,socket);
    line(head,[[s*.025,.016,.252],[s*.080,.025,.244],[s*.139,.016,.222]],boss?.0045:.0028,eyeMat);
    line(head,[[s*.025,-.082,.231],[s*.072,-.063,.224],[s*.119,-.065,.208]],.004,socket);
    stud(head,s*.17,-.025,.165,.016,trim);
    line(head,[[s*.15,.12,.118],[s*.18,.075,.055],[s*.17,-.03,.01]],.008,trim);
  }
  line(head,[[0,.235,-.10],[0,.272,-.025],[0,.24,.12],[0,.12,.20],[0,.034,.24]],.012,trim);
  const nasal=plate(head,[[-.19,.035,.055],[-.09,.027,.045],[.04,.020,.025]],armor,.014,10);nasal.position.z=.211;
  // Laminated neck guard follows the curve of the helmet at the rear.
  for(let i=0;i<3;i++){const o=add(head,loft([[-.14-i*.04,.17+i*.01,.16+i*.012],[-.10-i*.04,.165+i*.01,.16+i*.012]],16,0,PI,PI,false),armor);o.position.z=-.025;}
  if(boss){
    // Distinctive broken antler diadem, tarnished metal sockets and ivory branches.
    const crown=add(head,loft([[.16,.205,.19],[.22,.22,.195]],24,0),trim);
    for(const s of [-1,1]){
      taperedHorn(head,[[s*.17,.18,-.035],[s*.30,.31,-.09],[s*.38,.51,-.12],[s*.34,.73,-.09]],[.058,.045,.028,.001],boss?M.bone:pale);
      taperedHorn(head,[[s*.30,.33,-.09],[s*.47,.40,-.12],[s*.53,.58,-.11]],[.031,.022,.001],M.bone);
      if(s<0)taperedHorn(head,[[s*.37,.48,-.12],[s*.50,.56,-.15],[s*.52,.72,-.13]],[.021,.012,.001],M.bone);
      cylinder(head,s*.17,.225,-.035,.07,.12,trim,10,.055);
    }
    // A broken central coronet blade gives the silhouette an asymmetric focal point.
    const shard=add(head,new T.ConeGeometry(.050,.26,4),trim,-.07,.365,.13);shard.rotation.z=-.12;
  }else{
    // A short, worn cloth crest and an attached side plume.
    const crest=ellipsoid(head,0,.242,-.06,.045,.055,.14,clothMat);crest.rotation.x=-.1;
    line(head,[[.02,.25,-.11],[.025,.25,-.22],[.018,.16,-.28]],.018,clothMat);
  }

  const arms=[],legs=[];
  for(const s of [-1,1]){
    const shoulder=joint(body,s*(boss?.46:.385),.62,0,s<0?'left_shoulder':'right_shoulder');
    ellipsoid(shoulder,0,-.13,0,.095,.22,.09,chainMat);
    // Nested spherical armor lames form a domed pauldron, no squared-off shoulder blocks.
    for(let i=0;i<3;i++){
      const o=shell(shoulder,s*.023,-i*.052,.0,(boss?.25:.205)-i*.018,.165,.225-i*.014,i===0?armor:pale,0,TAU,0,PI*.60);
      o.rotation.z=-s*.16;
      const rim=ring(shoulder,s*.025,-.026-i*.049,0,(boss?.235:.192)-i*.018,.009,trim,1,1.05);rim.rotation.z=-s*.16;
    }
    if(boss){
      // Uneven reliquary thorn plates on one shoulder rather than mirrored spikes.
      const count=s<0?3:2;for(let i=0;i<count;i++)taperedHorn(shoulder,[[s*.06,.11,-.09+i*.09],[s*(.18+i*.03),.25,-.12+i*.09],[s*(.27+i*.03),.36+i*.04,-.11+i*.09]],[.037,.026,.001],M.bone);
    }
    plate(shoulder,[[-.17,.087,.085],[-.31,.081,.075],[-.37,.075,.075]],armor,.01,14);
    const elbow=joint(shoulder,0,-.39,0,s<0?'left_elbow':'right_elbow');
    ellipsoid(elbow,0,-.005,.025,.105,.09,.10,armor);
    line(elbow,[[-.075,.027,.08],[0,.055,.115],[.075,.027,.08]],.007,trim);
    // Tapered, ridged vambrace, wrist cuff and leather palm.
    plate(elbow,[[-.07,.10,.10],[-.19,.088,.097],[-.31,.068,.076]],armor,.017,16);
    line(elbow,[[0,-.08,.127],[0,-.19,.124],[0,-.28,.095]],.007,trim);
    ring(elbow,0,-.30,0,.071,.009,trim,1,1.08);
    ellipsoid(elbow,0,-.37,.015,.075,.088,.058,dark);
    shell(elbow,0,-.365,-.023,.078,.09,.038,pale);
    for(let finger=0;finger<4;finger++){
      const x=(finger-1.5)*.033,y=-.40-Math.sin((finger+.5)/4*PI)*.015;
      line(elbow,[[x,y,-.016],[x,y-.035,.028],[x,y-.025,.070]],.014,armor);
      stud(elbow,x,y-.004,-.024,.016,pale);
    }
    line(elbow,[[-s*.06,-.34,.02],[-s*.09,-.38,.055],[-s*.05,-.41,.08]],.021,armor);
    arms.push({shoulder,elbow});

    const hip=joint(model,s*.17,.98,0,s<0?'left_hip':'right_hip');
    // Thigh has anatomical taper, a curved upper plate and a seam at the inside leg.
    plate(hip,[[-.02,.125,.13],[-.17,.125,.12],[-.31,.098,.10]],chainMat,.006,16);
    const thigh=add(hip,loft([[-.06,.125,.13],[-.17,.125,.132],[-.31,.098,.11]],18,.02,0,PI,false),armor);thigh.position.z=.015;
    line(hip,[[s*.077,-.08,.10],[s*.086,-.20,.105],[s*.060,-.29,.088]],.007,trim);
    const knee=joint(hip,0,-.36,0,s<0?'left_knee':'right_knee');
    ellipsoid(knee,0,0,0,.091,.095,.085,dark);
    const kneecap=ellipsoid(knee,0,-.005,.082,.112,.102,.063,armor);
    const wing=ellipsoid(knee,s*.10,.005,.025,.068,.07,.023,pale);wing.rotation.y=s*.3;
    line(knee,[[-.065,.045,.125],[0,.075,.15],[.065,.045,.125]],.006,trim);
    plate(knee,[[-.08,.093,.095],[-.20,.094,.108],[-.35,.069,.081],[-.40,.057,.067]],armor,.024,18);
    line(knee,[[0,-.095,.13],[0,-.23,.14],[0,-.36,.102]],.007,trim);
    const foot=joint(knee,0,-.42,0,s<0?'left_foot':'right_foot');
    ellipsoid(foot,0,-.07,.065,.101,.104,.17,dark);
    ellipsoid(foot,0,-.07,.133,.108,.082,.205,armor);
    for(let i=0;i<3;i++){const y=-.015-i*.014,z=.025+i*.073;const shoe=shell(foot,0,y,z,.109-i*.004,.045,.085,i%2?armor:pale,0,TAU,0,PI*.55);shoe.rotation.x=.10;}
    const toe=ellipsoid(foot,0,-.075,.288,.080,.049,.083,armor);toe.rotation.x=-.12;
    ring(foot,0,.015,-.015,.066,.008,trim,1,1.15);
    legs.push({hip,knee,foot});
  }

  // A proper kite shield with a convex face, engraved tree and a continuous rolled rim.
  let shield=null;
  if(!boss){
    shield=joint(arms[0].elbow,0,-.31,.155,'shield');
    const shape=new T.Shape();shape.moveTo(0,.35);shape.bezierCurveTo(.11,.34,.25,.31,.29,.20);shape.lineTo(.25,-.12);shape.quadraticCurveTo(.16,-.29,0,-.44);shape.quadraticCurveTo(-.16,-.29,-.25,-.12);shape.lineTo(-.29,.20);shape.bezierCurveTo(-.25,.31,-.11,.34,0,.35);
    const g=new T.ExtrudeGeometry(shape,{depth:.042,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:10});
    const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+.065*(1-Math.pow(p.getX(i)/.32,2)));g.computeVertexNormals();add(shield,g,boss?armor:dark);
    const rimPoints=shape.getPoints(38).map(v=>[v.x,v.y,.060+.065*(1-Math.pow(v.x/.32,2))]);line(shield,rimPoints,.011,trim);
    const crestZ=.139;line(shield,[[0,-.25,crestZ],[0,.16,crestZ]],.009,pale);
    for(const s of [-1,1])for(let i=0;i<3;i++)line(shield,[[0,-.12+i*.10,crestZ],[s*.07,-.05+i*.1,crestZ-.006],[s*(.12-i*.012),.03+i*.08,crestZ-.01]],.007,pale);
    for(const [x,y]of [[-.20,.22],[.20,.22],[-.18,-.08],[.18,-.08],[0,-.34]])stud(shield,x,y,.09,.014,trim);
  }

  const weaponGroup=joint(arms[1].elbow,0,-.40,.02,'longsword');weaponGroup.rotation.x=boss?-1.12:-1.04;
  // The blade's diamond cross-section is forged as one mesh and remains swappable
  // when the combat controller ignites it for the second phase.
  const bladeRings=boss?[
    [-.15,.125,.035,.0],[-.28,.170,.045,0],[-.72,.185,.040,-.025],[-1.24,.16,.036,-.08],[-1.65,.10,.026,-.13],[-1.90,.001,.003,-.17]
  ]:[[-.13,.073,.022,0],[-.30,.073,.023,0],[-.88,.061,.019,0],[-1.20,.042,.014,0],[-1.43,.001,.002,0]];
  const bladePos=[],bladeUV=[],bladeIndices=[];
  for(let j=0;j<bladeRings.length;j++){const [y,w,t,off]=bladeRings[j];for(const [x,z]of [[-w,0],[0,t],[w,0],[0,-t]]){bladePos.push(x+off,y,z);bladeUV.push((x/w+1)*.5,j/(bladeRings.length-1));}}
  for(let j=0;j<bladeRings.length-1;j++)for(let k=0;k<4;k++){const a=j*4+k,b=j*4+(k+1)%4,c=a+4,d=b+4;bladeIndices.push(a,c,b,b,c,d)}
  const bg=new T.BufferGeometry();bg.setAttribute('position',new T.Float32BufferAttribute(bladePos,3));bg.setAttribute('uv',new T.Float32BufferAttribute(bladeUV,2));bg.setIndex(bladeIndices);bg.computeVertexNormals();
  const bladeSteel=add(weaponGroup,bg,steel);bladeSteel.userData.keepArtMesh=true;
  const bladeLen=boss?1.90:1.43;
  line(weaponGroup,[[0,-.23,.028],[boss?-.03:0,-.65,.031],[boss?-.08:0,-1.11,.023]],boss?.010:.005,socket);
  for(let i=0;i<(boss?6:4);i++){const y=-.28-i*.12,x=boss?-.012-i*.008:0;line(weaponGroup,[[x-.025,y+.027,.039],[x,y,.044],[x+.021,y+.026,.039]],.0035,trim);}
  line(weaponGroup,[[-(boss?.31:.20),-.18,.0],[-(boss?.25:.16),-.11,0],[0,-.12,0],[(boss?.25:.16),-.11,0],[(boss?.31:.20),-.18,0]],boss?.028:.018,trim);
  plate(weaponGroup,[[-.10,.052,.044],[.17,.040,.037]],dark,0,12);
  for(let i=0;i<6;i++)ring(weaponGroup,0,-.06+i*.037,0,.043,.006,trim,1,.9);
  const pommel=add(weaponGroup,new T.OctahedronGeometry(boss?.092:.069,0),trim,0,.23,0);pommel.scale.set(.75,1.1,.65);
  if(boss){
    const eye=ellipsoid(weaponGroup,0,-.17,.062,.046,.067,.019,eyeMat);
    for(const s of [-1,1])line(weaponGroup,[[s*.05,-.14,.04],[s*.14,-.23,.04],[s*.18,-.30,.02]],.010,trim);
  }
  const weapon={group:weaponGroup,steel:bladeSteel,tip:new T.Vector3(boss?-.17:0,-bladeLen,0),restPitch:weaponGroup.rotation.x,bladeLength:bladeLen};

  // A tapered, irregular cloth silhouette. The core animator may freely deform Z.
  const capeGeometry=new T.PlaneGeometry(boss?.91:.72,boss?1.44:1.17,10,14);
  const cp=capeGeometry.attributes.position;
  for(let i=0;i<cp.count;i++){
    const y=cp.getY(i),x=cp.getX(i),drop=(.75-y)/1.5;
    cp.setX(i,x*(.86+drop*.24));
    if(y<-(boss?.60:.47))cp.setY(i,y-[.00,.08,.03,.14,.05,.02,.12,.025,.07,.02,.00][i%11]);
    cp.setZ(i,-.04-drop*.13+Math.sin(x*16)*drop*.018);
  }
  capeGeometry.computeVertexNormals();
  const cape=add(body,capeGeometry,clothMat,0,.11,-.245);cape.userData.keepArtMesh=true;cape.userData.restPositions=new Float32Array(cp.array);
  for(const s of [-1,1]){
    const clasp=ellipsoid(body,s*.20,.58,-.05,.033,.036,.018,trim);clasp.rotation.y=s*.5;
    line(body,[[s*.20,.58,-.06],[s*.27,.55,-.18],[s*.23,.49,-.27]],.012,clothMat);
  }

  // Bake only decorative surfaces belonging to one joint. No animated pivot,
  // cape, shield toggle or ignitable blade is flattened by this optimization.
  function batchAt(part){
    part.updateWorldMatrix(true,true);const inverse=part.matrixWorld.clone().invert(),items=[],buckets=new Map();
    function collect(node){for(const child of [...node.children]){if(child.userData.artJoint)continue;if(child.isMesh&&!child.userData.keepArtMesh){const g=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone());g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,child.matrixWorld));const key=child.material.uuid;if(!buckets.has(key))buckets.set(key,{m:child.material,pos:[],normal:[],uv:[]});const b=buckets.get(key);b.pos.push(g.attributes.position.array);b.normal.push(g.attributes.normal.array);b.uv.push(g.attributes.uv?g.attributes.uv.array:new Float32Array(g.attributes.position.count*2));items.push(child);g.dispose();}else if(!child.isMesh)collect(child);}}
    collect(part);const concat=arrays=>{const out=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let at=0;for(const a of arrays){out.set(a,at);at+=a.length}return out};
    for(const b of buckets.values()){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(concat(b.pos),3));g.setAttribute('normal',new T.BufferAttribute(concat(b.normal),3));g.setAttribute('uv',new T.BufferAttribute(concat(b.uv),2));const o=add(part,g,b.m);o.name='forged_'+(part.name||'assembly');}
    for(const o of items)o.parent.remove(o);
  }
  for(const a of assemblies)batchAt(a);
  arms[0].shoulder.rotation.x=-.12;arms[1].shoulder.rotation.x=-.22;
  for(const arm of arms)arm.elbow.rotation.x=-.04;
  root.scale.setScalar(boss?1.66:sentinel?.98:1);
  root.name=boss?'Crownless Warden · ivory reliquary':'Wayfarer · etched ash cuirass';
  const actor={root,pivot,model,body,neck,head,arms,legs,weapon,shield,cape,scale:root.scale.x,walk:0,blend:0,hit:0};
  let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});
  root.userData.artStats={meshes,triangles:Math.round(triangles)};
  return actor;
}
global.AshenCharacters={createKnight};
})(typeof window!=='undefined'?window:globalThis);
