const assert=require('node:assert/strict'),{makeEngine}=require('./engine.cjs'),rules=require('./classes.js');
function setup(hunter,other='riftwalker'){
 const e=makeEngine();e.start([{id:'a',slot:1,hunter},{id:'b',slot:2,hunter:other}],0,7);e.debug.enemies.length=0;
 let p;for(let y=65;y<535&&!p;y+=20)for(let x=65;x<760;x+=20)if(e.debug.clearSight(x-25,y,x+150,y,12)&&!e.debug.walls.some(w=>e.debug.circleHitsRect(x,y,12,w))){p={x,y};break;}assert(p);
 e.debug.setActor('a',{...p,aimX:1,aimY:0});e.debug.setActor('b',{x:p.x-20,y:p.y,aimX:1,aimY:0});
 const c=new Map(['a','b'].map(id=>[id,{connected:true,input:{up:false,down:false,left:false,right:false,fire:false,charge:false,releaseSeq:0,abilitySeq:0,aimX:p.x+100,aimY:p.y}}]));
 const enemy=(dx,dy=0,hp=20)=>{const obj={id:100+e.debug.enemies.length,type:'ghost',x:p.x+dx,y:p.y+dy,radius:11,hp,maxHp:hp,speed:0,vx:0,vy:0,alive:true,hitFlash:0,knockX:0,knockY:0,behavior:'pursuit',abilityCooldown:99,decisionTimer:99,approachX:0,approachY:0};e.debug.enemies.push(obj);return obj;};
 const tick=(time=1/30)=>e.tick(time,c);return {e,p,c,input:c.get('a').input,enemy,tick};
}
{
 const t=setup('warden'),front=t.enemy(35),rear=t.enemy(-35);t.input.fire=true;t.tick(.001);assert.equal(front.hp,18);assert.equal(rear.hp,20);assert(t.e.snapshot().classEffects.some(e=>e.type==='slash'));
 const w=setup('warden');w.c.get('b').connected=false;const frontEnemy=w.enemy(16);w.input.abilitySeq=1;w.tick(.001);assert.equal(w.e.snapshot().players[0].hp,100);assert(w.e.snapshot().players[0].abilityCooldown>8);frontEnemy.x=w.p.x-16;frontEnemy.knockX=0;w.tick(.001);assert(w.e.snapshot().players[0].hp<100);console.log('PASS Warden hammer cone, rear exclusion, shield blocks front but not rear, ability cooldown.');
}
{
 const t=setup('riftwalker'),one=t.enemy(50),two=t.enemy(110);t.input.charge=true;for(let i=0;i<34;i++)t.tick();t.input.charge=false;t.input.releaseSeq=1;for(let i=0;i<15;i++)t.tick(.016);assert.equal(one.hp,16);assert.equal(two.hp,16);assert(t.e.snapshot().players[0].chargeCooldown>0);
 const d=setup('riftwalker');d.input.abilitySeq=1;d.tick(.001);const a=d.e.snapshot().players[0];assert(a.x>d.p.x+80);assert(a.invulnerability>0);assert(!d.e.debug.walls.some(w=>d.e.debug.circleHitsRect(a.x,a.y,10,w)));d.tick(.001);assert(d.e.snapshot().players[0].abilityCooldown<4);console.log('PASS Riftwalker piercing once per target, separate charge recovery, swept wall-safe dash and protection.');
}
{
 const t=setup('hexkeeper'),target=t.enemy(55);t.input.fire=true;t.tick(.12);assert.equal(target.hp,19);assert(target.slowTime>0);
 const h=setup('hexkeeper');h.e.debug.setActor('a',{hp:50});h.e.debug.setActor('b',{hp:50});h.input.abilitySeq=1;for(let i=0;i<120;i++)h.tick();const players=h.e.snapshot().players;assert(players.every(a=>Math.abs(a.hp-70)<.01));assert(h.e.snapshot().players[0].abilityCooldown>13);
 const dead=setup('hexkeeper');dead.e.debug.setActor('b',{hp:0});dead.input.abilitySeq=1;for(let i=0;i<20;i++)dead.tick();assert.equal(dead.e.snapshot().players[1].hp,0);
 const rune=setup('hexkeeper');const near=rune.enemy(100);rune.input.charge=true;for(let i=0;i<34;i++)rune.tick();rune.input.charge=false;rune.input.releaseSeq=1;rune.tick();assert(rune.e.snapshot().classEffects.some(e=>e.type==='rune'));assert.equal(near.hp,20);for(let i=0;i<21;i++)rune.tick();assert.equal(near.hp,17);console.log('PASS Hex slow, capped team healing, no revive, rune warning then delayed AoE damage.');
}
{
 const t=setup('revenant');t.e.debug.setActor('a',{hp:50});const target=t.enemy(35,0,100);t.input.abilitySeq=1;t.input.fire=true;for(let i=0;i<120;i++)t.tick();const a=t.e.snapshot().players[0];assert(target.hp<100);assert(a.hp>50&&a.hp<=62.01);assert(a.pactHealing<=12);
 const d=setup('revenant');d.input.charge=true;for(let i=0;i<34;i++)d.tick();d.input.charge=false;d.input.releaseSeq=1;d.tick(.001);const actor=d.e.snapshot().players[0];assert(actor.x>d.p.x+60);assert(!d.e.debug.walls.some(w=>d.e.debug.circleHitsRect(actor.x,actor.y,10,w)));console.log('PASS Revenant alternating melee, bounded Blood Pact healing, wall-safe charged lunge.');
}
assert.equal(Object.keys(rules).length,4);console.log('PASS four class definitions and independent authoritative state.');

{
 const t=setup('warden');t.e.debug.setActor('b',{x:t.p.x-2,y:t.p.y+10});const enemy=t.enemy(8,20);t.input.abilitySeq=1;t.tick(.001);assert.equal(t.e.snapshot().players[1].hp,100);console.log('PASS Warden shield covers a nearby teammate.');
}
for(const hunter of ['warden','riftwalker','hexkeeper','revenant']){
 const t=setup(hunter);let spot;for(const wall of t.e.debug.walls){if(wall.w>35||wall.h<60)continue;const y=wall.y+wall.h/2,left={x:wall.x-14,y},right={x:wall.x+wall.w+14,y};if([left,right].every(p=>!t.e.debug.walls.some(w=>t.e.debug.circleHitsRect(p.x,p.y,10,w)))){spot={left,right,wall};break;}}assert(spot);
 t.e.debug.setActor('a',{...spot.left,hp:50,aimX:1,aimY:0});t.e.debug.setActor('b',{...spot.right,hp:50});t.input.aimX=spot.right.x;t.input.aimY=spot.right.y;
 const enemy=t.enemy(100);enemy.x=spot.right.x;enemy.y=spot.right.y;
 if(hunter==='warden'||hunter==='revenant'){t.input.fire=true;t.tick(.001);assert.equal(enemy.hp,20);}
 if(hunter==='riftwalker'){t.input.abilitySeq=1;t.tick(.001);const a=t.e.snapshot().players[0];assert(a.x<=spot.wall.x-10);assert(!t.e.debug.walls.some(w=>t.e.debug.circleHitsRect(a.x,a.y,10,w)));}
 if(hunter==='hexkeeper'){t.e.debug.enemies.length=0;t.input.abilitySeq=1;for(let i=0;i<20;i++)t.tick();assert.equal(t.e.snapshot().players[1].hp,50);}
 console.log('PASS '+hunter+' wall separation for melee/dash/healing.');
}
