const assert=require('node:assert/strict');
const {makeEngine}=require('./engine.cjs');
const members=[{id:'a',hunter:'warden',slot:1},{id:'b',hunter:'riftwalker',slot:2}];
const commands=new Map(members.map(m=>[m.id,{connected:true,input:{aimX:480,aimY:300}}]));
const expected=[['rain','dive'],['shards','laser','well'],['cleave','lunge','spikes'],['ring','beam']];
for(let level=0;level<4;level++){
 const engine=makeEngine();engine.start(members,level,123);engine.debug.spawnBoss();const boss=engine.debug.enemies[0];
 assert.equal(boss.hp,[120,180,250,350][level]/2);assert.equal(boss.speed,[200,220,190,170][level]);
 const moves=new Set();for(let i=0;i<1500;i++){for(const a of engine.debug.actors){a.hp=a.maxHp;a.invulnerability=2;}engine.tick(1/30,commands);if(boss.move)moves.add(boss.move);assert.equal(engine.snapshot().enemies.filter(e=>e.type!=='boss').length,0,'boss minions must not spawn');}
 for(const move of expected[level])assert(moves.has(move),`level ${level} missing ${move}`);
 if(level===3){boss.hp=boss.maxHp/2;engine.tick(1/30,commands);assert(engine.snapshot().bossEffects.some(e=>e.type==='magma'),'cataclysm magma');}
 boss.hp=1;boss.behavior='boss-recovery';boss.behaviorTimer=10;boss.perched=false;engine.debug.bullets.push({id:999,ownerId:'a',targetId:boss.id,x:boss.x,y:boss.y,vx:0,vy:0,radius:1,life:1,damage:1000,melee:true});engine.tick(1/30,commands);assert(engine.snapshot().won,'boss death clears level');assert.equal(engine.snapshot().enemies.length,0,'no extra boss');console.log(`PASS stage ${level+1}: moves, no minions and boss victory`);
}
