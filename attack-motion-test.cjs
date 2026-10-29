const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
for(const file of ['solo.html','client.html']){
 const source=fs.readFileSync(__dirname+'/'+file,'utf8'),block=source.match(/  const attackVisuals=new Map\(\);[\s\S]*?(?=  function resetClassState)/)[0];
 const player={hunter:'riftwalker',attackSide:-1},context={player,CLASS_RULES:require('./classes.js'),attackDirection:()=>({x:1,y:0})};
 vm.runInNewContext(block+';globalThis.pose=attackPose;globalThis.begin=beginAttack;',context);
 context.begin(false);assert.equal(player.attackSide,1);context.begin(false);assert.equal(player.attackSide,1);
 player.hunter='revenant';context.begin(false);const first=player.attackSide;context.begin(false);assert.equal(player.attackSide,-first);
 const actor={id:'a',hunter:'warden',attackSerial:1,attackTime:.3,attackDuration:.3,attackSide:1,attackKind:'normal'};
 const start=context.pose(actor,10);assert(Math.abs(start.swing)<1e-9);assert.equal(start.kick,0);
 const early=context.pose(actor,10.03);assert(early.swing<0);const middle=context.pose({...actor,attackTime:.1},10.15);assert(middle.p>.49&&middle.p<.51);assert(middle.swing>0);const end=context.pose({...actor,attackTime:0},10.31);assert.equal(end.active,false);assert(Math.abs(end.kick)<1e-9);assert(Math.abs(end.swing)<1e-9);
 const next=context.pose({...actor,attackSerial:2,attackTime:.3},10.4);assert.equal(next.p,0);
 assert(!source.includes('c.rotate((actor.attackSide||1)*.35)'));
 console.log('PASS '+file+': ranged does not alternate, blades alternate, smooth rest/windup/sweep/recovery, repeated snapshots do not restart animation.');
}
