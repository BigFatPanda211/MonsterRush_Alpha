const assert=require('node:assert/strict'),{makeEngine}=require('./engine.cjs');
const members=[{id:'one',hunter:'riftwalker',slot:1},{id:'two',hunter:'warden',slot:2}];
function input(){return new Map(members.map(p=>[p.id,{connected:true,input:{aimX:480,aimY:300}}]));}
const e=makeEngine();e.start(members,3,123);const cmd=input();assert.equal(e.snapshot().levelIndex,3);assert.equal(e.snapshot().enemies.length,8);assert.equal(e.debug.walls.length,25);
for(const enemy of e.debug.enemies)enemy.alive=false;
const a=e.debug.actors[0];e.debug.actors[1].hp=0;
for(const [start,key,check] of [[{x:22,y:300},'left',p=>p.x>900],[{x:938,y:300},'right',p=>p.x<60],[{x:480,y:22},'up',p=>p.y>550],[{x:480,y:578},'down',p=>p.y<60]]){Object.assign(a,start,{hp:100});cmd.get(a.id).input={left:false,right:false,up:false,down:false,[key]:true,aimX:480,aimY:300};e.tick(.033,cmd);assert(check(a),'gate '+key);assert(!e.debug.walls.some(w=>e.debug.circleHitsRect(a.x,a.y,10,w)));}
Object.assign(a,{x:40,y:120});cmd.get(a.id).input={left:true,right:false,up:false,down:false,aimX:480,aimY:300};for(let i=0;i<20;i++)e.tick(.033,cmd);assert(a.x>=38,'solid perimeter blocks outside gate');
// An enemy chooses the short path through the edge rather than traversing the map.
Object.assign(a,{x:120,y:300,hp:100});cmd.get(a.id).input={left:false,right:false,up:false,down:false,aimX:480,aimY:300};e.debug.enemies.push({id:999,type:'ghost',x:884,y:300,radius:11,hp:999,maxHp:999,speed:90,vx:0,vy:0,alive:true,hitFlash:0,knockX:0,knockY:0,behavior:'pursuit',decisionTimer:99,approachX:0,approachY:0,abilityCooldown:2});let warped=false;for(let i=0;i<120;i++){e.tick(1/30,cmd);const g=e.debug.enemies.find(g=>g.id===999);if(g.x<200){warped=true;break;}}assert(warped,'enemy follows portal path');
e.debug.spawnBoss();const boss=e.debug.enemies.find(e=>e.type==='boss');boss.hp=boss.maxHp*.89;e.debug.updateBossEncounter(0);assert(boss.houseHealUsed);assert.equal(boss.healTime,1.5);assert([178,422,300].includes(boss.y));for(let i=0;i<47;i++)e.tick(1/30,cmd);assert.equal(boss.hp,boss.maxHp);boss.hp=boss.maxHp*.7;e.debug.updateBossEncounter(0);assert.equal(boss.healTime,0,'one heal only');
for(let i=0;i<180;i++)e.tick(1/30,cmd);for(const enemy of e.debug.enemies.filter(e=>e.alive))assert(!e.debug.walls.some(w=>e.debug.circleHitsRect(enemy.x,enemy.y,enemy.radius,w)),'enemy wall collision');
console.log('PASS graveyard: four paired gates, intact perimeter, enemy portal pursuit, safe boss house spawn and one-time 90% ritual heal.');

