const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
for(const file of ['solo.html','client.html']){
 const html=fs.readFileSync(file,'utf8'),code=html.slice(html.indexOf('  function drawBossAttackMotion('),html.indexOf('  function paintedEnemy('));
 const box={BOSS_SPRITES:Array.from({length:4},()=>({complete:true,naturalWidth:1200,naturalHeight:1200})),lastTime:1200,bossMotion:()=>({step:.5,dirX:1,dirY:0,windup:.7,attack:.5,breathe:.2,float:.3}),polygon() {}};
 vm.createContext(box);vm.runInContext(code+';globalThis.renderBoss=drawStageBoss;',box);
 for(const [index,moves] of [[0,['rain','dive']],[1,['shards','laser','well']],[2,['cleave','lunge','spikes']],[3,['ring','beam']]])for(const move of moves)for(const behavior of ['boss-windup','boss-charge','boss-recovery']){
  let images=0;const ctx=new Proxy({drawImage(){images++}},{get:(target,k)=>k in target?target[k]:(()=>{}),set:(target,k,v)=>(target[k]=v,true)});
  box.renderBoss(ctx,index,false,{id:'boss',move,behavior,dashX:1,dashY:0});assert(images>0,`${file} ${move} ${behavior} draws sprite`);
 }
 console.log(`PASS ${file}: every boss attack animation renders`);
}
