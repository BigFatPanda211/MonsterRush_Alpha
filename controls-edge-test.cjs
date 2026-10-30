const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createGameServer}=require('./server.cjs');
const waitFor=fn=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{try{if(fn()){clearInterval(timer);resolve();}else if(Date.now()-start>7000){clearInterval(timer);reject(Error('Client state timeout'));}}catch(e){clearInterval(timer);reject(e)}},10)});
function browser(base,storage=new Map(),file="client.html"){
 const elements={},timers=[],callbacks={},windowCallbacks={},context=new Proxy({createLinearGradient:()=>({addColorStop:()=>{}}),createRadialGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function element(id){return elements[id]??={open:false,showModal(){this.open=true},close(){this.open=false},style:{setProperty:()=>{}},dataset:{},value:'0',textContent:'',addEventListener:(k,fn)=>{callbacks[id+':'+k]=fn},getContext:()=>context,focus:()=>{},setPointerCapture:()=>{},setAttribute:()=>{},width:960,height:600,getBoundingClientRect:()=>({left:0,top:0,width:960,height:600})};}
 const streams=[];
 class EventSource{
  constructor(url){this.controller=new AbortController();streams.push(this);(async()=>{try{const response=await fetch(base+url,{signal:this.controller.signal});if(!response.ok)throw Error('SSE failed');let buffer='';for await(const chunk of response.body){buffer+=Buffer.from(chunk).toString();let i;while((i=buffer.indexOf('\n\n'))>=0){const part=buffer.slice(0,i);buffer=buffer.slice(i+2);if(part.startsWith('data: '))this.onmessage?.({data:part.slice(6)});}}}catch(e){if(!this.controller.signal.aborted)this.onerror?.(e)}})();}
  close(){this.controller.abort();}
 }
 const sandbox={console,document:{body:{classList:{add:()=>{},remove:()=>{},toggle:()=>{}}},getElementById:element,querySelectorAll:()=>[],addEventListener:()=>{}},window:{location:{assign:url=>navigation.push(url)},addEventListener:(k,fn)=>windowCallbacks[k]=fn},requestAnimationFrame:()=>{},setInterval:fn=>timers.push(fn),fetch:(url,opts)=>fetch(base+url,opts),EventSource,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
 let code=fs.readFileSync(__dirname+'/'+file,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];code=code.replace('  // Initial mouse aim points','  globalThis.client={resetCombat,setPlaying(){runState="playing"},get bullets(){return bullets},input,player,frame,drawReticle,mouse,...(typeof network!=="undefined"?{network}:{startGame,getState:()=>runState})};\n  // Initial mouse aim points');vm.createContext(sandbox);sandbox.MONSTER_CLASSES=require('./classes.js');vm.runInContext(code,sandbox);
 return {document:sandbox.document,client:sandbox.client,element,elements,storage,callbacks,windowCallbacks,close:()=>streams.forEach(s=>s.close())};
}


const navigation=[];
(async()=>{for(const file of ['solo.html','client.html']){
const b=browser('',new Map(),file);b.client.player.hunter='riftwalker';b.client.resetCombat();b.client.setPlaying();b.element('game').getBoundingClientRect=()=>({left:240,top:100,width:480,height:300});
const empty={closest:()=>null},ev={target:empty,clientX:100,clientY:250,button:0,pointerId:1,preventDefault(){}};
b.windowCallbacks.pointermove(ev);assert.equal(b.client.mouse.x,-280);assert.equal(b.client.mouse.y,300);b.windowCallbacks.pointerdown(ev);assert.equal(b.client.input.fire,true);assert(b.client.bullets.some(v=>v.vx<0),'leftward shot outside scaled canvas');b.windowCallbacks.pointerup({button:0});assert.equal(b.client.input.fire,false);
const count=b.client.bullets.length;b.windowCallbacks.pointerdown({...ev,target:{closest:()=>({})}});assert.equal(b.client.input.fire,false);assert.equal(b.client.bullets.length,count,'UI buttons must not fire');
let enters=0,exits=0;b.element('play-arena').requestFullscreen=async()=>{enters++;b.document.fullscreenElement={}};b.document.exitFullscreen=async()=>{exits++;b.document.fullscreenElement=null};
b.windowCallbacks.keydown({key:'F',repeat:false,preventDefault(){}});assert.equal(enters,1);b.windowCallbacks.keydown({key:'f',repeat:true,preventDefault(){}});assert.equal(exits,0);b.windowCallbacks.keydown({key:'f',repeat:false,preventDefault(){}});assert.equal(exits,1);b.windowCallbacks.keydown({key:'f',target:{tagName:'INPUT'},repeat:false,preventDefault(){}});assert.equal(enters,1,'typing in room-code input does not toggle fullscreen');
b.document.querySelector=()=>({open:true});b.windowCallbacks.pointerdown(ev);assert.equal(b.client.input.fire,false,'open modal prevents firing');console.log('PASS '+file+': windowed left-margin aim/fire, UI/modal exclusion, F enter/exit, repeat suppression and text entry.');
}})().catch(e=>{console.error(e);process.exitCode=1});
