'use strict';
(function(root){
  const PRESETS={
    acoustic:{label:'木吉他',file:'guitar-acoustic.js'},
    electric:{label:'清音电吉他',file:'guitar-electric.js'}
  };
  const pendingPacks=new Map();
  function loadPack(id){
    if(!PRESETS[id])return Promise.reject(new Error('Unknown guitar sound'));
    if(root.GuitarSamplePacks?.[id])return Promise.resolve(root.GuitarSamplePacks[id]);
    if(pendingPacks.has(id))return pendingPacks.get(id);
    const promise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      const timer=setTimeout(()=>fail(),30000);
      function fail(){clearTimeout(timer);script.remove();reject(new Error('Guitar samples could not be loaded'));}
      script.src=new URL(`assets/${PRESETS[id].file}`,document.baseURI).href;
      script.onerror=fail;
      script.onload=()=>{
        clearTimeout(timer);
        const pack=root.GuitarSamplePacks?.[id];
        if(pack)resolve(pack);else fail();
      };
      document.head.append(script);
    });
    pendingPacks.set(id,promise);
    promise.catch(()=>pendingPacks.delete(id));
    return promise;
  }
  function nearestSample(pack,midi){
    return Object.keys(pack).map(Number).sort((a,b)=>a-b).reduce((nearest,key)=>
      Math.abs(key-midi)<Math.abs(nearest-midi)?key:nearest);
  }
  class Player{
    constructor(context,packLoader=loadPack){
      this.context=context;this.packLoader=packLoader;this.buffers=new Map();this.active=new Set();this.generation=0;
    }
    stop(){
      this.generation++;
      const now=this.context.currentTime;
      this.active.forEach(({source,gain})=>{
        gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(0,now,.004);
        try{source.stop(now+.02);}catch{/* A naturally ended source is already silent. */}
      });
      this.active.clear();
    }
    buffer(id,midi,pack){
      const key=`${id}:${midi}`;
      if(!this.buffers.has(key)){
        const bytes=Uint8Array.from(atob(pack[midi]),c=>c.charCodeAt(0));
        const pending=this.context.decodeAudioData(bytes.buffer);
        this.buffers.set(key,pending);
        pending.catch(()=>this.buffers.delete(key));
      }
      return this.buffers.get(key);
    }
    async play(notes,id,onStatus=()=>{}){
      this.stop();
      const generation=this.generation,preset=PRESETS[id];
      if(!preset)throw new Error('Unknown guitar sound');
      onStatus(`正在加载${preset.label}音色…`);
      try{
        const pack=await this.packLoader(id);
        const voices=await Promise.all(notes.map(async note=>{
          const sample=nearestSample(pack,note.midi);
          return {buffer:await this.buffer(id,sample,pack),rate:2**((note.midi-sample)/12)};
        }));
        if(generation!==this.generation)return false;
        const start=this.context.currentTime+.04;
        voices.forEach(({buffer,rate},i)=>{
          const source=this.context.createBufferSource(),gain=this.context.createGain();
          const t=start+i*.09,duration=Math.min(buffer.duration/rate,4.5),level=.23;
          source.buffer=buffer;source.playbackRate.value=rate;
          gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(level,t+.003);
          gain.gain.setValueAtTime(level,t+Math.max(.004,duration-.25));gain.gain.linearRampToValueAtTime(0,t+duration);
          source.connect(gain);gain.connect(this.context.destination);
          const voice={source,gain};
          source.onended=()=>{source.disconnect();gain.disconnect();this.active.delete(voice);};
          this.active.add(voice);source.start(t);source.stop(t+duration);
        });
        onStatus('');return true;
      }catch(error){if(generation===this.generation)throw error;return false;}
    }
  }
  const api={PRESETS,Player,nearestSample};
  root.GuitarAudio=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
