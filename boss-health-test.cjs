const assert=require('node:assert/strict'),{makeEngine}=require('./engine.cjs');
for(let stage=0;stage<4;stage++)for(let count=1;count<=4;count++){
 const engine=makeEngine(),members=Array.from({length:count},(_,i)=>({id:'p'+i,hunter:['warden','riftwalker','hexkeeper','revenant'][i],slot:i+1}));
 engine.start(members,stage,100);engine.debug.spawnBoss();const boss=engine.debug.enemies[0],expected=[120,180,250,300][stage]*count/4;
 assert.equal(boss.hp,expected);assert.equal(boss.maxHp,expected);
 if(count>1){engine.debug.actors[1].connected=false;assert.equal(boss.maxHp,expected,'HP stays fixed during fight');}
 console.log(`PASS stage ${stage+1}, players ${count}: ${expected} HP`);
}
