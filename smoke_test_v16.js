const path=require('path');
global.window=global;
global.KP={};
global.window.addEventListener=(name,fn)=>{};
global.window.removeEventListener=(name,fn)=>{};
global.requestAnimationFrame=(fn)=>{};
global.Image=class{constructor(){this.complete=true;this.naturalWidth=64;this.width=1200;this.height=675;} set src(v){this._src=v;} get src(){return this._src;} };
global.Audio=class{constructor(src){this.src=src;this.currentTime=0;this.volume=1;this.loop=false;this.preload='auto';this.playbackRate=1;this.muted=false;} play(){return Promise.resolve();} pause(){} load(){}};
function noop(){}
let drawCalls=[];
const ctx=new Proxy({}, {get:(t,p)=>{
  if(p==='createLinearGradient') return ()=>({addColorStop:noop});
  if(p==='createPattern') return ()=>('#333');
  if(p==='drawImage') return (...args)=>{ drawCalls.push(args); };
  if(p==='measureText') return (s)=>({width:String(s).length*8});
  return t[p] || noop;
}, set:(t,p,v)=>{t[p]=v;return true;}});
global.document={getElementById:()=>({width:1024,height:576,getContext:()=>ctx})};
for(const f of ['utils.js','input.js','balance.js','assets.js','entities.js','player.js','world.js','ui.js','audio.js','game.js']) require(path.join(__dirname,'js',f));
const g=new KP.Game();
function pressRaw(key){g.input.pressed.add(key); g.input.down.add(key);} function press(action){pressRaw(KP.Input.prototype.map.call(g.input,action)[0]);} function release(){g.input.down.clear();g.input.pressed.clear();g.input.mouseDown=false;}
press('start'); g.update(); release();
// Down drops through current ground segment, not just one-way platform
const ground=g.world.platforms.find(p=>p.type==='ground' && p.x===560);
g.player.x=ground.x+70; g.player.y=ground.y-g.player.h; g.player.vx=0; g.player.vy=0; g.player.grounded=true; g.player.floorContact=ground;
press('downAct'); g.update(); release();
if(g.player.y <= ground.y-g.player.h+5) throw new Error('Down did not start dropping through ground platform');
if(g.player.pose !== 'stand' || g.player.h !== 58) throw new Error('Down changed pose/hitbox');
// Weapon sprite is requested from the loaded weapon asset, not hidden inside the hero only
const imgId=KP.Balance.weapons[g.player.weapon].sprite;
drawCalls=[]; g.player.draw(ctx,g.assets);
const weaponDrawn=drawCalls.some(args => args[0]===g.assets.images[imgId]);
if(!weaponDrawn) throw new Error('Current weapon sprite was not drawn');
console.log('SMOKE_V16_OK', {dropY:g.player.y, weapon: g.player.weapon, imgId});
