const { test } = require('node:test');
const assert = require('node:assert/strict');
const V = require('../engine.js');

test('official gap table and root-position pitch patterns, including octave skips', () => {
  const expected = [
    [0,4,7,11], [0,7,11,16], [0,4,11,19], [0,11,16,19], [0,7,16,23],
    [0,16,19,23], [0,19,23,28], [0,11,19,28], [0,7,11,28], [0,7,23,28],
    [0,11,16,31], [0,16,23,31], [0,4,19,23], [0,4,7,23]
  ];
  expected.forEach((p,i) => assert.deepEqual(V.voicedOffsets('maj7',i+1,0),p));
});

test('known Cmaj7 V2 fingerings and actual bass inversion', () => {
  const shapes=V.findVoicings({rootName:'C',qualityId:'maj7',group:2,inversion:0,strings:[5,4,3,2]});
  const known=shapes.find(s=>s.frets.join(',')===',3,5,4,5,');
  assert.ok(known);
  assert.deepEqual(known.notes.map(n=>n.midi),[48,55,59,64]);
  assert.equal(known.span,2);
  assert.equal(known.crossed,false);
});

test('correct theoretical spelling for altered chords and enharmonic roots', () => {
  assert.deepEqual(V.tonesFor('C','dim7').map(n=>n.name),['C','E♭','G♭','B♭♭']);
  assert.deepEqual(V.tonesFor('F♯','maj7').map(n=>n.name),['F♯','A♯','C♯','E♯']);
  assert.deepEqual(V.tonesFor('D♭','7').map(n=>n.name),['D♭','F','A♭','C♭']);
  assert.deepEqual(V.tonesFor('B♭','m6').map(n=>n.name),['B♭','D♭','F','G']);
});

function combinations(a,k) {
  if(!k)return [[]];
  return a.flatMap((n,i)=>combinations(a.slice(i+1),k-1).map(rest=>[n,...rest]));
}
function countGap(a,b,pcs) {
  let count=0;for(let p=a+1;p<b;p++)if(pcs.includes(p%12))count++;return count;
}
test('all qualities, V groups, inversions and 15 string sets preserve exact gaps and pitches', () => {
  let count=0, crosses=0;
  const sets=combinations([6,5,4,3,2,1],4);
  for(const q of V.QUALITIES)for(let group=1;group<=14;group++)for(let inversion=0;inversion<4;inversion++)for(const strings of sets){
    const shapes=V.findVoicings({rootName:'C',qualityId:q.id,group,inversion,strings,maxFret:24,maxSpan:24,showOctaves:true});
    const ids=new Set();
    for(const shape of shapes){
      count++;if(shape.crossed)crosses++;
      const id=shape.frets.join();assert.ok(!ids.has(id));ids.add(id);
      assert.equal(new Set(shape.notes.map(n=>n.pc)).size,4);
      assert.equal(shape.notes[0].pc,q.intervals[inversion]);
      shape.notes.forEach((n,i)=>{
        const string=V.STRINGS.find(s=>s.number===n.string);
        assert.equal(string.open+n.fret,n.midi);
        assert.ok(strings.includes(n.string)&&n.fret>=1&&n.fret<=24);
        assert.equal(n.midi%12,n.pc);
        if(i)assert.equal(countGap(shape.notes[i-1].midi,n.midi,q.intervals),V.GROUPS[group-1][i-1]);
      });
    }
  }
  assert.ok(count>10000);assert.ok(crosses>0);
});

test('independent brute force finds exactly the same V group shapes, including crossed voices', () => {
  const strings=[6,4,3,1], pcs=[0,4,7,11], brute=new Set();
  function walk(notes){
    if(notes.length===4){
      const sorted=[...notes].sort((a,b)=>a.midi-b.midi);
      if(sorted[0].midi%12!==0||new Set(sorted.map(n=>n.midi%12)).size!==4)return;
      const gaps=sorted.slice(1).map((n,i)=>countGap(sorted[i].midi,n.midi,pcs));
      if(gaps.join()!=='2,1,0')return;
      brute.add(V.STRINGS.map(s=>notes.find(n=>n.string===s.number)?.fret??null).join());return;
    }
    const s=V.STRINGS.find(s=>s.number===strings[notes.length]);
    for(let fret=1;fret<=12;fret++)if(pcs.includes((s.open+fret)%12))walk([...notes,{string:s.number,fret,midi:s.open+fret}]);
  }
  walk([]);
  const actual=V.findVoicings({rootName:'C',qualityId:'maj7',group:4,inversion:0,strings,maxFret:12,maxSpan:24,showOctaves:true});
  assert.deepEqual(new Set(actual.map(s=>s.frets.join())),brute);
  assert.ok(brute.size>0);
});

test('open strings are optional and limited to low positions; fret/span filters still apply', () => {
  const base={rootName:'C',qualityId:'maj7',group:2,inversion:3,strings:[5,4,3,2],maxSpan:24};
  assert.ok(V.findVoicings(base).every(s=>s.notes.every(n=>n.fret>0)));
  const all=V.findVoicings({...base,allowOpen:true});
  assert.ok(all.some(s=>s.notes.some(n=>n.fret===0)));
  all.filter(s=>s.notes.some(n=>n.fret===0)).forEach(s=>assert.ok(s.notes.every(n=>n.fret<=5)));
  // Previously this V14 shape mixed a seventh/eighth-fret grip with an open G string.
  const wide=V.findVoicings({rootName:'C',qualityId:'maj7',group:14,inversion:0,strings:[6,5,3,1],allowOpen:true,maxSpan:24,showOctaves:true});
  assert.ok(!wide.some(s=>s.frets.join() === '8,7,,0,,7'));
  const filtered=V.findVoicings({...base,minFret:2,maxFret:17,maxSpan:5,allowOpen:false});
  assert.ok(filtered.length);
  filtered.forEach((s,i)=>{
    assert.ok(s.span<=5&&s.notes.every(n=>n.fret>=2&&n.fret<=17));
    if(i)assert.ok(s.span>=filtered[i-1].span);
  });
  assert.throws(()=>V.findVoicings({strings:[1,2,3,3]}));
  assert.throws(()=>V.findVoicings({minFret:9,maxFret:2}));
  assert.throws(()=>V.voicePattern(15,0));
  assert.throws(()=>V.quality('bad'));
});

test('octave duplicates are hidden by default, with an explicit opt-in', () => {
  const base={rootName:'C',qualityId:'maj7',group:2,inversion:0,strings:[5,4,3,2]};
  const compact=V.findVoicings(base),all=V.findVoicings({...base,showOctaves:true});
  assert.equal(compact.length,1);assert.equal(all.length,2);
  assert.deepEqual(compact[0].frets,[null,3,5,4,5,null]);
  assert.deepEqual(all[1].frets,[null,15,17,16,17,null]);
  // A requested high-fret range must keep its available representative.
  const high=V.findVoicings({...base,minFret:13});
  assert.equal(high.length,1);assert.deepEqual(high[0].frets,all[1].frets);
  // Open shapes and their fully fretted +12 equivalents collapse too.
  const openBase={rootName:'C',qualityId:'maj7',group:2,inversion:3,strings:[5,4,3,2],allowOpen:true,maxSpan:5};
  const open=V.findVoicings(openBase),openAll=V.findVoicings({...openBase,showOctaves:true});
  assert.ok(open.some(s=>s.frets.join()===',2,2,0,1,'));
  assert.ok(!open.some(s=>s.frets.join()===',14,14,12,13,'));
  assert.ok(openAll.some(s=>s.frets.join()===',14,14,12,13,'));
});
