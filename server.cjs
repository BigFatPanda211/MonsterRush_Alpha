"use strict";
const http=require('node:http'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const {makeEngine}=require('./engine.cjs');
const HUNTERS=['warden','riftwalker','hexkeeper','revenant'];
const emptyInput=()=>({up:false,down:false,left:false,right:false,fire:false,charge:false,releaseSeq:0,abilitySeq:0,aimX:480,aimY:300});
function createGameServer({maxRooms=12}={}){
 const rooms=new Map();let timer;
 function json(res,code,data){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
 function requireMember(req,room){const token=(req.headers.authorization||'').replace(/^Bearer /,'');return [...room.members.values()].find(m=>m.token===token);}
 function sanitizeInput(value={}){const clean=emptyInput();for(const k of ['up','down','left','right','fire','charge'])clean[k]=value[k]===true;for(const k of ['aimX','aimY'])clean[k]=typeof value[k]==='number'&&Number.isFinite(value[k])?Math.max(-2000,Math.min(3000,value[k])):clean[k];clean.releaseSeq=Number.isSafeInteger(value.releaseSeq)&&value.releaseSeq>=0?value.releaseSeq:0;clean.abilitySeq=Number.isSafeInteger(value.abilitySeq)&&value.abilitySeq>=0?value.abilitySeq:0;return clean;}
 function publicState(room){return {code:room.code,hostId:room.hostId,state:room.state,revision:room.revision,
   members:[...room.members.values()].map(({id,hunter,slot,ready,connected})=>({id,hunter,slot,ready,connected})),world:room.state==='playing'?room.engine.snapshot():null};}
 function broadcast(room){const data='data: '+JSON.stringify(publicState(room))+'\n\n';for(const m of room.members.values())if(m.stream&&!m.stream.writableNeedDrain)m.stream.write(data);}
 async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)throw Error('Request too large');}return raw?JSON.parse(raw):{};}
 function member(room,hunter){const slot=[1,2,3,4].find(slot=>![...room.members.values()].some(m=>m.slot===slot));const id=crypto.randomUUID();const m={id,slot,hunter,token:crypto.randomBytes(24).toString('hex'),ready:false,connected:false,input:emptyInput(),seq:-1,lastInput:0,joined:Date.now(),lastSeen:Date.now(),stream:null};room.members.set(id,m);return m;}
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   // Cross-origin frontends require an explicit origin allowlist.
   const origin=req.headers.origin,allowed=(process.env.FRONTEND_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
   if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`&&!allowed.includes(origin))return json(res,403,{error:'This frontend is not allowed.'});
   if(origin&&allowed.includes(origin)){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Max-Age','600');}
   if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
   if(req.method==='GET'&&['/shell.js','/config.js'].includes(url.pathname)){res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,url.pathname.slice(1))));}
   if(req.method==='GET'&&['/','/solo'].includes(url.pathname)){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,'index.html')));}
   if(req.method==='GET'&&url.pathname==='/classes.js'){res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'no-store'});return res.end(fs.readFileSync(path.join(__dirname,'classes.js')));}
   if(req.method==='GET'&&url.pathname==='/health')return json(res,200,{ok:true});
   if(req.method==='GET'&&(url.pathname==='/client.html'||url.pathname==='/solo.html')){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(fs.readFileSync(path.join(__dirname,url.pathname==='/solo.html'?'solo.html':'client.html')));
   }
   if(req.method==='POST'&&url.pathname==='/api/rooms'){
    if(rooms.size>=maxRooms)return json(res,503,{error:'Server is full. Try again later.'});
    const data=await body(req);if(rooms.size>=maxRooms)return json(res,503,{error:'Server is full.'});const hunter=HUNTERS.includes(data.hunter)?data.hunter:'warden';
    let code;do{code=crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));
    const room={code,members:new Map(),state:'lobby',revision:0,engine:null,hostId:null,lastActive:Date.now()};const m=member(room,hunter);room.hostId=m.id;rooms.set(code,room);return json(res,201,{code,id:m.id,token:m.token});
   }
   const match=url.pathname.match(/^\/api\/rooms\/([A-F0-9]{6})\/(join|events|input|ready|start|leave|resume)$/);
   if(!match)return json(res,404,{error:'Not found'});
   const room=rooms.get(match[1]);if(!room)return json(res,404,{error:'Room not found. Create or join another room.'});room.lastActive=Date.now();
   const action=match[2];
   if(action==='join'&&req.method==='POST'){
    if(room.state!=='lobby')return json(res,409,{error:'This room is already playing.'});
    if(room.members.size>=4)return json(res,409,{error:'Room is full (four players).'});
    const data=await body(req);if(room.state!=='lobby'||room.members.size>=4)return json(res,409,{error:'Room is full or already playing.'});const hunter=HUNTERS.includes(data.hunter)?data.hunter:'riftwalker';const m=member(room,hunter);broadcast(room);return json(res,200,{code:room.code,id:m.id,token:m.token});
   }
   if(action==='events'&&req.method==='GET'){
    const m=[...room.members.values()].find(m=>m.token===url.searchParams.get('token'));if(!m)return json(res,401,{error:'Room session expired.'});
    if(m.stream)m.stream.end();m.stream=res;m.connected=true;m.lastSeen=Date.now();m.input=emptyInput();
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(': connected\n\n');broadcast(room);
    req.on('close',()=>{if(m.stream===res){m.stream=null;m.connected=false;m.ready=false;m.input=emptyInput();m.lastSeen=Date.now();broadcast(room);}});return;
   }
   const m=requireMember(req,room);if(!m)return json(res,401,{error:'Room session expired.'});
   if(req.method!=='POST')return json(res,405,{error:'POST required.'});
   const data=await body(req);m.lastSeen=Date.now();
   if(action==='resume')return json(res,200,{seq:m.seq});
   if(action==='input'){
    if(Number.isSafeInteger(data.seq)&&data.seq>m.seq){m.seq=data.seq;m.input=sanitizeInput(data.input);m.lastInput=Date.now();}return json(res,200,{ok:true});
   }
   if(action==='ready'){
    if(room.state==='playing'&&!room.engine.snapshot().won&&!room.engine.snapshot().gameOver)return json(res,409,{error:'Finish the current run first.'});
    if(HUNTERS.includes(data.hunter))m.hunter=data.hunter;m.ready=data.ready===true;broadcast(room);return json(res,200,{ok:true});
   }
   if(action==='start'){
    if(room.hostId!==m.id)return json(res,403,{error:'Only the host can start.'});
    if(room.state==='playing'&&!room.engine.snapshot().won&&!room.engine.snapshot().gameOver)return json(res,409,{error:'Run is still active.'});
    const live=[...room.members.values()].filter(m=>m.connected);
    if(live.length<2||live.some(m=>!m.ready))return json(res,409,{error:'At least two connected players must be ready.'});
    if(!Number.isInteger(data.level)||data.level<0||data.level>2)return json(res,400,{error:'Choose a valid level.'});
    room.engine=makeEngine();room.engine.start(live,data.level,crypto.randomBytes(4).readUInt32LE());room.state='playing';room.revision++;for(const m of room.members.values()){m.input=emptyInput();m.ready=false;}broadcast(room);return json(res,200,{ok:true});
   }
   if(action==='leave'){if(m.stream)m.stream.end();room.members.delete(m.id);if(room.hostId===m.id)room.hostId=room.members.keys().next().value;if(!room.members.size)rooms.delete(room.code);else broadcast(room);return json(res,200,{ok:true});}
   return json(res,404,{error:'Not found'});
  }catch(error){if(!res.headersSent)json(res,400,{error:error.message==='Request too large'?error.message:'Could not process request.'});else res.end();}
 });
 timer=setInterval(()=>{
  const now=Date.now();
  for(const room of rooms.values()){
   for(const m of room.members.values())if(!m.connected&&now-m.lastSeen>10000){room.members.delete(m.id);if(room.hostId===m.id)room.hostId=room.members.keys().next().value;}
   if(!room.members.size){rooms.delete(room.code);continue;}
   if(room.state==='playing'){
    const commands=new Map([...room.members.values()].map(m=>[m.id,{connected:m.connected,input:now-m.lastInput<350?m.input:emptyInput()}]));
    try{room.engine.tick(1/30,commands);}catch(e){room.state='error';process.stderr.write('Room simulation stopped: '+e.message+'\n');}
   }
   broadcast(room);
  }
 },1000/30);
 server.on('close',()=>clearInterval(timer));
 return {server,rooms,close:()=>{clearInterval(timer);for(const r of rooms.values())for(const m of r.members.values())m.stream?.end();return new Promise(resolve=>server.close(resolve));}};
}
if(require.main===module){const app=createGameServer();const port=Number(process.env.PORT)||8080;const host=process.env.HOST||(process.env.RENDER?'0.0.0.0':'127.0.0.1');app.server.listen(port,host,()=>console.log(`Monster Rush multiplayer: http://${host}:${port}\nKeep this window open. For LAN set HOST=0.0.0.0 before starting.`));}
module.exports={createGameServer};
