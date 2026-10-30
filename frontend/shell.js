(()=>{'use strict';
 const frame=document.getElementById('game-host');
 const modeFromPath=()=>location.pathname==='/solo'?'solo':'multiplayer';
 const sendState=()=>frame.contentWindow?.postMessage({type:'monster-fullscreen',active:!!document.fullscreenElement},location.origin);
 function load(mode){frame.src=mode==='solo'?'/solo.html':'/client.html';}
 window.MONSTER_SHELL={
   switchMode(mode){const path=mode==='solo'?'/solo':'/';if(location.pathname!==path)history.pushState({mode},'',path);load(mode);},
   isFullscreen:()=>!!document.fullscreenElement,
   async toggleFullscreen(){if(document.fullscreenElement){window.navigator?.keyboard?.unlock?.();await document.exitFullscreen();}else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();try{await window.navigator?.keyboard?.lock?.(['Escape']);}catch{}}else throw Error('Fullscreen unavailable');sendState();}
 };
 frame.addEventListener('load',sendState);document.addEventListener('fullscreenchange',sendState);window.addEventListener('popstate',()=>load(modeFromPath()));load(modeFromPath());
})();
