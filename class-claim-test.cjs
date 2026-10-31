const assert=require('node:assert/strict');
const {Readable}=require('node:stream');
const {createGameServer}=require('./server.cjs');

(async()=>{
 const app=createGameServer();
 function post(url,data={},token){
  return new Promise(resolve=>{
   const req=Readable.from([JSON.stringify(data)]);req.method='POST';req.url=url;
   req.headers={host:'local.test',...(token?{authorization:'Bearer '+token}:{})};
   const res={headersSent:false,setHeader(){},writeHead(status){this.status=status;this.headersSent=true;},end(body=''){resolve({status:this.status,body:JSON.parse(String(body))});}};
   app.server.emit('request',req,res);
  });
 }
 try{
  const host=(await post('/api/rooms',{hunter:'warden'})).body;
  const route='/api/rooms/'+host.code;
  const guests=await Promise.all(Array.from({length:3},()=>post(route+'/join',{hunter:'warden'})));
  assert(guests.every(r=>r.status===200));
  const players=[host,...guests.map(r=>r.body)];
  const room=app.rooms.get(host.code);
  assert.equal(new Set([...room.members.values()].map(m=>m.hunter)).size,1,'joining does not reserve a class');
  assert.equal((await post(route+'/join',{hunter:'warden'})).status,409,'room remains capped at four');

  const p2=room.members.get(players[1].id),p3=room.members.get(players[2].id);
  const [previewA,previewB]=await Promise.all([
   post(route+'/select',{hunter:'revenant'},players[1].token),
   post(route+'/select',{hunter:'revenant'},players[2].token)
  ]);
  assert.deepEqual([previewA.status,previewB.status],[200,200],'players may preview the same class');
  assert.equal(p2.ready,false);assert.equal(p3.ready,false);
  const [a,b]=await Promise.all([
   post(route+'/ready',{hunter:'revenant',ready:true},players[1].token),
   post(route+'/ready',{hunter:'revenant',ready:true},players[2].token)
  ]);
  assert.deepEqual([a.status,b.status].sort(),[200,409],'simultaneous Ready requests have one winner');
  const winner=a.status===200?p2:p3,loser=a.status===200?p3:p2;
  assert.equal(winner.ready,true);assert.equal(loser.ready,false);
  assert.equal((await post(route+'/select',{hunter:'revenant'},players.find(p=>p.id===loser.id).token)).status,200,'reserved classes remain viewable');
  assert.equal((await post(route+'/ready',{hunter:'revenant',ready:true},players.find(p=>p.id===loser.id).token)).status,409,'Ready enforces the reservation');
  await post(route+'/ready',{ready:false},players.find(p=>p.id===winner.id).token);
  assert.equal((await post(route+'/ready',{hunter:'revenant',ready:true},players.find(p=>p.id===loser.id).token)).status,200,'canceling Ready frees the class');
  await post(route+'/leave',{},players.find(p=>p.id===loser.id).token);
  assert.equal((await post(route+'/ready',{hunter:'revenant',ready:true},players.find(p=>p.id===winner.id).token)).status,200,'leaving frees the class');
  console.log('PASS browse before Ready, atomic unique claims, cancel and leave');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
