const path=require('path');
global.window=global;
global.KP={};
global.window.addEventListener=(name,fn)=>{};
global.window.removeEventListener=(name,fn)=>{};
global.requestAnimationFrame=(fn)=>{};
global.Image=class{constructor(){this.complete=true;this.naturalWidth=64;this.width=1200;this.height=675;} set src(v){this._src=v;} get src(){return this._src;} };
global.Audio=class{constructor(src){this.src=src;this.currentTime=0;this.volume=1;this.loop=false;this.preload='auto';this.playbackRate=1;this.muted=false;} play(){return Promise.resolve();} pause(){} load(){}};
function noop(){}
const ctx=new Proxy({}, {get:(t,p)=>{ if(p==='createLinearGradient') return ()=>({addColorStop:noop}); if(p==='measureText') return (s)=>({width:String(s).length*8}); return t[p] || noop;}, set:(t,p,v)=>{t[p]=v;return true;}});
global.document={getElementById:()=>({width:1024,height:576,getContext:()=>ctx})};
for(const f of ['utils.js','input.js','balance.js','assets.js','entities.js','player.js','world.js','ui.js','audio.js','game.js']) require(path.join(__dirname,'js',f));
const g=new KP.Game();
function pressRaw(key){g.input.pressed.add(key); g.input.down.add(key);} function press(action){pressRaw(KP.Input.prototype.map.call(g.input,action)[0]);} function release(){g.input.down.clear();g.input.pressed.clear();g.input.mouseDown=false;}
press('start'); g.update(); release();
pressRaw('KeyD'); for(let i=0;i<20;i++) g.update(); release(); if(g.player.x<=80) throw new Error('KeyD movement failed');
const xAfter=g.player.x; g.enemies=[]; pressRaw('в'); for(let i=0;i<20;i++) g.update(); release(); if(g.player.x<=xAfter) throw new Error('Russian D/В movement failed');
const jumpY=g.player.vy; press('up'); g.update(); release(); if(g.player.vy>=jumpY) throw new Error('Jump failed');
const s=g.world.shops[0]; g.player.x=s.x; g.player.y=s.y; pressRaw('KeyE'); g.update(); release(); if(!g.ui.shopOpen) throw new Error('KeyE shop failed');
pressRaw('у'); g.update(); release(); if(g.ui.shopOpen) throw new Error('Russian E/У close failed');
g.player.unlockAbility('timeStop',g); const before=g.player.time; press('timeStop'); g.update(); release(); if(g.timeStopFrames<=0 || g.player.time>=before) throw new Error('Time stop failed');
const hBefore=g.player.h; press('downAct'); g.update(); release(); if(g.player.h!==hBefore) throw new Error('Down changed hitbox and may cause ground fall');
const ammoBefore=g.player.ammoBag.rifle; pressRaw('Mouse0'); g.update(); release(); if(g.player.ammoBag.rifle>=ammoBefore) throw new Error('Rifle ammo did not decrease');
// Враг должен держаться своего этажа/платформы.
const e=new KP.Enemy(200,0,'runner'); e.setPatrol(180,360,485); e.aggro('test'); g.enemies=[e]; g.player.x=900; g.player.y=380; for(let i=0;i<260;i++) g.update(); if(e.x < e.patrolMin-1 || e.x+e.w > e.patrolMax+1) throw new Error('Enemy left patrol bounds');
g.enemies=[];
const oldLevel=g.levelIndex; g.player.x=g.world.portal.x+5; g.player.y=g.world.portal.y+5; g.update(); for(let i=0;i<50;i++) g.update(); if(g.levelIndex!==oldLevel+1) throw new Error('Level transition failed');
press('restart'); g.update(); release(); if(g.levelIndex!==0 || !g.ui.intro || g.player.x!==80) throw new Error('Restart failed');
console.log('SMOKE_OK', {level:g.levelIndex, x:g.player.x, intro:g.ui.intro});
