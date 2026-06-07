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
      x:80,y:380,vx:0,vy:0,w:34,h:58,
      maxTime:b.maxTime,time:b.maxTime,
      facing:1,pose:'stand',grounded:false,jumpsLeft:1,
      ammoBag,maxAmmoBag,money:18,xp:0,level:1,xpNext:70,
      turbo:0,turboCd:0,weak:0,timeStopCd:0,
      weapon:'mosin',inventory:['pistol','mosin'],
      utilitySlots:['medkit','gasMask',null,null,null,null],
      items:{ medkit:1, gasMask:false, gasMaskActive:false },
      invuln:0,attackCd:0,dead:false,draining:false,dropTimer:0,
      attackFlash:0,dodgeSerial:0,runHeld:false,
      enemyHitChain:0,enemyHitChainTimer:0,stunTimer:0,
      gasSlowTimer:0,gasWarnTimer:0,gasMaskTimer:0,gasMaskCd:0,
      dodgeTimer:0,dodgeCd:0,dodgeVx:0,
      wasGrounded:false,landTimer:0,
      abilities:{doubleJump:false,turbo:false,timeStop:false,meleeMastery:false,finalResolve:false}
    });
  }

  update(game){
    const input=game.input, b=KP.Balance.player;
    if(this.invuln>0) this.invuln--;
    if(this.attackCd>0) this.attackCd--;
    if(this.attackFlash>0) this.attackFlash--;
    if(this.timeStopCd>0) this.timeStopCd--;
    if(this.dropTimer>0) this.dropTimer--;
    if(this.dodgeCd>0) this.dodgeCd--;
    if(this.stunTimer>0) this.stunTimer--;
    if(this.landTimer>0) this.landTimer--;
    if(this.enemyHitChainTimer>0) this.enemyHitChainTimer--;
    else if(this.enemyHitChain>0) this.enemyHitChain=0;
    if(this.gasSlowTimer>0) this.gasSlowTimer--;
    if(this.gasWarnTimer>0) this.gasWarnTimer--;
    // Противогаз: 3 c действия, затем 5 c откат.
    if(this.gasMaskTimer>0){
      this.gasMaskTimer--;
      if(this.gasMaskTimer<=0){ this.items.gasMaskActive=false; this.gasMaskCd=b.gasMaskCooldown; game.toast('Противогаз снят, откат 5 секунд.'); }
    } else if(this.gasMaskCd>0) this.gasMaskCd--;

    // Турбо (клавиша C/С): единственный режим, который тратит здоровье.
    if(this.turbo>0){
      this.turbo--;
      this.time-=b.turboHealthPerFrame;
      if(this.time<=0){ this.time=0; this.dead=true; }
      if(this.turbo<=0){
        this.weak=b.turboCooldown;
        game.toast('Откат турбо: Феликс временно выжат.');
      }
    } else if(this.turboCd>0){
      this.turboCd--;
    }
    if(this.weak>0) this.weak--;

    const stunned=this.stunTimer>0;
    this.runHeld=!stunned&&input.isDown('run')&&(input.isDown('left')||input.isDown('right'));

    if(!stunned&&this.abilities.turbo&&input.wasPressed('turbo')) this.tryTurbo(game);
    if(!stunned&&input.wasPressed('timeStop')) this.tryTimeStop(game);

    if(!stunned&&input.wasPressed('dodge')){
      if(this.dodgeCd<=0&&this.time>b.dodge.cost){
        const dodgeSpd=b.dodge.speed*(this.abilities.finalResolve?1.25:1);
        this.dodgeTimer=b.dodge.duration;
        this.dodgeCd=b.dodge.cooldown;
        this.dodgeSerial++;
        this.dodgeVx=(input.isDown('left')?-1:input.isDown('right')?1:this.facing)*dodgeSpd;
        this.time-=b.dodge.cost;
        this.invuln=Math.max(this.invuln,b.dodge.duration);
        game.burst(this.x+this.w/2,this.y+this.h/2,'#aaffff',8);
        game.audio.play('pickupTime',1.18,.6);
      } else if(this.time<=b.dodge.cost){
        game.toast('Мало времени для переката.');
      }
    }

    const left=input.isDown('left'), right=input.isDown('right');
    const speedMul=(this.runHeld?b.runSpeed:1)*(this.turbo>0?b.turboSpeed:1)*(this.weak>0?b.weakSpeed:1)*(this.gasSlowTimer>0?b.gasSlowMul:1);

    if(this.dodgeTimer>0){
      this.dodgeTimer--;
      this.vx=this.dodgeVx;
    } else if(!stunned){
      if(left){ this.vx-=b.speed*speedMul; this.facing=-1; }
      if(right){ this.vx+=b.speed*speedMul; this.facing=1; }
    }

    this.pose='stand';
    this.h=58;

    if(!stunned&&(input.wasPressed('downAct')||input.isDown('downAct'))){
      const support=(this.floorContact&&this.floorContact.type==='sky')?this.floorContact:game.world.findDropPlatform(this);
      if(support){
        this.dropPlatform=support;
        this.dropTimer=60;
        this.y=Math.max(this.y,support.y+4);
        this.vy=Math.max(this.vy,5.8);
        this.grounded=false;
        this.floorContact=null;
      }
    }

    const maxJumps=this.abilities.doubleJump?2:1;
    if(!stunned&&input.wasPressed('up')&&this.jumpsLeft>0){
      this.vy=b.jump;
      this.jumpsLeft--;
      game.burst(this.x+this.w/2,this.y+this.h,'#ffd21c',8);
    }
    if(!stunned&&input.wasPressed('weaponNext')) this.nextWeapon(game);

    const slotActions=['one','two','three','four','five','six'];
    if(!stunned) for(let i=0;i<slotActions.length;i++) if(input.wasPressed(slotActions[i])) this.useUtilitySlot(i,game);
    if(!stunned&&input.wasPressed('inventory')) game.ui.inventoryOpen=!game.ui.inventoryOpen;
    if(!stunned&&(input.wasPressed('attack')||game.input.mouseDown)) this.attack(game);

    this.vx*=(stunned&&this.grounded)?0.76:0.84;
    this.vx=KP.Utils.clamp(this.vx,-7.2*speedMul,7.2*speedMul);
    this.vy+=game.gravity;
    const impactVy=this.vy;
    game.world.collide(this);
    if(this.grounded&&!this.wasGrounded&&impactVy>5.5){
      this.landTimer=9; // squash-and-stretch при приземлении
      game.burst(this.x+this.w/2,this.y+this.h,'#b9b2a2',Math.min(14,4+Math.round(impactVy)));
      if(impactVy>9) game.shake(5,3);
    }
    this.wasGrounded=this.grounded;
    if(this.grounded){
      this.jumpsLeft=maxJumps;
      this.runHeld=!stunned&&input.isDown('run')&&(input.isDown('left')||input.isDown('right'));
    } else {
      this.runHeld=false;
    }
    if(this.dead) this.pose='dead';
    else if(stunned&&this.grounded) this.pose='stun';
    else if(this.dodgeTimer>0) this.pose='dodge';
    else if(!this.grounded) this.pose=this.vy<0?'jump':'fall';
    else if(this.attackFlash>0) this.pose='shoot';
    else if(Math.abs(this.vx)>1.25) this.pose='run';
    else this.pose='stand';

    this.draining=false;

    if(this.time<=0){ this.time=0; this.dead=true; }
  }

  heal(amount){
    if(amount<=0) return 0;
    const before=this.time;
    this.time=KP.Utils.clamp(this.time+amount,0,this.maxTime);
    return this.time-before;
  }

  addItem(id,amount=1){
    if(id==='medkit'){
      const meta=KP.Balance.items.medkit;
      this.items.medkit=KP.Utils.clamp((this.items.medkit||0)+amount,0,meta.max);
      return this.items.medkit;
    }
    if(id==='gasMask'){
      this.items.gasMask=true;
      return 1;
    }
    return 0;
  }

  useUtilitySlot(index,game){
    const id=this.utilitySlots[index];
    if(!id) return;
    if(id==='medkit'){
      if((this.items.medkit||0)<=0){
        game.toast('В этом слоте нет аптечки.');
        return;
      }
      if(this.time>=this.maxTime-1){
        game.toast('Здоровье уже полное.');
        return;
      }
      this.items.medkit--;
      const healed=this.heal(KP.Balance.items.medkit.heal);
      game.audio.playPickup('heal');
      game.toast(`Аптечка использована: +${Math.round(healed)}. Осталось ${this.items.medkit}.`);
      return;
    }
    if(id==='gasMask'){
      if(!this.items.gasMask){ game.toast('Противогаз ещё не найден.'); return; }
      if(this.gasMaskTimer>0){ game.toast('Противогаз уже надет.'); return; }
      if(this.gasMaskCd>0){ game.toast(`Противогаз на откате: ${Math.ceil(this.gasMaskCd/60)} c.`); return; }
      this.gasMaskTimer=KP.Balance.player.gasMaskDuration;
      this.items.gasMaskActive=true;
      game.audio.playPickup('gasMask');
      game.toast('Противогаз надет на 3 секунды.');
    }
  }

  applyGasDamage(amount,dir,game){
    // Газ больше НЕ снимает здоровье — только замедляет (зона контроля).
    if(this.items.gasMaskActive||this.dead) return false;
    const b=KP.Balance.player;
    this.gasSlowTimer=Math.max(this.gasSlowTimer,b.gasSlowFrames);
    this.vx+=dir*0.6;
    if(this.gasWarnTimer<=0){
      this.gasWarnTimer=b.gasWarningFrames;
      game.toast('Газ замедляет! Противогаз — цифра 2 (3 c, откат 5 c).');
    }
    return true;
  }

  tryTimeStop(game){
    const b=KP.Balance.player;
    if(!this.abilities.timeStop){ game.toast('Остановка времени ещё не открыта.'); return; }
    if(game.timeStopFrames>0) return;
    if(this.timeStopCd>0){ game.toast(`Остановка времени перезаряжается: ${Math.ceil(this.timeStopCd/60)}с.`); return; }
    this.timeStopCd=b.timeStopCooldown;
    game.timeStopFrames=b.timeStopDuration;
    game.audio.play('timeStop',.96);
    game.toast('Время остановлено на 5 секунд.');
    game.burst(this.x+this.w/2,this.y+this.h/2,'#65e8ff',40);
  }

  tryTurbo(game){
    const b=KP.Balance.player;
    if(this.turbo>0) return;
    if(this.weak>0){ game.toast('Феликс ещё не отошёл от прошлого турбо.'); return; }
    if(this.turboCd>0){ game.toast(`Турбо перезаряжается: ${Math.ceil(this.turboCd/60)}с.`); return; }
    if(this.time<=20){ game.toast('Мало здоровья для турбо.'); return; }
    this.turbo=b.turboDuration;
    this.turboCd=b.turboCooldown;
    game.audio.play('timeStop',1.3,.6);
    game.toast('ТУРБО! Быстрее и сильнее — но жжёт здоровье.');
    game.burst(this.x+this.w/2,this.y+this.h/2,'#ff8a1c',26);
  }

  ammoForCurrentWeapon(){
    const w=KP.Balance.weapons[this.weapon];
    if(!w.ammoType) return Infinity;
    return this.ammoBag[w.ammoType]||0;
  }

  addAmmo(type,amount){
    if(!type||!this.ammoBag.hasOwnProperty(type)) return;
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
    if(up&&!down) ay=-.62;
    if(down&&!up) ay=.62;
    const len=Math.hypot(ax,ay)||1;
    return {x:ax/len,y:ay/len};
  }

  attack(game){
    const w=KP.Balance.weapons[this.weapon];
    if(this.attackCd>0||this.stunTimer>0) return;
    const ammoType=w.ammoType, ammoUse=w.ammoUse||0;
    if(ammoType&&(this.ammoBag[ammoType]||0)<ammoUse){
      game.toast(`Нет боеприпасов: ${KP.Balance.ammoTypes[ammoType].name}.`);
      return;
    }
    this.attackCd=w.delay/16.67;
    this.attackFlash=8;
    if(ammoType) this.ammoBag[ammoType]-=ammoUse;
    let dmg=w.dmg*this.damageMultiplier()*(game.comboMul||1);
    if(this.abilities.meleeMastery&&w.type==='melee') dmg*=1.35;
    if(this.abilities.finalResolve) dmg*=1.10;
    const aim=this.aimVector(game);
    const shotX=this.x+this.w/2+aim.x*30;
    const shotY=this.y+25+aim.y*10;
    game.audio.playWeapon(this.weapon);
    game.registerPlayerShot(shotX,shotY,w);

    if(w.type==='melee'){
      const hit={x:this.x+(this.facing>0?this.w:-w.range),y:this.y+8,w:w.range,h:this.h-6};
      for(const e of game.enemies) if(e.alive&&KP.Utils.rects(hit,e)){
        e.takeDamage(dmg,w.knock+(this.abilities.meleeMastery?4:0),this.x,{targetX:this.x+this.w/2},game);
        game.onEnemyHit(e,true,dmg);
        game.registerHit(dmg);
        game.damageNumbers.push(new KP.DamageNumber(e.x+e.w/2,e.y,dmg,dmg>50));
      }
      game.burst(hit.x+hit.w/2,hit.y+20,w.color,10);
      return;
    }

    const sx=shotX, sy=shotY;
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

    if(w.type==='gas'){
      game.spawnGasCloud('player',sx+aim.x*72,sy+aim.y*20,{
        life:w.cloudLife,
        radius:w.cloudRadius,
        tickDamage:w.cloudTick,
        color:w.color,
        driftX:aim.x*.55,
        driftY:aim.y*.1
      });
      game.burst(sx,sy,w.color,6);
      return;
    }

    const flame=w.type==='flame';
    game.playerBullets.push(new KP.Bullet('player',sx,sy,w.speed*aim.x,w.speed*aim.y,{
      dmg,range:w.range,color:w.color,knock:w.knock,flame,burn:w.burn,burnDps:w.burnDps,size:flame?18:9,pierce:flame,ammoType
    }));
    if(!flame) this.vx-=aim.x*(this.weapon==='mosin'?1.4:.35);
    game.burst(sx,sy,w.color,flame?3:8);
  }

  registerEnemyHit(game){
    const b=KP.Balance.player;
    if(this.dead||this.stunTimer>0) return;
    this.enemyHitChainTimer=b.hitStunResetFrames;
    this.enemyHitChain++;
    if(this.enemyHitChain<b.hitStunHits) return;
    this.enemyHitChain=0;
    this.enemyHitChainTimer=0;
    this.stunTimer=b.hitStunDuration;
    this.vx=0;
    game.toast('Феликс оглушён на 2 секунды.');
    game.burst(this.x+this.w/2,this.y+this.h/2,'#ffd21c',18);
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
      this.registerEnemyHit(game);
    }
    if(this.time<=0){ this.time=0; this.dead=true; }
  }

  gainXP(game,amount){
    this.xp+=amount;
    while(this.xp>=this.xpNext){
      this.xp-=this.xpNext;
      this.level++;
      this.xpNext=Math.round(this.xpNext*1.4+30);
      this.maxTime+=12;
      this.time=Math.min(this.maxTime,this.time+38);
      for(const t of Object.keys(this.maxAmmoBag)) this.maxAmmoBag[t]+=t==='machinegun'?18:t==='fuel'?14:t==='gas'?10:6;
      game.toast(`Уровень ${this.level}: больше времени и боезапаса.`);
    }
  }

  unlockAbility(id,game){
    if(!id||this.abilities[id]===undefined||this.abilities[id]) return;
    this.abilities[id]=true;
    const meta=(KP.Balance.abilityUnlocks||[]).find(a=>a&&a.id===id);
    if(game) game.toast('Открыта способность: '+(meta?meta.name:id)+'. '+(meta?meta.desc:''));
  }

  draw(ctx,assets){
    if(this.dodgeTimer>0){
      ctx.save();
      ctx.globalAlpha=this.dodgeTimer/KP.Balance.player.dodge.duration*0.4;
      ctx.fillStyle='#65e8ff';
      ctx.fillRect(this.x-this.facing*10,this.y+4,this.w,this.h-4);
      ctx.restore();
    }
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
    if(this.stunTimer>0){
      ctx.strokeStyle='rgba(255,210,28,.75)';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(this.x+17,this.y+22,18,0,Math.PI*2);
      ctx.stroke();
      ctx.fillStyle='rgba(255,210,28,.9)';
      ctx.fillRect(this.x+11,this.y-10,4,4);
      ctx.fillRect(this.x+20,this.y-14,4,4);
    }
    if(this.draining){
      ctx.strokeStyle='#65e8ff';
      ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(this.x+17,this.y+30,58,0,Math.PI*2);
      ctx.stroke();
    }
    if(this.gasSlowTimer>0&&!this.items.gasMaskActive){
      ctx.fillStyle='rgba(120,200,60,.18)';
      ctx.beginPath(); ctx.ellipse(this.x+17,this.y+30,22,38,0,0,Math.PI*2); ctx.fill();
    }
    if(this.items.gasMaskActive){
      ctx.strokeStyle='rgba(150,217,74,.75)';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(this.x+17,this.y+26,20,0,Math.PI*2);
      ctx.stroke();
    }
    assets.drawHero(ctx,this);
    const ratio=KP.Utils.clamp(this.time/this.maxTime,0,1);
    const bw=56, bh=6, bx=this.x+(this.w-bw)/2, by=this.y-18;
    KP.Utils.drawBar(ctx,bx,by,bw,bh,ratio,ratio>.35?'#65e8ff':'#ff5a4f','rgba(0,0,0,.7)');
    ctx.fillStyle='#dff8ff';
    ctx.font='bold 10px Arial';
    ctx.textAlign='center';
    ctx.fillText(`${Math.ceil(this.time)}/${this.maxTime}`,this.x+this.w/2,by-2);
    ctx.textAlign='left';
  }
};
