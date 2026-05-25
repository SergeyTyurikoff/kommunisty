'use strict';
window.KP = window.KP || {};
const U = KP.Utils;

KP.Entity = class Entity {
  constructor(x,y,w,h){ Object.assign(this,{x,y,w,h,vx:0,vy:0,grounded:false,alive:true}); }
  get rect(){ return this; }
};

// Floating damage number
KP.DamageNumber = class DamageNumber {
  constructor(x,y,amount,crit=false){
    Object.assign(this,{x,y,vy:-2.2,life:52,maxLife:52,text:Math.round(amount).toString(),crit});
  }
  update(){ this.x+=U.rand(-.3,.3); this.y+=this.vy; this.vy+=0.07; this.life--; }
  draw(ctx){
    const alpha=Math.max(0,this.life/this.maxLife);
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.font=this.crit?'bold 19px Arial':'bold 14px Arial';
    ctx.strokeStyle='#000';
    ctx.lineWidth=3;
    ctx.strokeText(this.text,this.x,this.y);
    ctx.fillStyle=this.crit?'#ff8800':'#fff';
    ctx.fillText(this.text,this.x,this.y);
    ctx.restore();
  }
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

// Destructible crate
KP.Crate = class Crate extends KP.Entity {
  constructor(x,y){ super(x,y,36,36); this.hp=1; this.shake=0; }
  takeDamage(game){
    this.shake=6;
    this.hp--;
    if(this.hp<=0){
      this.alive=false;
      game.burst(this.x+18,this.y+18,'#8b5a20',18);
      game.burst(this.x+18,this.y+18,'#ffd21c',6);
      this._dropLoot(game);
      game.audio.play('pickupAmmo',0.72);
    }
  }
  _dropLoot(game){
    const r=Math.random();
    const px=this.x+8, py=this.y;
    if(r<0.38) game.pickups.push(new KP.Pickup(px,py,'money',KP.Utils.rand(10,28)|0));
    else if(r<0.65){
      const inv=game.player.inventory;
      const allTypes=Object.keys(KP.Balance.ammoTypes);
      const relevant=allTypes.filter(at=>inv.some(id=>KP.Balance.weapons[id]&&KP.Balance.weapons[id].ammoType===at));
      const at=relevant.length?relevant[Math.floor(Math.random()*relevant.length)]:allTypes[Math.floor(Math.random()*allTypes.length)];
      const amt=at==='machinegun'?20:at==='fuel'?16:at==='shells'?4:8;
      game.pickups.push(new KP.Pickup(px,py,'ammo',amt,at));
    } else {
      game.pickups.push(new KP.Pickup(px,py,'time',16));
    }
  }
  draw(ctx){
    const ox=this.shake>0?(Math.random()*4-2):0;
    if(this.shake>0) this.shake--;
    const x=this.x+ox, y=this.y;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x+3,y+34,30,4);
    // Crate body
    ctx.fillStyle='#7a4f18'; ctx.fillRect(x,y,36,36);
    ctx.fillStyle='#5c3610'; ctx.fillRect(x,y,36,36);
    // Wood planks horizontal
    ctx.fillStyle='#8b5a20'; ctx.fillRect(x,y,36,36);
    ctx.fillStyle='#6b3e10';
    ctx.fillRect(x,y+11,36,3);
    ctx.fillRect(x,y+22,36,3);
    // Wood planks vertical
    ctx.fillRect(x+10,y,3,36);
    ctx.fillRect(x+23,y,3,36);
    // Corner nails
    ctx.fillStyle='#c8960a';
    [[2,2],[30,2],[2,30],[30,30]].forEach(([nx,ny])=>{
      ctx.beginPath(); ctx.arc(x+nx,y+ny,2.5,0,Math.PI*2); ctx.fill();
    });
    // Outline
    ctx.strokeStyle='#3a2005'; ctx.lineWidth=2; ctx.strokeRect(x,y,36,36);
    // Question mark
    ctx.fillStyle='#ffd21c'; ctx.font='bold 22px Arial';
    ctx.fillText('?',x+10,y+27);
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
    this.x+=this.vx; this.y+=this.vy;
    this.travel+=Math.hypot(this.vx,this.vy);
    if(this.travel>this.range) this.alive=false;
  }
  draw(ctx){
    for(let i=0;i<this.trail.length;i++){
      const t=this.trail[i];
      ctx.globalAlpha=(i+1)/this.trail.length*.28;
      ctx.fillStyle=this.color;
      ctx.beginPath(); ctx.arc(t.x,t.y,this.flame?10:4,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
    }
    if(this.flame){
      // Flamethrower blob with outer glow
      ctx.save();
      ctx.globalAlpha=.35; ctx.fillStyle='#ff8800';
      ctx.beginPath(); ctx.arc(this.x,this.y,18,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
      ctx.fillStyle='#ff5b1a'; ctx.beginPath(); ctx.arc(this.x,this.y,12,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,210,70,.7)'; ctx.beginPath(); ctx.arc(this.x-4,this.y,7,0,Math.PI*2); ctx.fill();
      ctx.restore();
    } else {
      // Enemy bullet: green glow halo
      if(this.owner==='enemy'){
        ctx.save();
        ctx.globalAlpha=.25; ctx.fillStyle=this.color;
        ctx.beginPath(); ctx.arc(this.x,this.y,this.w,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      ctx.save();
      ctx.translate(this.x,this.y);
      ctx.rotate(Math.atan2(this.vy,this.vx));
      // Sniper bullet: larger elongated
      const rx=this.w>10?14:10, ry=this.w>10?4.5:3.4;
      ctx.fillStyle=this.color; ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.75)'; ctx.fillRect(-rx*.4,-1,rx*.8,2);
      ctx.restore();
    }
  }
};

KP.Pickup = class Pickup extends KP.Entity {
  constructor(x,y,type,amount=1,ammoType=null){
    super(x,y,22,22);
    Object.assign(this,{type,amount,ammoType,bob:Math.random()*99});
  }
  update(game){
    this.bob+=.07;
    this.vy+=game?game.gravity*.35:.2;
    if(game) game.world.collide(this);
  }
  draw(ctx){
    const yy=this.y+Math.sin(this.bob)*3;
    ctx.save();
    if(this.type==='money'){
      // Gold coin with sheen
      ctx.fillStyle='#c89000'; ctx.beginPath(); ctx.arc(this.x+11,yy+11,11,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffd21c'; ctx.beginPath(); ctx.arc(this.x+11,yy+10,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(this.x+8,yy+6,4,2.5,-0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#7a5100'; ctx.font='bold 13px Arial'; ctx.fillText('$',this.x+7,yy+15);
    } else if(this.type==='time'){
      // Cyan crystal hourglass
      ctx.fillStyle='#003d44'; ctx.beginPath(); ctx.arc(this.x+11,yy+11,11,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#65e8ff'; ctx.beginPath(); ctx.arc(this.x+11,yy+10,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(this.x+8,yy+7,3.5,2,-0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#06333c'; ctx.font='bold 12px Arial'; ctx.fillText('T',this.x+7,yy+15);
    } else if(this.type==='heal'){
      ctx.fillStyle='#3a0a0a'; ctx.beginPath(); ctx.arc(this.x+11,yy+11,11,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#d92d2d'; ctx.beginPath(); ctx.arc(this.x+11,yy+10,9,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.32)'; ctx.beginPath(); ctx.ellipse(this.x+8,yy+7,3.5,2,-0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff4f4';
      ctx.fillRect(this.x+9,yy+4,4,12);
      ctx.fillRect(this.x+5,yy+8,12,4);
    } else {
      // Ammo box — colour by type
      const colours={pistol:'#aaa',rifle:'#c89042',machinegun:'#6aaa44',shells:'#cc3322',fuel:'#ff7700'};
      const bg=this.ammoType&&colours[this.ammoType]||'#ffd21c';
      ctx.fillStyle='#222'; ctx.fillRect(this.x,yy,22,22);
      ctx.fillStyle=bg; ctx.fillRect(this.x+1,yy+1,20,20);
      // Stripe
      ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(this.x+1,yy+10,20,2);
      ctx.fillStyle='#000'; ctx.font='bold 9px Arial';
      const short=this.ammoType&&KP.Balance.ammoTypes[this.ammoType]?KP.Balance.ammoTypes[this.ammoType].short:'AM';
      ctx.fillText(short,this.x+2,yy+15);
      ctx.strokeStyle='#111'; ctx.lineWidth=1; ctx.strokeRect(this.x,yy,22,22);
    }
    ctx.restore();
  }
};

KP.Enemy = class Enemy extends KP.Entity {
  constructor(x,y,kind){
    const bossKinds=['lenin','mushroomBoss','treeBoss','sandBoss','swampBoss','factoryBoss'];
    const size=kind==='horse'?[70,62]:kind==='shielder'?[50,56]:bossKinds.includes(kind)?[86,88]:kind==='miniboss'?[50,60]:[42,52];
    super(x,y,size[0],size[1]);
    const b=KP.Balance.enemies[kind];
    Object.assign(this,{
      kind,hp:b.hp,maxHp:b.hp,dmg:b.dmg,hitTime:b.hitTime,xp:b.xp,moneyRange:b.money,
      speed:b.speed,detect:b.detect,attackRange:b.attackRange,shoot:b.shoot,fireDelay:b.fireDelay||0,
      keepDistance:b.keepDistance||0,bulletSpeed:b.bulletSpeed||0,canJump:b.jump,weight:b.weight,
      facing:-1,state:'patrol',shootCd:60,jumpCd:80,hurt:0,alertText:'',alertTimer:0,meleeCd:0,
      burn:0,burnDps:0,ramCd:b.ramCd||0,ramTimer:0,ramSpeed:b.ramSpeed||0,ramDuration:b.ramDuration||0,
      turboCd:120+Math.random()*160,turboTimer:0,timeDrained:false,
      patrolMin:0,patrolMax:99999,basePatrolMin:0,basePatrolMax:99999,laneType:'ground',floorY:0,memoryTimer:0,lastSeenX:x,lastSeenY:y,
      laneBias:U.rand(-28,28),strafeBias:Math.random()<.5?-1:1,
      burstCd:55+Math.random()*70,burstTimer:0,underFireTimer:0,
      strafeTimer:24+Math.random()*40|0,attackFlash:0,deathTimer:0,lastDodgeSerial:-1,
      stuckFrames:0,intentDir:0,intentMove:0,
      phase2:false,phase2Triggered:false,
      // Per-enemy abilities
      rollTimer:0,   rollCd:  kind==='runner'  ?(55+Math.random()*60|0):9999,
      lungeCd:       kind==='zombie'   ?(75+Math.random()*80|0):9999,  lungeTimer:0,
      mbShieldTimer:0, mbShieldCd: kind==='miniboss'?(200+Math.random()*140|0):9999,
      sniperScope:0,
      explodeArmed:  kind==='kamikaze',
      shieldFlash:0
    });
  }

  setPatrol(min,max,floorY,laneType='ground'){
    this.patrolMin=min; this.patrolMax=max;
    this.basePatrolMin=min; this.basePatrolMax=max;
    this.laneType=laneType;
    this.floorY=floorY;
    this.x=KP.Utils.clamp(this.x,min,Math.max(min,max-this.w));
    this.y=floorY-this.h; this.grounded=true;
    this.lastSeenX=this.x; this.lastSeenY=this.y;
    return this;
  }

  sameFloor(p){ return Math.abs((p.y+p.h)-(this.floorY||0))<135; }

  seePlayer(p){
    const dx=(p.x+p.w/2)-(this.x+this.w/2);
    const absX=Math.abs(dx), dy=(p.y+p.h/2)-(this.y+this.h/2);
    const ahead=Math.sign(dx)===this.facing||absX<36;
    const alertVision=this.state==='aggro'||absX<108||this.kind==='horse'||KP.Balance.enemies[this.kind].role==='boss';
    const playerNearMyFloor=this.sameFloor(p)||this.shoot||this.kind==='lenin'||absX<92;
    return (ahead||alertVision)&&playerNearMyFloor&&absX<this.detect&&Math.abs(dy)<170;
  }

  aggro(text){
    this.state='aggro'; this.memoryTimer=Math.max(this.memoryTimer,55);
    if(text){ this.alertText=text; this.alertTimer=105; }
  }

  rememberPlayer(p,frames=150){
    this.lastSeenX=p.x+p.w/2+this.laneBias; this.lastSeenY=p.y+p.h/2;
    this.memoryTimer=Math.max(this.memoryTimer,frames);
  }

  rememberPoint(x,y,frames=150){
    this.lastSeenX=x;
    this.lastSeenY=y;
    this.memoryTimer=Math.max(this.memoryTimer,frames);
  }

  clampTargetX(raw){ return KP.Utils.clamp(raw,this.patrolMin+this.w*.5,Math.max(this.patrolMin+this.w*.5,this.patrolMax-this.w*.5)); }
  applyMove(dir,amount){
    if(!dir||!amount) return;
    this.vx+=dir*amount;
    this.intentDir=dir;
    this.intentMove=Math.max(this.intentMove,Math.abs(amount));
  }

  shouldSupportAllies(game,p,abs){
    if(abs>this.detect*.82) return false;
    for(const ally of game.enemies){
      if(ally===this||!ally.alive||ally.state!=='aggro') continue;
      if(Math.abs((ally.floorY||ally.y)-(this.floorY||this.y))>110) continue;
      if(Math.abs(ally.x-this.x)<210){ this.rememberPlayer(p,95); return true; }
    }
    return false;
  }

  refreshCombatBounds(game,targetX){
    if(this.laneType!=='ground'){
      this.patrolMin=this.basePatrolMin;
      this.patrolMax=this.basePatrolMax;
      return;
    }
    const role=KP.Balance.enemies[this.kind]&&KP.Balance.enemies[this.kind].role;
    const extra=role==='boss'?440:this.kind==='horse'?380:(this.shoot?330:290);
    const pressureBoost=this.underFireTimer>0?150:0;
    const min=Math.min(this.basePatrolMin,targetX-extra-pressureBoost);
    const max=Math.max(this.basePatrolMax,targetX+extra+pressureBoost);
    this.patrolMin=KP.Utils.clamp(min,0,game.world.worldW-this.w-40);
    this.patrolMax=KP.Utils.clamp(max,this.patrolMin+this.w+40,game.world.worldW);
  }

  restorePatrolBounds(){
    this.patrolMin=this.basePatrolMin;
    this.patrolMax=this.basePatrolMax;
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
    if(this.burstCd<=0&&abs<trigger){
      this.burstTimer=this.kind==='horse'?34:22;
      this.burstCd=85+Math.random()*80;
      if(this.kind==='horse') return 1.9;
      if(this.kind==='runner') return 1.6;
      return 1.35;
    }
    return 1;
  }

  shouldCombatJump(p,abs,ranged=false,canTrackVertical=false){
    if(!this.canJump||!this.grounded||this.jumpCd>0) return false;
    const playerHigher=p.y+50<this.y&&abs<250;
    const pressureHop=!ranged&&abs<105;
    const rangedHop=ranged&&abs>this.attackRange*.82&&abs<this.attackRange*1.15&&Math.random()<.08;
    const verticalHop=canTrackVertical&&Math.abs((p.y+p.h)-this.floorY)>70&&abs<145;
    return playerHigher||verticalHop||pressureHop||rangedHop;
  }

  jumpToward(dir,highArc=false,speedMul=1){
    this.vy=highArc?-10.9:-9.2;
    this.vx+=dir*this.speed*speedMul*1.9;
    this.intentDir=dir||this.intentDir;
    this.jumpCd=74+Math.random()*56;
  }

  takeDamage(dmg,knock,fromX,opts={},game=null){
    // Miniboss shield absorbs one hit
    if(this.kind==='miniboss'&&this.mbShieldTimer>0){
      this.mbShieldTimer=0; this.shieldFlash=20;
      if(game) game.burst(this.x+this.w/2,this.y+this.h/2,'#aaddff',16);
      return;
    }
    // Shielder: front-facing shield reduces incoming damage from front
    if(this.kind==='shielder'){
      const fromFront=(fromX<this.x+this.w/2)===(this.facing<0);
      if(fromFront){ dmg=Math.round(dmg*0.12); knock*=0.12; this.shieldFlash=10; }
    }
    // Kamikaze explodes on death
    if(this.kind==='kamikaze'&&this.hp-dmg<=0&&this.explodeArmed&&game){
      this._kamikazeExplode(game); return;
    }
    this.hp-=dmg;
    this.hurt=12;
    this.facing=fromX<this.x?-1:1;
    this.vx+=this.facing*knock/Math.max(.7,this.weight);
    this.lastSeenX=opts.targetX!==undefined?opts.targetX:fromX;
    this.memoryTimer=Math.max(this.memoryTimer,120);
    this.underFireTimer=Math.max(this.underFireTimer,140);
    if(opts.burn){ this.burn=Math.max(this.burn,opts.burn); this.burnDps=Math.max(this.burnDps,opts.burnDps||0); }
    this.aggro(U.choice(['Тревога!','Он снова здесь!','Не подпускайте его!','По нему огонь!','Грибница требует реванша!']));
    // Boss phase 2
    if(!this.phase2Triggered && this.hp>0 && this.hp/this.maxHp<0.4){
      const cfg=KP.Balance.enemies[this.kind];
      if(cfg&&cfg.role==='boss') this._triggerPhase2(game);
    }
    if(this.hp<=0){
      this.alive=false;
      this.deathTimer=Math.max(this.deathTimer,28);
      this.vx+=this.facing*1.8;
      this.vy=-2.1;
    }
  }

  _triggerPhase2(game){
    this.phase2=true; this.phase2Triggered=true;
    this.speed*=1.55;
    if(this.fireDelay>0) this.fireDelay=Math.max(24,Math.round(this.fireDelay*0.62));
    this.alertText='ВТОРАЯ ФАЗА!'; this.alertTimer=180;
    if(game){
      game.toast('Босс перешёл во вторую фазу — быстрее и злее!');
      game.burst(this.x+this.w/2,this.y+this.h/2,'#ff0000',35);
      game.burst(this.x+this.w/2,this.y+this.h/2,'#ffd21c',20);
      game.audio.play('timeStop',1.22);
    }
  }

  drainTime(game){
    this.timeDrained=true;
    this.hp-=KP.Balance.player.drainEnemyDamagePerFrame;
    this.vx*=.72;
    this.memoryTimer=Math.max(this.memoryTimer,90);
    if(this.hp<=0){
      this.alive=false;
      this.deathTimer=Math.max(this.deathTimer,24);
    }
  }

  update(game){
    const p=game.player;
    this.timeDrained=false;
    if(!this.alive){
      if(this.deathTimer>0){
        this.deathTimer--;
        this.vx*=.84;
        this.vy=Math.min(this.vy+game.gravity*.35,4.4);
        this.x+=this.vx;
        this.y=Math.min(this.y+this.vy,(this.floorY||this.y+this.h)-this.h);
      }
      return;
    }
    if(game.timeStopFrames>0) return;
    if(this.hurt>0) this.hurt--;
    if(this.alertTimer>0) this.alertTimer--;
    if(this.meleeCd>0) this.meleeCd--;
    if(this.jumpCd>0) this.jumpCd--;
    if(this.memoryTimer>0) this.memoryTimer--;
    if(this.underFireTimer>0) this.underFireTimer--;
    if(this.attackFlash>0) this.attackFlash--;
    if(this.strafeTimer>0) this.strafeTimer--;
    if(this.burn>0){
      this.burn--; this.hp-=this.burnDps;
      game.burst(this.x+this.w/2,this.y+this.h/2,'#ff5b1a',1);
      if(this.hp<=0){
        this.alive=false;
        this.deathTimer=Math.max(this.deathTimer,24);
        return;
      }
    }
    if(this.alertTimer<=0&&Math.random()<0.0025&&Math.abs(game.player.x-this.x)<520)
      this.aggro(U.choice(['Где мой паёк?','Не дыши на грибницу.','Кто выключил вечность?','Смена тревожная.']));

    const dx=(p.x+p.w/2)-(this.x+this.w/2);
    const abs=Math.abs(dx), dir=dx>0?1:-1;
    const prevX=this.x;
    this.intentDir=0;
    this.intentMove=0;
    const sees=this.seePlayer(p);
    const allySupport=this.shouldSupportAllies(game,p,abs);
    const shotSignal=game.playerShotSignal&&game.playerShotSignal.timer>0?game.playerShotSignal:null;
    const shotDx=shotSignal?shotSignal.x-(this.x+this.w/2):0;
    const shotAbs=Math.abs(shotDx);
    const heardRecentShot=!!(shotSignal&&shotAbs<shotSignal.radius&&Math.abs(shotSignal.y-(this.y+this.h/2))<260);
    const hearsShots=heardRecentShot||(game.player.attackCd>0&&abs<this.detect*.95&&Math.abs((p.y+p.h/2)-(this.y+this.h/2))<220);

    if(sees){ this.aggro(); this.rememberPlayer(p,this.shoot?185:155); }
    else if(hearsShots){
      this.aggro('Огонь!');
      if(heardRecentShot) this.rememberPoint(shotSignal.x+this.laneBias,shotSignal.y,this.shoot?175:150);
      else this.rememberPlayer(p,this.shoot?145:125);
    }
    else if(allySupport){ this.aggro('Контакт!'); }

    if(this.state==='aggro'||this.memoryTimer>0||this.underFireTimer>0) this.refreshCombatBounds(game,sees?p.x+p.w/2:this.lastSeenX);
    else this.restorePatrolBounds();

    const speedMul=this.updateBossTurbo(game,abs,dir);
    if(this.kind==='lenin') this.updateLeninRam(game,abs,dir);
    this._updateAbilities(game,p,abs,dir);

    if(this.state==='aggro') this.runAggro(game,p,abs,dir,speedMul,sees,hearsShots);
    else this.runPatrol(speedMul);

    this.vx*=.88; this.vy+=game.gravity;
    game.world.collide(this);
    if(this.floorY&&this.y>this.floorY-this.h+72){ this.y=this.floorY-this.h; this.vy=0; this.grounded=true; }
    this.enforcePatrolBounds();
    this.resolveStuckState(prevX,p,abs);
    if(U.rects(this,p)&&this.meleeCd<=0){
      this.meleeCd=52;
      p.hurt(this.hitTime,this.x<p.x?1:-1,game);
    }
  }

  resolveStuckState(prevX,p,abs){
    const moved=Math.abs(this.x-prevX);
    const wantsMove=this.intentMove>.04&&this.grounded;
    const meleeContact=!this.shoot&&abs<this.attackRange+22;
    if(wantsMove&&moved<0.18&&!meleeContact) this.stuckFrames++;
    else this.stuckFrames=Math.max(0,this.stuckFrames-2);
    if(this.stuckFrames<18) return;
    const breakDir=this.intentDir||(p.x+p.w/2>=this.x+this.w/2?1:-1)||this.facing;
    this.vx=breakDir*Math.max(2.6,this.speed*18);
    this.facing=breakDir;
    if(this.canJump&&this.jumpCd<=0) this.jumpToward(breakDir,p.y+40<this.y,1.05);
    this.memoryTimer=Math.max(this.memoryTimer,45);
    this.stuckFrames=0;
  }

  runAggro(game,p,abs,dir,speedMul,sees,hearsShots=false){
    const targetInside=p.x>this.patrolMin-140&&p.x<this.patrolMax+140;
    const canTrackVertical=Math.abs((p.y+p.h)-(this.floorY||this.y+this.h))<210;
    const pressureOk=targetInside&&(this.sameFloor(p)||this.shoot||this.kind==='lenin'||canTrackVertical);
    const rememberedX=this.clampTargetX((sees?p.x+p.w/2:this.lastSeenX));
    const center=this.x+this.w/2;
    const pursueDir=rememberedX>=center?1:-1;
    const pressureFromFire=this.underFireTimer>0||hearsShots||(game.player.attackCd>0&&abs<this.detect*.95);
    const meleeSettle=!this.shoot&&abs<=this.attackRange+26&&this.sameFloor(p);
    this.facing=pursueDir||dir||this.facing;

    if(this.shoot){
      const desiredKeep=Math.max(120,this.keepDistance+this.laneBias*.4);
      if(pressureFromFire&&pressureOk) this.applyMove(pursueDir,this.speed*speedMul*.95);
      else if(abs<desiredKeep*.82) this.applyMove(-dir,this.speed*speedMul*.8);
      else if(pressureOk&&abs>this.attackRange*.9) this.applyMove(pursueDir,this.speed*speedMul*(sees?1.08:.7));
      else if(pressureOk&&Math.abs(rememberedX-center)>28) this.applyMove(pursueDir,this.speed*speedMul*.52);
      else {
        if(this.strafeTimer<=0){
          this.strafeTimer=26+Math.random()*46|0;
          this.strafeBias*=-1;
        }
        this.applyMove(this.strafeBias,this.speed*speedMul*.52);
      }
      this.shootCd--;
      if(this.shouldCombatJump(p,abs,true,canTrackVertical)) this.jumpToward(pursueDir,p.y+45<this.y,speedMul);
      const canFire=sees||pressureFromFire||(this.memoryTimer>55&&abs<this.attackRange*.78);
      if(canFire&&abs<this.attackRange&&this.shootCd<=0) this.fire(game,p);
    } else {
      const burst=this.updateBurst(abs);
      if(meleeSettle){
        this.vx*=0.58;
      } else if(pressureOk) this.applyMove(pursueDir,this.speed*speedMul*burst*1.35*(pressureFromFire?1.18:1));
      else if(this.memoryTimer>0) this.applyMove(pursueDir,this.speed*speedMul*.55);
      if(this.shouldCombatJump(p,abs,false,canTrackVertical)) this.jumpToward(pursueDir,p.y+45<this.y,speedMul*burst);
    }

    if(!sees&&this.memoryTimer<=0&&abs>this.detect*1.12){ this.state='patrol'; return; }
    if(!pressureOk&&!sees&&this.memoryTimer<28&&Math.abs(rememberedX-center)<32) this.state='patrol';
  }

  runPatrol(speedMul){
    this.applyMove(this.facing,this.speed*speedMul*.52);
    if(Math.random()<.0035) this.facing*=-1;
  }

  enforcePatrolBounds(){
    if(this.x<this.patrolMin){ this.x=this.patrolMin; this.vx=Math.abs(this.vx)*.4; this.facing=1; }
    if(this.x+this.w>this.patrolMax){ this.x=this.patrolMax-this.w; this.vx=-Math.abs(this.vx)*.4; this.facing=-1; }
  }

  updateBossTurbo(game,abs,dir){
    const cfg=KP.Balance.enemies[this.kind];
    if(!cfg||cfg.role!=='boss') return 1;
    if(this.turboTimer>0){ this.turboTimer--; this.facing=dir||this.facing; return 1.75; }
    if(this.turboCd>0) this.turboCd--;
    if(this.turboCd<=0&&abs<620){
      this.turboTimer=150; this.turboCd=260+Math.random()*150;
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
      this.ramTimer--; this.vx=dir*this.ramSpeed;
      if(U.rects(this,game.player)) game.player.hurt(this.hitTime+10,dir,game);
      return;
    }
    if(this.ramCd>0) this.ramCd--;
    if(abs>120&&abs<600&&this.ramCd<=0&&Math.abs(this.y-game.player.y)<90){
      this.ramTimer=this.ramDuration; this.ramCd=220; this.facing=dir;
      this.alertText='ТАРАН ИСТОРИИ!'; this.alertTimer=90;
      this.rememberPlayer(game.player,150);
      game.toast('Ленин идёт тараном. Придётся отходить.');
    }
  }

  _updateAbilities(game,p,abs,dir){
    if(this.rollCd>0) this.rollCd--;
    if(this.rollTimer>0) this.rollTimer--;
    if(this.lungeCd>0) this.lungeCd--;
    if(this.lungeTimer>0){ this.lungeTimer--; this.vx+=this.facing*3.2; }
    if(this.mbShieldTimer>0) this.mbShieldTimer--;
    if(this.mbShieldCd>0) this.mbShieldCd--;
    if(this.shieldFlash>0) this.shieldFlash--;

    // Zombie lunge charge
    if(this.kind==='zombie'&&this.state==='aggro'&&this.lungeCd<=0&&abs<200&&this.grounded){
      this.lungeTimer=16; this.lungeCd=90+Math.random()*60|0;
      this.alertText='РЫВОК!'; this.alertTimer=40;
    }

    // Runner dodge-roll when under fire
    if(this.kind==='runner'&&this.rollCd<=0&&this.underFireTimer>60&&this.grounded&&Math.random()<.04){
      const dodgeDir=(Math.random()<.5?-1:1);
      this.vx=dodgeDir*9; this.vy=-3.5;
      this.rollTimer=14; this.rollCd=100+Math.random()*60|0;
      this.hurt=0; // brief visual immunity
    }

    // Miniboss periodic shield
    if(this.kind==='miniboss'&&this.state==='aggro'&&this.mbShieldCd<=0&&this.mbShieldTimer<=0){
      this.mbShieldTimer=65; this.mbShieldCd=240+Math.random()*120|0;
      this.alertText='ЩИТ!'; this.alertTimer=65;
    }

    // Sniper scope wind-up before shot
    if(this.kind==='sniper'&&this.shoot&&this.state==='aggro'&&this.shootCd>0){
      const scopeStart=KP.Balance.enemies.sniper.scopeFrames||80;
      this.sniperScope=Math.max(0, this.shootCd<=scopeStart ? this.shootCd : 0);
    }

    // Kamikaze self-destruct when HP very low
    if(this.kind==='kamikaze'&&this.explodeArmed&&this.hp<this.maxHp*.3&&Math.random()<.04){
      this._kamikazeExplode(game);
    }
  }

  _kamikazeExplode(game){
    if(!this.explodeArmed) return;
    this.explodeArmed=false; this.alive=false;
    const cx=this.x+this.w/2, cy=this.y+this.h/2;
    const r=KP.Balance.enemies.kamikaze.explodeRadius||100;
    game.burst(cx,cy,'#ff4400',45); game.burst(cx,cy,'#ffcc00',28); game.burst(cx,cy,'#ffffff',14);
    if(game.audio) game.audio.play('enemyDown',1.4);
    const pd=Math.hypot(game.player.x+game.player.w/2-cx, game.player.y+game.player.h/2-cy);
    if(pd<r) game.player.hurt(KP.Balance.enemies.kamikaze.explodeDmg||50, cx<game.player.x?1:-1, game);
    for(const c of game.world.crates) if(c.alive&&Math.hypot(c.x+c.w/2-cx,c.y+c.h/2-cy)<r) c.takeDamage(game);
    if(game.toast) game.toast('Камикадзе взорвался!');
  }

  fire(game,p){
    this.shootCd=Math.max(18,Math.round(this.fireDelay*(this.memoryTimer>85?0.92:1)));
    this.attackFlash=7;
    const c=U.center(this),pc=U.center(p);
    const rawDx=pc.x-c.x,rawDy=pc.y-c.y;
    const travelFrames=Math.min(18,Math.hypot(rawDx,rawDy)/Math.max(1,this.bulletSpeed));
    const tx=pc.x+(p.vx||0)*travelFrames*1.65;
    const ty=pc.y+(p.vy||0)*Math.min(10,travelFrames)*1.2;
    const dx=tx-c.x,dy=ty-c.y,len=Math.hypot(dx,dy)||1;
    const bColor=this.kind==='sniper'?'#ffee44':this.kind==='kamikaze'?'#ff6600':'#76ff54';
    const bSize=this.kind==='sniper'?14:10;
    game.enemyBullets.push(new KP.Bullet('enemy',c.x,c.y,dx/len*this.bulletSpeed,dy/len*this.bulletSpeed,{
      dmg:this.hitTime,range:700,color:bColor,knock:4,size:bSize
    }));
    // Gunner burst: 2 extra spread shots
    if(this.kind==='gunner'){
      for(const sp of[-0.12,0.12]){
        const nx=dx/len*Math.cos(sp)-dy/len*Math.sin(sp);
        const ny=dx/len*Math.sin(sp)+dy/len*Math.cos(sp);
        game.enemyBullets.push(new KP.Bullet('enemy',c.x,c.y,nx*this.bulletSpeed*.85,ny*this.bulletSpeed*.85,{
          dmg:Math.round(this.hitTime*.65),range:580,color:'#ff9933',knock:1.5,size:8
        }));
      }
    }
    // Phase 2: double-tap at low HP
    if(this.phase2&&Math.random()<0.35){
      const spread=(Math.random()-.5)*0.25;
      const vx2=(dx/len*this.bulletSpeed)*Math.cos(spread)-(dy/len*this.bulletSpeed)*Math.sin(spread);
      const vy2=(dx/len*this.bulletSpeed)*Math.sin(spread)+(dy/len*this.bulletSpeed)*Math.cos(spread);
      game.enemyBullets.push(new KP.Bullet('enemy',c.x,c.y,vx2,vy2,{
        dmg:Math.round(this.hitTime*.75),range:700,color:'#ff8844',knock:2,size:8
      }));
    }
  }

  draw(ctx,assets){
    assets.drawEnemy(ctx,this);
    // HP bar (show only when damaged or for bosses)
    const isBoss=KP.Balance.enemies[this.kind]&&KP.Balance.enemies[this.kind].role==='boss';
    if(isBoss||this.hp<this.maxHp){
      const barW=this.w+8, barH=isBoss?8:5;
      const bx=this.x-4, by=this.y-(isBoss?16:12);
      U.drawBar(ctx,bx,by,barW,barH,this.hp/this.maxHp,isBoss?(this.phase2?'#ff4040':'#ff8800'):'#52e152');
      if(isBoss&&this.phase2){
        ctx.strokeStyle='#ff0000'; ctx.lineWidth=2; ctx.strokeRect(bx,by,barW,barH);
      }
    }
    if(this.burn>0){
      ctx.fillStyle='rgba(255,90,20,.45)';
      ctx.beginPath(); ctx.arc(this.x+this.w/2,this.y+this.h/2,this.w*.55,0,Math.PI*2); ctx.fill();
    }
    if(this.timeDrained){
      ctx.strokeStyle='#65e8ff'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(this.x+this.w/2,this.y+this.h/2,this.w*.7,0,Math.PI*2); ctx.stroke();
    }
    // Phase 2 glow
    if(this.phase2){
      ctx.strokeStyle='rgba(255,0,0,.6)'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(this.x+this.w/2,this.y+this.h/2,this.w*.72+Math.sin(Date.now()/120)*4,0,Math.PI*2); ctx.stroke();
    }
    // Miniboss shield bubble
    if(this.kind==='miniboss'&&this.mbShieldTimer>0){
      ctx.save();
      ctx.globalAlpha=0.55+Math.sin(Date.now()/80)*0.15;
      ctx.strokeStyle='#66ccff'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(this.x+this.w/2,this.y+this.h/2,this.w*.78,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(100,200,255,.12)';
      ctx.beginPath(); ctx.arc(this.x+this.w/2,this.y+this.h/2,this.w*.78,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    // Shield flash (when blocked)
    if(this.shieldFlash>0){
      ctx.save(); ctx.globalAlpha=this.shieldFlash/20;
      ctx.fillStyle='#aaddff';
      ctx.fillRect(this.x-4,this.y-4,this.w+8,this.h+8);
      ctx.restore();
    }
    // Kamikaze warning flash when about to explode
    if(this.kind==='kamikaze'&&this.hp<this.maxHp*.4&&this.explodeArmed){
      ctx.save();
      ctx.globalAlpha=(0.4+Math.sin(Date.now()/60)*0.4);
      ctx.fillStyle='#ff3300';
      ctx.fillRect(this.x-2,this.y-2,this.w+4,this.h+4);
      ctx.restore();
    }
    // Runner roll dust
    if(this.kind==='runner'&&this.rollTimer>0){
      ctx.save(); ctx.globalAlpha=0.55;
      ctx.fillStyle='rgba(200,180,120,.6)';
      ctx.beginPath(); ctx.ellipse(this.x+this.w/2,this.y+this.h,this.w*.65,8,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
    // Sniper scope beam
    if(this.kind==='sniper'&&this.sniperScope>0){
      ctx.save();
      ctx.globalAlpha=Math.min(1,this.sniperScope/30)*0.7;
      ctx.strokeStyle='#ffee00'; ctx.lineWidth=1;
      ctx.setLineDash([5,4]);
      ctx.beginPath();
      ctx.moveTo(this.x+this.w/2, this.y+this.h/2);
      ctx.lineTo(this.x+this.facing*640+this.w/2, this.y+this.h/2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    if(this.alertTimer>0){
      ctx.fillStyle='rgba(20,10,5,.88)';
      ctx.fillRect(this.x-18,this.y-46,Math.max(100,this.alertText.length*7.5),26);
      ctx.strokeStyle=this.phase2?'#ff4040':'rgba(255,210,28,.7)';
      ctx.lineWidth=1.5; ctx.strokeRect(this.x-18,this.y-46,Math.max(100,this.alertText.length*7.5),26);
      ctx.fillStyle=this.phase2?'#ff6644':'#ffd21c';
      ctx.font='bold 12px Arial';
      ctx.fillText(this.alertText,this.x-13,this.y-29);
    }
  }
};
