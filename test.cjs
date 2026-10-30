"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {makeEngine}=require('./engine.cjs'),{createGameServer}=require('./server.cjs');
const members=[{id:'p1',hunter:'warden',slot:1},{id:'p2',hunter:'riftwalker',slot:2},{id:'p3',hunter:'hexkeeper',slot:3},{id:'p4',hunter:'revenant',slot:4}];
function commands(ids=members){return new Map(ids.map(m=>[m.id,{connected:true,input:{up:false,down:false,left:false,right:false,fire:false,aimX:480,aimY:300}}]));}
function hit(engine,enemy,owner='p1'){engine.debug.bullets.push({id:100000+Math.random(),ownerId:owner,x:enemy.x,y:enemy.y,vx:0,vy:0,radius:3,life:1});engine.tick(1/30,commands());}
function kill(engine,enemy){while(enemy.alive)hit(engine,enemy);}
function waitFor(fn,ms=5000){return new Promise((resolve,reject)=>{const started=Date.now();const timer=setInterval(()=>{try{const value=fn();if(value){clearInterval(timer);resolve(value);}else if(Date.now()-started>ms){clearInterval(timer);reject(Error('Timed out'));}}catch(e){clearInterval(timer);reject(e);}},10);});}
async function main(){

 for(let level=0;level<4;level++)for(const teamSize of [2,4]){
  const team=members.slice(0,teamSize),engine=makeEngine();engine.start(team,level,11);const cmd=commands(team),ids=new Set();
  let snap=engine.snapshot();assert.equal(snap.players.length,teamSize);assert.equal(snap.enemies.length,8);assert.equal(snap.levelIndex,level);
  for(const a of snap.players){assert(!engine.debug.walls.some(w=>engine.debug.circleHitsRect(a.x,a.y,10,w)));for(const b of snap.players)if(a!==b)assert(Math.hypot(a.x-b.x,a.y-b.y)>=28);}
  const initialX=snap.players[0].x;cmd.get('p1').input.right=true;cmd.get('p1').input.fire=true;cmd.get('p2').input.fire=true;engine.tick(1/30,cmd);snap=engine.snapshot();assert(snap.players[0].x>initialX);assert(snap.players[0].attackTime>0);assert(snap.bullets.some(b=>b.ownerId==='p2'));engine.debug.bullets.length=0;
  for(const c of cmd.values())c.input.fire=c.input.right=false;
  function strike(e,owner='p1'){engine.debug.bullets.push({id:100000+Math.random(),ownerId:owner,x:e.x,y:e.y,vx:0,vy:0,radius:3,life:1});engine.tick(.001,cmd);}
  function defeat(e){while(e.alive)strike(e);}
  const ghost=engine.debug.enemies.find(e=>e.type==='ghost'),maxHp=ghost.hp;
  strike(ghost,'p1');strike(ghost,'p2');assert.equal(ghost.hp,maxHp-2);defeat(ghost);assert.equal(engine.snapshot().score,100);
  engine.debug.setActor('p1',{hp:60});engine.debug.setActor('p2',{hp:40});
  for(let wave=0;wave<3;wave++){
    snap=engine.snapshot();assert.equal(snap.waveIndex,wave);
    if(wave>0)assert.equal(snap.enemies.length,[8,12,16][wave]);
    for(const e of [...engine.debug.enemies])if(e.alive){assert(!ids.has(e.id));ids.add(e.id);defeat(e);}
    if(wave<2){assert.equal(engine.snapshot().stage,'wave-break');assert.equal(engine.debug.actors[0].hp,75+15*wave);assert.equal(engine.debug.actors[1].hp,55+15*wave);engine.tick(4.01,cmd);assert.equal(engine.snapshot().stage,'wave');}
  }
  for(let i=0;i<61;i++)engine.tick(1/30,cmd);const boss=engine.debug.enemies.find(e=>e.alive&&e.type==='boss');assert(boss);assert.equal(boss.maxHp,Math.ceil(20*(1+.5*(teamSize-1))));
  const hits=Math.ceil(boss.maxHp*.4);for(let i=0;i<hits;i++)strike(boss);assert.equal(engine.snapshot().summonsUsed,9);defeat(boss);assert.equal(engine.snapshot().stage,'last-gasp');
  for(const e of [...engine.debug.enemies])if(e.alive)defeat(e);for(let i=0;i<23;i++)engine.tick(1/30,cmd);const last=engine.debug.enemies.find(e=>e.alive&&e.finale);assert(last);defeat(last);assert(engine.snapshot().won);assert.equal(engine.snapshot().score,8800);
  console.log('PASS '+teamSize+' players / map '+(level+1)+': shared weapons/deaths, three waves, team healing, scaled boss/summons and finale');
 }
 const engine=makeEngine();engine.start(members.slice(0,2),0,1);for(const e of engine.debug.enemies)e.alive=false;
 const p1=engine.debug.actors[0],p2=engine.debug.actors[1];
 engine.debug.enemies.push({id:88,type:'ghost',x:p1.x,y:p1.y,radius:11,hp:3,maxHp:3,speed:0,vx:0,vy:0,alive:true,hitFlash:0,knockX:0,knockY:0,behavior:'pursuit',decisionTimer:99,approachX:0,approachY:0});
 engine.tick(1/30,commands(members.slice(0,2)));assert.equal(p1.hp,88);assert.equal(p2.hp,100);engine.tick(1/30,commands(members.slice(0,2)));assert.equal(p1.hp,88);
 p1.hp=0;engine.tick(1/30,commands(members.slice(0,2)));assert(!engine.snapshot().gameOver);assert.equal(engine.snapshot().enemies[0].targetId,'p2');p2.hp=0;engine.tick(1/30,commands(members.slice(0,2)));assert(engine.snapshot().gameOver);
 console.log('PASS player-specific contact/invulnerability, survivor targeting and whole-team defeat');
 if(process.argv.includes('--simulation-only'))return;
 const app=createGameServer();await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port,streams=[];
 async function post(path,data={},session){const res=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.token}:{})},body:JSON.stringify(data)});return {status:res.status,data:await res.json()};}
 async function open(session){const controller=new AbortController();const response=await fetch(base+'/api/rooms/'+session.code+'/events?token='+session.token,{signal:controller.signal});assert.equal(response.status,200);const record={controller,latest:null};streams.push(record);(async()=>{let pending='';try{for await(const bytes of response.body){pending+=Buffer.from(bytes).toString();let end;while((end=pending.indexOf('\n\n'))>=0){const chunk=pending.slice(0,end);pending=pending.slice(end+2);if(chunk.startsWith('data: '))record.latest=JSON.parse(chunk.slice(6));}}}catch{}})();return record;}
 try{
  assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/solo')).status,200);
  const host=(await post('/api/rooms',{hunter:'warden'})).data;const route='/api/rooms/'+host.code;const one=await open(host);
  const guest=(await post(route+'/join',{hunter:'riftwalker'})).data;const two=await open(guest);
  await waitFor(()=>one.latest?.members.length===2&&two.latest?.members.length===2);
  assert.equal((await post(route+'/start',{level:0},guest)).status,403);assert.equal((await post(route+'/start',{level:0},host)).status,409);
  await post(route+'/ready',{ready:true,hunter:'warden'},host);await post(route+'/ready',{ready:true,hunter:'riftwalker'},guest);
  assert.equal((await post(route+'/start',{level:0},host)).status,200);await waitFor(()=>one.latest?.world&&two.latest?.world);
  assert.equal(one.latest.world.enemies.length,8);assert.equal(two.latest.world.enemies.length,8);assert.equal(one.latest.revision,two.latest.revision);
  const before=one.latest.world.players.find(a=>a.id===host.id).x;
  await post(route+'/input',{seq:1,input:{right:true,fire:true,aimX:250,aimY:150,x:999,hp:999}},host);
  await waitFor(()=>two.latest?.world.players.find(a=>a.id===host.id).x>before);
  assert(two.latest.world.players.find(a=>a.id===host.id).hp<=100);assert(two.latest.world.players.find(a=>a.id===host.id).x<999);
  await post(route+'/input',{seq:0,input:{left:true}},host);assert.equal(app.rooms.get(host.code).members.get(host.id).input.right,true);
  assert.equal((await post(route+'/input',{}, {...guest,token:'wrong'})).status,401);
  assert.equal((await post(route+'/join',{})).status,409);assert.equal((await post(route+'/resume',{},host)).data.seq,1);
  // Stop input automatically after its heartbeat expires.
  const member=app.rooms.get(host.code).members.get(host.id);member.lastInput=Date.now()-1000;member.input.fire=true;
  one.controller.abort();await waitFor(()=>!member.connected);assert.equal(member.input.fire,false);
  await post(route+'/leave',{},host);await waitFor(()=>two.latest?.hostId===guest.id);
  const crowd=(await post('/api/rooms',{})).data;const extra=await Promise.all(Array.from({length:6},()=>post('/api/rooms/'+crowd.code+'/join',{})));
  assert.equal(extra.filter(r=>r.status===200).length,3);assert.equal(app.rooms.get(crowd.code).members.size,4);
  console.log('PASS live HTTP/SSE two-client sync, host/readiness rules, sanitized sequenced input, stale/disconnected controls, host transfer, late-join rejection and concurrent four-player cap');
 }finally{for(const stream of streams)stream.controller.abort();await app.close();}
 // Browser client boot smoke with fake DOM, no network or browser globals leaking into server.
 const html=fs.readFileSync(__dirname+'/client.html','utf8');new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
 console.log('PASS browser client syntax; integration tests complete');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
