'use strict';
window.KP = window.KP || {};
KP.VERSION = 'V 1.0.18';
KP.Game = class Game {
  constructor(){
    this.canvas=document.getElementById('game');
    this.ctx=this.canvas.getContext('2d');
    this.input=new KP.Input();
    this.assets=new KP.Assets();
    this.ui=new KP.UI();
    this.audio=new KP.AudioSystem();
    this.gravity=.72;
    this.cameraX=0;
    this.cameraY=0;
    this.levelIndex=0;
    this.world=new KP.World(this.levelIndex);
    this.player=new KP.Player();
    this.enemies=[];
    this.playerBullets=[];
    this.enemyBullets=[];
    this.pickups=[];
    this.particles=[];
    this.kills=0;
    this.toastText='';
    this.toastTimer=0;
    this.timeStopFrames=0;
    this.levelTransition=0;
    this.spawnLevel();
    this.loop=this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  spawnLevel(){
    this.enemies=[];
    this.playerBullets=[];
    this.enemyBullets=[];
    this.pickups=[];
    this.particles=[];
    this.world.rushTriggers.forEach(t=>t.done=false);

    for(const sp of this.world.enemySpawns){
      const e=new KP.Enemy(sp.x,0,sp.kind);
      e.setPatrol(sp.min,sp.max,sp.floorY);
      this.applyBiomeScaling(e);
      this.enemies.push(e);
    }

    const ammoTypes=Object.keys(KP.Balance.ammoTypes);
    for(let n=0;n<14;n++){
      const type=n%3===0?'ammo':(n%5===0?'time':'money');
      const ammoType=type==='ammo'?ammoTypes[(n+this.levelIndex)%ammoTypes.length]:null;
      const amount=type==='ammo'?(ammoType==='machinegun'?22:ammoType==='fuel'?18:ammoType==='shells'?4:8):(type==='time'?8:(KP.Utils.rand(2,8)|0));
      this.pickups.push(new KP.Pickup(420+n*135,455,type,amount,ammoType));
    }
    this.toast(`Локация: ${this.world.biomeName()}. Противник занял позиции и уже не валится всем отрядом вниз.`);
  }

  applyBiomeScaling(e){
    const boss=KP.Balance.enemies[e.kind] && KP.Balance.enemies[e.kind].role==='boss';
    const hpScale=1+this.levelIndex*(boss?0.22:0.18);
    const dmgScale=1+this.levelIndex*(boss?0.16:0.13);
    e.hp=Math.round(e.hp*hpScale);
    e.maxHp=e.hp;
    e.hitTime=Math.round(e.hitTime*dmgScale);
    e.dmg=Math.round(e.dmg*dmgScale);
    e.xp=Math.round(e.xp*(1+this.levelIndex*.12));
    e.moneyRange=e.moneyRange.map(v=>Math.round(v*(1+this.levelIndex*.16)));
  }

  loop(){
    this.update();
    this.draw();
    this.input.tick();
    requestAnimationFrame(this.loop);
  }

  update(){
    if(this.input.wasPressed('restart')){ this.restart(); return; }
    if(this.ui.intro){
      if(this.input.wasPressed('start')||this.input.wasPressed('up')||this.input.wasPressed('attack')||this.input.wasPressed('interact')) this.startGame();
      return;
    }
    if(this.ui.ending||this.player.dead) return;
    if(this.toastTimer>0) this.toastTimer--;
    if(this.levelTransition>0){
      this.levelTransition--;
      if(this.levelTransition===1) this.loadNextLevel();
      return;
    }
    if(this.timeStopFrames>0) this.timeStopFrames--;

    if(this.ui.shopOpen){ this.shopInput(); return; }
    if(this.input.wasPressed('interact')){
      const openedUi=this.interact();
      if(openedUi){
        this.updateCamera();
        this.updateParticles();
        return;
      }
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
  }

  startGame(){
    this.ui.intro=false;
    this.audio.play('menuStart',1);
    this.audio.playMusic(true);
    this.toast('Операция началась. Музыка включена, плесень предупреждена.');
  }

  restart(){
    this.levelIndex=0;
    this.world=new KP.World(this.levelIndex);
    this.player.reset();
    this.kills=0;
    this.ui.intro=true;
    this.ui.ending=false;
    this.ui.shopOpen=null;
    this.ui.inventoryOpen=false;
    this.timeStopFrames=0;
    this.levelTransition=0;
    this.cameraX=0;
    this.cameraY=0;
    this.audio.stopMusic(true);
    this.spawnLevel();
    this.toast('Рестарт. Отряд собирается заново.');
  }

  loadNextLevel(){
    if(this.levelIndex>=this.world.biomes.length-1){ this.ui.ending=true; return; }
    this.levelIndex++;
    this.world=new KP.World(this.levelIndex);
    this.player.x=80;
    this.player.y=380;
    this.player.vx=0;
    this.player.vy=0;
    this.player.jumpsLeft=this.player.abilities.doubleJump?2:1;
    this.cameraX=0;
    this.cameraY=0;
    this.timeStopFrames=0;
    this.spawnLevel();
    this.audio.play('portal',1);
    const ability=(KP.Balance.abilityUnlocks||[])[this.levelIndex];
    if(ability) this.player.unlockAbility(ability.id,this);
  }

  checkPortal(){
    if(!this.world.portal) return;
    if(KP.Utils.rects(this.player,this.world.portal)){
      const bossAlive=this.enemies.some(e=>e.alive && KP.Balance.enemies[e.kind] && KP.Balance.enemies[e.kind].role==='boss');
      if(bossAlive){
        this.toast('Сначала убей босса биома. Выход не любит незавершённые перевороты.');
        this.player.x=this.world.portal.x-80;
        return;
      }
      if(this.levelIndex>=this.world.biomes.length-1){ this.ui.ending=true; return; }
      this.levelTransition=45;
      this.toast('Переход в следующий биом. Пейзаж меняется, долг перед историей остаётся.');
    }
  }

  checkRush(){
    for(const t of this.world.rushTriggers) if(!t.done && this.player.x>t.x){
      t.done=true;
      this.toast('Поздний грибной раш. Теперь противник давит числом и скоростью.');
      const min=KP.Utils.clamp(this.player.x+150,760,this.world.worldW-650);
      const max=Math.min(min+460,this.world.worldW-140);
      const floorY=485;
      const count=4+Math.min(4,this.levelIndex);
      for(let i=0;i<count;i++){
        const kind=i%3===0?'runner':'zombie';
        const e=new KP.Enemy(min+30+i*70,0,kind);
        e.setPatrol(min,max,floorY);
        this.applyBiomeScaling(e);
        e.aggro('Раааш, но уже организованный!');
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
      if(this.timeStopFrames>0 && (a===this.player || b===this.player)){
        if(a===this.player) a.x+=dir*amount;
        else b.x-=dir*amount;
      } else if(a===this.player){
        a.x+=dir*amount;
        b.x-=dir*overlapX*.25;
      } else if(b===this.player){
        b.x-=dir*amount;
        a.x+=dir*overlapX*.25;
      } else {
        a.x+=dir*amount*.5;
        b.x-=dir*amount*.5;
      }
      a.vx*=.35;
      b.vx*=.35;
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
      if(this.bulletHitsBarrier(b)) continue;
      for(const e of this.enemies) if(e.alive&&KP.Utils.rects(b,e)){
        e.takeDamage(b.dmg,b.knock,b.x,{burn:b.burn,burnDps:b.burnDps});
        if(!b.pierce) b.alive=false;
        this.onEnemyHit(e);
        break;
      }
    }
    for(const b of this.enemyBullets){
      if(!b.alive) continue;
      if(this.bulletHitsBarrier(b)) continue;
      if(KP.Utils.rects(b,this.player)){
        b.alive=false;
        this.player.hurt(b.dmg,b.x<this.player.x?1:-1,this);
      }
    }
    this.playerBullets=this.playerBullets.filter(b=>b.alive&&this.visible(b,350,220));
    this.enemyBullets=this.enemyBullets.filter(b=>b.alive&&this.visible(b,350,220));
  }

  bulletHitsBarrier(b){
    const barriers=[];
    for(const w of barriers) if(KP.Utils.rects(b,w)){
      if(w.hp!==undefined){
        w.hp-=b.dmg||10;
        if(w.hp<=0) w.alive=false;
      }
      b.alive=false;
      this.burst(b.x,b.y,'#999',6);
      return true;
    }
    return false;
  }

  onEnemyHit(e){
    if(!e.alive && !e.counted){
      this.audio.play('enemyDown',0.95+Math.random()*0.08);
      e.counted=true;
      this.kills++;
      const m=KP.Utils.rand(e.moneyRange[0],e.moneyRange[1])|0;
      this.player.gainXP(this,e.xp);
      this.pickups.push(new KP.Pickup(e.x+e.w/2,e.y+e.h/2,'money',m));
      if(Math.random()<.45){
        const ats=Object.keys(KP.Balance.ammoTypes);
        const at=ats[Math.floor(Math.random()*ats.length)];
        this.pickups.push(new KP.Pickup(e.x+10,e.y,'ammo',at==='machinegun'?18:at==='fuel'?14:at==='shells'?3:7,at));
      }
      if(Math.random()<.20) this.pickups.push(new KP.Pickup(e.x+20,e.y,'time',8));
      if(e.kind==='lenin'){
        this.ui.ending=true;
        this.toast('Ленин повержен. Время снова потекло вперёд.');
      }
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
        this.audio.playPickup(p.type);
        p.alive=false;
      }
    }
    this.pickups=this.pickups.filter(p=>p.alive);
  }

  updateParticles(){
    for(const p of this.particles) p.update();
    this.particles=this.particles.filter(p=>p.life>0).slice(-240);
  }

  updateCamera(){
    this.cameraX=KP.Utils.clamp(this.player.x-390,0,this.world.worldW-this.canvas.width);
    this.cameraY=KP.Utils.clamp(this.player.y-330,0,this.world.worldH-this.canvas.height);
  }

  interact(){
    for(const s of this.world.shops) if(KP.Utils.near(this.player,s,125,130)){
      this.ui.shopOpen=s;
      this.toast('Магазин открыт. Снабженец снова на смене.');
      return true;
    }
    for(const c of this.world.chests) if(!c.open&&KP.Utils.near(this.player,c,90,95)){
      c.open=true;
      this.openChest(c);
      return false;
    }
    this.toast('Рядом нет объекта для E. Кнопка пока не научилась открывать воздух.');
    return false;
  }

  openChest(c){
    if(c.loot==='money'){
      this.player.money+=45;
      this.toast('+45 денег из сундука. Происхождение не уточняем.');
    } else if(c.loot==='ammo'){
      this.player.addAmmo('rifle',12);
      this.player.addAmmo('pistol',18);
      this.toast('+винтовочные и пистолетные патроны.');
    } else {
      if(!this.player.inventory.includes(c.loot)) this.player.inventory.push(c.loot);
      this.toast('Найдено оружие: '+KP.Balance.weapons[c.loot].name);
    }
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
        const a=KP.Balance.ammoTypes[at];
        this.player.addAmmo(at,a.buyAmount);
      } else if(!this.player.inventory.includes(id)) this.player.inventory.push(id);
      this.toast(id==='time'?`+${KP.Balance.shop.timeAmount} времени`:id==='ammo'?'боеприпасы к текущему оружию куплены':'Куплено: '+KP.Balance.weapons[id].name);
    };
    if(this.input.wasPressed('one')) buy('time',KP.Balance.shop.timePrice);
    if(this.input.wasPressed('two')){
      const w=KP.Balance.weapons[this.player.weapon];
      const at=w.ammoType||'rifle';
      buy('ammo',KP.Balance.ammoTypes[at].price);
    }
    if(this.input.wasPressed('three')) buy('smg',KP.Balance.weapons.smg.price);
    if(this.input.wasPressed('four')) buy('flamethrower',KP.Balance.weapons.flamethrower.price);
    if(this.input.wasPressed('five')) buy('sabre',KP.Balance.weapons.sabre.price);
    if(this.input.wasPressed('six')) buy('shotgun',KP.Balance.weapons.shotgun.price);
  }

  burst(x,y,color,count){
    for(let i=0;i<count;i++) this.particles.push(new KP.Particle(x,y,color));
  }

  toast(t){
    this.toastText=t;
    this.toastTimer=190;
  }

  visible(o,padX=100,padY=120){
    return o.x+o.w>this.cameraX-padX && o.x<this.cameraX+this.canvas.width+padX && o.y+o.h>this.cameraY-padY && o.y<this.cameraY+this.canvas.height+padY;
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
    if(this.timeStopFrames>0){
      ctx.fillStyle='rgba(101,232,255,.10)';
      ctx.fillRect(this.cameraX,this.cameraY,this.canvas.width,this.canvas.height);
    }
    ctx.restore();
    this.ui.draw(this);
  }
};
window.addEventListener('DOMContentLoaded',()=>new KP.Game());
