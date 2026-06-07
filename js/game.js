'use strict';
window.KP = window.KP || {};
KP.VERSION = 'V 1.3.0';
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
    this.clouds=[]; this.pickups=[]; this.particles=[]; this.damageNumbers=[];
    this.kills=0; this.maxCombo=1;
    this.toastText=''; this.toastTimer=0;
    this.timeStopFrames=0; this.levelTransition=0;
    this.paused=false; this.deathStats=null;
    this.combatPressure=0;
    this.biomeEntryHeroLevel=1;
    this.playerShotSignal={x:0,y:0,radius:0,timer:0,weaponType:null};
    this.frameId=0;
    this.comboCount=0; this.comboTimer=0; this.comboMul=1;
    // Эффекты «сочности»
    this.hitStopFrames=0; this.shakeFrames=0; this.shakeMag=0;
    this.gibs=[]; this.bloodSplatters=[];
    // Волны и чекпойнты
    this.waveObjective=null;
    this.checkpoint=null;
    this.spawnLevel();
    this.loop=this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  // --- Эффекты экрана ---
  hitStop(frames){ this.hitStopFrames=Math.max(this.hitStopFrames,frames); }
  shake(frames,mag){ this.shakeFrames=Math.max(this.shakeFrames,frames); this.shakeMag=Math.max(this.shakeMag,mag); }
  addBlood(count=6,color='rgba(150,10,10,'){
    for(let i=0;i<count;i++){
      const ang=Math.random()*Math.PI*2, dist=Math.random()*0.5;
      this.bloodSplatters.push({
        x:512+Math.cos(ang)*dist*420, y:288+Math.sin(ang)*dist*240,
        r:14+Math.random()*40, life:90+Math.random()*60, maxLife:150, color
      });
    }
    if(this.bloodSplatters.length>60) this.bloodSplatters=this.bloodSplatters.slice(-60);
  }
  spawnGibs(x,y,color,count=10){
    for(let i=0;i<count;i++) this.gibs.push(new KP.Gib(x,y,color));
  }

  spawnLevel(){
    this.enemies=[]; this.playerBullets=[]; this.enemyBullets=[];
    this.clouds=[]; this.pickups=[]; this.particles=[]; this.damageNumbers=[];
    this.gibs=[]; this.bloodSplatters=[]; this.waveObjective=null;
    this.hitStopFrames=0; this.shakeFrames=0; this.shakeMag=0;
    this.world.rushTriggers.forEach(t=>{ t.done=false; t.warnTimer=undefined; });
    if(Array.isArray(this.world.tutorialHints)) this.world.tutorialHints.forEach(t=>t.done=false);

    for(const sp of this.world.enemySpawns){
      const e=new KP.Enemy(sp.x,0,sp.kind);
      e.setPatrol(sp.min,sp.max,sp.floorY,sp.platformType||'ground');
      this.applyBiomeScaling(e);
      this.enemies.push(e);
    }

    const ammoTypes=Object.keys(KP.Balance.ammoTypes);
    const seed=this.levelIndex*17;
    for(let n=0;n<14;n++){
      const type=n%4===0?'ammo':(n%6===0?'time':'money');
      const ammoType=type==='ammo'?ammoTypes[(n+seed)%ammoTypes.length]:null;
      const amount=type==='ammo'
        ?(ammoType==='machinegun'?22:ammoType==='fuel'?18:ammoType==='gas'?12:ammoType==='shells'?4:8)
        :(type==='time'?8:(KP.Utils.rand(2,8)|0));
      const px=350+n*160+(n%3)*40+(seed%20);
      this.pickups.push(new KP.Pickup(px,455,type,amount,ammoType));
    }
    this.toast(`Локация: ${this.world.biomeName()}. Отряд занял позиции.`);
  }

  applyBiomeScaling(e){
    const boss=KP.Balance.enemies[e.kind]&&KP.Balance.enemies[e.kind].role==='boss';
    const entryLevel=Math.max(1,this.biomeEntryHeroLevel||1);
    const levelBoost=Math.max(0,entryLevel-1);
    const hpScale=1+this.levelIndex*(boss?0.18:0.14)+levelBoost*(boss?0.2:0.16);
    const dmgScale=1+this.levelIndex*(boss?0.14:0.11)+levelBoost*(boss?0.13:0.10);
    const speedScale=1+this.levelIndex*(boss?0.05:0.09)+levelBoost*(boss?0.015:0.02);
    e.hp=Math.round(e.hp*hpScale); e.maxHp=e.hp;
    e.hitTime=Math.round(e.hitTime*dmgScale);
    e.dmg=Math.round(e.dmg*dmgScale);
    e.speed=e.speed>0?+(e.speed*speedScale).toFixed(4):0;
    e.xp=Math.round(e.xp*(1+this.levelIndex*.14));
    e.moneyRange=e.moneyRange.map(v=>Math.round(v*(1+this.levelIndex*.18)));
    e.enemyLevel=entryLevel;
  }

  loop(){
    this.update();
    this.draw();
    this.input.tick();
    requestAnimationFrame(this.loop);
  }

  update(){
    this.frameId++;
    if(this.input.wasPressed('restart')){ this.restart(); return; }
    if(this.ui.intro){ this.updateIntroMenu(); return; }
    if(this.ui.ending||this.player.dead){
      if(this.player.dead&&!this.deathStats){
        this.deathStats={ kills:this.kills, biome:this.world.biomeName(), biomeIndex:this.levelIndex, level:this.player.level, maxCombo:this.maxCombo, money:this.player.money };
      }
      return;
    }

    if(this.input.wasPressed('esc')) this.paused=!this.paused;
    if(this.paused) return;

    // Hit-stop: на пару кадров замираем для «веса» удара, но анимация эффектов идёт.
    if(this.hitStopFrames>0){
      this.hitStopFrames--;
      this.updateParticles();
      this.updateDamageNumbers();
      return;
    }

    if(this.toastTimer>0) this.toastTimer--;
    if(this.levelTransition>0){
      this.levelTransition--;
      if(this.levelTransition===1) this.loadNextLevel();
      return;
    }
    if(this.timeStopFrames>0) this.timeStopFrames--;
    if(this.playerShotSignal.timer>0) this.playerShotSignal.timer--;

    if(this.comboTimer>0) this.comboTimer--;
    else { this.comboCount=0; this.comboMul=1; }

    this.updateWaveObjective();

    const nearEnemy=this.enemies.some(e=>e.alive&&Math.abs(e.x-this.player.x)<280&&Math.abs(e.y-this.player.y)<160);
    if(nearEnemy&&this.timeStopFrames<=0){
      this.combatPressure=Math.min(120,this.combatPressure+3);
    } else {
      this.combatPressure=Math.max(0,this.combatPressure-2);
    }

    if(this.ui.shopOpen){ this.shopInput(); return; }
    if(this.input.wasPressed('interact')){
      const openedUi=this.interact();
      if(openedUi){ this.updateCamera(); this.updateParticles(); return; }
    }

    this.player.update(this);
    this.updateDodgeCollisions();
    this.updateCamera();
    this.checkTutorial();
    this.checkPortal();
    this.checkRush();
    this.updateEnemies();
    this.resolveEntityCollisions();
    this.updateBullets();
    this.updateClouds();
    this.updatePickups();
    this.updateParticles();
    this.updateDamageNumbers();
  }

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
    this.ui.shopAmmoOpen=false;
    this.audio.play('menuStart',1);
    this.audio.playMusic(true);
    this.saveCheckpoint();
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
    // Из меню/финала или без чекпойнта — полный сброс; иначе откат на начало текущего биома.
    if(this.ui.ending||this.ui.intro||!this.checkpoint){ this.fullReset(); return; }
    this.restoreCheckpoint();
  }

  fullReset(){
    this.levelIndex=0;
    this.world=new KP.World(this.levelIndex);
    this.player.reset();
    this.biomeEntryHeroLevel=this.player.level;
    this.kills=0; this.maxCombo=1;
    this.comboCount=0; this.comboTimer=0; this.comboMul=1;
    this.combatPressure=0;
    this.checkpoint=null;
    this.ui.intro=true; this.ui.ending=false;
    this.ui.shopOpen=null; this.ui.inventoryOpen=false;
    this.ui.shopAmmoOpen=false;
    this.ui.menuIndex=1; this.ui.controlsOpen=false;
    this.timeStopFrames=0; this.levelTransition=0;
    this.cameraX=0; this.cameraY=0;
    this.paused=false; this.deathStats=null;
    this.audio.stopMusic(true);
    this.spawnLevel();
    this.toast('Рестарт. Отряд собирается заново.');
  }

  // Сохраняем прогресс на входе в биом.
  saveCheckpoint(){
    const p=this.player;
    this.checkpoint={
      levelIndex:this.levelIndex,
      level:p.level, xp:p.xp, xpNext:p.xpNext, maxTime:p.maxTime,
      money:p.money, weapon:p.weapon,
      inventory:[...p.inventory],
      utilitySlots:[...p.utilitySlots],
      items:{...p.items},
      ammoBag:{...p.ammoBag}, maxAmmoBag:{...p.maxAmmoBag},
      abilities:{...p.abilities},
      kills:this.kills, maxCombo:this.maxCombo
    };
  }

  restoreCheckpoint(){
    const c=this.checkpoint;
    this.levelIndex=c.levelIndex;
    this.world=new KP.World(this.levelIndex);
    this.player.reset();
    const p=this.player;
    p.level=c.level; p.xp=c.xp; p.xpNext=c.xpNext; p.maxTime=c.maxTime;
    p.time=c.maxTime; // на чекпойнте здоровье полное
    p.money=c.money; p.weapon=c.weapon;
    p.inventory=[...c.inventory];
    p.utilitySlots=[...c.utilitySlots];
    p.items={...c.items};
    p.ammoBag={...c.ammoBag}; p.maxAmmoBag={...c.maxAmmoBag};
    p.abilities={...c.abilities};
    p.x=80; p.y=380; p.dead=false;
    this.biomeEntryHeroLevel=p.level;
    this.kills=c.kills; this.maxCombo=c.maxCombo;
    this.comboCount=0; this.comboTimer=0; this.comboMul=1;
    this.combatPressure=0;
    this.ui.intro=false; this.ui.ending=false;
    this.ui.shopOpen=null; this.ui.inventoryOpen=false; this.ui.shopAmmoOpen=false;
    this.timeStopFrames=0; this.levelTransition=0;
    this.cameraX=0; this.cameraY=0;
    this.paused=false; this.deathStats=null;
    this.spawnLevel();
    this.toast(`Чекпойнт: заново с биома «${this.world.biomeName()}».`);
  }

  loadNextLevel(){
    if(this.levelIndex>=this.world.biomes.length-1){ this.ui.ending=true; return; }
    this.levelIndex++;
    this.world=new KP.World(this.levelIndex);
    this.biomeEntryHeroLevel=this.player.level;
    this.player.x=80; this.player.y=380;
    this.player.vx=0; this.player.vy=0;
    this.player.jumpsLeft=this.player.abilities.doubleJump?2:1;
    this.cameraX=0; this.cameraY=0; this.timeStopFrames=0;
    this.ui.shopAmmoOpen=false;
    this.comboCount=0; this.comboTimer=0; this.comboMul=1;
    this.spawnLevel();
    this.audio.play('portal',1);
    const ability=(KP.Balance.abilityUnlocks||[])[this.levelIndex];
    if(ability) this.player.unlockAbility(ability.id,this);
    this.saveCheckpoint();
  }

  checkPortal(){
    if(!this.world.portal) return;
    if(KP.Utils.rects(this.player,this.world.portal)){
      const bossAlive=this.enemies.some(e=>e.alive&&KP.Balance.enemies[e.kind]&&KP.Balance.enemies[e.kind].role==='boss');
      if(bossAlive){ this.toast('Сначала убей босса биома.'); this.player.x=this.world.portal.x-80; return; }
      if(this.levelIndex>=this.world.biomes.length-1){ this.ui.ending=true; return; }
      this.levelTransition=45;
      this.toast('Переход в следующий биом.');
    }
  }

  checkRush(){
    for(const t of this.world.rushTriggers){
      if(t.done) continue;
      if(t.warnTimer===undefined){
        // Игрок подошёл к точке раша — ставим часы и запускаем отсчёт.
        if(this.player.x>t.x-420&&this.player.x<t.x+160){
          t.warnTimer=150; t.warnMax=150;
          t.clockX=KP.Utils.clamp(this.player.x+300,t.x,this.world.worldW-220);
          t.clockY=455;
          this.toast('Тревога! Где появились часы — скоро накатит волна.');
          this.audio.play('portal',0.9,.5);
        }
        continue;
      }
      if(t.warnTimer>0){
        t.warnTimer--;
        if(t.warnTimer<=0){ t.done=true; this.spawnRushWave(t); }
      }
    }
  }

  spawnRushWave(t){
    const rushKinds=[
      ['runner','zombie','pistol'],
      ['runner','pistol','gasman'],
      ['horse','runner','rifleman','sabreur'],
      ['horse','gunner','gasman','kamikaze'],
      ['rifleman','gasman','maxim','shielder'],
      ['miniboss','horse','maxim','shielder','kamikaze','sabreur']
    ];
    const wave=t.wave||0;
    const kinds=rushKinds[this.levelIndex]||rushKinds[0];
    const count=3+wave*2+Math.min(3,this.levelIndex);
    const min=KP.Utils.clamp((t.clockX||this.player.x+180)-180,760,this.world.worldW-600);
    const max=Math.min(min+480,this.world.worldW-120);
    const messages=['Противник давит!','Волна подкрепления!','Последний рубеж!'];
    this.toast(messages[wave]||'Ещё одна волна!');
    this.audio.play('enemyDown',0.7,.6);
    this.shake(10,4);
    for(let i=0;i<count;i++){
      const kind=kinds[i%kinds.length];
      const e=new KP.Enemy(min+30+i*60,0,kind);
      e.setPatrol(min,max,485);
      this.applyBiomeScaling(e);
      e.aggro('Атака!');
      e.fromWave=true;
      this.enemies.push(e);
      this.burst(e.x+e.w/2,e.y+e.h/2,'#ffd21c',8);
    }
    this.startWaveObjective(wave,count);
  }

  startWaveObjective(wave,count){
    // Чередуем мини-цели: перебить всю волну / продержаться.
    if(wave%2===0){
      this.waveObjective={type:'kill',target:count,progress:0,done:false};
    } else {
      const frames=480; // ~8 секунд
      this.waveObjective={type:'survive',timeLeft:frames,maxTime:frames,done:false};
    }
  }

  updateEnemies(){
    if(this.timeStopFrames>0){
      for(const e of this.enemies){ e.vx=0; e.vy=0; }
      return;
    }
    for(const e of this.enemies) if(this.visible(e,1000,500)) e.update(this);
    this.enemies=this.enemies.filter(e=>e.alive||e.deathTimer>0);
  }

  inventoryInput(){
    if(this.input.wasPressed('inventory')||this.input.wasPressed('esc')){
      this.ui.inventoryOpen=false;
      return;
    }
    if(this.input.wasPressed('weaponNext')){
      this.player.nextWeapon(this);
      return;
    }
    const slots=[['one','pistol'],['two','mosin'],['three','smg'],['four','gasSprayer'],['five','sabre'],['six','shotgun']];
    for(const [act,id] of slots) if(this.input.wasPressed(act)&&this.player.inventory.includes(id)){
      this.player.weapon=id;
      this.toast('Оружие: '+KP.Balance.weapons[id].name);
      return;
    }
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
      const damp=playerInvolved?0.38:0.92;
      a.vx*=damp; b.vx*=damp;
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
        b.alive=false;
        this.player.hurt(b.dmg,b.x<this.player.x?1:-1,this);
      }
    }
    this.playerBullets=this.playerBullets.filter(b=>b.alive&&this.visible(b,350,220));
    this.enemyBullets=this.enemyBullets.filter(b=>b.alive&&this.visible(b,350,220));
  }

  spawnGasCloud(owner,x,y,opts={}){
    this.clouds.push(new KP.GasCloud(owner,x,y,opts));
  }

  updateClouds(){
    for(const cloud of this.clouds) cloud.update(this);
    this.clouds=this.clouds.filter(cloud=>cloud.alive);
  }

  onEnemyHit(e,fromPlayer=true,dmg=0){
    if(!e.alive&&!e.counted){
      this.audio.play('enemyDown',0.95+Math.random()*0.08);
      e.counted=true; this.kills++;
      this.deathFx(e);
      if(e.fromWave&&this.waveObjective&&this.waveObjective.type==='kill') this.waveObjective.progress++;
      const m=KP.Utils.rand(e.moneyRange[0],e.moneyRange[1])|0;
      this.player.gainXP(this,e.xp);
      this.pickups.push(new KP.Pickup(e.x+e.w/2,e.y+e.h/2,'money',m));
      if(Math.random()<.45){
        const inv=this.player.inventory;
        const allTypes=Object.keys(KP.Balance.ammoTypes);
        const relevant=allTypes.filter(at=>inv.some(id=>KP.Balance.weapons[id]&&KP.Balance.weapons[id].ammoType===at));
        const at=(relevant.length?relevant:allTypes)[Math.floor(Math.random()*(relevant.length||allTypes.length))];
        const qty=at==='machinegun'?18:at==='fuel'?14:at==='gas'?10:at==='shells'?3:7;
        this.pickups.push(new KP.Pickup(e.x+10,e.y,'ammo',qty,at));
      }
      if(Math.random()<.18) this.pickups.push(new KP.Pickup(e.x+20,e.y,'medkit',1));
      else if(Math.random()<.10) this.pickups.push(new KP.Pickup(e.x+20,e.y,'time',8));
      if(e.kind==='gasman'&&!this.player.items.gasMask&&Math.random()<.3) this.pickups.push(new KP.Pickup(e.x+16,e.y-8,'gasMask',1));
      if(e.kind==='lenin'){ this.ui.ending=true; this.toast('Ленин повержен. Время снова потекло вперёд.'); }
      return;
    }
    if(e.alive){
      this.audio.play('enemyHit',0.96+Math.random()*0.1,.85);
      if(fromPlayer&&dmg>=42) this.hitStop(1); // вес тяжёлого попадания
    }
  }

  // Эффект смерти врага: одних разрывает на части (гибы), другие пачкают экран кровью.
  deathFx(e){
    const cx=e.x+e.w/2, cy=e.y+e.h/2;
    const isBoss=KP.Balance.enemies[e.kind]&&KP.Balance.enemies[e.kind].role==='boss';
    const gibKinds=['zombie','runner','kamikaze','horse','sabreur'];
    if(isBoss){
      this.spawnGibs(cx,cy,'#7a3a2a',24);
      this.burst(cx,cy,'#ffd21c',26);
      this.addBlood(8,'rgba(140,12,12,');
      this.hitStop(7); this.shake(18,7);
    } else if(gibKinds.includes(e.kind)){
      const col=e.kind==='horse'?'#5b351d':e.kind==='kamikaze'?'#8b1a00':'#6fbf4a';
      this.spawnGibs(cx,cy,col,e.kind==='horse'?16:11);
      this.burst(cx,cy,col,8);
      this.hitStop(3); this.shake(7,4);
    } else {
      this.addBlood(7,'rgba(150,10,10,');
      this.burst(cx,cy,'#9a0f0f',14);
      this.hitStop(2); this.shake(4,3);
    }
  }

  updateWaveObjective(){
    const o=this.waveObjective;
    if(!o||o.done) return;
    if(o.type==='survive'){
      o.timeLeft--;
      if(o.timeLeft<=0) this.completeWaveObjective();
    } else if(o.type==='kill'){
      if(o.progress>=o.target) this.completeWaveObjective();
    }
  }

  completeWaveObjective(){
    const o=this.waveObjective;
    if(!o||o.done) return;
    o.done=true;
    const bonusMoney=18+this.levelIndex*6;
    this.player.money+=bonusMoney;
    this.player.heal(KP.Balance.player.healPickupAmount);
    this.toast(`Задача волны выполнена! +${bonusMoney} денег и немного здоровья.`);
    this.audio.play('pickupMoney',1.1);
    this.waveObjective=null;
  }

  updatePickups(){
    for(const p of this.pickups){
      p.update(this);
      if(KP.Utils.rects(p,this.player)){
        if(p.type==='money') this.player.money+=p.amount;
        if(p.type==='ammo') this.player.addAmmo(p.ammoType||'rifle',p.amount);
        if(p.type==='time') this.player.heal(p.amount);
        if(p.type==='heal'||p.type==='medkit') this.player.addItem('medkit',p.amount||1);
        if(p.type==='gasMask') this.player.addItem('gasMask',1);
        this.audio.playPickup(p.type);
        p.alive=false;
      }
    }
    this.pickups=this.pickups.filter(p=>p.alive);
  }

  updateParticles(){
    for(const p of this.particles) p.update();
    this.particles=this.particles.filter(p=>p.life>0).slice(-240);
    for(const g of this.gibs) g.update(this);
    this.gibs=this.gibs.filter(g=>g.life>0).slice(-120);
    for(const b of this.bloodSplatters) b.life--;
    this.bloodSplatters=this.bloodSplatters.filter(b=>b.life>0);
  }

  updateDamageNumbers(){
    for(const d of this.damageNumbers) d.update();
    this.damageNumbers=this.damageNumbers.filter(d=>d.life>0).slice(-40);
  }

  updateCamera(){
    this.cameraX=KP.Utils.clamp(this.player.x-390,0,this.world.worldW-this.canvas.width);
    this.cameraY=KP.Utils.clamp(this.player.y-330,0,this.world.worldH-this.canvas.height);
  }

  checkTutorial(){
    if(!Array.isArray(this.world.tutorialHints)) return;
    for(const hint of this.world.tutorialHints){
      if(hint.done) continue;
      if(this.player.x>=hint.x){
        hint.done=true;
        this.toast(hint.text);
      }
    }
  }

  interact(){
    for(const s of this.world.shops) if(KP.Utils.near(this.player,s,125,130)){
      this.ui.shopOpen=s; this.ui.shopAmmoOpen=false; this.toast('Магазин открыт. Снабженец снова на смене.'); return true;
    }
    for(const c of this.world.chests) if(!c.open&&KP.Utils.near(this.player,c,90,95)){
      c.open=true; this.openChest(c); return false;
    }
    this.toast('Рядом нет объекта для E.');
    return false;
  }

  openChest(c){
    if(c.loot==='money'){
      this.player.money+=45;
      this.toast('+45 денег из сундука.');
    } else if(c.loot==='ammo'){
      this.player.addAmmo('rifle',12);
      this.player.addAmmo('pistol',18);
      this.player.addAmmo('gas',8);
      this.toast('+патроны (винтовка + пистолет).');
    } else if(c.loot==='heal'){
      this.pickups.push(new KP.Pickup(c.x+8,c.y-6,'medkit',2));
      this.toast('Из сундука выпало лечение.');
    } else if(c.loot==='gasMask'){
      this.pickups.push(new KP.Pickup(c.x+8,c.y-6,'gasMask',1));
      this.toast('В сундуке найден противогаз.');
    } else {
      if(!this.player.inventory.includes(c.loot)) this.player.inventory.push(c.loot);
      this.toast('Найдено оружие: '+KP.Balance.weapons[c.loot].name);
    }
  }

  getShopAmmoOptions(){
    const seen=new Set();
    const order=['pistol','rifle','machinegun','shells','gas'];
    const current=KP.Balance.weapons[this.player.weapon]&&KP.Balance.weapons[this.player.weapon].ammoType;
    if(current) seen.add(current);
    for(const id of this.player.inventory){
      const at=KP.Balance.weapons[id]&&KP.Balance.weapons[id].ammoType;
      if(at) seen.add(at);
    }
    return order.filter(id=>seen.has(id)).map(id=>({id,...KP.Balance.ammoTypes[id]}));
  }

  buyAmmoType(ammoType){
    const meta=KP.Balance.ammoTypes[ammoType];
    if(!meta) return;
    if(this.player.money<meta.price){ this.toast('Не хватает денег.'); return; }
    this.player.money-=meta.price;
    this.player.addAmmo(ammoType,meta.buyAmount);
    this.toast(`Куплены ${meta.name} патроны: +${meta.buyAmount}.`);
  }

  shopInput(){
    if(this.input.wasPressed('interact')||this.input.wasPressed('esc')){
      if(this.ui.shopAmmoOpen){ this.ui.shopAmmoOpen=false; return; }
      this.ui.shopOpen=null; return;
    }
    const buy=(id,cost)=>{
      if(this.player.money<cost) return this.toast('Не хватает денег.');
      this.player.money-=cost;
      if(!this.player.inventory.includes(id)) this.player.inventory.push(id);
      this.toast('Куплено: '+KP.Balance.weapons[id].name);
    };
    if(this.ui.shopAmmoOpen){
      const options=this.getShopAmmoOptions();
      const keys=['one','two','three','four','five','six'];
      for(let i=0;i<keys.length;i++) if(this.input.wasPressed(keys[i])&&options[i]){
        this.buyAmmoType(options[i].id);
        return;
      }
      return;
    }
    if(this.input.wasPressed('one')){
      const options=this.getShopAmmoOptions();
      if(!options.length){ this.toast('Нет оружия, под которое можно купить патроны.'); return; }
      this.ui.shopAmmoOpen=true;
      this.toast('Выбери тип патронов цифрой 1-6.');
    }
    if(this.input.wasPressed('two')) buy('smg',KP.Balance.weapons.smg.price);
    if(this.input.wasPressed('three')) buy('gasSprayer',KP.Balance.weapons.gasSprayer.price);
    if(this.input.wasPressed('four')) buy('sabre',KP.Balance.weapons.sabre.price);
    if(this.input.wasPressed('five')) buy('shotgun',KP.Balance.weapons.shotgun.price);
  }

  burst(x,y,color,count){
    for(let i=0;i<count;i++) this.particles.push(new KP.Particle(x,y,color));
  }

  registerPlayerShot(x,y,weaponMeta={}){
    const radius=weaponMeta.soundRadius||(
      weaponMeta.type==='melee'?96:
      weaponMeta.type==='flame'?300:
      weaponMeta.type==='shotgun'?520:
      weaponMeta.delay>=700?760:
      weaponMeta.delay<=100?640:480
    );
    const timer=weaponMeta.type==='melee'?16:(weaponMeta.type==='flame'?34:48);
    this.playerShotSignal={x,y,radius,timer,weaponType:weaponMeta.type||'gun'};
  }

  updateDodgeCollisions(){
    if(this.player.dodgeTimer<=0) return;
    const cfg=KP.Balance.player.dodge;
    for(const e of this.enemies){
      if(!e.alive||!KP.Utils.rects(this.player,e)) continue;
      if(e.lastDodgeSerial===this.player.dodgeSerial) continue;
      e.lastDodgeSerial=this.player.dodgeSerial;
      e.takeDamage(cfg.hitDmg,cfg.knock,this.player.x,{targetX:this.player.x+this.player.w/2},this);
      this.registerHit(cfg.hitDmg);
      this.damageNumbers.push(new KP.DamageNumber(e.x+e.w/2,e.y,cfg.hitDmg,false));
      this.burst(e.x+e.w/2,e.y+e.h/2,'#a8ecff',14);
      this.onEnemyHit(e,true,cfg.hitDmg);
    }
  }

  toast(t){ this.toastText=t; this.toastTimer=200; }

  visible(o,padX=100,padY=120){
    return o.x+o.w>this.cameraX-padX&&o.x<this.cameraX+this.canvas.width+padX&&o.y+o.h>this.cameraY-padY&&o.y<this.cameraY+this.canvas.height+padY;
  }

  draw(){
    const ctx=this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    // Тряска экрана
    let ox=0, oy=0;
    if(this.shakeFrames>0){
      ox=(Math.random()*2-1)*this.shakeMag;
      oy=(Math.random()*2-1)*this.shakeMag;
      this.shakeFrames--;
      if(this.shakeFrames<=0) this.shakeMag=0;
    }
    ctx.save();
    ctx.translate(-this.cameraX+ox,-this.cameraY+oy);
    this.world.draw(ctx,this.cameraX,this.cameraY,this.canvas.width,this.canvas.height,this.assets);
    this.drawRushClocks(ctx);
    for(const cloud of this.clouds) if(this.visible(cloud,220,180)) cloud.draw(ctx);
    for(const p of this.pickups) if(this.visible(p)) p.draw(ctx);
    for(const b of this.playerBullets) b.draw(ctx);
    for(const b of this.enemyBullets) b.draw(ctx);
    for(const e of this.enemies) if(this.visible(e)) e.draw(ctx,this.assets);
    this.player.draw(ctx,this.assets);
    for(const g of this.gibs) g.draw(ctx);
    for(const p of this.particles) p.draw(ctx);
    for(const d of this.damageNumbers) d.draw(ctx);
    if(this.timeStopFrames>0){
      ctx.fillStyle='rgba(101,232,255,.10)';
      ctx.fillRect(this.cameraX,this.cameraY,this.canvas.width,this.canvas.height);
    }
    ctx.restore();
    this.drawBlood(ctx);
    this.ui.draw(this);
  }

  drawBlood(ctx){
    if(!this.bloodSplatters.length) return;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    for(const b of this.bloodSplatters){
      const a=Math.min(.5,b.life/b.maxLife*.5);
      ctx.fillStyle=b.color+a+')';
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      // несколько брызг помельче
      ctx.beginPath(); ctx.arc(b.x+b.r*.7,b.y-b.r*.4,b.r*.35,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(b.x-b.r*.6,b.y+b.r*.5,b.r*.28,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  drawRushClocks(ctx){
    for(const t of this.world.rushTriggers){
      if(t.done||t.warnTimer===undefined||t.warnTimer<=0) continue;
      const x=t.clockX, y=t.clockY;
      const prog=1-t.warnTimer/(t.warnMax||150);
      const pulse=0.7+Math.sin(Date.now()/90)*0.3;
      // тревожное свечение
      ctx.save();
      ctx.globalAlpha=0.25*pulse;
      ctx.fillStyle='#ff3030';
      ctx.beginPath(); ctx.arc(x,y,46,0,Math.PI*2); ctx.fill();
      ctx.restore();
      // циферблат
      ctx.fillStyle='#1c140a'; ctx.beginPath(); ctx.arc(x,y,24,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#ffd21c'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(x,y,24,0,Math.PI*2); ctx.stroke();
      // сектор обратного отсчёта
      ctx.fillStyle='rgba(255,48,48,.55)';
      ctx.beginPath(); ctx.moveTo(x,y);
      ctx.arc(x,y,22,-Math.PI/2,-Math.PI/2+Math.PI*2*prog); ctx.closePath(); ctx.fill();
      // стрелка
      const ang=-Math.PI/2+Math.PI*2*prog;
      ctx.strokeStyle='#fff'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(ang)*18,y+Math.sin(ang)*18); ctx.stroke();
      ctx.fillStyle='#ffd21c'; ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
      // подпись
      ctx.fillStyle='#ffd21c'; ctx.font='bold 12px Arial'; ctx.textAlign='center';
      ctx.fillText('ВОЛНА',x,y-32); ctx.textAlign='left';
    }
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
      game.biomeEntryHeroLevel=game.player.level;
      game.player.x=80; game.player.y=380; game.player.dead=false;
      game.ui.ending=false; game.ui.shopOpen=null; game.ui.shopAmmoOpen=false; game.ui.inventoryOpen=false;
      game.timeStopFrames=0; game.levelTransition=0;
      game.spawnLevel(); placePlayerNearGround(); game.saveCheckpoint(); return safe;
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
          menuIndex:game.ui.menuIndex, controlsOpen:game.ui.controlsOpen, inventoryOpen:game.ui.inventoryOpen,
          player:{x:game.player.x,y:game.player.y,time:game.player.time,weapon:game.player.weapon},
          enemies:game.enemies.map(e=>({kind:e.kind,x:e.x,y:e.y,state:e.state,memoryTimer:e.memoryTimer,underFireTimer:e.underFireTimer,alive:e.alive})),
          bullets:{player:game.playerBullets.length,enemy:game.enemyBullets.length}
      };
    }
  };
});

