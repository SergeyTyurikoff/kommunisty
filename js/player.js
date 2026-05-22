'use strict';
window.KP = window.KP || {};
KP.Player = class Player extends KP.Entity {
  constructor(){ super(80,380,34,58); this.reset(); }

  reset(){
    const b=KP.Balance.player;
    const ammoBag={}, maxAmmoBag={};
    for(const [id,a] of Object.entries(KP.Balance.ammoTypes)){
      ammoBag[id]=a.start;
      maxAmmoBag[id]=a.max;
    }
    Object.assign(this,{
      x:80,y:380,vx:0,vy:0,w:34,h:58,maxTime:b.maxTime,time:b.maxTime,facing:1,pose:'stand',grounded:false,jumpsLeft:1,
      ammoBag,maxAmmoBag,money:18,xp:0,level:1,xpNext:70,turbo:0,turboCd:0,weak:0,timeStopCd:0,weapon:'mosin',
      inventory:['pistol','mosin'],invuln:0,attackCd:0,dead:false,draining:false,dropTimer:0,
      abilities:{drain:true,doubleJump:false,turbo:false,timeStop:false,meleeMastery:false,finalResolve:false}
    });
  }

  update(game){
    const input=game.input,b=KP.Balance.player;
    if(this.invuln>0) this.invuln--;
    if(this.attackCd>0) this.attackCd--;
    if(this.timeStopCd>0) this.timeStopCd--;
    if(this.dropTimer>0) this.dropTimer--;

    this.time-=b.baseTimeDecay;
    if(this.turbo>0){
      this.turbo--;
      this.time-=b.turboTimeCostPerFrame;
      if(this.turbo<=0){
        this.weak=b.turboCooldown;
        game.toast('Откат турбо: Феликс временно выжат.');
      }
    } else if(this.turboCd>0){
      this.turboCd--;
    }
    if(this.weak>0) this.weak--;
    if(game.timeStopFrames>0) this.time-=b.timeStopDrainPerFrame;

    if(input.wasPressed('turbo')){
      if(!this.abilities.turbo) game.toast('Турбо ещё не открыто. Сначала доберись до пустыни.');
      else if(this.turbo<=0 && this.turboCd<=0 && this.time>35){
        this.turbo=b.turboDuration;
        this.turboCd=b.turboDuration+b.turboCooldown;
        game.toast('Турбо: 5 секунд быстрее и сильнее, потом короткая слабость.');
      }
    }
    if(input.wasPressed('timeStop')) this.tryTimeStop(game);

    const speedMul=(this.turbo>0?b.turboSpeed:1)*(this.weak>0?b.weakSpeed:1);
    const left=input.isDown('left'), right=input.isDown('right');
    if(left){ this.vx-=b.speed*speedMul; this.facing=-1; }
    if(right){ this.vx+=b.speed*speedMul; this.facing=1; }

    this.pose='stand';
    this.h=58;

    if((input.wasPressed('downAct')||input.isDown('downAct')) && this.grounded && this.floorContact && this.floorContact.type==='sky'){
      this.dropPlatform=this.floorContact;
      this.dropTimer=60;
      this.y+=14;
      this.vy=Math.max(this.vy,3.2);
      this.grounded=false;
      this.floorContact=null;
    }

    const maxJumps=this.abilities.doubleJump?2:1;
    if(input.wasPressed('up') && this.jumpsLeft>0){
      this.vy=b.jump;
      this.jumpsLeft--;
      game.burst(this.x+this.w/2,this.y+this.h,'#ffd21c',8);
    }
    if(input.wasPressed('weaponNext')) this.nextWeapon(game);
    const slots=[['one','pistol'],['two','mosin'],['three','smg'],['four','flamethrower'],['five','sabre'],['six','shotgun']];
    for(const [act,id] of slots) if(input.wasPressed(act)&&this.inventory.includes(id)) this.weapon=id;
    if(input.wasPressed('inventory')) game.ui.inventoryOpen=!game.ui.inventoryOpen;
    if(input.wasPressed('attack')||game.input.mouseDown) this.attack(game);

    this.vx*=.84;
    this.vx=KP.Utils.clamp(this.vx,-7.2*speedMul,7.2*speedMul);
    this.vy+=game.gravity;
    game.world.collide(this);
    if(this.grounded) this.jumpsLeft=maxJumps;
    this.drainNearbyEnemyTime(game);
    if(this.time<=0){ this.time=0; this.dead=true; }
  }

  tryTimeStop(game){
    const b=KP.Balance.player;
    if(!this.abilities.timeStop){
      game.toast('Остановка времени ещё не открыта.');
      return;
    }
    if(game.timeStopFrames>0) return;
    if(this.time < b.timeStopCost+12){
      game.toast('Мало времени для остановки времени.');
      return;
    }
    this.time-=b.timeStopCost;
    game.timeStopFrames=b.timeStopDuration;
    game.audio.play('timeStop',.96);
    game.toast('Время остановлено на 5 секунд.');
    game.burst(this.x+this.w/2,this.y+this.h/2,'#65e8ff',40);
  }

  drainNearbyEnemyTime(game){
    const b=KP.Balance.player;
    this.draining=false;
    if(!this.abilities.drain) return;
    if(!game.input.isDown('interact')) return;
    let drained=false;
    for(const e of game.enemies){
      if(!e.alive) continue;
      if(KP.Utils.near(this,e,b.drainRange,105)){
        e.drainTime(game);
        if(!e.alive) game.onEnemyHit(e);
        this.time=KP.Utils.clamp(this.time+b.drainGainPerFrame,0,this.maxTime);
        drained=true;
        this.draining=true;
      }
    }
    if(drained && Math.random()<.22) game.burst(this.x+this.w/2,this.y+this.h/2,'#65e8ff',2);
  }

  ammoForCurrentWeapon(){
    const w=KP.Balance.weapons[this.weapon];
    if(!w.ammoType) return Infinity;
    return this.ammoBag[w.ammoType] || 0;
  }

  addAmmo(type,amount){
    if(!type || !this.ammoBag.hasOwnProperty(type)) return;
    this.ammoBag[type]=KP.Utils.clamp(this.ammoBag[type]+amount,0,this.maxAmmoBag[type]);
  }

  nextWeapon(game){
    const i=this.inventory.indexOf(this.weapon);
    this.weapon=this.inventory[(i+1)%this.inventory.length];
    game.toast('Оружие: '+KP.Balance.weapons[this.weapon].name);
  }

  damageMultiplier(){
    const b=KP.Balance.player;
    return (this.turbo>0?b.turboDamage:1)*(this.weak>0?b.weakDamage:1);
  }

  aimVector(game){
    const up=game.input.isDown('up'), down=game.input.isDown('downAct');
    let ax=this.facing, ay=0;
    if(up && !down) ay=-.62;
    if(down && !up) ay=.62;
    const len=Math.hypot(ax,ay)||1;
    return {x:ax/len,y:ay/len};
  }

  attack(game){
    const w=KP.Balance.weapons[this.weapon];
    if(this.attackCd>0) return;
    const ammoType=w.ammoType, ammoUse=w.ammoUse||0;
    if(ammoType && (this.ammoBag[ammoType]||0)<ammoUse){
      game.toast(`Нет боеприпасов: ${KP.Balance.ammoTypes[ammoType].name}.`);
      return;
    }
    this.attackCd=w.delay/16.67;
    if(ammoType) this.ammoBag[ammoType]-=ammoUse;
    let dmg=w.dmg*this.damageMultiplier();
    if(this.abilities.meleeMastery && w.type==='melee') dmg*=1.35;
    if(this.abilities.finalResolve) dmg*=1.10;
    const aim=this.aimVector(game);
    game.audio.playWeapon(this.weapon);

    if(w.type==='melee'){
      const hit={x:this.x+(this.facing>0?this.w:-w.range),y:this.y+8,w:w.range,h:this.h-6};
      for(const e of game.enemies) if(e.alive&&KP.Utils.rects(hit,e)){
        e.takeDamage(dmg,w.knock+(this.abilities.meleeMastery?4:0),this.x,{targetX:this.x+this.w/2});
        game.onEnemyHit(e);
      }
      game.burst(hit.x+hit.w/2,hit.y+20,w.color,10);
      return;
    }

    const y=this.y+25;
    const sx=this.x+this.w/2+aim.x*30, sy=y+aim.y*10;
    if(w.type==='shotgun'){
      const count=w.pellets||5;
      for(let i=0;i<count;i++){
        const spread=(i-(count-1)/2)*0.10;
        const vx=(aim.x*Math.cos(spread)-aim.y*Math.sin(spread))*w.speed;
        const vy=(aim.x*Math.sin(spread)+aim.y*Math.cos(spread))*w.speed;
        game.playerBullets.push(new KP.Bullet('player',sx,sy,vx,vy,{dmg,range:w.range,color:w.color,knock:w.knock,size:9,ammoType}));
      }
      this.vx-=aim.x*1.2;
      game.burst(sx,sy,w.color,12);
      return;
    }

    const flame=w.type==='flame';
    game.playerBullets.push(new KP.Bullet('player',sx,sy,w.speed*aim.x,w.speed*aim.y,{
      dmg,range:w.range,color:w.color,knock:w.knock,flame,burn:w.burn,burnDps:w.burnDps,size:flame?18:9,pierce:flame,ammoType
    }));
    if(!flame) this.vx-=aim.x*(this.weapon==='mosin'?1.4:.35);
    game.burst(sx,sy,w.color,flame?3:8);
  }

  hurt(timeLoss,dir,game=null){
    if(this.invuln>0) return;
    this.time-=timeLoss;
    this.invuln=42;
    this.vx+=dir*7;
    this.vy=-3.5;
    if(game){
      if(this.time<=0) game.audio.play('playerDown',1);
      else game.audio.play('playerHit',0.96+Math.random()*0.08);
    }
    if(this.time<=0){
      this.time=0;
      this.dead=true;
    }
  }

  gainXP(game,amount){
    this.xp+=amount;
    while(this.xp>=this.xpNext){
      this.xp-=this.xpNext;
      this.level++;
      this.xpNext=Math.round(this.xpNext*1.4+30);
      this.maxTime+=12;
      this.time=Math.min(this.maxTime,this.time+38);
      for(const t of Object.keys(this.maxAmmoBag)) this.maxAmmoBag[t]+= t==='machinegun'?18:t==='fuel'?14:6;
      game.toast('Уровень '+this.level+': больше времени и боезапаса.');
    }
  }

  unlockAbility(id, game){
    if(!id || this.abilities[id]) return;
    this.abilities[id]=true;
    const meta=(KP.Balance.abilityUnlocks||[]).find(a=>a.id===id);
    if(game) game.toast('Открыта способность: '+(meta?meta.name:id)+'. '+(meta?meta.desc:''));
  }

  draw(ctx,assets){
    if(this.invuln>0&&Math.floor(this.invuln/5)%2===0) return;
    if(this.turbo>0){
      ctx.fillStyle='rgba(255,138,28,.28)';
      ctx.beginPath();
      ctx.ellipse(this.x+17-this.facing*16,this.y+32,22,38,0,0,Math.PI*2);
      ctx.fill();
    }
    if(this.weak>0){
      ctx.fillStyle='rgba(80,80,80,.25)';
      ctx.beginPath();
      ctx.ellipse(this.x+17,this.y+32,24,40,0,0,Math.PI*2);
      ctx.fill();
    }
    if(this.draining){
      ctx.strokeStyle='#65e8ff';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(this.x+17,this.y+30,58,0,Math.PI*2);
      ctx.stroke();
    }
    assets.drawHero(ctx,this.x,this.y,this.pose,this.facing,this.weapon);
  }
};
