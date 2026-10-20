const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../server.cjs');
test('local server delivers the app with correct types and restricts file access',async t=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  for(const [file,type] of [['/','text/html'],['/styles.css','text/css'],['/engine.js','text/javascript'],['/app.js','text/javascript'],['/guitar-audio.js','text/javascript'],['/assets/guitar-acoustic.js','text/javascript'],['/assets/guitar-electric.js','text/javascript']]){
    const res=await fetch(base+file);assert.equal(res.status,200);assert.ok(res.headers.get('content-type').startsWith(type));assert.ok((await res.text()).length>50);
  }
  assert.equal((await fetch(base+'/package.json')).status,404);
  assert.equal((await fetch(base+'/../server.cjs')).status,404);
  assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
  const head=await fetch(base+'/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
});
