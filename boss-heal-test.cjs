const assert=require('node:assert/strict');
const {makeEngine}=require('./engine.cjs');

for(let level=0;level<4;level++){
  const engine=makeEngine();
  engine.start([{id:'p1',hunter:'warden',slot:1},{id:'p2',hunter:'riftwalker',slot:2}],level,101);
  engine.debug.spawnBoss();
  const [p1,p2]=engine.debug.actors;
  let [first,second]=engine.snapshot().bossHeals;
  assert.equal(first.ownerId,'p1');assert.equal(second.ownerId,'p2');
  assert(!first.spawned&&!second.spawned,'No pickup at boss start');

  p1.hp=p1.maxHp*.5;p2.hp=p2.maxHp*.75;
  engine.debug.updateBossHeals();
  assert(engine.snapshot().bossHeals.every(h=>!h.spawned),'Exactly 50% does not drop');

  p1.hp=p1.maxHp*.49;
  engine.debug.updateBossHeals();
  [first,second]=engine.snapshot().bossHeals;
  assert(first.spawned&&!second.spawned,'Only injured player gets a drop');
  for(const heal of [first]){
    assert(heal.x>0&&heal.x<960&&heal.y>0&&heal.y<600,'Pickup stays in arena');
    assert(!engine.debug.walls.some(w=>engine.debug.circleHitsRect(heal.x,heal.y,10,w)),'Pickup is outside walls');
  }
  p2.hp=p2.maxHp*.4;
  engine.debug.updateBossHeals();
  [first,second]=engine.snapshot().bossHeals;
  assert(second.spawned,'Second player gets a separate drop');
  assert(!engine.debug.walls.some(w=>engine.debug.circleHitsRect(second.x,second.y,10,w)));

  const p1Hp=p1.hp,p2Hp=p2.hp;
  p1.x=second.x;p1.y=second.y;
  p2.x=first.x;p2.y=first.y;
  engine.debug.updateBossHeals();
  assert.equal(p1.hp,p1Hp,'Cannot take teammate pickup');
  assert.equal(p2.hp,p2Hp,'Cannot take teammate pickup');
  p1.x=first.x;p1.y=first.y;
  p2.x=second.x;p2.y=second.y;
  engine.debug.updateBossHeals();
  assert.equal(p1.hp,p1Hp+p1.maxHp*.35);
  assert.equal(p2.hp,p2Hp+p2.maxHp*.35);
  assert(engine.snapshot().bossHeals.every(h=>h.used),'Both items consumed');
  p1.hp=p1Hp;p2.hp=p2Hp;
  engine.debug.updateBossHeals();
  assert.equal(p1.hp,p1Hp,'Cannot reuse pickup');
  assert.equal(p2.hp,p2Hp,'Cannot reuse pickup');

  engine.debug.spawnBoss();
  assert(engine.snapshot().bossHeals.every(h=>!h.spawned&&!h.used),'Fresh fight resets drops');
  p1.hp=p1.maxHp;
  engine.debug.updateBossHeals();
  assert.equal(engine.snapshot().bossHeals[0].spawned,false,'Full-health player gets no drop');
  console.log(`PASS stage ${level+1}: health-threshold boss drops`);
}
