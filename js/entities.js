'use strict';
window.KP = window.KP || {};
const U = KP.Utils;

KP.Entity = class Entity {
  constructor(x,y,w,h){ Object.assign(this,{x,y,w,h,vx:0,vy:0,grounded:false,alive:true}); }
  get rect(){ return this; }
};

KP.Particle = class Particle {
  constructor(x,y,color){
    Object.assign(this,{x,y,color,vx:U.rand(-3,3),vy:U.rand(-4,2),life:U.rand(18,35),r:U.rand(1.5,3.5)});
  }
  update(){ this.x+=this.vx; this.y+=this.vy; this.vy+=.12; this.life--; }
  draw(ctx){
    ctx.globalAlpha=Math.max(0,this.life/35);
    ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=1;
  }
};

KP.Bullet = class Bullet extends KP.Entity {
  constructor(owner,x,y,vx,vy,opts){
    super(x,y,opts.size||10,opts.size||6);
    Object.assign(this,{
      owner,vx,vy,dmg:opts.dmg,range:opts.range,travel:0,color:opts.color,knock:opts.knock||0,
      flame:opts.flame||false,burn:opts.burn||0,burnDps:opts.burnDps||0,pierce:opts.pierce||false,trail:[]
    });
  }
  update(){
    this.trail.push({x:this.x,y:this.y});
    if(this.trail.length>7) this.trail.shift();
    this.x+=this.vx;
    this.y+=this.vy;
    this.travel+=Math.hypot(this.vx,this.vy);
    if(this.travel>this.range) this.alive=false;
  }
  draw(ctx){
    for(let i=0;i<this.trail.length;i++){
      const t=this.trail[i];
      ctx.globalAlpha=(i+1)/this.trail.length*.28;
      ctx.fillStyle=this.color;
      ctx.beginPath();
      ctx.arc(t.x,t.y,this.flame?10:4,0,Math.PI*2);
      ctx.fill();
      ctx.globalAlpha=1;
    }
    if(this.flame){
      ctx.fillStyle='#ff5b1a';
      ctx.beginPath();
      ctx.arc(this.x,this.y,12,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='rgba(255,210,70,.7)';
      ctx.beginPath();
      ctx.arc(this.x-4,this.y,7,0,Math.PI*2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(this.x,this.y);
      ctx.rotate(Math.atan2(this.vy,this.vx));
      ctx.fillStyle=this.color;
      ctx.beginPath();
      ctx.ellipse(0,0,10,3.4,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.75)';
      ctx.fillRect(-3,-1,6,2);
      ctx.restore();
    }
  }
};

KP.Pickup = class Pickup extends KP.Entity {
  constructor(x,y,type,amount=1,ammoType=null){
    super(x,y,20,20);
    Object.assign(this,{type,amount,ammoType,bob:Math.random()*99});
  }
  update(game){
    this.bob+=.07;
    this.vy+=game?game.gravity*.35:.2;
    if(game) game.world.collide(this);
  }
  draw(ctx){
    const yy=this.y+Math.sin(this.bob)*3;
    if(this.type==='money'){
      ctx.fillStyle='#ffd21c';
      ctx.beginPath();
      ctx.arc(this.x+10,yy+10,8,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#7a5100';
      ctx.font='bold 13px Arial';
      ctx.fillText('$',this.x+6,yy+15);
    } else if(this.type==='time'){
      ctx.fillStyle='#65e8ff';
      ctx.beginPath();
      ctx.arc(this.x+10,yy+10,9,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#06333c';
      ctx.font='bold 12px Arial';
      ctx.fillText('T',this.x+6,yy+15);
    } else {
      ctx.fillStyle='#ffd21c';
      ctx.fillRect(this.x+2,yy+2,16,16);
      ctx.fillStyle='#111';
      ctx.font='bold 9px Arial';
      const a=this.ammoType&&KP.Balance.ammoTypes[this.ammoType]?KP.Balance.ammoTypes[this.ammoType].short:'AM';
      ctx.fillText(a,this.x+3,yy+14);
    }
  }
};

KP.Enemy = class Enemy extends KP.Entity {
  constructor(x,y,kind){
    const bossKinds=['lenin','mushroomBoss','treeBoss','sandBoss','swampBoss','factoryBoss'];
    const size=kind==='tank'?[104,62]:kind==='horse'?[70,62]:bossKinds.includes(kind)?[86,88]:kind==='miniboss'?[50,60]:[42,52];
    super(x,y,size[0],size[1]);
    const b=KP.Balance.enemies[kind];
    Object.assign(this,{
      kind,hp:b.hp,maxHp:b.hp,dmg:b.dmg,hitTime:b.hitTime,xp:b.xp,moneyRange:b.money,speed:b.speed,detect:b.detect,
      attackRange:b.attackRange,shoot:b.shoot,fireDelay:b.fireDelay||0,keepDistance:b.keepDistance||0,bulletSpeed:b.bulletSpeed||0,
      canJump:b.jump,weight:b.weight,facing:-1,state:'patrol',shootCd:60,jumpCd:80,hurt:0,alertText:'',alertTimer:0,meleeCd:0,
      burn:0,burnDps:0,ramCd:b.ramCd||0,ramTimer:0,ramSpeed:b.ramSpeed||0,ramDuration:b.ramDuration||0,turboCd:120+Math.random()*160,
      turboTimer:0,timeDrained:false,patrolMin:0,patrolMax:99999,floorY:0,memoryTimer:0,lastSeenX:x,lastSeenY:y,laneBias:U.rand(-28,28),
      strafeBias:Math.random()<.5?-1:1,burstCd:55+Math.random()*70,burstTimer:0
    });
  }

  setPatrol(min,max,floorY){
    this.patrolMin=min;
    this.patrolMax=max;
    this.floorY=floorY;
    this.x=KP.Utils.clamp(this.x,min,Math.max(min,max-this.w));
    this.y=floorY-this.h;
    this.grounded=true;
    this.lastSeenX=this.x;
    this.lastSeenY=this.y;
    return this;
  }

  sameFloor(p){ return Math.abs((p.y+p.h)-(this.floorY||0))<135; }

  seePlayer(p){
    const dx=(p.x+p.w/2)-(this.x+this.w/2);
    const absX=Math.abs(dx);
    const dy=(p.y+p.h/2)-(this.y+this.h/2);
    const ahead=Math.sign(dx)===this.facing || absX<36;
    const alertVision=this.state==='aggro' || absX<108 || this.kind==='horse' || KP.Balance.enemies[this.kind].role==='boss';
    const playerNearMyFloor=this.sameFloor(p) || this.shoot || this.kind==='lenin' || absX<92;
    return (ahead || alertVision) && playerNearMyFloor && absX<this.detect && Math.abs(dy)<170;
  }

  aggro(text){
    this.state='aggro';
    this.memoryTimer=Math.max(this.memoryTimer,55);
    if(text){ this.alertText=text; this.alertTimer=105; }
  }

  rememberPlayer(p,frames=150){
    this.lastSeenX=p.x+p.w/2+this.laneBias;
    this.lastSeenY=p.y+p.h/2;
    this.memoryTimer=Math.max(this.memoryTimer,frames);
  }

  clampTargetX(raw){
    return KP.Utils.clamp(raw,this.patrolMin+this.w*.5,Math.max(this.patrolMin+this.w*.5,this.patrolMax-this.w*.5));
  }

  shouldSupportAllies(game,p,abs){
    if(abs>this.detect*.82) return false;
    for(const ally of game.enemies){
      if(ally===this || !ally.alive || ally.state!=='aggro') continue;
      if(Math.abs((ally.floorY||ally.y)-(this.floorY||this.y))>110) continue;
      if(Math.abs(ally.x-this.x)<210){
        this.rememberPlayer(p,95);
        return true;
      }
    }
    return false;
  }

  updateBurst(abs){
    if(this.shoot) return 1;
    if(this.burstTimer>0){
      this.burstTimer--;
      if(this.kind==='horse') return 1.9;
      if(this.kind==='runner') return 1.6;
      return 1.35;
    }
    if(this.burstCd>0) this.burstCd--;
    const trigger=this.kind==='horse'?330:250;
    if(this.burstCd<=0 && abs<trigger){
      this.burstTimer=this.kind==='horse'?34:22;
      this.burstCd=85+Math.random()*80;
      if(this.kind==='horse') return 1.9;
      if(this.kind==='runner') return 1.6;
      return 1.35;
    }
    return 1;
  }

  shouldCombatJump(p,abs,ranged=false,canTrackVertical=false){
    if(!this.canJump || !this.grounded || this.jumpCd>0) return false;
    const playerHigher=p.y+50<this.y && abs<250;
    const pressureHop=!ranged && abs<105;
    const rangedHop=ranged && abs>this.attackRange*.82 && abs<this.attackRange*1.15 && Math.random()<.08;
    const verticalHop=canTrackVertical && Math.abs((p.y+p.h)-this.floorY)>70 && abs<145;
    return playerHigher || verticalHop || pressureHop || rangedHop;
  }

  jumpToward(dir,highArc=false,speedMul=1){
    this.vy=highArc?-10.9:-9.2;
    this.vx+=dir*this.speed*speedMul*1.9;
    this.jumpCd=74+Math.random()*56;
  }

  takeDamage(dmg,knock,fromX,opts={}){
    this.hp-=dmg;
    this.hurt=12;
    this.facing=fromX < this.x ? -1 : 1;
    this.vx+=this.facing*knock/Math.max(.7,this.weight);
    this.lastSeenX=fromX;
    this.memoryTimer=Math.max(this.memoryTimer,120);
    if(opts.burn){
      this.burn=Math.max(this.burn,opts.burn);
      this.burnDps=Math.max(this.burnDps,opts.burnDps||0);
    }
    this.aggro(U.choice([
      'Тревога!',
      'Он снова здесь!',
      'Не подпускайте его!',
      'По нему огонь!',
      'Грибница требует реванша!'
    ]));
    if(this.hp<=0) this.alive=false;
  }

  drainTime(game){
    this.timeDrained=true;
    this.hp-=KP.Balance.player.drainEnemyDamagePerFrame;
    this.vx*=.72;
    this.memoryTimer=Math.max(this.memoryTimer,90);
    if(this.hp<=0) this.alive=false;
  }

  update(game){
    const p=game.player;
    this.timeDrained=false;
    if(game.timeStopFrames>0) return;
    if(this.hurt>0) this.hurt--;
    if(this.alertTimer>0) this.alertTimer--;
    if(this.meleeCd>0) this.meleeCd--;
    if(this.jumpCd>0) this.jumpCd--;
    if(this.memoryTimer>0) this.memoryTimer--;
    if(this.burn>0){
      this.burn--;
      this.hp-=this.burnDps;
      game.burst(this.x+this.w/2,this.y+this.h/2,'#ff5b1a',1);
      if(this.hp<=0) this.alive=false;
    }
    if(this.alertTimer<=0 && Math.random()<0.0025 && Math.abs(game.player.x-this.x)<520){
      this.aggro(U.choice(['Где мой паёк?','Не дыши на грибницу.','Кто выключил вечность?','Смена тревожная.']));
    }

    const dx=(p.x+p.w/2)-(this.x+this.w/2);
    const abs=Math.abs(dx);
    const dir=dx>0?1:-1;
    const sees=this.seePlayer(p);
    const allySupport=this.shouldSupportAllies(game,p,abs);

    if(sees){
      this.aggro();
      this.rememberPlayer(p,this.shoot?185:155);
    } else if(allySupport){
      this.aggro('Контакт!');
    }

    const speedMul=this.updateBossTurbo(game,abs,dir);
    if(this.kind==='lenin') this.updateLeninRam(game,abs,dir);

    if(this.state==='aggro') this.runAggro(game,p,dx,abs,dir,speedMul,sees);
    else this.runPatrol(speedMul);

    this.vx*=.88;
    this.vy+=game.gravity;
    game.world.collide(this);
    if(this.floorY && this.y>this.floorY-this.h+72){
      this.y=this.floorY-this.h;
      this.vy=0;
      this.grounded=true;
    }
    this.enforcePatrolBounds();
    if(U.rects(this,p) && this.meleeCd<=0){
      this.meleeCd=52;
      p.hurt(this.hitTime,this.x<p.x?1:-1,game);
    }
  }

  runAggro(game,p,dx,abs,dir,speedMul,sees){
    const targetInside=p.x>this.patrolMin-140 && p.x<this.patrolMax+140;
    const canTrackVertical=Math.abs((p.y+p.h)-(this.floorY||this.y+this.h))<210;
    const pressureOk=targetInside && (this.sameFloor(p) || this.shoot || this.kind==='lenin' || canTrackVertical);
    const rememberedX=this.clampTargetX((sees?p.x+p.w/2:this.lastSeenX));
    const center=this.x+this.w/2;
    const pursueDir=rememberedX>=center?1:-1;
    this.facing=pursueDir || dir || this.facing;

    if(this.shoot){
      const desiredKeep=Math.max(120,this.keepDistance+this.laneBias*.4);
      if(abs<desiredKeep*.82){
        this.vx-=dir*this.speed*speedMul*.8;
      } else if(pressureOk && abs>this.attackRange*.9){
        this.vx+=pursueDir*this.speed*speedMul*(sees?1.08:.7);
      } else if(pressureOk && Math.abs(rememberedX-center)>28){
        this.vx+=pursueDir*this.speed*speedMul*.52;
      } else {
        this.vx+=this.strafeBias*this.speed*speedMul*.12;
      }
      this.shootCd--;
      if(this.shouldCombatJump(p,abs,true,canTrackVertical)) this.jumpToward(pursueDir,p.y+45<this.y,speedMul);
      const canFire=sees || (this.memoryTimer>55 && abs<this.attackRange*.78);
      if(canFire && abs<this.attackRange && this.shootCd<=0) this.fire(game,p);
    } else {
      const burst=this.updateBurst(abs);
      if(pressureOk) this.vx+=pursueDir*this.speed*speedMul*burst;
      else if(this.memoryTimer>0) this.vx+=pursueDir*this.speed*speedMul*.55;
      if(this.shouldCombatJump(p,abs,false,canTrackVertical)) this.jumpToward(pursueDir,p.y+45<this.y,speedMul*burst);
    }

    if(!sees && this.memoryTimer<=0 && abs>this.detect*1.12){
      this.state='patrol';
      return;
    }
    if(!pressureOk && !sees && this.memoryTimer<28 && Math.abs(rememberedX-center)<32) this.state='patrol';
  }

  runPatrol(speedMul){
    this.vx+=this.facing*this.speed*speedMul*.18;
    if(Math.random()<.0035) this.facing*=-1;
  }

  enforcePatrolBounds(){
    if(this.x<this.patrolMin){
      this.x=this.patrolMin;
      this.vx=Math.abs(this.vx)*.4;
      this.facing=1;
    }
    if(this.x+this.w>this.patrolMax){
      this.x=this.patrolMax-this.w;
      this.vx=-Math.abs(this.vx)*.4;
      this.facing=-1;
    }
  }

  updateBossTurbo(game,abs,dir){
    const cfg=KP.Balance.enemies[this.kind];
    if(!cfg || cfg.role!=='boss') return 1;
    if(this.turboTimer>0){
      this.turboTimer--;
      this.facing=dir || this.facing;
      return 1.75;
    }
    if(this.turboCd>0) this.turboCd--;
    if(this.turboCd<=0 && abs<620){
      this.turboTimer=150;
      this.turboCd=260+Math.random()*150;
      this.alertText=U.choice(['ТУРБО-ПЛЕСЕНЬ!','Фаза ускорения!','Исторический рывок!']);
      this.alertTimer=90;
      game.toast('Босс включил турбо. Теперь он и правда давит.');
      game.burst(this.x+this.w/2,this.y+this.h/2,'#ff4040',18);
      return 1.75;
    }
    return 1;
  }

  updateLeninRam(game,abs,dir){
    if(this.ramTimer>0){
      this.ramTimer--;
      this.vx=dir*this.ramSpeed;
      if(U.rects(this,game.player)) game.player.hurt(this.hitTime+10,dir,game);
      return;
    }
    if(this.ramCd>0) this.ramCd--;
    if(abs>120 && abs<600 && this.ramCd<=0 && Math.abs(this.y-game.player.y)<90){
      this.ramTimer=this.ramDuration;
      this.ramCd=220;
      this.facing=dir;
      this.alertText='ТАРАН ИСТОРИИ!';
      this.alertTimer=90;
      this.rememberPlayer(game.player,150);
      game.toast('Ленин идёт тараном. Придётся отходить.');
    }
  }

  fire(game,p){
    this.shootCd=Math.max(18,Math.round(this.fireDelay*(this.memoryTimer>85?0.92:1)));
    const c=U.center(this), pc=U.center(p);
    const rawDx=pc.x-c.x, rawDy=pc.y-c.y;
    const travelFrames=Math.min(18,Math.hypot(rawDx,rawDy)/Math.max(1,this.bulletSpeed));
    const tx=pc.x+(p.vx||0)*travelFrames*1.65;
    const ty=pc.y+(p.vy||0)*Math.min(10,travelFrames)*1.2;
    const dx=tx-c.x, dy=ty-c.y, len=Math.hypot(dx,dy)||1;
    game.enemyBullets.push(new KP.Bullet('enemy',c.x,c.y,dx/len*this.bulletSpeed,dy/len*this.bulletSpeed,{
      dmg:this.hitTime,range:700,color:this.kind==='tank'?'#ff4040':'#76ff54',knock:4,size:this.kind==='tank'?15:10
    }));
  }

  draw(ctx,assets){
    assets.drawEnemy(ctx,this);
    U.drawBar(ctx,this.x,this.y-10,this.w,5,this.hp/this.maxHp,this.kind==='lenin'?'#ff4040':'#52e152');
    if(this.burn>0){
      ctx.fillStyle='rgba(255,90,20,.45)';
      ctx.beginPath();
      ctx.arc(this.x+this.w/2,this.y+this.h/2,this.w*.55,0,Math.PI*2);
      ctx.fill();
    }
    if(this.timeDrained){
      ctx.strokeStyle='#65e8ff';
      ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(this.x+this.w/2,this.y+this.h/2,this.w*.7,0,Math.PI*2);
      ctx.stroke();
    }
    if(this.alertTimer>0){
      ctx.fillStyle='rgba(255,255,255,.92)';
      ctx.fillRect(this.x-20,this.y-44,Math.max(96,this.alertText.length*7),24);
      ctx.fillStyle='#111';
      ctx.font='12px Arial';
      ctx.fillText(this.alertText,this.x-15,this.y-28);
    }
  }
};
