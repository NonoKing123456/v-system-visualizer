'use strict';
const V=globalThis.VSystem;
const $=id=>document.getElementById(id);
const COLORS=['#b96141','#9c7a2b','#377e79','#83729b'];
const TITLES=['原位','第一转位','第二转位','第三转位'];
const DESCRIPTIONS=['密集排列','开放排列 · Drop 2','开放排列 · Drop 3','开放排列 · Drop 2 & 4','宽展排列','低音扩展八度','低音扩展八度','反向和弦音序','高音扩展八度','上下声部拉开','高音扩展八度','低音扩展八度','中间声部拉开','高音扩展八度'];
const DEFAULTS={rootName:'C',qualityId:'maj7',group:2,strings:[5,4,3,2],maxSpan:5,allowOpen:false,showOctaves:false};
let state={...DEFAULTS,strings:[...DEFAULTS.strings]}, positions=[0,0,0,0], results=[], audioContext, activeAudio=[];
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function load(){
  try{
    const saved=JSON.parse(localStorage.getItem('v-system-settings'));
    if(!saved)return;
    const s={...Object.fromEntries(Object.keys(DEFAULTS).filter(k=>k in saved).map(k=>[k,saved[k]])),showOctaves:saved.showOctaves===true,allowOpen:saved.showOctaves===undefined?false:saved.allowOpen===true};
    V.tonesFor(s.rootName,s.qualityId); V.voicePattern(s.group,0);
    V.findVoicings({...s,inversion:0});
    state={...DEFAULTS,...s};
  }catch{/* Private browsing or old settings: defaults remain available. */}
}
function persist(){try{localStorage.setItem('v-system-settings',JSON.stringify(state));}catch{/* Storage is optional. */}}
function syncControls(){
  $('root').value=state.rootName;$('quality').value=state.qualityId;
  $('span').value=state.maxSpan;$('show-octaves').checked=state.showOctaves;$('open-strings').checked=state.allowOpen;
  document.querySelectorAll('[data-string]').forEach(b=>b.setAttribute('aria-pressed',state.strings.includes(Number(b.dataset.string))));
  document.querySelectorAll('[data-strings]').forEach(b=>b.classList.toggle('active',b.dataset.strings===state.strings.join(',')));
  document.querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.group)===state.group));
  $('string-count').textContent=`${state.strings.length} / 4`;
}
function stopAudio(){activeAudio.forEach(o=>{try{o.stop();}catch{}});activeAudio=[];}
function pluckString(midi,duration=2.6){
  const sampleRate=audioContext.sampleRate,frequency=440*2**((midi-69)/12);
  const delayLength=Math.max(2,Math.round(sampleRate/frequency));
  const sampleCount=Math.ceil(sampleRate*duration),buffer=audioContext.createBuffer(1,sampleCount,sampleRate);
  const samples=buffer.getChannelData(0),string=new Float32Array(delayLength);
  for(let i=0;i<delayLength;i++)string[i]=Math.random()*2-1;
  let cursor=0;
  for(let i=0;i<sampleCount;i++){
    const next=(cursor+1)%delayLength;
    samples[i]=string[cursor];
    string[cursor]=.498*(string[cursor]+string[next]);
    cursor=next;
  }
  return buffer;
}
async function play(shape){
  stopAudio();
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio){$('result-count').textContent='此浏览器不支持试听';return;}
  try{
    audioContext ||= new Audio();await audioContext.resume();
    const start=audioContext.currentTime+.03;
    shape.notes.forEach((n,i)=>{
      const source=audioContext.createBufferSource(),body=audioContext.createBiquadFilter(),gain=audioContext.createGain();
      const t=start+i*.09;source.buffer=pluckString(n.midi);body.type='lowpass';body.frequency.value=5600;body.Q.value=.35;
      gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(.2,t+.006);gain.gain.exponentialRampToValueAtTime(.001,t+2.45);
      source.connect(body);body.connect(gain);gain.connect(audioContext.destination);source.start(t);source.stop(t+2.6);
      source.onended=()=>{source.disconnect();body.disconnect();gain.disconnect();activeAudio=activeAudio.filter(x=>x!==source);};activeAudio.push(source);
    });
  }catch{$('result-count').textContent='试听暂不可用，请检查浏览器音频权限';}
}
function fretboard(shape,inversion){
  const stopped=shape.notes.filter(n=>n.fret>0).map(n=>n.fret);
  const low=stopped.length?Math.min(...stopped):1, high=stopped.length?Math.max(...stopped):5;
  let first=low<=3?1:Math.max(1,low-1), last=Math.max(first+4,high+1);
  if(last>24){last=24;first=Math.min(first,20);}
  const count=last-first+1, x0=48, svgWidth=Math.max(442,count*35+100), width=svgWidth-100, step=width/count, top=24, dy=27;
  const title=`${TITLES[inversion]}：1弦在上、6弦在下，${first}至${last}品。6至1弦品位 ${shape.frets.map(x=>x??'不弹').join('、')}`;
  let svg=`<svg class="fretboard" style="min-width:${count>10?svgWidth:290}px" viewBox="0 0 ${svgWidth} 200" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect x="${x0}" y="${top-9}" width="${width}" height="${dy*5+18}" fill="#f7f4ea" rx="2"/>`;
  for(let f=first;f<=last;f++){
    const x=x0+(f-first)*step;
    svg+=`<line x1="${x}" y1="${top-9}" x2="${x}" y2="${top+dy*5+9}" stroke="${f===1?'#7c8776':'#d7d4c5'}" stroke-width="${f===1?4:1.3}"/><text class="fret-number" x="${x+step/2}" y="187" text-anchor="middle" fill="#858c7f" font-size="10">${f}</text>`;
    if([3,5,7,9,12,15,17,19,21,24].includes(f)){
      const dots=[12,24].includes(f)?[top+dy*1.5,top+dy*3.5]:[top+dy*2.5];
      dots.forEach(y=>svg+=`<circle cx="${x+step/2}" cy="${y}" r="3" fill="#dcd9c9"/>`);
    }
  }
  svg+=`<line x1="${x0+width}" y1="${top-9}" x2="${x0+width}" y2="${top+dy*5+9}" stroke="#d7d4c5"/>`;
  [...V.STRINGS].reverse().forEach((s,i)=>{
    const y=top+i*dy, note=shape.notes.find(n=>n.string===s.number),selected=state.strings.includes(s.number);
    svg+=`<text class="string-label" x="10" y="${y+4}" font-size="10" fill="#8c9586">${s.note[0]}</text><line x1="${x0}" y1="${y}" x2="${x0+width}" y2="${y}" stroke="${selected?'#a2aa98':'#d7dbce'}" stroke-width="${.95+i*.25}"/><text class="string-fret" x="${x0+width+27}" y="${y+4}" text-anchor="middle" font-size="12" fill="${note?'#4f6658':'#abb2a1'}">${note?.fret??'×'}</text>`;
    if(!note)return;
    const x=note.fret===0?32:x0+(note.fret-first+.5)*step;
    const radius=Math.min(12.5,step*.43),color=COLORS[note.index];
    svg+=`<circle cx="${x}" cy="${y}" r="${radius}" fill="${note.fret===0?'#fffefa':color}" stroke="${color}" stroke-width="1.5"/><text x="${x}" y="${y+3.7}" text-anchor="middle" font-size="${note.degree.length>2?9:11}" font-weight="600" fill="${note.fret===0?color:'#fffefa'}">${esc(note.degree)}</text>`;
  });
  svg+='</svg>';
  return svg;
}
function sequence(inversion){
  const tones=V.tonesFor(state.rootName,state.qualityId);
  return V.voicePattern(state.group,inversion).map((s,i)=>`${i?'<i>→</i>':''}<b style="--tone:${COLORS[s%4]}">${esc(tones[s%4].degree)}</b>`).join('');
}
function cardHTML(inversion){
  const options=results[inversion],index=Math.min(positions[inversion],options.length-1),shape=options[index];
  const bass=V.tonesFor(state.rootName,state.qualityId)[inversion];
  const header=`<div class="card-top"><div class="card-title"><span class="inversion-number">0${inversion+1}</span><div><h4>${TITLES[inversion]}</h4><small>低音 ${esc(bass.name)} · ${esc(bass.degree)}</small></div></div><button class="play" data-play="${inversion}" aria-label="试听${TITLES[inversion]}" title="由低到高试听" ${shape?'':'disabled'}>▶</button></div><div class="voice-sequence" aria-label="从低到高的和弦音序">${sequence(inversion)}${shape?.crossed?'<span class="crossed">声部跨弦</span>':''}</div>`;
  if(!shape){
    const suggestions=[[6,5,4,3],[5,4,3,2],[4,3,2,1],[6,4,3,1],[6,5,3,1],[5,4,3,1]].filter(strings=>strings.join()!==state.strings.join()&&V.findVoicings({...state,strings,inversion}).length).slice(0,2);
    return `<article class="voicing-card">${header}<div class="empty"><div class="empty-symbol">∅</div><strong>当前条件下无匹配指型</strong><p>试试其他弦组，或放宽跨度。V-${state.group} 的声部八度间距会保持不变。</p><div class="empty-actions">${suggestions.map(s=>`<button data-suggest="${s.join(',')}">试用 ${s.join('–')} 弦</button>`).join('')}</div></div><div class="card-bottom"><span>低 → 高音序如上</span><span>0 个位置</span></div></article>`;
  }
  const spoken=shape.notes.map(n=>{
    const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n.name[0]];
    const alteration=[...n.name].slice(1).reduce((a,c)=>a+(c==='♯'?1:-1),0);
    const octave=(n.midi-natural-alteration)/12-1;
    return `${n.string}弦${n.fret}品 ${n.name}${octave}`;
  }).join('，');
  return `<article class="voicing-card">${header}<div class="fret-scroll" title="${esc(spoken)}">${fretboard(shape,inversion)}</div><div class="card-bottom card-pagination"><div class="pagination"><button data-step="-1" data-inversion="${inversion}" aria-label="${TITLES[inversion]}上一个位置" ${index===0?'disabled':''}>‹</button><span>${index+1} / ${options.length}</span><button data-step="1" data-inversion="${inversion}" aria-label="${TITLES[inversion]}下一个位置" ${index===options.length-1?'disabled':''}>›</button></div></div></article>`;
}
function renderCards(){ $('cards').innerHTML=[0,1,2,3].map(cardHTML).join(''); }
function render(){
  stopAudio();syncControls();
  const tones=V.tonesFor(state.rootName,state.qualityId),q=V.quality(state.qualityId);
  const displaySymbol=q.id==='mMaj7'?'m(maj7)':q.id.replace('s5','♯5').replace('b5','♭5');
  $('chord-title').innerHTML=`${esc(state.rootName+displaySymbol)} <span>/ V-${state.group}</span>`;
  $('chord-tones').innerHTML=tones.map(t=>`<div class="tone-chip" style="--tone:${COLORS[t.index]}"><b>${esc(t.degree)}</b><small>${esc(t.name)}</small></div>`).join('');
  $('group-description').textContent=`V-${state.group} / ${DESCRIPTIONS[state.group-1]}`;
  $('gap-info').textContent=`B–T / T–A / A–S : ${V.GROUPS[state.group-1].join(' · ')}`;
  let message='';
  if(state.strings.length!==4)message=`请恰好选择四根琴弦（当前已选 ${state.strings.length} 根）。`;
  $('validation').hidden=!message;$('validation').textContent=message;
  $('cards').hidden=!!message;
  if(message){$('result-count').textContent='等待有效搜索条件';return;}
  results=[0,1,2,3].map(inversion=>V.findVoicings({...state,inversion}));
  $('result-count').textContent=`${state.strings.join('–')} 弦 · 共 ${results.reduce((a,r)=>a+r.length,0)} 个位置`;
  renderCards();persist();
}
function update(patch){state={...state,...patch};positions=[0,0,0,0];render();}
function init(){
  load();
  $('root').innerHTML=V.ROOTS.map(r=>`<option value="${r[0]}">${r[0]}</option>`).join('');
  $('quality').innerHTML=V.QUALITIES.map(q=>`<option value="${q.id}">${q.name}</option>`).join('');
  $('strings').innerHTML=V.STRINGS.map(s=>`<button type="button" data-string="${s.number}" aria-label="${s.number}弦 ${s.note}" aria-pressed="false"><b>${s.number}</b><small>${s.note}</small></button>`).join('');
  $('groups').innerHTML=V.GROUPS.map((g,i)=>`<button type="button" data-group="${i+1}" aria-pressed="false" title="V-${i+1} · gap ${g.join(' / ')}">V${i+1}</button>`).join('');
  $('root').addEventListener('change',e=>update({rootName:e.target.value}));
  $('quality').addEventListener('change',e=>update({qualityId:e.target.value}));
  $('span').addEventListener('change',e=>update({maxSpan:Number(e.target.value)}));
  $('show-octaves').addEventListener('change',e=>update({showOctaves:e.target.checked}));
  $('open-strings').addEventListener('change',e=>update({allowOpen:e.target.checked}));
  $('strings').addEventListener('click',e=>{
    const button=e.target.closest('[data-string]');if(!button)return;
    const number=Number(button.dataset.string);
    update({strings:(state.strings.includes(number)?state.strings.filter(s=>s!==number):[...state.strings,number]).sort((a,b)=>b-a)});
  });
  document.querySelectorAll('[data-strings]').forEach(b=>b.addEventListener('click',()=>update({strings:b.dataset.strings.split(',').map(Number)})));
  $('groups').addEventListener('click',e=>{const b=e.target.closest('[data-group]');if(b)update({group:Number(b.dataset.group)});});
  $('cards').addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.step){const i=Number(b.dataset.inversion);positions[i]=Math.max(0,Math.min(results[i].length-1,positions[i]+Number(b.dataset.step)));renderCards();}
    if(b.dataset.play!==undefined){const i=Number(b.dataset.play),shape=results[i][positions[i]];if(shape)void play(shape);}
    if(b.dataset.suggest)update({strings:b.dataset.suggest.split(',').map(Number)});
  });
  $('show-theory').addEventListener('click',()=>{const expanded=$('show-theory').getAttribute('aria-expanded')==='true';$('show-theory').setAttribute('aria-expanded',!expanded);$('theory').hidden=expanded;});
  $('reset').addEventListener('click',()=>update({...DEFAULTS,strings:[...DEFAULTS.strings]}));
  render();
}
init();
