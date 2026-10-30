"use strict";
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/solo.html','utf8').replace(/\r\n/g,'\n');
function makeEngine(){
 let script=source.match(/<script>([\s\S]*?)<\/script>/)[1];
 // Audio belongs exclusively to browser clients.
 script=script.replace(/  \/\/ Local synthesized audio:[\s\S]*?(?=  \/\/ All world coordinates)/, '  const sound={reset(){}};\n');
 function replace(a,b){if(!script.includes(a))throw Error('Engine source mismatch: '+a.slice(0,70));script=script.replace(a,b);}
 replace('      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);','      netTarget(enemy);\n      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);');
 replace('  function classActors(){return [player];}','  function classActors(){return netActors;}');
 replace('    updateClass(dt);','    // Per-actor abilities are advanced in netTick.');
 replace('    updateCharge(dt);','    // Charge is advanced once per actor below.');
 replace('    player.invulnerability = Math.max(0, player.invulnerability-dt);','    // Protection is advanced separately for every network actor.');
 replace('if(player.hp<=0){gameOver=true;input.fire=false;input.charge=false;input.revive=false;statusLabel.textContent="YOU WERE CAUGHT";}','if(player.hp<=0){input.fire=false;input.charge=false;}\n    netCommit();');
 replace('const safe=p=>!walls.some','const safe=p=>!netActors.some(a=>a.connected&&a.hp>0&&Math.hypot(a.x-p.x,a.y-p.y)<(finale?40:100)) && !walls.some');
 replace('if(distance>300)distant.push(point);','if(distance>300 && netActors.every(a=>!a.connected||a.hp<=0||Math.hypot(a.x-point.x,a.y-point.y)>180))distant.push(point);');

 replace('if(Math.hypot(point.x-player.x,point.y-player.y)>180)candidates.push(point);','if(Math.hypot(point.x-player.x,point.y-player.y)>180 && netActors.every(a=>!a.connected||a.hp<=0||Math.hypot(a.x-point.x,a.y-point.y)>140))candidates.push(point);');
 replace('player.hp=Math.min(MAX_HP,player.hp+15);','netHeal();');
 script=script.replaceAll('hp:config.hp,maxHp:config.hp','hp:Math.ceil(config.hp*netDifficulty),maxHp:Math.ceil(config.hp*netDifficulty)');
 replace('hp: config.hp+wave.hpBonus, maxHp: config.hp+wave.hpBonus','hp: Math.ceil((config.hp+wave.hpBonus)*netDifficulty), maxHp: Math.ceil((config.hp+wave.hpBonus)*netDifficulty)');
 const bridge=`
  let netActors=[],netActive=null,netClock=0,netCache=new Map(),netDifficulty=1;
  function netCommit(){if(netActive)for(const k of ['x','y','aimX','aimY','moving','hp','maxHp','speed','invulnerability','chargeTime','chargeCooldown','lastReleaseSeq','abilityCooldown','abilityTime','lastAbilitySeq','pactHealing','attackTime','attackSide','attackSerial','attackDuration','attackKind','attackAngle','reviveTime','reviveTarget','reviveHp'])netActive[k]=player[k];}
  function netHeal(){for(const a of netActors)if(a.connected&&a.hp>0)a.hp=Math.min(a.maxHp||100,a.hp+15);if(netActive)player.hp=netActive.hp;}
  function netUse(actor){netActive=actor;Object.assign(player,actor);}
  function netTarget(enemy){
    const live=netActors.filter(a=>a.connected&&a.hp>0);if(!live.length)return;
    const actor=live.reduce((a,b)=>Math.hypot(a.x-enemy.x,a.y-enemy.y)<=Math.hypot(b.x-enemy.x,b.y-enemy.y)?a:b);
    netUse(actor);enemy.targetId=actor.id;
    let cached=netCache.get(actor.id);
    if(!cached||(netClock-cached.time>.18&&Math.hypot(actor.x-cached.x,actor.y-cached.y)>6)||!cached.fields.has(enemy.radius)){
      buildPlayerPath(11);if(stage==='boss')buildPlayerPath(14);
      cached={time:netClock,x:actor.x,y:actor.y,fields:new Map(radiusPaths)};netCache.set(actor.id,cached);
    }
    radiusPaths.clear();for(const [r,p] of cached.fields)radiusPaths.set(r,p);
  }
  function netStart(members,level,seed){
    netActors=[];netDifficulty=1+.5*(members.length-1);selectLevel(level);resetCombat(seed);runState='playing';netClock=0;netCache.clear();
    netActors=[];
    for(const m of members){
      const candidates=[];for(let i=0;i<PATH_COLS*PATH_ROWS;i++){
        const p=cellCenter(i),d=Math.hypot(p.x-player.x,p.y-player.y);
        if(d<120 && radiusPaths.get(11)?.[i] && !walls.some(w=>circleHitsRect(p.x,p.y,10,w))&&netActors.every(a=>Math.hypot(a.x-p.x,a.y-p.y)>=28))candidates.push({...p,d});
      }
      candidates.sort((a,b)=>a.d-b.d);const p=candidates[0];if(!p)throw Error('No safe team spawn');
      const stats=MONSTER_CLASSES[m.hunter]||{hp:100,speed:235};netActors.push({id:m.id,hunter:m.hunter,slot:m.slot,x:p.x,y:p.y,radius:10,speed:stats.speed,maxHp:stats.hp,aimX:1,aimY:0,moving:false,hp:stats.hp,invulnerability:0,cooldown:0,chargeTime:0,chargeCooldown:0,lastReleaseSeq:0,connected:true});
    }
    for(const actor of netActors)resetClassState(actor);
    netUse(netActors[0]);buildPlayerPath(11);
  }
  function netTick(dt,commands){
    netClock+=dt;netActors=netActors.filter(a=>commands.has(a.id));
    for(const a of netActors)a.connected=!!commands.get(a.id)?.connected;
    for(const actor of netActors){
      const command=commands.get(actor.id);actor.connected=!!command?.connected;
      actor.invulnerability=Math.max(0,actor.invulnerability-dt);actor.cooldown=Math.max(0,actor.cooldown-dt);
      if(!actor.connected||actor.hp<=0||gameOver||won){actor.chargeTime=0;actor.abilityTime=0;continue;}
      netUse(actor);Object.assign(input,{revive:false},command.input);Object.assign(mouse,{x:command.input.aimX,y:command.input.aimY});
      update(dt);shootTimer=actor.cooldown;updateClass(dt);updateCharge(dt);if(input.fire)fireBullet();actor.cooldown=shootTimer;netCommit();
    }
    input.fire=false;input.charge=false;
    const live=netActors.filter(a=>a.connected&&a.hp>0);
    if(live.length&&!won&&!gameOver){netUse(live[0]);updateCombat(dt);netCommit();}
    if(netActors.length&&netActors.every(a=>a.hp<=0||!commands.has(a.id))){gameOver=true;statusLabel.textContent='TEAM DEFEATED';}
  }
  globalThis.engine={start:netStart,tick:netTick,snapshot:()=>({levelIndex,waveIndex,waveDelay,stage,score,won,gameOver,summonsUsed,finaleSpawned,difficulty:netDifficulty,
    graveHazards:graveHazards.map(h=>({...h})),status:statusLabel.textContent,players:netActors.map(a=>({...a})),enemies:enemies.filter(e=>e.alive).map(e=>({...e})),
    classEffects:classEffects.map(e=>({...e})),bullets:bullets.map(b=>({...b})),particles:particles.map(p=>({...p})),trails:trails.map(t=>({...t})),muzzle:muzzle?{...muzzle}:null}),
    debug:{get actors(){return netActors},get enemies(){return enemies},get bullets(){return bullets},get walls(){return walls},get graveHazards(){return graveHazards},updateGraves,circleHitsRect,clearSight,
    setActor:(id,values)=>Object.assign(netActors.find(a=>a.id===id),values),spawnBoss,updateBossEncounter}};
 `;
 script=script.slice(0,script.indexOf('  // Initial mouse aim points'))+bridge+'\n})();';
 const labels={},context=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const canvas={getContext:()=>context,addEventListener:()=>{},focus:()=>{}};
 const sandbox={MONSTER_CLASSES:require('./classes.js'),document:{body:{classList:{add:()=>{},remove:()=>{}}},getElementById:id=>id==='game'?canvas:(labels[id]??={style:{},setAttribute:()=>{},addEventListener:()=>{}}),querySelectorAll:()=>[],addEventListener:()=>{}},window:{addEventListener:()=>{}},requestAnimationFrame:()=>{}};
 vm.createContext(sandbox);vm.runInContext(script,sandbox,{timeout:10000});return sandbox.engine;
}
module.exports={makeEngine};

