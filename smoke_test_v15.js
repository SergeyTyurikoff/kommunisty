const path=require('path');
global.window=global;
global.KP={};
global.window.addEventListener=(name,fn)=>{};
global.window.removeEventListener=(name,fn)=>{};
global.requestAnimationFrame=(fn)=>{};
global.Image=class{constructor(){this.complete=true;this.naturalWidth=64;this.width=1200;this.height=675;} set src(v){this._src=v;} get src(){return this._src;} };
global.Audio=class{constructor(src){this.src=src;this.currentTime=0;this.volume=1;this.loop=false;this.preload='auto';this.playbackRate=1;this.muted=false;} play(){return Promise.resolve();} pause(){} load(){}};
function noop(){}
const ctx=new Proxy({}, {get:(t,p)=>{ if(p==='createLinearGradient') return ()=>({addColorStop:noop}); if(p==='createPattern') return ()=>('#333'); if(p==='measureText') return (s)=>({width:String(s).length*8}); return t[p] || noop;}, set:(t,p,v)=>{t[p]=v;return true;}});
global.document={getElementById:()=>({width:1024,height:576,getContext:()=>ctx})};
for(const f of ['utils.js','input.js','balance.js','assets.js','entities.js','player.js','world.js','ui.js','audio.js','game.js']) require(path.join(__dirname,'js',f));
const g=new KP.Game();
function pressRaw(key){g.input.pressed.add(key); g.input.down.add(key);} function press(action){pressRaw(KP.Input.prototype.map.call(g.input,action)[0]);} function release(){g.input.down.clear();g.input.pressed.clear();g.input.mouseDown=false;}
press('start'); g.update(); release();
// one boss per biome
const bosses=g.enemies.filter(e=>KP.Balance.enemies[e.kind].role==='boss'); if(bosses.length!==1) throw new Error('Expected one boss, got '+bosses.length);
// holes in ground allow lower area by falling/walking through entrance gap
const hasGroundGap = !g.world.platforms.some(p=>p.type==='ground' && p.x<=430 && p.x+p.w>=530); if(!hasGroundGap) throw new Error('No descent gap in ground');
// Drop through one-way platform works
const p=g.world.platforms.find(p=>p.type==='sky'); g.player.x=p.x+20; g.player.y=p.y-g.player.h; g.player.grounded=true; g.player.floorContact=p; press('downAct'); g.update(); release(); if(g.player.y <= p.y-g.player.h+2) throw new Error('Drop-through one-way platform failed');
// time stop freezes enemy bullet position
const eb=new KP.Bullet('enemy',400,400,5,0,{dmg:5,range:999,color:'#fff'}); g.enemyBullets=[eb]; g.timeStopFrames=120; g.updateBullets(); if(eb.x!==400) throw new Error('Enemy bullet moved during time stop');
// enemies stay within patrol
const e=new KP.Enemy(200,0,'runner'); e.setPatrol(180,360,485); e.aggro('test'); g.enemies=[e]; g.player.x=900; g.player.y=380; for(let i=0;i<260;i++) g.update(); if(e.x < e.patrolMin-1 || e.x+e.w > e.patrolMax+1) throw new Error('Enemy left patrol bounds');
console.log('SMOKE_V15_OK', {bosses:bosses.length, dropY:g.player.y});
