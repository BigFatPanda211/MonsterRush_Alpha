const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createGameServer}=require('./server.cjs');
const waitFor=fn=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{try{if(fn()){clearInterval(timer);resolve();}else if(Date.now()-start>7000){clearInterval(timer);reject(Error('Client state timeout'));}}catch(e){clearInterval(timer);reject(e)}},10)});
function browser(base,storage=new Map()){
 const elements={},timers=[],callbacks={},windowCallbacks={},context=new Proxy({createLinearGradient:()=>({addColorStop:()=>{}}),createRadialGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function element(id){return elements[id]??={open:false,showModal(){this.open=true},close(){this.open=false},style:{setProperty:()=>{}},dataset:{},value:'0',textContent:'',addEventListener:(k,fn)=>{callbacks[id+':'+k]=fn},getContext:()=>context,focus:()=>{},setPointerCapture:()=>{},setAttribute:()=>{},width:960,height:600,getBoundingClientRect:()=>({left:0,top:0,width:960,height:600})};}
 const streams=[];
 class EventSource{
  constructor(url){this.controller=new AbortController();streams.push(this);(async()=>{try{const response=await fetch(base+url,{signal:this.controller.signal});if(!response.ok)throw Error('SSE failed');let buffer='';for await(const chunk of response.body){buffer+=Buffer.from(chunk).toString();let i;while((i=buffer.indexOf('\n\n'))>=0){const part=buffer.slice(0,i);buffer=buffer.slice(i+2);if(part.startsWith('data: '))this.onmessage?.({data:part.slice(6)});}}}catch(e){if(!this.controller.signal.aborted)this.onerror?.(e)}})();}
  close(){this.controller.abort();}
 }
 const sandbox={console,document:{body:{classList:{add:()=>{},remove:()=>{},toggle:()=>{}}},getElementById:element,querySelectorAll:()=>[],addEventListener:()=>{}},window:{addEventListener:(k,fn)=>windowCallbacks[k]=fn},requestAnimationFrame:()=>{},setInterval:fn=>timers.push(fn),fetch:(url,opts)=>fetch(base+url,opts),EventSource,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
 let code=fs.readFileSync(__dirname+'/solo.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];code=code.replace('  // Initial mouse aim points','  globalThis.client={input,player,frame,startGame,get state(){return runState}};\n  // Initial mouse aim points');vm.createContext(sandbox);sandbox.MONSTER_CLASSES=require('./classes.js');vm.runInContext(code,sandbox);
 return {client:sandbox.client,element,elements,storage,callbacks,windowCallbacks,close:()=>streams.forEach(s=>s.close())};
}

const a=browser('');const esc={key:'Escape',repeat:false,preventDefault(){}};
a.client.startGame();const before={x:a.client.player.x,y:a.client.player.y,hp:a.client.player.hp};
a.client.input.up=true;a.client.input.fire=true;a.windowCallbacks.keydown(esc);assert.equal(a.client.state,'paused');assert.equal(a.element('solo-menu-dialog').open,true);assert.equal(a.client.input.fire,false);
a.windowCallbacks.keydown({...esc,repeat:true});assert.equal(a.client.state,'paused');a.windowCallbacks.keydown({key:'w',preventDefault(){}});assert.equal(a.client.input.up,false);
for(let t=1000;t<5000;t+=100)a.client.frame(t);assert.deepEqual({x:a.client.player.x,y:a.client.player.y,hp:a.client.player.hp},before);
a.windowCallbacks.keydown(esc);assert.equal(a.client.state,'playing');assert.equal(a.element('solo-menu-dialog').open,false);
a.callbacks['return-menu:click']();a.callbacks['solo-resume:click']();assert.equal(a.client.state,'playing');a.callbacks['return-menu:click']();a.callbacks['solo-confirm-menu:click']();assert.equal(a.client.state,'menu');assert.equal(a.element('solo-menu-dialog').open,false);
console.log('PASS solo Escape pauses, clears controls, ignores held Escape/movement, freezes player/health, resumes same run, confirms return to selection. Mocked DOM/Canvas.');
