const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createGameServer}=require('./server.cjs');
const waitFor=fn=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{try{if(fn()){clearInterval(timer);resolve();}else if(Date.now()-start>7000){clearInterval(timer);reject(Error('Client state timeout: '+fn));}}catch(e){clearInterval(timer);reject(e)}},10)});
function browser(base,storage=new Map()){
 const elements={},timers=[],callbacks={},windowCallbacks={},context=new Proxy({createRadialGradient:()=>({addColorStop:()=>{}}),createLinearGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function element(id){return elements[id]??={open:false,showModal(){this.open=true},close(){this.open=false},style:{setProperty:()=>{}},dataset:{},value:'0',textContent:'',addEventListener:(k,fn)=>{callbacks[id+':'+k]=fn},getContext:()=>context,focus:()=>{},setPointerCapture:()=>{},setAttribute:()=>{},width:960,height:600,getBoundingClientRect:()=>({left:0,top:0,width:960,height:600})};}
 const streams=[];
 class EventSource{
  constructor(url){this.controller=new AbortController();streams.push(this);(async()=>{try{const response=await fetch(base+url,{signal:this.controller.signal});if(!response.ok)throw Error('SSE failed');let buffer='';for await(const chunk of response.body){buffer+=Buffer.from(chunk).toString();let i;while((i=buffer.indexOf('\n\n'))>=0){const part=buffer.slice(0,i);buffer=buffer.slice(i+2);if(part.startsWith('data: '))this.onmessage?.({data:part.slice(6)});}}}catch(e){if(!this.controller.signal.aborted)this.onerror?.(e)}})();}
  close(){this.controller.abort();}
 }
 const sandbox={console,document:{body:{classList:{add:()=>{},remove:()=>{},toggle:()=>{}}},getElementById:element,querySelectorAll:()=>[],addEventListener:()=>{}},window:{addEventListener:(k,fn)=>windowCallbacks[k]=fn},requestAnimationFrame:()=>{},setInterval:fn=>timers.push(fn),fetch:(url,opts)=>fetch(base+url,opts),EventSource,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
 let code=fs.readFileSync(__dirname+'/client.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];code=code.replace('  // Initial mouse aim points','  globalThis.client={network,input,player,frame,chooseHunter};\n  // Initial mouse aim points');vm.createContext(sandbox);sandbox.MONSTER_CLASSES=require('./classes.js');vm.runInContext(code,sandbox);
 return {client:sandbox.client,element,elements,storage,callbacks,windowCallbacks,close:()=>streams.forEach(s=>s.close())};
}
(async()=>{const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;const a=browser(base),b=browser(base);let reload;
 try{
  await a.client.network.connect(true);await waitFor(()=>a.client.network.roster.length===1);b.element('room-code').value=a.client.network.session.code;await b.client.network.connect(false);await waitFor(()=>b.client.network.roster.length===2);
  await a.client.network.ready(true);await waitFor(()=>a.client.network.readyState);await b.client.network.ready(true);assert.equal(b.client.network.readyState,false,'the same hunter cannot be reserved twice');
  b.client.chooseHunter('riftwalker');await b.client.network.ready(true);await waitFor(()=>!a.elements['room-start'].disabled);await a.client.network.start();
  await waitFor(()=>a.element('start-instructions').open&&b.element('start-instructions').open);assert.equal(a.client.network.world,null,'combat waits for the control briefing');
  await a.client.network.brief();await b.client.network.brief();await waitFor(()=>!a.element('start-countdown').hidden&&a.element('start-countdown').textContent==='3');
  await waitFor(()=>a.client.network.world&&b.client.network.world);
  assert.equal(a.client.network.world.enemies.length,8);assert.equal(b.client.network.world.waveIndex,0);a.client.frame(1000);b.client.frame(1000);
  const saved=a.client.network.session.id;
  const esc={key:'Escape',repeat:false,preventDefault(){}};
  a.client.input.up=true;a.client.input.fire=true;a.windowCallbacks.keydown(esc);
  assert.equal(a.element('leave-dialog').open,true);assert.equal(a.client.network.session.id,saved);assert.equal(a.client.input.up,false);assert.equal(a.client.input.fire,false);
  a.windowCallbacks.keydown({...esc,repeat:true});assert.equal(a.element('leave-dialog').open,true);
  a.windowCallbacks.keydown({key:'w',preventDefault(){}});assert.equal(a.client.input.up,false);
  a.windowCallbacks.keydown(esc);assert.equal(a.element('leave-dialog').open,false);assert.equal(a.client.network.session.id,saved);
  a.callbacks['leave-room:click']();assert.equal(a.element('leave-dialog').open,true);a.callbacks['stay-in-hunt:click']();assert.equal(a.client.network.session.id,saved);
  await waitFor(()=>b.client.network.roster.length===2);
a.close();reload=browser(base,a.storage);await waitFor(()=>reload.client.network.world);assert.equal(reload.client.network.session.id,saved);assert.equal(reload.client.network.roster.length,2);reload.client.frame(1100);
  b.callbacks['leave-room:click']();b.callbacks['confirm-leave:click']();await waitFor(()=>!b.client.network.session);assert.equal(b.client.network.session,null);
  console.log('PASS actual client room creation/join/ready/start, snapshot-to-Canvas frame, shared world, reload resume and leave using live HTTP/SSE with mocked DOM');
 }finally{a.close();b.close();reload?.close();await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

