/* Small, dependency-free filmic resolve for the local Three.js r128 renderer. */
(function(root){
'use strict';
root.AshenPolish={create:function({THREE,renderer,scene,camera}){
 const size=renderer.getDrawingBufferSize(new THREE.Vector2());
 const target=new THREE.WebGLRenderTarget(size.x,size.y,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false});
 target.texture.encoding=THREE.sRGBEncoding;
 const uniforms={image:{value:target.texture},texel:{value:new THREE.Vector2(1/size.x,1/size.y)},clock:{value:0},hurt:{value:0},strength:{value:.14}};
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,toneMapped:false,
 vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
 fragmentShader:`precision highp float;
 uniform sampler2D image;uniform vec2 texel;uniform float clock;uniform float hurt;uniform float strength;varying vec2 uv0;
 float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
 vec3 sampleAt(vec2 uv){return texture2D(image,clamp(uv,vec2(.001),vec2(.999))).rgb;}
 void main(){
  vec2 p=uv0;vec3 c=sampleAt(p);float m=luma(c);
  float n=luma(sampleAt(p+vec2(0.,texel.y))),s=luma(sampleAt(p-vec2(0.,texel.y)));
  float e=luma(sampleAt(p+vec2(texel.x,0.))),w=luma(sampleAt(p-vec2(texel.x,0.)));
  float lo=min(m,min(min(n,s),min(e,w))),hi=max(m,max(max(n,s),max(e,w)));
  if(hi-lo>max(.045,hi*.15)){
   vec2 direction=abs(n-s)>abs(e-w)?vec2(texel.x,0.):vec2(0.,texel.y);
   vec3 aa=(sampleAt(p+direction*.5)+sampleAt(p-direction*.5))*.5;
   c=mix(c,aa,.45);
  }
  vec3 bloom=vec3(0.);for(int i=0;i<8;i++){
   float angle=float(i)*.785398;vec2 d=vec2(cos(angle),sin(angle))*texel*4.5;
   vec3 h=sampleAt(p+d);bloom+=h*smoothstep(.72,.99,max(h.r,max(h.g,h.b)));
  }c+=bloom*(strength/8.);
  float lum=luma(c);c=mix(vec3(lum),c,1.06);
  c+=vec3(-.009,.003,.014)*(1.-smoothstep(.12,.65,lum));
  c+=vec3(.013,.006,-.006)*smoothstep(.45,.95,lum);
  c=(c-.5)*1.025+.5;c=clamp(c,0.,1.);
  vec2 q=p*2.-1.;float vignette=1.-.11*pow(clamp(dot(q,q)*.45,0.,1.),1.7);c*=vignette;
  float grain=fract(sin(dot(gl_FragCoord.xy+floor(clock*18.),vec2(12.9898,78.233)))*43758.5453)-.5;
  c+=grain*.0025;
  float edge=smoothstep(.25,1.15,length(q));c+=vec3(.09,-.014,-.018)*hurt*edge;
  gl_FragColor=vec4(clamp(c,0.,1.),1.);
 }`});
 const screen=new THREE.Scene(),screenCamera=new THREE.Camera();screen.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));
 let disposed=false;
 return {
  render:function(dt,time,feedback){if(disposed)return;uniforms.clock.value=time||0;uniforms.hurt.value=feedback&&Number.isFinite(feedback.damage)?feedback.damage:0;const previous=renderer.getRenderTarget();renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);renderer.setRenderTarget(previous);renderer.render(screen,screenCamera);},
  resize:function(){if(disposed)return;renderer.getDrawingBufferSize(size);target.setSize(Math.max(1,size.x),Math.max(1,size.y));uniforms.texel.value.set(1/Math.max(1,size.x),1/Math.max(1,size.y));},
  dispose:function(){disposed=true;target.dispose();screen.children[0].geometry.dispose();material.dispose();}
 };
}};
})(window);
