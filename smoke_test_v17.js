const path=require('path');
global.window=global;
global.KP={};
global.window.addEventListener=(name,fn)=>{};
global.window.removeEventListener=(name,fn)=>{};
global.requestAnimationFrame=(fn)=>{};
global.Image=class{constructor(){this.complete=true;this.naturalWidth=64;this.width=1254;this.height=1254;} set src(v){this._src=v;} get src(){return this._src;} };
global.Audio=class{constructor(src){this.src=src;this.currentTime=0;this.volume=1;this.loop=false;this.preload='auto';this.playbackRate=1;this.muted=false;} play(){return Promise.resolve();} pause(){} load(){}};
function noop(){}
const ctx=new Proxy({}, {get:(t,p)=>{
  if(p==='createLinearGradient') return ()=>({addColorStop:noop});
  if(p==='createPattern') return ()=>('#333');
  if(p==='drawImage') return noop;
  if(p==='measureText') return (s)=>({width:String(s).length*8});
  return t[p] || noop;
}, set:(t,p,v)=>{t[p]=v;return true;}});
global.document={getElementById:()=>({width:1024,height:576,getContext:()=>ctx})};
for(const f of ['utils.js','input.js','balance.js','assets.js','entities.js','player.js','world.js','ui.js','audio.js','game.js']) require(path.join(__dirname,'js',f));
const g=new KP.Game();
function pressRaw(key){g.input.pressed.add(key); g.input.down.add(key);} 
function press(action){pressRaw(KP.Input.prototype.map.call(g.input,action)[0]);} 
function release(){g.input.down.clear();g.input.pressed.clear();g.input.mouseDown=false;}
press('start'); g.update(); release();

if(g.world.acid.length!==0) throw new Error('Acid should be removed');
if(g.world.platforms.some(p=>p.type==='cave')) throw new Error('Lower cave level should be removed');
const ground=g.world.platforms.find(p=>p.type==='ground');
if(!ground || ground.x!==0 || ground.w<3100) throw new Error('Main road should be flat continuous ground');
if(g.world.enemySpawns.some(s=>s.x<620)) throw new Error('Enemy spawned too close to start');

// Down should not drop through the main ground.
g.player.x=260; g.player.y=ground.y-g.player.h; g.player.vx=0; g.player.vy=0; g.player.grounded=true; g.player.floorContact=ground;
const yGround=g.player.y;
press('downAct'); g.update(); release();
if(g.player.y>yGround+4) throw new Error('Player dropped through solid ground');

// Down should drop through one-way sky platform.
const sky=g.world.platforms.find(p=>p.type==='sky');
g.player.x=sky.x+20; g.player.y=sky.y-g.player.h; g.player.vx=0; g.player.vy=0; g.player.grounded=true; g.player.floorContact=sky;
press('downAct'); g.update(); release();
if(g.player.y <= sky.y-g.player.h+6) throw new Error('Drop-through sky platform failed');

// Enemies should stay on their assigned floor/platform.
const e=new KP.Enemy(sky.x+30,0,'runner'); e.setPatrol(sky.x+10,sky.x+sky.w-10,sky.y); e.aggro('test'); g.enemies=[e];
g.player.x=900; g.player.y=ground.y-g.player.h;
for(let i=0;i<240;i++) g.update();
if(Math.abs((e.y+e.h)-e.floorY)>2) throw new Error('Enemy left assigned floor');
if(e.x < e.patrolMin-1 || e.x+e.w > e.patrolMax+1) throw new Error('Enemy left patrol bounds');

// Rush should not spawn too early.
g.enemies=[];
g.player.x=1000; g.checkRush(); if(g.enemies.length!==0) throw new Error('Rush spawned too early');
g.player.x=2200; g.checkRush(); if(g.enemies.length===0) throw new Error('Rush did not spawn late');

// Biome scaling should strengthen enemies.
const e0=new KP.Enemy(1000,0,'zombie'); e0.setPatrol(900,1100,485); g.levelIndex=0; g.applyBiomeScaling(e0);
const hp0=e0.hp, dmg0=e0.hitTime;
const e5=new KP.Enemy(1000,0,'zombie'); e5.setPatrol(900,1100,485); g.levelIndex=5; g.applyBiomeScaling(e5);
if(e5.hp<=hp0 || e5.hitTime<=dmg0) throw new Error('Biome scaling failed');

// Boss turbo should be available.
g.levelIndex=3;
const boss=new KP.Enemy(1000,0,'swampBoss'); boss.setPatrol(900,1150,485); boss.turboCd=0; g.enemies=[boss]; g.player.x=1080; g.player.y=ground.y-g.player.h;
boss.update(g);
if(boss.turboTimer<=0) throw new Error('Boss turbo did not activate');

console.log('SMOKE_V17_OK', {dropY:g.player.y, rush:g.enemies.length, bossTurbo:boss.turboTimer});
