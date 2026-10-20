const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Player,nearestSample}=require('../guitar-audio.js');
require('../assets/guitar-acoustic.js');
require('../assets/guitar-electric.js');
function audioContext(){
  const context={currentTime:10,destination:{},sources:[],decoded:0};
  context.decodeAudioData=async data=>{assert.ok(data.byteLength);context.decoded++;return {duration:4};};
  context.createGain=()=>({connect(){},disconnect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(){}}});
  context.createBufferSource=()=>{
    const source={playbackRate:{},connect(){},disconnect(){},start(t){this.started=t;},stop(t){this.stopped=t;}};
    context.sources.push(source);return source;
  };
  return context;
}
test('both guitar packs contain distinct, valid MP3 recordings and select the closest sample',()=>{
  const packs=globalThis.GuitarSamplePacks;
  assert.equal(Object.keys(packs.acoustic).length,35);assert.equal(Object.keys(packs.electric).length,16);
  for(const pack of Object.values(packs))for(const encoded of Object.values(pack)){
    const bytes=Buffer.from(encoded,'base64');assert.ok(bytes.length>1000);
    assert.ok(bytes.subarray(0,3).toString()==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224));
  }
  assert.notEqual(packs.acoustic[60],packs.electric[60]);
  assert.equal(nearestSample(packs.acoustic,63),63);
  assert.equal(nearestSample(packs.electric,64),63);
  assert.equal(nearestSample(packs.electric,88),84);
});
test('sample playback uses four recorded voices, transposes missing notes and caches decoding',async()=>{
  const context=audioContext(),player=new Player(context,async id=>globalThis.GuitarSamplePacks[id]);
  const notes=[48,55,59,64].map(midi=>({midi}));
  assert.equal(await player.play(notes,'electric'),true);
  assert.equal(context.sources.length,4);
  assert.equal(context.sources[3].playbackRate.value,2**(1/12));
  assert.ok(context.sources[3].started>context.sources[0].started);
  const decoded=context.decoded;
  await player.play(notes,'electric');assert.equal(context.decoded,decoded);
  assert.ok(context.sources[0].stopped<=context.currentTime+.02);
});
test('switching sounds while samples load cancels the old pending preview',async()=>{
  let finishLoading;
  const context=audioContext(),player=new Player(context,()=>new Promise(resolve=>{finishLoading=resolve;}));
  const pending=player.play([{midi:60}],'acoustic');player.stop();
  finishLoading(globalThis.GuitarSamplePacks.acoustic);
  assert.equal(await pending,false);assert.equal(context.sources.length,0);
});
test('a failed sample load can be retried without returning to a synthetic voice',async()=>{
  let attempts=0;
  const context=audioContext(),player=new Player(context,async()=>{
    if(++attempts===1)throw new Error('offline');return globalThis.GuitarSamplePacks.electric;
  });
  await assert.rejects(player.play([{midi:60}],'electric'),/offline/);
  assert.equal(await player.play([{midi:60}],'electric'),true);assert.equal(context.sources.length,1);
});
