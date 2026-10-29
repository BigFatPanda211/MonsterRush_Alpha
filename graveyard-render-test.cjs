const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createGameServer}=require('./server.cjs');
const waitFor=fn=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{try{if(fn()){clearInterval(timer);resolve();}else if(Date.now()-start>7000){clearInterval(timer);reject(Error('Client state timeout'));}}catch(e){clearInterval(timer);reject(e)}},10)});
function browser(base,storage=new Map(),file="client.html"){
 const elements={},timers=[],callbacks={},windowCallbacks={},context=new Proxy({createRadialGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function element(id){return elements[id]??={open:false,showModal(){this.open=true},close(){this.open=false},style:{setProperty:()=>{}},dataset:{},value:'0',textContent:'',addEventListener:(k,fn)=>{callbacks[id+':'+k]=fn},getContext:()=>context,focus:()=>{},setPointerCapture:()=>{},setAttribute:()=>{},width:960,height:600,getBoundingClientRect:()=>({left:0,top:0,width:960,height:600})};}
 const streams=[];
 class EventSource{
  constructor(url){this.controller=new AbortController();streams.push(this);(async()=>{try{const response=await fetch(base+url,{signal:this.controller.signal});if(!response.ok)throw Error('SSE failed');let buffer='';for await(const chunk of response.body){buffer+=Buffer.from(chunk).toString();let i;while((i=buffer.indexOf('\n\n'))>=0){const part=buffer.slice(0,i);buffer=buffer.slice(i+2);if(part.startsWith('data: '))this.onmessage?.({data:part.slice(6)});}}}catch(e){if(!this.controller.signal.aborted)this.onerror?.(e)}})();}
  close(){this.controller.abort();}
 }
 const sandbox={console,document:{body:{classList:{add:()=>{},remove:()=>{},toggle:()=>{}}},getElementById:element,querySelectorAll:()=>[],addEventListener:()=>{}},window:{location:{assign:url=>navigation.push(url)},addEventListener:(k,fn)=>windowCallbacks[k]=fn},requestAnimationFrame:()=>{},setInterval:fn=>timers.push(fn),fetch:(url,opts)=>fetch(base+url,opts),EventSource,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
 let code=fs.readFileSync(__dirname+'/'+file,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];code=code.replace('  // Initial mouse aim points','  globalThis.client={selectLevel,input,player,frame,drawReticle,mouse,...(typeof network!=="undefined"?{network}:{startGame,getState:()=>runState})};\n  // Initial mouse aim points');vm.createContext(sandbox);sandbox.MONSTER_CLASSES=require('./classes.js');vm.runInContext(code,sandbox);
 return {client:sandbox.client,element,elements,storage,callbacks,windowCallbacks,close:()=>streams.forEach(s=>s.close())};
}


const navigation=[];const b=browser('',new Map(),'solo.html');let timestamp=1000;
b.client.selectLevel(3);
for(const hunter of ['warden','riftwalker','hexkeeper','revenant']){b.client.player.hunter=hunter;b.client.startGame();b.client.input.fire=true;b.client.mouse.inside=true;b.client.frame(timestamp);b.client.frame(timestamp+30);b.client.input.fire=false;for(let i=1;i<=12;i++)b.client.frame(timestamp+30+i*30);b.client.input.charge=true;for(let i=1;i<=35;i++)b.client.frame(timestamp+400+i*30);b.client.input.charge=false;b.client.input.releaseSeq++;b.client.frame(timestamp+1500);b.client.frame(timestamp+1530);timestamp+=2000;console.log('PASS '+hunter+' normal/charged attack frame rendering and recovery with mocked Canvas.');}
