const assert=require('assert/strict'),{makeEngine}=require('./engine.cjs');
const near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function setup(ownerId){
 const e=makeEngine();e.start([{id:'a',slot:1,hunter:ownerId==='a'?'revenant':'warden'},{id:'b',slot:2,hunter:ownerId==='b'?'revenant':'warden'}],0,7);e.debug.enemies.length=0;
 let p;for(let y=65;y<535&&!p;y+=20)for(let x=65;x<760;x+=20)if(e.debug.clearSight(x-25,y,x+150,y,12)&&!e.debug.walls.some(w=>e.debug.circleHitsRect(x,y,12,w))){p={x,y};break;}assert(p);
 e.debug.setActor('a',{...p});e.debug.setActor('b',{x:p.x-20,y:p.y});
 const commands=new Map(['a','b'].map(id=>[id,{connected:true,input:{fire:false,charge:false,releaseSeq:0,abilitySeq:id===ownerId?1:0,aimX:p.x+100,aimY:p.y}}]));
 const tick=(dt=.001)=>e.tick(dt,commands);tick();
 const owner=()=>e.snapshot().players.find(a=>a.id===ownerId);
 function hit(damage,hp=100){
  e.debug.enemies.length=0;const x=p.x+90,y=p.y;
  e.debug.enemies.push({id:100,type:'ghost',x,y,radius:11,hp,maxHp:hp,speed:0,vx:0,vy:0,alive:true,hitFlash:0,knockX:0,knockY:0,behavior:'pursuit',abilityCooldown:99,decisionTimer:99,approachX:0,approachY:0});
  e.debug.bullets.push({x,y,vx:0,vy:0,life:1,radius:3,damage,ownerId,knockback:0});tick();
 }
 return {e,tick,hit,owner};
}
for(const id of ['a','b']){
 const t=setup(id);t.hit(3);near(t.owner().hp,100);near(t.owner().pactHealing,0);
 t.e.debug.setActor(id,{hp:50});t.hit(3);near(t.owner().hp,52.4);near(t.owner().pactHealing,2.4);
 assert(t.e.snapshot().classEffects.some(e=>e.type==='lifesteal'&&e.ownerId===id&&Math.abs(e.amount-2.4)<1e-7));
 for(let i=0;i<9;i++)t.hit(3);near(t.owner().hp,62);near(t.owner().pactHealing,12);t.hit(3);near(t.owner().hp,62);
 console.log('PASS actor '+id+': full-health hits preserve allowance; real damage restores HP with feedback; multiplayer counter persists and stops at 12.');
 const p=setup(id);p.e.debug.setActor(id,{hp:99.7});p.hit(3);near(p.owner().hp,100);near(p.owner().pactHealing,.3);
 const o=setup(id);o.e.debug.setActor(id,{hp:50});o.hit(4,1);near(o.owner().hp,50.8);near(o.owner().pactHealing,.8);
 const expired=setup(id);expired.e.debug.setActor(id,{hp:50});for(let i=0;i<125;i++)expired.tick(1/30);expired.hit(3);near(expired.owner().hp,50);
 const fallen=setup(id);fallen.e.debug.setActor(id,{hp:0});fallen.hit(3);near(fallen.owner().hp,0);
 console.log('PASS actor '+id+': missing-health cap, overkill exclusion, expired pact and fallen-player exclusion.');
}
