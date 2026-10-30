const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
for(const file of ['solo.html','client.html'])for(const guest of (file==='client.html'?[false,true]:[false])){
 const source=fs.readFileSync(__dirname+'/'+file,'utf8'),start=source.indexOf('  let stageCarousel='),end=source.indexOf('  function initHunterPicker()',start),events={},attrs={},chosen=[];let now=1000;
 const element=id=>({id,disabled:false,addEventListener:(name,fn)=>events[id+':'+name]=fn,setAttribute:(k,v)=>attrs[id+':'+k]=v});
 const cards=Array.from({length:4},(_,i)=>({...element('card'+i),tabIndex:0}));
 const slides=cards.map((card,i)=>({...element('slide'+i),dataset:{stageSlide:String(i)},querySelector:()=>card}));
 const viewport={...element('viewport'),clientWidth:800,scrollWidth:3200,scrollLeft:0,scrollTo({left}){this.scrollLeft=left;events['viewport:scroll']?.()},querySelectorAll:()=>slides};
 const select={value:'0',disabled:guest},elements={'stage-carousel-viewport':viewport,'hunting-grounds':element('root'),'stage-prev':element('prev'),'stage-next':element('next'),'stage-position':element('position'),'level-select':select,'room-level':select};
 for(let i=0;i<4;i++)elements['stage-dot-'+i]=element('dot'+i);
 const box={document:{getElementById:id=>elements[id]},window:{addEventListener:(k,fn)=>events['window:'+k]=fn,matchMedia:()=>({matches:false})},Date:{now:()=>now},player:{hunter:'revenant'},selectLevel:n=>{select.value=String(n);chosen.push(n);vm.runInContext('stageCarousel.sync()',box)},refreshGroundMenu:()=>{chosen.push(Number(select.value));vm.runInContext('stageCarousel.sync()',box)}};
 vm.createContext(box);vm.runInContext(source.slice(start,end)+';initStageCarousel();',box);
 const expected=n=>guest?'0':String(n);
 assert(elements['stage-prev'].disabled);events['next:click']();assert.equal(select.value,expected(1));assert.equal(viewport.scrollLeft,800);assert.equal(elements['stage-position'].textContent,'02 / 04');
 for(let i=0;i<5;i++)vm.runInContext('stageCarousel.sync()',box);assert.equal(viewport.scrollLeft,800,'guest preview survives repeated lobby refreshes');
 events['root:keydown']({key:'End',preventDefault(){},stopPropagation(){}});assert.equal(viewport.scrollLeft,2400);assert(elements['stage-next'].disabled);events['root:keydown']({key:'Home',preventDefault(){},stopPropagation(){}});
 events['viewport:wheel']({deltaY:80,deltaX:0,deltaMode:0,preventDefault(){}});assert.equal(viewport.scrollLeft,800);now+=400;events['viewport:wheel']({deltaY:80,deltaX:0,deltaMode:0,preventDefault(){}});assert.equal(select.value,expected(2));
 events['viewport:pointerdown']();viewport.scrollLeft=2400;events['viewport:scroll']();assert.equal(select.value,expected(3));assert.equal(attrs['dot3:aria-current'],'true');assert.equal(cards[3].tabIndex,0);assert.equal(cards[2].tabIndex,-1);
 events['dot1:click']();assert.equal(viewport.scrollLeft,800);viewport.clientWidth=600;events['window:resize']();assert.equal(viewport.scrollLeft,600);
 const before=chosen.length;events['root:keydown']({key:'ArrowRight',target:{tagName:'INPUT'},preventDefault(){throw Error('Input intercepted')}});assert.equal(chosen.length,before);assert.equal(box.player.hunter,'revenant');
 if(guest)assert.equal(chosen.length,0,'guest never changes selected room level');
 select.value='2';vm.runInContext('stageCarousel.sync()',box);assert.equal(viewport.scrollLeft,1200,'external selected stage synchronizes');
 assert(!source.includes('stage-details'));assert(!source.includes('stage-preview-'));assert(!source.includes('drawStagePreviews'));assert(!source.includes('Click Attack'));assert(/basic attack/i.test(source));
 console.log('PASS '+file+(guest?' guest':' selector')+': stage arrows, wheel, scroll, dots, keyboard, resize, selection synchronization and hunter preservation.');
}
