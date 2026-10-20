/* Chord-tone gaps from James Hober, Method 2 (TedGreene.com).
   Each gap is the number of intervening chord tones, NOT semitones. */
(function (root) {
  'use strict';
  const GROUPS = [
    [0,0,0], [1,0,1], [0,1,2], [2,1,0], [1,2,1], [4,0,0], [5,0,1],
    [2,2,2], [1,0,5], [1,4,1], [2,1,4], [4,1,2], [0,4,0], [0,0,4]
  ];
  const QUALITIES = [
    { id:'maj7', name:'maj7 · 大七', intervals:[0,4,7,11], degrees:['1','3','5','7'] },
    { id:'7', name:'7 · 属七', intervals:[0,4,7,10], degrees:['1','3','5','♭7'] },
    { id:'m7', name:'m7 · 小七', intervals:[0,3,7,10], degrees:['1','♭3','5','♭7'] },
    { id:'mMaj7', name:'m(maj7) · 小大七', intervals:[0,3,7,11], degrees:['1','♭3','5','7'] },
    { id:'m7b5', name:'m7♭5 · 半减七', intervals:[0,3,6,10], degrees:['1','♭3','♭5','♭7'] },
    { id:'dim7', name:'dim7 · 减七', intervals:[0,3,6,9], degrees:['1','♭3','♭5','♭♭7'] },
    { id:'maj7s5', name:'maj7♯5 · 增大七', intervals:[0,4,8,11], degrees:['1','3','♯5','7'] },
    { id:'7s5', name:'7♯5 · 增属七', intervals:[0,4,8,10], degrees:['1','3','♯5','♭7'] },
    { id:'7b5', name:'7♭5 · 属七降五', intervals:[0,4,6,10], degrees:['1','3','♭5','♭7'] },
    { id:'6', name:'6 · 大六', intervals:[0,4,7,9], degrees:['1','3','5','6'] },
    { id:'m6', name:'m6 · 小六', intervals:[0,3,7,9], degrees:['1','♭3','5','6'] },
    { id:'7sus4', name:'7sus4 · 挂四属七', intervals:[0,5,7,10], degrees:['1','4','5','♭7'] },
    { id:'7sus2', name:'7sus2 · 挂二属七', intervals:[0,2,7,10], degrees:['1','2','5','♭7'] }
  ];
  const ROOTS = [ ['C',0],['C♯',1],['D♭',1],['D',2],['D♯',3],['E♭',3],['E',4],['F',5],['F♯',6],['G♭',6],['G',7],['G♯',8],['A♭',8],['A',9],['A♯',10],['B♭',10],['B',11] ];
  const STRINGS = [ {number:6,open:40,note:'E2'}, {number:5,open:45,note:'A2'}, {number:4,open:50,note:'D3'}, {number:3,open:55,note:'G3'}, {number:2,open:59,note:'B3'}, {number:1,open:64,note:'E4'} ];
  const mod = (n, d=12) => ((n % d) + d) % d;
  function quality(id) {
    const q = QUALITIES.find(q=>q.id===id);
    if (!q) throw new Error('未知和弦性质');
    return q;
  }
  function toneName(rootName, degree, interval) {
    const letters = ['C','D','E','F','G','A','B'];
    const natural = [0,2,4,5,7,9,11];
    const r = ROOTS.find(r=>r[0]===rootName);
    if (!r) throw new Error('未知根音');
    const step = Number(degree.match(/\d+/)[0]) - 1;
    const letter = mod(letters.indexOf(rootName[0])+step,7);
    let accidental = mod(r[1]+interval-natural[letter]);
    if (accidental>6) accidental-=12;
    return letters[letter]+(accidental>0?'♯'.repeat(accidental):'♭'.repeat(-accidental));
  }
  function tonesFor(rootName, qualityId) {
    const q = quality(qualityId);
    const r = ROOTS.find(r=>r[0]===rootName);
    if (!r) throw new Error('未知根音');
    return q.intervals.map((interval,i)=>({index:i, interval, pc:mod(r[1]+interval), degree:q.degrees[i], name:toneName(rootName,q.degrees[i],interval)}));
  }
  function voicePattern(group, inversion) {
    if (!Number.isInteger(group)||group<1||group>14||!Number.isInteger(inversion)||inversion<0||inversion>3) throw new Error('V group / inversion 超出范围');
    const path=[inversion];
    GROUPS[group-1].forEach(gap=>path.push(path.at(-1)+gap+1));
    return path;
  }
  function voicedOffsets(qualityId, group, inversion) {
    const q=quality(qualityId);
    return voicePattern(group,inversion).map(step=>q.intervals[step%4]+12*Math.floor(step/4));
  }
  function permutations(items) {
    if (!items.length) return [[]];
    return items.flatMap((item,i)=>permutations(items.filter((_,j)=>i!==j)).map(tail=>[item,...tail]));
  }
  function findVoicings({rootName='C',qualityId='maj7',group=2,inversion=0,strings=[5,4,3,2],minFret=0,maxFret=24,maxSpan=5,allowOpen=false,showOctaves=false}) {
    if (strings.length!==4||new Set(strings).size!==4||strings.some(s=>!STRINGS.some(t=>t.number===s))) throw new Error('请选择四根不同的琴弦');
    if (![minFret,maxFret,maxSpan].every(Number.isInteger)||minFret<0||maxFret>24||minFret>maxFret||maxSpan<0) throw new Error('品位范围无效');
    const tones=tonesFor(rootName,qualityId);
    const offsets=voicedOffsets(qualityId,group,inversion);
    const pattern=voicePattern(group,inversion);
    const rootPc=ROOTS.find(r=>r[0]===rootName)[1];
    const sortedStrings=[...strings].sort((a,b)=>b-a);
    const assignments=permutations(sortedStrings);
    const results=[];
    // All four pitches move together by octaves: the exact group spacing is retained.
    for(let octave=0;octave<=8;octave++) {
      const pitches=offsets.map(offset=>12*octave+rootPc+offset);
      for(const assignment of assignments) {
        const notes=assignment.map((number,i)=>{
          const tuning=STRINGS.find(s=>s.number===number);
          const tone=tones[pattern[i]%4];
          return {...tone,string:number,midi:pitches[i],fret:pitches[i]-tuning.open,voice:i};
        });
        if(notes.some(n=>n.fret<minFret||n.fret>maxFret||(!allowOpen&&n.fret===0))) continue;
        const stopped=notes.filter(n=>n.fret>0).map(n=>n.fret);
        // Open strings belong only to first-position shapes, never to a high-fret shape.
        const hasOpen=notes.some(n=>n.fret===0);
        if(hasOpen&&stopped.some(f=>f>5)) continue;
        const span=stopped.length?Math.max(...stopped)-Math.min(...stopped):0;
        if(span>maxSpan) continue;
        const physical=[...notes].sort((a,b)=>b.string-a.string);
        const crossed=physical.some((n,i)=>i>0&&n.midi<physical[i-1].midi);
        results.push({notes,span,crossed,position:stopped.length?Math.min(...stopped):0,frets:STRINGS.map(s=>notes.find(n=>n.string===s.number)?.fret??null)});
      }
    }
    const sorted=results.sort((a,b)=>a.span-b.span||a.position-b.position||Number(a.crossed)-Number(b.crossed)||a.frets.join().localeCompare(b.frets.join()));
    if(showOctaves) return sorted;
    const seen=new Set();
    return sorted.filter(shape=>{
      // Collapse only a whole-shape 12-fret translation; preserve different shapes.
      // Include zero in the key for open shapes so their +12 versions also collapse.
      const lowest=Math.min(...shape.notes.map(n=>n.fret));
      const shift=12*Math.floor(lowest/12);
      const key=shape.frets.map(f=>f===null?'x':f-shift).join(',');
      if(seen.has(key)) return false;
      seen.add(key);return true;
    });
  }
  const api={GROUPS,QUALITIES,ROOTS,STRINGS,quality,tonesFor,toneName,voicePattern,voicedOffsets,findVoicings};
  root.VSystem=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
})(globalThis);
