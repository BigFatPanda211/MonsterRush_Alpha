const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{for(const file of ['solo.html','client.html']){
 const html=fs.readFileSync(__dirname+'/'+file,'utf8');assert.equal((html.match(/id="game"/g)||[]).length,1);assert.ok(html.indexOf('id="play-arena"')<html.indexOf('class="controls-sidebar"'));assert.ok(html.indexOf('class="controls-sidebar"')<html.indexOf('class="game-frame"'));assert.ok(html.indexOf('class="enemy-sidebar"')>html.indexOf('class="game-frame"'));assert.ok(html.includes('if(isGameFullscreen())return;'));
 const events={},elements={},input={up:true,fire:true};let focus=0;
 const document={body:{classList:{toggle(){}}},fullscreenElement:null,getElementById(id){return elements[id]??={setAttribute(k,v){this[k]=v},addEventListener(k,f){events[id+':'+k]=f}}},addEventListener(k,f){events[k]=f},async exitFullscreen(){this.fullscreenElement=null;events.fullscreenchange()}};
 document.getElementById('play-arena').requestFullscreen=async()=>{document.fullscreenElement=elements['play-arena'];events.fullscreenchange()};
 const script=html.match(/  \/\/ Fullscreen belongs[\s\S]*?(?=  const mouse =)/)[0];vm.runInNewContext(script,{window:{addEventListener(){}},document,input,canvas:{focus(){focus++}}});
 await events['fullscreen-toggle:click']();assert.equal(elements['fullscreen-toggle']['aria-pressed'],'true');assert.equal(input.fire,false);assert.equal(input.up,false);await events['fullscreen-toggle:click']();assert.equal(elements['fullscreen-toggle']['aria-pressed'],'false');assert.ok(focus>0);
 delete elements['play-arena'].requestFullscreen;await events['fullscreen-toggle:click']();assert.ok(elements['fullscreen-message'].textContent.includes('unavailable'));
 elements['play-arena'].requestFullscreen=async()=>{throw Error('denied')};await events['fullscreen-toggle:click']();assert.ok(elements['fullscreen-message'].textContent.includes('could not open'));
 console.log('PASS '+file+' sidebar structure, fullscreen enter/exit labels, cleared input, focus, unsupported and rejected API handling (mocked browser).');
}})().catch(e=>{console.error(e);process.exitCode=1});