'use strict';
// Headless logic smoke без зависимостей (в отличие от tests/playtest_smoke.js,
// которому нужны playwright-core + Chrome/Edge). Грузит игру со стабами браузера
// (canvas/Image/Audio) и прогоняет ключевые системы: турбо, стоп-время, гибы/кровь,
// волны с часами, телеграф босса, чекпойнты, отрисовку всех биомов.
// Запуск: npm run test:logic  (или node tools/logic_smoke.js)
const path = require('path');
const root = path.resolve(__dirname, '..');

function makeCtx(){
  return new Proxy({}, {
    get(t, p){
      if(p==='createLinearGradient'||p==='createRadialGradient') return ()=>({addColorStop(){}});
      if(p==='createPattern') return ()=>({});
      if(p==='measureText') return ()=>({width:10});
      if(p==='canvas') return {width:1024,height:576};
      if(p in t) return t[p];
      return ()=>{};
    },
    set(t,p,v){ t[p]=v; return true; }
  });
}
const canvasEl={ getContext:()=>makeCtx(), width:1024, height:576 };
const listeners={};
global.window = global;
global.performance = { now:()=>Date.now() };
global.requestAnimationFrame = ()=>0;
global.addEventListener = (t,cb)=>{ listeners[t]=cb; };
global.removeEventListener = ()=>{};
global.document = {
  getElementById:()=>canvasEl,
  createElement:()=>({ getContext:()=>makeCtx(), width:0, height:0 }),
  addEventListener:(t,cb)=>{ listeners[t]=cb; }
};
global.Image = function(){ this.complete=false; this.naturalWidth=0; let _s=''; Object.defineProperty(this,'src',{get:()=>_s,set:v=>{_s=v;}}); };
global.Audio = function(){ return { play:()=>Promise.resolve(), pause(){}, addEventListener(){}, currentTime:0, volume:1, loop:false, muted:false, playbackRate:1, preload:'', src:'' }; };

for(const f of ['utils','input','balance','assets','entities','player','world','ui','audio','game'])
  require(path.join(root,'js',f+'.js'));

// «DOMContentLoaded» создаёт игру и KP_TEST
listeners['DOMContentLoaded'] && listeners['DOMContentLoaded']();
const T = global.KP_TEST, g = T.getGame();
let step = '';
const mark = s => { step = s; };
try {
  mark('startGame'); T.startGame(); T.tick(60); g.draw();
  mark('checkpoint exists'); if(!g.checkpoint) throw new Error('checkpoint не сохранён на старте');

  mark('turbo'); g.player.abilities.turbo=true; g.player.tryTurbo(g);
  if(g.player.turbo<=0) throw new Error('турбо не включилось');
  const hpBefore=g.player.time; T.tick(30);
  if(g.player.time>=hpBefore) throw new Error('турбо не тратит здоровье');

  mark('timeStop'); g.player.abilities.timeStop=true; g.player.tryTimeStop(g);
  if(g.timeStopFrames<=0) throw new Error('стоп-время не включилось'); T.tick(20);

  mark('deathFx kinds'); for(const k of ['zombie','pistol','horse','kamikaze','shielder','sabreur']){
    const e=T.spawnEnemy(k,160);
    e.takeDamage(9999,0,e.x,{},g);
    g.onEnemyHit(e,true,9999);
  }
  T.tick(6); g.draw();
  if(g.gibs.length===0 && g.bloodSplatters.length===0) throw new Error('ни гибов, ни крови после убийств');

  mark('hitStop/shake'); g.hitStop(4); g.shake(8,5); T.tick(2); g.draw();

  mark('waves+clock'); T.goToBiome(1); T.tick(2);
  const trig=g.world.rushTriggers[0]; g.player.x=trig.x-100; T.tick(3); g.draw();
  if(trig.warnTimer===undefined) throw new Error('часы перед волной не запустились');
  T.tick(200); g.draw();
  if(!trig.done) throw new Error('волна не заспавнилась после отсчёта');

  mark('lenin ram telegraph'); T.goToBiome(5); const lenin=g.enemies.find(e=>e.kind==='lenin');
  if(lenin){ g.player.x=lenin.x-300; g.player.y=lenin.y; T.tick(220); g.draw(); }

  mark('death+checkpoint restore'); const cpBiome=g.checkpoint.levelIndex; g.player.time=0; g.player.dead=true; T.tick(2);
  g.restart();
  if(g.levelIndex!==cpBiome) throw new Error('restart не вернул на чекпойнт-биом');
  if(g.player.dead) throw new Error('после рестарта игрок мёртв'); T.tick(10); g.draw();

  mark('progress biomes + draw'); for(let b=0;b<6;b++){ T.goToBiome(b); for(let i=0;i<8;i++){ g.update(); g.draw(); } }

  console.log('LOGIC SMOKE OK');
} catch(e){
  console.error('FAILED at step:', step);
  console.error(e && e.stack || e);
  process.exit(1);
}
