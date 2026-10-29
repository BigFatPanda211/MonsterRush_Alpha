const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createGameServer}=require('./server.cjs');
const waitFor=fn=>new Promise((resolve,reject)=>{const start=Date.now(),timer=setInterval(()=>{try{if(fn()){clearInterval(timer);resolve();}else if(Date.now()-start>7000){clearInterval(timer);reject(Error('Client state timeout'));}}catch(e){clearInterval(timer);reject(e)}},10)});
function browser(base,storage=new Map()){
 const elements={},timers=[],callbacks={},windowCallbacks={},context=new Proxy({createRadialGradient:()=>({addColorStop:()=>{}})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 function element(id){return elements[id]??={open:false,showModal(){this.open=true},close(){this.open=false},style:{setProperty:()=>{}},dataset:{},value:'0',textContent:'',addEventListener:(k,fn)=>{callbacks[id+':'+k]=fn},getContext:()=>context,focus:()=>{},setPointerCapture:()=>{},setAttribute:()=>{},width:960,height:600,getBoundingClientRect:()=>({left:0,top:0,width:960,height:600})};}
 const streams=[];
 class EventSource{
  constructor(url){this.controller=new AbortController();streams.push(this);(async()=>{try{const response=await fetch(base+url,{signal:this.controller.signal});if(!response.ok)throw Error('SSE failed');let buffer='';for await(const chunk of response.body){buffer+=Buffer.from(chunk).toString();let i;while((i=buffer.indexOf('\n\n'))>=0){const part=buffer.slice(0,i);buffer=buffer.slice(i+2);if(part.startsWith('data: '))this.onmessage?.({data:part.slice(6)});}}}catch(e){if(!this.controller.signal.aborted)this.onerror?.(e)}})();}
  close(){this.controller.abort();}
 }
 const sandbox={console,document:{body:{classList:{add:()=>{},remove:()=>{},toggle:()=>{}}},getElementById:element,querySelectorAll:()=>[],addEventListener:()=>{}},window:{addEventListener:(k,fn)=>windowCallbacks[k]=fn},requestAnimationFrame:()=>{},setInterval:fn=>timers.push(fn),fetch:(url,opts)=>fetch(base+url,opts),EventSource,sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
 let code=fs.readFileSync(__dirname+'/client.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];code=code.replace('  // Initial mouse aim points','  globalThis.client={network,input,player,frame,chooseHunter};\n  // Initial mouse aim points');vm.createContext(sandbox);vm.runInContext(code,sandbox);
 return {client:sandbox.client,element,elements,storage,callbacks,windowCallbacks,close:()=>streams.forEach(s=>s.close())};
}

const {makeEngine}=require('./engine.cjs');
(async()=>{
 const members=[{id:'a',slot:1,hunter:'warden'},{id:'b',slot:2,hunter:'warden'}],engine=makeEngine();engine.start(members,0,12);
 const cmd=new Map(members.map(m=>[m.id,{connected:true,input:{up:false,down:false,left:false,right:false,fire:false,charge:false,releaseSeq:0,aimX:480,aimY:300}}]));
 const before=engine.snapshot(),ghost=before.enemies.find(e=>e.type==='ghost'),wraith=before.enemies.find(e=>e.type==='wraith');assert.ok(wraith.speed>ghost.speed*1.35);assert.equal(before.players[0].speed,235);
 for(const e of engine.debug.enemies){e.speed=0;e.x=850;e.y=500;e.abilityCooldown=99;}
 const actor=engine.debug.actors[0],direction=[[1,0],[-1,0],[0,1],[0,-1]].find(([x,y])=>engine.debug.clearSight(actor.x,actor.y,actor.x+x*80,actor.y+y*80,6));assert.ok(direction);
 const input=cmd.get('a').input;input.aimX=actor.x+direction[0]*80;input.aimY=actor.y+direction[1]*80;input.charge=true;
 for(let i=0;i<34;i++)engine.tick(1/30,cmd);assert.ok(engine.snapshot().players[0].chargeTime>=1);assert.equal(engine.snapshot().players[1].chargeTime,0);
 input.charge=false;input.releaseSeq=1;engine.tick(.001,cmd);let shots=engine.snapshot().bullets.filter(b=>b.charged);assert.equal(shots.length,1);assert.equal(shots[0].damage,4);assert.equal(shots[0].ownerId,'a');assert.ok(engine.snapshot().players[0].chargeCooldown>1);
 engine.tick(.001,cmd);assert.equal(engine.snapshot().bullets.filter(b=>b.charged).length,1);input.charge=true;for(let i=0;i<10;i++)engine.tick(1/30,cmd);input.charge=false;input.releaseSeq=2;engine.tick(.001,cmd);assert.equal(engine.snapshot().bullets.filter(b=>b.charged).length,1);
 console.log('PASS distinct enemy pace, faster player speed, authoritative full-charge damage, ownership, independent teammate charge, cooldown and duplicate release guard.');
 const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port,a=browser(base),b=browser(base);
 try{await a.client.network.connect(true);await waitFor(()=>a.client.network.roster.length===1);b.element('room-code').value=a.client.network.session.code;await b.client.network.connect(false);await waitFor(()=>b.client.network.roster.length===2);await a.client.network.ready(true);await b.client.network.ready(true);await a.client.network.start();await waitFor(()=>a.client.network.world);
 const initial={x:a.client.player.x,y:a.client.player.y};a.client.input.right=true;a.client.network.animate(1/60);assert.ok(a.client.player.x>initial.x);assert.equal(a.client.network.world.players.find(p=>p.id===a.client.network.session.id).x,initial.x);a.client.input.right=false;
 a.client.input.charge=true;a.callbacks['return-menu:click']();assert.equal(a.client.input.charge,false);a.callbacks['stay-in-hunt:click']();await a.client.network.ping();assert.ok(a.element('ping-label').textContent.includes('ms RTT'));
 a.client.network.lastSnapshot=Date.now()-2000;a.client.input.right=true;a.client.network.animate(1/60);assert.equal(a.client.input.right,false);
 console.log('PASS immediate client movement before server update, measured RTT, modal charge cancellation and stale-connection input stop with real local HTTP/SSE and mocked rendering.');
 }finally{await a.client.network.leave();await b.client.network.leave();a.close();b.close();await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
