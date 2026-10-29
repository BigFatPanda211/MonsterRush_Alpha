const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),{Readable}=require('stream'),{createGameServer}=require('./server.cjs');
(async()=>{
 const events={},sent=[],frame={contentWindow:{postMessage(data){sent.push(data)}},addEventListener(type,f){events['frame:'+type]=f}},location={pathname:'/',origin:'https://game.test'};
 const document={fullscreenElement:null,getElementById:()=>frame,documentElement:{async requestFullscreen(){document.fullscreenElement=this;events.fullscreenchange()}},addEventListener(type,f){events[type]=f},async exitFullscreen(){this.fullscreenElement=null;events.fullscreenchange()}};
 const window={addEventListener(type,f){events[type]=f}},history={pushState(data,title,path){location.pathname=path}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/shell.js','utf8'),{document,window,history,location});assert.equal(frame.src,'/client.html');await window.MONSTER_SHELL.toggleFullscreen();assert.ok(document.fullscreenElement);window.MONSTER_SHELL.switchMode('solo');assert.equal(frame.src,'/solo.html');assert.equal(location.pathname,'/solo');assert.ok(document.fullscreenElement);window.MONSTER_SHELL.switchMode('multiplayer');assert.ok(document.fullscreenElement);assert.equal(frame.src,'/client.html');await window.MONSTER_SHELL.toggleFullscreen();assert.equal(document.fullscreenElement,null);console.log('PASS shell keeps fullscreen document alive across both mode switches and preserves browser paths.');
 const previous=process.env.FRONTEND_ORIGINS;process.env.FRONTEND_ORIGINS='https://game.test';const app=createGameServer();
 function request(method,url,origin,data){return new Promise(resolve=>{const req=Readable.from(data?[JSON.stringify(data)]:[]);req.method=method;req.url=url;req.headers={host:'backend.test',...(origin?{origin}:{})};const headers={},response={headersSent:false,setHeader(k,v){headers[k]=v},writeHead(status,values={}){this.status=status;Object.assign(headers,values);this.headersSent=true},end(body=''){resolve({status:this.status,headers,body:String(body)})}};app.server.emit('request',req,response);});}
 try{
  for(const url of ['/','/solo'])assert.ok((await request('GET',url)).body.includes('game-host'));
  for(const url of ['/client.html','/solo.html'])assert.ok((await request('GET',url)).body.includes('getShell()'));
  assert.equal((await request('GET','/shell.js')).status,200);assert.equal((await request('GET','/config.js')).status,200);
  const allowed=await request('OPTIONS','/api/rooms','https://game.test');assert.equal(allowed.status,204);assert.equal(allowed.headers['Access-Control-Allow-Origin'],'https://game.test');assert.equal((await request('OPTIONS','/api/rooms','https://unknown.test')).status,403);
  const room=await request('POST','/api/rooms','https://game.test',{hunter:'warden'});assert.equal(room.status,201);assert.ok(JSON.parse(room.body).token);assert.equal(room.headers['Access-Control-Allow-Origin'],'https://game.test');
  console.log('PASS shell/static routes, configured CORS preflight, disallowed-origin rejection and authorized room creation without network sockets.');
 }finally{await app.close();if(previous===undefined)delete process.env.FRONTEND_ORIGINS;else process.env.FRONTEND_ORIGINS=previous;}
})().catch(e=>{console.error(e);process.exitCode=1});
