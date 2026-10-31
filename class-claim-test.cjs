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
  assert.equal(new Set([...room.members.values()].map(m=>m.hunter)).size,4,'same requested class gets unique fallback');
  assert.equal((await post(route+'/join',{hunter:'warden'})).status,409,'room remains capped at four');

  const p2=room.members.get(players[1].id),p3=room.members.get(players[2].id);
  const claim=await post(route+'/select',{hunter:'warden'},players[1].token);
  assert.equal(claim.status,409,'reserved class cannot be claimed');
  assert.match(claim.body.error,/taken by P1/);
  assert.equal(p2.hunter,'riftwalker','failed claim does not change class');
  await post(route+'/ready',{ready:true},players[1].token);
  assert.equal((await post(route+'/select',{hunter:'revenant'},players[1].token)).status,409);
  assert.equal(p2.ready,true,'failed claim preserves ready state');

  await post(route+'/leave',{},players[3].token);
  const [a,b]=await Promise.all([
   post(route+'/select',{hunter:'revenant'},players[1].token),
   post(route+'/select',{hunter:'revenant'},players[2].token)
  ]);
  assert.deepEqual([a.status,b.status].sort(),[200,409],'simultaneous claims have one winner');
  const winner=a.status===200?p2:p3,loser=a.status===200?p3:p2;
  assert.equal(winner.hunter,'revenant');
  assert.equal(winner.ready,false,'class change cancels Ready');
  assert.notEqual(loser.hunter,'revenant');

  const duplicateReady=await post(route+'/ready',{hunter:winner.hunter,ready:true},players.find(p=>p.id===loser.id).token);
  assert.equal(duplicateReady.status,409,'Ready cannot override another reservation');
  winner.connected=false;
  const reserved=await post(route+'/select',{hunter:'revenant'},players.find(p=>p.id===loser.id).token);
  assert.equal(reserved.status,409,'temporary disconnect keeps reservation for reconnect');
  await post(route+'/leave',{},players.find(p=>p.id===winner.id).token);
  assert.equal((await post(route+'/select',{hunter:'revenant'},players.find(p=>p.id===loser.id).token)).status,200,'leaving frees reservation');
  console.log('PASS unique classes, claims, races, ready, disconnect and leave');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
