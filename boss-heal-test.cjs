const assert=require('node:assert/strict');
const {makeEngine}=require('./engine.cjs');

for(let level=0;level<4;level++){
  const engine=makeEngine();
  engine.start([{id:'p1',hunter:'warden',slot:1},{id:'p2',hunter:'riftwalker',slot:2}],level,101);
  engine.debug.spawnBoss();
  let {bossHeals}=engine.snapshot();
  assert.equal(bossHeals.length,2);
  assert.equal(bossHeals.map(h=>h.ownerId).join(','),'p1,p2');
  const [first,second]=bossHeals;
  const [p1,p2]=engine.debug.actors;
  for(const heal of bossHeals){
    assert(heal.x>0&&heal.x<960&&heal.y>0&&heal.y<600,'Pickup stays in arena');
    assert(!engine.debug.walls.some(w=>engine.debug.circleHitsRect(heal.x,heal.y,10,w)),'Pickup is outside walls');
  }
  p1.x=second.x;p1.y=second.y;p1.hp=p1.maxHp/2;
  p2.x=first.x;p2.y=first.y;p2.hp=p2.maxHp/2;
  engine.debug.updateBossHeals();
  assert.equal(p1.hp,p1.maxHp/2,'Other player cannot take reserved pickup');
  assert.equal(p2.hp,p2.maxHp/2,'Other player cannot take reserved pickup');
  p1.x=first.x;p1.y=first.y;
  p2.x=second.x;p2.y=second.y;
  engine.debug.updateBossHeals();
  assert.equal(p1.hp,p1.maxHp*.85);
  assert.equal(p2.hp,p2.maxHp*.85);
  assert(engine.snapshot().bossHeals.every(h=>h.used),'Both items consumed');
  p1.hp=p1.maxHp/2;p2.hp=p2.maxHp/2;
  engine.debug.updateBossHeals();
  assert.equal(p1.hp,p1.maxHp/2,'Cannot reuse pickup');
  assert.equal(p2.hp,p2.maxHp/2,'Cannot reuse pickup');

  engine.debug.spawnBoss();
  assert(engine.snapshot().bossHeals.every(h=>!h.used),'Fresh fight gets new items');
  p1.hp=p1.maxHp;p1.x=engine.snapshot().bossHeals[0].x;p1.y=engine.snapshot().bossHeals[0].y;
  engine.debug.updateBossHeals();
  assert.equal(engine.snapshot().bossHeals[0].used,false,'Full-health player saves item');
  console.log(`PASS stage ${level+1}: reserved one-time boss heals`);
}
