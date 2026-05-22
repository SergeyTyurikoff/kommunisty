'use strict';
window.KP = window.KP || {};
KP.VERSION = 'V 1.1.0';
KP.Game = class Game {
  constructor(){
    this.canvas=document.getElementById('game');
    this.ctx=this.canvas.getContext('2d');
    this.input=new KP.Input();
    this.assets=new KP.Assets();
    this.ui=new KP.UI();
    this.audio=new KP.AudioSystem();
    this.gravity=.72;
    this.cameraX=0; this.cameraY=0;
    this.levelIndex=0;
    this.world=new KP.World(this.levelIndex);
    this.player=new KP.Player();
    this.enemies=[]; this.playerBullets=[]; this.enemyBullets=[];
    this.pickups=[]; this.particles=[]; this.damageNumbers=[];
    this.kills=0; this.maxCombo=1;
    this.toastText=''; this.toastTimer=0;
    this.timeStopFrames=0; this.levelTransition=0;
    this.paused=false; this.deathStats=null;
    this.combatPressure=0;
    // Combo system
    this.comboCount=0; this.comboTimer=0; this.comboMul=1;
    this.spawnLevel();
    this.loop=this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  spawnLevel(){
    this.enemies=[]; this.playerBullets=[]; this.enemyBullets=[];
    this.pickups=[]; this.particles=[]; this.damageNumbers=[];
    this.world.rushTriggers.forEach(t=>t.done=false);

    for(const sp of this.world.enemySpawns){
      const e=new KP.Enemy(sp.x,0,sp.kind);
      e.setPatrol(sp.min,sp.max,sp.floorY);
      this.applyBiomeScaling(e);
      this.enemies.push(e);
    }

    // Pickups — varied positions per level
    const ammoTypes=Object.keys(KP.Balance.ammoTypes);
    const seed=this.levelIndex*17;
    for(let n=0;n<14;n++){
      const type=n%3===0?'ammo':(n%5===0?'time':'money');
      const ammoType=type==='ammo'?ammoTypes[(n+seed)%ammoTypes.length]:null;
      const amount=type==='ammo'?(ammoType==='machinegun'?22:ammoType==='fuel'?18:ammoType==='shells'?4:8):(type==='time'?8:(KP.Utils.rand(2,8)|0));
      const px=350+n*160+(n%3)*40+(seed%20);
      this.pickups.push(new KP.Pickup(px,455,type,amount,ammoType));
    }
    this.toast(`Локация: ${this.world.biomeName()}. Отряд занял позиции.`);
  }

  applyBiomeScaling(e){
    const boss=KP.Balance.enemies[e.kind]&&KP.Balance.enemies[e.kind].role==='boss';
    const hpScale=1+this.levelIndex*(boss?0.28:0.22);
    const dmgScale=1+this.levelIndex*(boss?0.20:0.17);
    const speedScale=1+this.levelIndex*(boss?0.06:0.10);
    e.hp=Math.round(e.hp*hpScale); e.maxHp=e.hp;
    e.hitTime=Math.round(e.hitTime*dmgScale);
    e.dmg=Math.round(e.dmg*dmgScale);
    e.speed=+(e.speed*speedScale).toFixed(4);
    e.xp=Math.round(e.xp*(1+this.levelIndex*.14));
    e.moneyRange=e.moneyRange.map(v=>Math.round(v*(1+this.levelIndex*.18)));
  }

  loop(){
    this.update();
    this.draw();
    this.input.tick();
    requestAnimationFrame(this.loop);
  }

  update(){
    if(this.input.wasPressed('restart')){ this.restart(); return; }
    if(this.ui.intro){ this.updateIntroMenu(); return; }
    if(this.ui.ending||this.player.dead){
      // Record death stats once
      if(this.player.dead&&!this.deathStats){
        this.deathStats={ kills:this.kills, biome:this.world.biomeName(), biomeIndex:this.levelIndex, level:this.player.level, maxCombo:this.maxCombo };
      }
      return;
    }

    // Pause toggle
    if(this.input.wasPressed('esc')){ this.paused=!this.paused; }
    if(this.paused) return;

    if(this.toastTimer>0) this.toastTimer--;
    if(this.levelTransition>0){
      this.levelTransition--;
      if(this.levelTransition===1) this.loadNextLevel();
      return;
    }
    if(this.timeStopFrames>0) this.timeStopFrames--;

    // Combo decay
    if(this.comboTimer>0){ this.comboTimer--; }
    else { this.comboCount=0; this.comboMul=1; }

    // Combat pressure: extra time decay when enemies are nearby
    const nearEnemy=this.enemies.some(e=>e.alive&&Math.abs(e.x-this.player.x)<280&&Math.abs(e.y-this.player.y)<160);
    if(nearEnemy&&this.timeStopFrames<=0){
      this.combatPressure=Math.min(120,this.combatPressure+3);
      this.player.time=KP.Utils.clamp(this.player.time-KP.Balance.player.combatDecayBonus,0,this.player.maxTime);
    } else {
      this.combatPressure=Math.max(0,this.combatPressure-2);
    }

    if(this.ui.shopOpen){ this.shopInput(); return; }
    if(this.input.wasPressed('interact')){
      const openedUi=this.interact();
      if(openedUi){ this.updateCamera(); this.updateParticles(); return; }
    }

    this.player.update(this);
    this.updateCamera();
    this.checkPortal();
    this.checkRush();
    this.updateEnemies();
    this.resolveEntityCollisions();
    this.updateBullets();
    this.updatePickups();
    this.updateParticles();
    this.updateDamageNumbers();
  }

  // Called when player hits an enemy (bullet or melee)
  registerHit(dmg=0){
    this.comboCount++;
    this.comboTimer=KP.Balance.player.combo.window;
    const t=KP.Balance.player.combo.thresholds;
    const m=KP.Balance.player.combo.multipliers;
    let mul=m[0];
    for(let i=t.length-1;i>=0;i--) if(this.comboCount>=t[i]){ mul=m[i]; break; }
    this.comboMul=mul;
    if(mul>this.maxCombo) this.maxCombo=mul;
  }

  startGame(){
    this.ui.intro=false; this.ui.controlsOpen=false;
    this.audio.play('menuStart',1);
    this.audio.playMusic(true);
    this.toast('Операция началась. Музыка включена, плесень предупреждена.');
  }

  updateIntroMenu(){
    if(this.input.wasPressed('up')||this.input.wasPressed('left')){
      this.ui.menuIndex=(this.ui.menuIndex+this.ui.menuItems.length-1)%this.ui.menuItems.length;
      this.ui.controlsOpen=false;
      this.audio.play('pickupAmmo',1.14,.32);
    }
    if(this.input.wasPressed('downAct')||this.input.wasPressed('right')){
      this.ui.menuIndex=(this.ui.menuIndex+1)%this.ui.menuItems.length;
      this.ui.controlsOpen=false;
      this.audio.play('pickupAmmo',1.08,.32);
    }
    if(this.input.wasPressed('esc')&&this.ui.controlsOpen){
      this.ui.controlsOpen=false;
      this.audio.play('pickupTime',.94,.32);
    }
    const confirm=this.input.wasPressed('start')||this.input.wasPressed('attack')||this.input.wasPressed('interact');
    if(!confirm) return;
    if(this.ui.menuItems[this.ui.menuIndex]==='start'){ this.startGame(); return; }
    this.ui.controlsOpen=!this.ui.controlsOpen;
    this.audio.play(this.ui.controlsOpen?'pickupTime':'pickupAmmo',1,.34);
  }

  restart(){
    this.levelIndex=0;
    this.world=new KP.World(this.levelIndex);
    this.player.reset();
    this.kills=0; this.maxCombo=1;
    this.comboCount=0; this.comboTimer=0; this.comboMul=1;
    this.combatPressure=0;
    this.ui.intro=true; this.ui.ending=false;
    this.ui.shopOpen=null; this.ui.inventoryOpen=false;
    this.ui.menuIndex=1; this.ui.controlsOpen=false;
    this.timeStopFrames=0; this.levelTransition=0;
    this.cameraX=0; this.cameraY=0;
    this.paused=false; this.deathStats=null;
    this.audio.stopMusic(true);
    this.spawnLevel();
    this.toast('Рестарт. Отряд собирается заново.');
  }

  loadNextLevel(){
    if(this.levelIndex>=this.world.biomes.length-1){ this.ui.ending=true; return; }
    this.levelIndex++;
    this.world=new KP.World(this.levelIndex);
    this.player.x=80; this.player.y=380;
    this.player.vx=0; this.player.vy=0;
    this.player.jumpsLeft=this.player.abilities.doubleJump?2:1;
    this.cameraX=0; this.cameraY=0; this.timeStopFrames=0;
    this.comboCount=0; this.comboTimer=0; this.comboMul=1;
    this.spawnLevel();
    this.audio.play('portal',1);
    const ability=(KP.Balance.abilityUnlocks||[])[this.levelIndex];
    if(ability) this.player.unlockAbility(ability.id,this);
  }

  checkPortal(){
    if(!this.world.portal) return;
    if(KP.Utils.rects(this.player,this.world.portal)){
      const bossAlive=this.enemies.some(e=>e.alive&&KP.Balance.enemies[e.kind]&&KP.Balance.enemies[e.kind].role==='boss');
      if(bossAlive){ this.toast('Сначала убей босса биома. Выход не любит незавершённые перевороты.'); this.player.x=this.world.portal.x-80; return; }
      if(this.levelIndex>=this.world.biomes.length-1){ this.ui.ending=true; return; }
      this.levelTransition=45;
      this.toast('Переход в следующий биом. Пейзаж меняется, долг перед историей остаётся.');
    }
  }

  checkRush(){
    const rushKinds=[
      ['runner','zombie','pistol'],
      ['runner','pistol','gunner'],
      ['horse','runner','pistol'],
      ['horse','gunner','miniboss'],
      ['horse','gunner','tank'],
      ['miniboss','horse','gunner','tank']
    ];
    for(const t of this.world.rushTriggers) if(!t.done&&this.player.x>t.x){
      t.done=true;
      const wave=t.wave||0;
      const kinds=rushKinds[this.levelIndex]||rushKinds[0];
      const count=3+wave*2+Math.min(3,this.levelIndex);
      const min=KP.Utils.clamp(this.player.x+180,760,this.world.worldW-600);
      const max=Math.min(min+480,this.world.worldW-120);
      const messages=['Противник давит!','Волна подкрепления!','Последний рубеж!'];
      this.toast(messages[wave]||'Ещё одна волна!');
      for(let i=0;i<count;i++){
        const kind=kinds[i%kinds.length];
        const e=new KP.Enemy(min+30+i*60,0,kind);
        e.setPatrol(min,max,485);
        this.applyBiomeScaling(e);
        e.aggro('Атака!');
        this.enemies.push(e);
      }
    }
  }

  updateEnemies(){
    if(this.timeStopFrames>0){
      for(const e of this.enemies){ e.vx=0; e.vy=0; }
      return;
    }
    for(const e of this.enemies) if(this.visible(e,1000,500)) e.update(this);
    this.enemies=this.enemies.filter(e=>e.alive);
  }

  resolveEntityCollisions(){
    const pushApart=(a,b,playerInvolved=false)=>{
      if(!a.alive||!b.alive||!KP.Utils.rects(a,b)) return;
      const ac=KP.Utils.center(a), bc=KP.Utils.center(b);
      const overlapX=(a.w+b.w)/2-Math.abs(ac.x-bc.x);
      const overlapY=(a.h+b.h)/2-Math.abs(ac.y-bc.y);
      if(overlapX<=0||overlapY<=0||overlapX>=overlapY) return;
      const dir=ac.x<bc.x?-1:1;
      const amount=playerInvolved?overlapX+.6:overlapX*.55;
      if(this.timeStopFrames>0&&(a===this.player||b===this.player)){
        if(a===this.player) a.x+=dir*amount; else b.x-=dir*amount;
      } else if(a===this.player){
        a.x+=dir*amount; b.x-=dir*overlapX*.25;
      } else if(b===this.player){
        b.x-=dir*amount; a.x+=dir*overlapX*.25;
      } else {
        a.x+=dir*amount*.5; b.x-=dir*amount*.5;
      }
      a.vx*=.35; b.vx*=.35;
    };
    for(const e of this.enemies) pushApart(this.player,e,true);
    for(let i=0;i<this.enemies.length;i++) for(let j=i+1;j<this.enemies.length;j++) pushApart(this.enemies[i],this.enemies[j],false);
    this.world.collide(this.player);
    for(const e of this.enemies) this.world.collide(e);
  }

  updateBullets(){
    for(const b of this.playerBullets) b.update();
    if(this.timeStopFrames<=0) for(const b of this.enemyBullets) b.update();

    for(const b of this.playerBullets){
      if(!b.alive) continue;
      // Check crates
      for(const c of this.world.crates){
        if(c.alive&&KP.Utils.rects(b,c)){
          c.takeDamage(this); b.alive=false; break;
        }
      }
      if(!b.alive) continue;
      for(const e of this.enemies) if(e.alive&&KP.Utils.rects(b,e)){
        e.takeDamage(b.dmg,b.knock,b.x,{burn:b.burn,burnDps:b.burnDps,targetX:this.player.x+this.player.w/2},this);
        this.registerHit(b.dmg);
        if(!b.pierce) b.alive=false;
        this.damageNumbers.push(new KP.DamageNumber(e.x+e.w/2,e.y,b.dmg,b.dmg>50));
        this.onEnemyHit(e,true,b.dmg);
        break;
      }
    }
    for(const b of this.enemyBullets){
      if(!b.alive) continue;
      if(KP.Utils.rects(b,this.player)){
        b.alive=false; this.player.hurt(b.dmg,b.x<this.player.x?1:-1,this);
      }
    }
    this.playerBullets=this.playerBullets.filter(b=>b.alive&&this.visible(b,350,220));
    this.enemyBullets=this.enemyBullets.filter(b=>b.alive&&this.visible(b,350,220));
  }

  onEnemyHit(e,fromPlayer=true,dmg=0){
    if(!e.alive&&!e.counted){
      this.audio.play('enemyDown',0.95+Math.random()*0.08);
      e.counted=true; this.kills++;
      const m=KP.Utils.rand(e.moneyRange[0],e.moneyRange[1])|0;
      this.player.gainXP(this,e.xp);
      this.pickups.push(new KP.Pickup(e.x+e.w/2,e.y+e.h/2,'money',m));
      // Ammo drop — prefer weapons in player's inventory
      if(Math.random()<.45){
        const inv=this.player.inventory;
        const allTypes=Object.keys(KP.Balance.ammoTypes);
        const relevant=allTypes.filter(at=>inv.some(id=>KP.Balance.weapons[id]&&KP.Balance.weapons[id].ammoType===at));
        const at=(relevant.length?relevant:allTypes)[Math.floor(Math.random()*(relevant.length||allTypes.length))];
        const qty=at==='machinegun'?18:at==='fuel'?14:at==='shells'?3:7;
        this.pickups.push(new KP.Pickup(e.x+10,e.y,'ammo',qty,at));
      }
      if(Math.random()<.20) this.pickups.push(new KP.Pickup(e.x+20,e.y,'time',8));
      if(e.kind==='lenin'){ this.ui.ending=true; this.toast('Ленин повержен. Время снова потекло вперёд.'); }
      return;
    }
    if(e.alive) this.audio.play('enemyHit',0.96+Math.random()*0.1,.85);
  }

  updatePickups(){
    for(const p of this.pickups){
      p.update(this);
      if(KP.Utils.rects(p,this.player)){
        if(p.type==='money') this.player.money+=p.amount;
        if(p.type==='ammo') this.player.addAmmo(p.ammoType||'rifle',p.amount);
        if(p.type==='time') this.player.time=KP.Utils.clamp(this.player.time+p.amount,0,this.player.maxTime);
        this.audio.playPickup(p.type); p.alive=false;
      }
    }
    this.pickups=this.pickups.filter(p=>p.alive);
  }

  updateParticles(){
    for(const p of this.particles) p.update();
    this.particles=this.particles.filter(p=>p.life>0).slice(-240);
  }

  updateDamageNumbers(){
    for(const d of this.damageNumbers) d.update();
    this.damageNumbers=this.damageNumbers.filter(d=>d.life>0).slice(-40);
  }

  updateCamera(){
    this.cameraX=KP.Utils.clamp(this.player.x-390,0,this.world.worldW-this.canvas.width);
    this.cameraY=KP.Utils.clamp(this.player.y-330,0,this.world.worldH-this.canvas.height);
  }

  interact(){
    for(const s of this.world.shops) if(KP.Utils.near(this.player,s,125,130)){
      this.ui.shopOpen=s; this.toast('Магазин открыт. Снабженец снова на смене.'); return true;
    }
    for(const c of this.world.chests) if(!c.open&&KP.Utils.near(this.player,c,90,95)){
      c.open=true; this.openChest(c); return false;
    }
    this.toast('Рядом нет объекта для E. Кнопка пока не научилась открывать воздух.');
    return false;
  }

  openChest(c){
    if(c.loot==='money'){ this.player.money+=45; this.toast('+45 денег из сундука. Происхождение не уточняем.'); }
    else if(c.loot==='ammo'){ this.player.addAmmo('rifle',12); this.player.addAmmo('pistol',18); this.toast('+патроны (винтовка + пистолет).'); }
    else { if(!this.player.inventory.includes(c.loot)) this.player.inventory.push(c.loot); this.toast('Найдено оружие: '+KP.Balance.weapons[c.loot].name); }
  }

  shopInput(){
    if(this.input.wasPressed('interact')||this.input.wasPressed('esc')){ this.ui.shopOpen=null; return; }
    const buy=(id,cost)=>{
      if(this.player.money<cost) return this.toast('Не хватает денег. Даже плесень богаче.');
      this.player.money-=cost;
      if(id==='time') this.player.time=KP.Utils.clamp(this.player.time+KP.Balance.shop.timeAmount,0,this.player.maxTime);
      else if(id==='ammo'){
        const w=KP.Balance.weapons[this.player.weapon];
        const at=w.ammoType||'rifle';
        this.player.addAmmo(at,KP.Balance.ammoTypes[at].buyAmount);
      } else if(!this.player.inventory.includes(id)) this.player.inventory.push(id);
      this.toast(id==='time'?`+${KP.Balance.shop.timeAmount} времени`:id==='ammo'?'боеприпасы куплены':'Куплено: '+KP.Balance.weapons[id].name);
    };
    if(this.input.wasPressed('one')) buy('time',KP.Balance.shop.timePrice);
    if(this.input.wasPressed('two')){ const w=KP.Balance.weapons[this.player.weapon]; const at=w.ammoType||'rifle'; buy('ammo',KP.Balance.ammoTypes[at].price); }
    if(this.input.wasPressed('three')) buy('smg',KP.Balance.weapons.smg.price);
    if(this.input.wasPressed('four')) buy('flamethrower',KP.Balance.weapons.flamethrower.price);
    if(this.input.wasPressed('five')) buy('sabre',KP.Balance.weapons.sabre.price);
    if(this.input.wasPressed('six')) buy('shotgun',KP.Balance.weapons.shotgun.price);
  }

  burst(x,y,color,count){
    for(let i=0;i<count;i++) this.particles.push(new KP.Particle(x,y,color));
  }

  toast(t){ this.toastText=t; this.toastTimer=200; }

  visible(o,padX=100,padY=120){
    return o.x+o.w>this.cameraX-padX&&o.x<this.cameraX+this.canvas.width+padX&&o.y+o.h>this.cameraY-padY&&o.y<this.cameraY+this.canvas.height+padY;
  }

  draw(){
    const ctx=this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    ctx.save();
    ctx.translate(-this.cameraX,-this.cameraY);
    this.world.draw(ctx,this.cameraX,this.cameraY,this.canvas.width,this.canvas.height,this.assets);
    for(const p of this.pickups) if(this.visible(p)) p.draw(ctx);
    for(const b of this.playerBullets) b.draw(ctx);
    for(const b of this.enemyBullets) b.draw(ctx);
    for(const e of this.enemies) if(this.visible(e)) e.draw(ctx,this.assets);
    this.player.draw(ctx,this.assets);
    for(const p of this.particles) p.draw(ctx);
    for(const d of this.damageNumbers) d.draw(ctx);
    if(this.timeStopFrames>0){
      ctx.fillStyle='rgba(101,232,255,.10)';
      ctx.fillRect(this.cameraX,this.cameraY,this.canvas.width,this.canvas.height);
    }
    ctx.restore();
    this.ui.draw(this);
  }
};

window.addEventListener('DOMContentLoaded',()=>{
  const game=new KP.Game();
  window.__KP_GAME__=game;
  const placePlayerNearGround=()=>{
    game.player.y=Math.min(game.player.y,game.world.platforms.find(p=>p.type==='ground').y-game.player.h);
    game.player.vx=0; game.player.vy=0; game.updateCamera();
  };
  const spawnEnemyNearPlayer=(kind='zombie',offsetX=220)=>{
    const x=KP.Utils.clamp(game.player.x+offsetX,140,game.world.worldW-180);
    const e=new KP.Enemy(x,0,kind);
    const floorY=485;
    const min=KP.Utils.clamp(x-180,80,game.world.worldW-320);
    const max=KP.Utils.clamp(x+180,260,game.world.worldW-60);
    e.setPatrol(min,max,floorY); game.applyBiomeScaling(e); e.aggro('Debug contact');
    game.enemies.push(e); return e;
  };
  window.KP_TEST={
    getGame(){ return window.__KP_GAME__; },
    startGame(){ if(game&&game.ui&&game.ui.intro) game.startGame(); },
    tick(frames=1){ for(let i=0;i<frames;i++) game.update(); },
    spawnEnemy(kind='zombie',offsetX=220){ return spawnEnemyNearPlayer(kind,offsetX); },
    clearEnemies(){ game.enemies=[]; game.enemyBullets=[]; return true; },
    listBiomes(){ return [...game.world.biomes]; },
    goToBiome(index){
      const max=game.world.biomes.length-1;
      const safe=KP.Utils.clamp(index|0,0,max);
      game.levelIndex=safe; game.world=new KP.World(safe);
      game.player.x=80; game.player.y=380; game.player.dead=false;
      game.ui.ending=false; game.ui.shopOpen=null; game.ui.inventoryOpen=false;
      game.timeStopFrames=0; game.levelTransition=0;
      game.spawnLevel(); placePlayerNearGround(); return safe;
    },
    nextBiome(){ return this.goToBiome(game.levelIndex+1); },
    prevBiome(){ return this.goToBiome(game.levelIndex-1); },
    movePlayer(x,y=null){
      game.player.x=KP.Utils.clamp(Number(x)||0,0,game.world.worldW-game.player.w);
      if(y!==null) game.player.y=KP.Utils.clamp(Number(y)||0,0,game.world.worldH-game.player.h);
      placePlayerNearGround(); return {x:game.player.x,y:game.player.y};
    },
    snapshot(){
      return {
        intro:game.ui.intro, levelIndex:game.levelIndex, biome:game.world.biomeName(),
        menuIndex:game.ui.menuIndex, controlsOpen:game.ui.controlsOpen,
        player:{x:game.player.x,y:game.player.y,time:game.player.time,weapon:game.player.weapon},
        enemies:game.enemies.map(e=>({kind:e.kind,x:e.x,y:e.y,state:e.state,memoryTimer:e.memoryTimer,underFireTimer:e.underFireTimer,alive:e.alive})),
        bullets:{player:game.playerBullets.length,enemy:game.enemyBullets.length}
      };
    }
  };
});
