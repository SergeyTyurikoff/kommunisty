'use strict';
window.KP = window.KP || {};
KP.Assets = class Assets {
  constructor(){
    this.images={};
    this.spriteFrameCache=new Map();
    this.animProfiles={
      hero:{ mode:'split', split:.56, pad:14, bob:2.2, stepLift:4.6, stride:6.5, lean:.08, breath:1.4, wholeBob:1.1, recoil:3.8, squash:.04 },
      zombie:{ mode:'split', split:.6, pad:12, bob:2.0, stepLift:3.6, stride:5.2, lean:.07, breath:1.0, wholeBob:.9, recoil:2.2, squash:.03 },
      runner:{ mode:'split', split:.6, pad:12, bob:2.4, stepLift:4.8, stride:7.2, lean:.11, breath:1.1, wholeBob:1.1, recoil:2.8, squash:.04 },
      pistol:{ mode:'split', split:.6, pad:12, bob:1.7, stepLift:3.2, stride:4.3, lean:.06, breath:.8, wholeBob:.8, recoil:3.4, squash:.03 },
      gunner:{ mode:'split', split:.61, pad:12, bob:1.9, stepLift:3.1, stride:4.6, lean:.05, breath:.8, wholeBob:.8, recoil:3.8, squash:.03 },
      rifleman:{ mode:'split', split:.61, pad:12, bob:1.9, stepLift:3.3, stride:4.9, lean:.06, breath:.8, wholeBob:.8, recoil:3.6, squash:.03 },
      gasman:{ mode:'split', split:.61, pad:12, bob:1.8, stepLift:3.1, stride:4.4, lean:.05, breath:.8, wholeBob:.8, recoil:3.4, squash:.03 },
      sabreur:{ mode:'split', split:.59, pad:12, bob:2.2, stepLift:4.2, stride:6.4, lean:.1, breath:.9, wholeBob:1.0, recoil:2.0, squash:.04 },
      maxim:{ mode:'whole', pad:12, bob:0, stepLift:0, stride:0, lean:0, breath:.3, wholeBob:.25, recoil:3.6, squash:.01 },
      miniboss:{ mode:'split', split:.62, pad:13, bob:2.0, stepLift:3.2, stride:4.4, lean:.05, breath:.9, wholeBob:1.0, recoil:3.0, squash:.03 },
      horse:{ mode:'whole', pad:16, bob:2.6, stride:8.0, lean:.06, breath:1.0, wholeBob:1.4, recoil:2.0, squash:.035 },
      mushroomBoss:{ mode:'whole', pad:18, bob:2.4, stride:5.5, lean:.04, breath:1.0, wholeBob:1.0, recoil:2.2, squash:.03 },
      treeBoss:{ mode:'whole', pad:18, bob:2.0, stride:4.0, lean:.035, breath:.8, wholeBob:.8, recoil:1.8, squash:.025 },
      sandBoss:{ mode:'whole', pad:18, bob:2.7, stride:6.5, lean:.055, breath:1.0, wholeBob:1.0, recoil:1.5, squash:.035 },
      swampBoss:{ mode:'whole', pad:18, bob:2.2, stride:4.8, lean:.04, breath:.9, wholeBob:.9, recoil:2.0, squash:.03 },
      factoryBoss:{ mode:'whole', pad:18, bob:1.6, stride:3.8, lean:.03, breath:.6, wholeBob:.7, recoil:2.1, squash:.02 },
      lenin:{ mode:'whole', pad:16, bob:2.0, stride:4.2, lean:.05, breath:.9, wholeBob:.9, recoil:2.6, squash:.03 }
    };
    this.load({
      // Персонажи (asset-pack v1.3.0, фон вычищен)
      hero:'img/sprites/characters/hero.png',
      zombie:'img/sprites/characters/zombie.png',
      runner:'img/sprites/characters/runner.png',
      pistol:'img/sprites/characters/mold_pistol_soldier.png',
      gunner:'img/sprites/characters/gunner.png',
      rifleman:'img/sprites/characters/rifleman.png',
      gasman:'img/sprites/characters/gasman.png',
      sniper:'img/sprites/characters/sniper.png',
      sabreur:'img/sprites/characters/sabreur.png',
      horse:'img/sprites/characters/horse.png',
      kamikaze:'img/sprites/characters/kamikaze.png',
      shielder:'img/sprites/characters/shielder.png',
      maxim:'img/sprites/characters/maxim.png',
      miniboss:'img/sprites/characters/miniboss.png',

      mushroomBoss:'img/sprites/bosses/mushroomBoss.png',
      treeBoss:'img/sprites/bosses/treeBoss.png',
      sandBoss:'img/sprites/bosses/sandBoss.png',
      swampBoss:'img/sprites/bosses/swampBoss.png',
      factoryBoss:'img/sprites/bosses/factoryBoss.png',
      lenin:'img/sprites/bosses/lenin.png',

      menuPoster:'img/menu_poster_v1018.png',
      forestBg:'img/backgrounds/forest.jpg',
      winterBg:'img/backgrounds/winter.jpg',
      desertBg:'img/backgrounds/desert.jpg',
      swampBg:'img/backgrounds/swamp.jpg',
      cityBg:'img/backgrounds/city.jpg',
      mausoleumBg:'img/backgrounds/mausoleum.jpg',

      pistolWeapon:'img/sprites/weapons/tt_pistol.png',
      shotgunWeapon:'img/sprites/weapons/shotgun.png',
      mosinWeapon:'img/sprites/weapons/mosin.png',
      smgWeapon:'img/sprites/weapons/smg.png',
      gasWeapon:'img/sprites/weapons/gasSprayer.png',
      sabreWeapon:'img/sprites/weapons/sabre.png',

      // Объекты и предметы
      shopImg:'img/sprites/objects/shop.png',
      chestImg:'img/sprites/objects/chest.png',
      portalExit:'img/sprites/objects/portal.png',
      moneyPickup:'img/sprites/objects/money.png',
      timePickupImg:'img/sprites/objects/timePickup.png',
      medkitImg:'img/sprites/objects/medkit.png',
      gasMaskImg:'img/sprites/objects/gasMask.png',
      ammoBoxImg:'img/sprites/objects/ammoBox.png',

      moneyIcon:'img/sprites/objects/money.png',
      forestTile:'img/sliced/ui_tiles/forest_platform.png',
      snowTile:'img/sliced/ui_tiles/snow_platform.png',
      desertTile:'img/sliced/ui_tiles/desert_platform.png',
      swampTile:'img/sliced/ui_tiles/swamp_platform.png',
      factoryPlatform:'img/sliced/ui_tiles/factory_platform.png',
      moldPlatform:'img/sliced/ui_tiles/mold_platform.png'
    });
  }

  load(map){
    for(const [id,src] of Object.entries(map)){
      const img=new Image(); img.src=src; this.images[id]=img;
    }
  }
  ready(id){ const img=this.images[id]; return img&&img.complete&&img.naturalWidth!==0; }
  drawImg(ctx,id,x,y,w,h,flip=false){
    const img=this.images[id];
    if(!img||!img.complete||!img.naturalWidth) return false;
    ctx.save();
    if(flip){ ctx.translate(x+w,y); ctx.scale(-1,1); ctx.drawImage(img,0,0,w,h); }
    else ctx.drawImage(img,x,y,w,h);
    ctx.restore();
    return true;
  }

  _makeCanvas(w,h){
    const canvas=document.createElement('canvas');
    canvas.width=w;
    canvas.height=h;
    return canvas;
  }

  _profileFor(id){
    return this.animProfiles[id]||this.animProfiles.zombie;
  }

  _framesForState(state){
    if(state==='run') return 8;
    if(state==='idle') return 6;
    if(state==='shoot') return 4;
    if(state==='hurt') return 3;
    if(state==='dead') return 5;
    if(state==='dodge') return 4;
    if(state==='jump'||state==='fall') return 2;
    return 1;
  }

  _fpsForState(state){
    if(state==='run') return 11;
    if(state==='idle') return 5;
    if(state==='shoot') return 16;
    if(state==='hurt') return 14;
    if(state==='dodge') return 14;
    if(state==='jump'||state==='fall') return 5;
    return 1;
  }

  _buildHeroFrames(img,w,h,state){
    // Тумблер: использовать ли отдельные PNG-спрайты движения (img/sliced/units/hero_move/).
    // false — все состояния (в т.ч. run/jump/fall) рисуются процедурной анимацией
    // базового спрайта hero_revolutionary.png. Поставить true, чтобы вернуть спрайты движения.
    const useMoveSprites=false;
    const heroMoveFrames={
      run:[
        {id:'heroRunContact', offsetX:-1, offsetY:0},
        {id:'heroRunPassing', offsetX:0, offsetY:-1},
        {id:'heroRunContact', offsetX:-1, offsetY:0},
        {id:'heroRunPassing', offsetX:0, offsetY:-1}
      ],
      jump:[
        {id:'heroJumpUp', offsetX:0, offsetY:-1},
        {id:'heroJumpApex', offsetX:0, offsetY:-3}
      ],
      fall:[
        {id:'heroFall', offsetX:0, offsetY:0},
        {id:'heroFall', offsetX:0, offsetY:1}
      ]
    };
    const heroMoveState=useMoveSprites?heroMoveFrames[state]:null;
    if(heroMoveState){
      const moveImages=heroMoveState.map((pose)=>this.images[pose.id]);
      if(moveImages.some((moveImg)=>!moveImg||!moveImg.complete||!moveImg.naturalWidth)) return null;
      const pad=14;
      const frames=[];
      for(let i=0;i<heroMoveState.length;i++){
        const pose=heroMoveState[i];
        const frame=this._makeCanvas(w+pad*2,h+pad*2);
        const fctx=frame.getContext('2d');
        const moveImg=moveImages[i];
        fctx.imageSmoothingEnabled=false;
        fctx.drawImage(moveImg,pad+(pose.offsetX||0),pad+(pose.offsetY||0),w,h);
        frames.push(frame);
      }
      return {frames,pad};
    }

    const frameMap={
      idle:[
        {lowerX:0,lowerY:0,upperX:0,upperY:0,upperRot:0},
        {lowerX:0,lowerY:1,upperX:-.5,upperY:-1,upperRot:-.01},
        {lowerX:0,lowerY:0,upperX:.4,upperY:0,upperRot:.01},
        {lowerX:0,lowerY:1,upperX:-.4,upperY:-1,upperRot:-.015}
      ],
      run:[
        {lowerX:-5,lowerY:1,upperX:1,upperY:-1,upperRot:-.07},
        {lowerX:-2,lowerY:3,upperX:0,upperY:-2,upperRot:-.03},
        {lowerX:2,lowerY:1,upperX:-1,upperY:-1,upperRot:.02},
        {lowerX:5,lowerY:0,upperX:-2,upperY:0,upperRot:.07},
        {lowerX:2,lowerY:2,upperX:-1,upperY:-1,upperRot:.03},
        {lowerX:-2,lowerY:1,upperX:0,upperY:0,upperRot:-.02}
      ],
      shoot:[
        {lowerX:0,lowerY:0,upperX:-4,upperY:0,upperRot:-.07},
        {lowerX:0,lowerY:0,upperX:-3,upperY:-1,upperRot:-.05},
        {lowerX:0,lowerY:0,upperX:-2,upperY:0,upperRot:-.03},
        {lowerX:0,lowerY:0,upperX:0,upperY:0,upperRot:0}
      ],
      hurt:[
        {lowerX:-1,lowerY:0,upperX:2,upperY:0,upperRot:.08},
        {lowerX:1,lowerY:0,upperX:-2,upperY:0,upperRot:-.08},
        {lowerX:0,lowerY:1,upperX:1,upperY:-1,upperRot:.04}
      ],
      dodge:[
        {lowerX:-6,lowerY:0,upperX:-2,upperY:-2,upperRot:-.22},
        {lowerX:-2,lowerY:-2,upperX:-1,upperY:-4,upperRot:-.28},
        {lowerX:3,lowerY:-1,upperX:1,upperY:-3,upperRot:-.18},
        {lowerX:7,lowerY:0,upperX:2,upperY:-1,upperRot:-.08}
      ],
      jump:[
        {lowerX:0,lowerY:-2,upperX:0,upperY:-5,upperRot:-.06},
        {lowerX:1,lowerY:-3,upperX:-1,upperY:-6,upperRot:-.03}
      ],
      fall:[
        {lowerX:1,lowerY:1,upperX:0,upperY:-1,upperRot:.05},
        {lowerX:0,lowerY:2,upperX:0,upperY:0,upperRot:.08}
      ],
      dead:[
        {dead:true,t:0},
        {dead:true,t:.33},
        {dead:true,t:.66},
        {dead:true,t:1}
      ]
    };
    const framesData=frameMap[state]||frameMap.idle;
    const split=.56;
    const pad=14;
    const iw=img.naturalWidth;
    const ih=img.naturalHeight;
    const srcSplit=Math.round(ih*split);
    const dstSplit=Math.round(h*split);
    const frames=[];
    for(const pose of framesData){
      const frame=this._makeCanvas(w+pad*2,h+pad*2);
      const fctx=frame.getContext('2d');
      fctx.imageSmoothingEnabled=false;
      if(pose.dead){
        const t=pose.t||0;
        fctx.save();
        fctx.translate(pad+w/2+t*4,pad+h);
        fctx.rotate(-1.18+t*.12);
        fctx.drawImage(img,0,0,iw,ih,-w/2,-h+t*3.5,w,h);
        fctx.restore();
      } else {
        fctx.drawImage(img,0,srcSplit,iw,ih-srcSplit,pad+(pose.lowerX||0),pad+dstSplit+(pose.lowerY||0),w,h-dstSplit);
        fctx.save();
        fctx.translate(pad+w/2+(pose.upperX||0),pad+dstSplit+(pose.upperY||0));
        fctx.rotate(pose.upperRot||0);
        fctx.translate(-w/2,-dstSplit);
        fctx.drawImage(img,0,0,iw,srcSplit,0,0,w,dstSplit);
        fctx.restore();
      }
      if(state==='hurt'){
        fctx.save();
        fctx.globalCompositeOperation='source-atop';
        fctx.fillStyle='rgba(255,235,190,.28)';
        fctx.fillRect(0,0,frame.width,frame.height);
        fctx.restore();
      }
      frames.push(frame);
    }
    return {frames,pad};
  }

  _buildAnimatedFrames(id,w,h,state){
    const img=this.images[id];
    if(!img||!img.complete||!img.naturalWidth) return null;
    if(id==='hero') return this._buildHeroFrames(img,w,h,state);
    const profile=this._profileFor(id);
    const frameCount=this._framesForState(state);
    const pad=profile.pad||12;
    const iw=img.naturalWidth;
    const ih=img.naturalHeight;
    const frames=[];
    for(let i=0;i<frameCount;i++){
      const frame=this._makeCanvas(w+pad*2,h+pad*2);
      const fctx=frame.getContext('2d');
      fctx.imageSmoothingEnabled=false;
      const phase=frameCount>1?(i/frameCount)*Math.PI*2:0;
      const stride=Math.sin(phase)*(profile.stride||4);
      const breath=Math.sin(phase)*(profile.breath||.6);
      const bobBase=Math.abs(Math.sin(phase))*(profile.bob||1);
      const p=pad;
      if(profile.mode==='whole'){
        let bodyY=p;
        let lean=0;
        let squashX=1;
        let squashY=1;
        let offsetX=0;
        if(state==='idle'){
          bodyY+=Math.sin(phase*.5)*(profile.wholeBob||.8);
          lean=Math.sin(phase)*profile.lean*.35;
        } else if(state==='run'){
          bodyY+=bobBase;
          offsetX=stride*.18;
          lean=Math.sin(phase)*profile.lean;
          squashX=1+Math.abs(Math.sin(phase))*(profile.squash||.02);
          squashY=1-Math.abs(Math.sin(phase))*(profile.squash||.02);
        } else if(state==='shoot'){
          bodyY+=Math.sin(phase*1.5)*.8;
          offsetX=-(profile.recoil||2)*(1-i/Math.max(1,frameCount-1));
          lean=-profile.lean*.8;
        } else if(state==='hurt'){
          offsetX=(i%2===0?-1:1)*(profile.stride||4)*.35;
          bodyY+=Math.max(0,1-i)*.8;
          lean=(i%2===0?-1:1)*profile.lean*.8;
        } else if(state==='dodge'){
          offsetX=(i-(frameCount-1)/2)*(profile.stride||4)*.32;
          bodyY-=Math.sin((i/frameCount)*Math.PI)*(profile.bob||1.5);
          lean=-profile.lean*2.2;
        } else if(state==='jump'){
          bodyY-=4+i;
          lean=-profile.lean*.9;
          squashX=1.03;
          squashY=.96;
        } else if(state==='fall'){
          bodyY-=1;
          lean=profile.lean*.95;
          squashX=.97;
          squashY=1.03;
        } else if(state==='dead'){
          const t=i/Math.max(1,frameCount-1);
          bodyY+=t*4;
          lean=-1.18+t*.18;
          offsetX=t*3;
        }
        fctx.save();
        fctx.translate(p+w/2+offsetX,p+h);
        fctx.rotate(lean);
        fctx.scale(squashX,squashY);
        fctx.translate(-w/2,-h);
        fctx.drawImage(img,0,0,iw,ih,0,bodyY-p,w,h);
        fctx.restore();
      } else {
        const split=profile.split||.58;
        const srcSplit=Math.round(ih*split);
        const dstSplit=Math.round(h*split);
        let lowerX=0, lowerY=0, upperX=0, upperY=0, upperRot=0, upperScaleX=1, upperScaleY=1;
        if(state==='idle'){
          lowerY=Math.abs(Math.sin(phase))*Math.max(.4,(profile.stepLift||2)*.15);
          upperY=-Math.abs(Math.sin(phase))*(profile.wholeBob||.8);
          upperRot=Math.sin(phase)*profile.lean*.24;
        } else if(state==='run'){
          lowerX=stride*.55;
          lowerY=Math.abs(Math.cos(phase))*(profile.stepLift||3);
          upperX=-stride*.12;
          upperY=-bobBase;
          upperRot=Math.sin(phase)*profile.lean;
          upperScaleX=1+Math.abs(Math.sin(phase))*(profile.squash||.02);
          upperScaleY=1-Math.abs(Math.sin(phase))*(profile.squash||.02);
        } else if(state==='shoot'){
          const recoil=(profile.recoil||2)*(1-i/Math.max(1,frameCount-1));
          lowerY=Math.abs(Math.sin(phase))*Math.max(.3,(profile.stepLift||2)*.08);
          upperX=-recoil;
          upperRot=-profile.lean*.62;
        } else if(state==='hurt'){
          upperX=(i%2===0?-1:1)*(profile.stride||4)*.3;
          lowerX=-upperX*.5;
          upperRot=(i%2===0?-1:1)*profile.lean*.8;
        } else if(state==='dodge'){
          lowerX=(i-(frameCount-1)/2)*(profile.stride||4)*.28;
          lowerY=-Math.sin((i/frameCount)*Math.PI)*(profile.stepLift||3)*.35;
          upperX=lowerX*.3;
          upperRot=-profile.lean*2.1;
        } else if(state==='jump'){
          upperY=-5-i;
          lowerY=-1.5;
          upperRot=-profile.lean*.8;
          upperScaleX=1.02;
          upperScaleY=.97;
        } else if(state==='fall'){
          upperY=-1;
          lowerY=1.2;
          upperRot=profile.lean*.8;
          upperScaleX=.98;
          upperScaleY=1.03;
        } else if(state==='dead'){
          const t=i/Math.max(1,frameCount-1);
          fctx.save();
          fctx.translate(p+w/2+t*3,p+h);
          fctx.rotate(-1.22+t*.2);
          fctx.drawImage(img,0,0,iw,ih,-w/2,-h+t*4,w,h);
          fctx.restore();
          if(i===frameCount-1){
            fctx.globalAlpha=.18;
            fctx.fillStyle='#000';
            fctx.fillRect(p+2,p+h+1,w-4,3);
            fctx.globalAlpha=1;
          }
          frames.push(frame);
          continue;
        }

        fctx.drawImage(img,0,srcSplit,iw,ih-srcSplit,p+lowerX,p+dstSplit+lowerY,w,h-dstSplit);
        fctx.save();
        fctx.translate(p+w/2+upperX,p+dstSplit+upperY);
        fctx.rotate(upperRot);
        fctx.scale(upperScaleX,upperScaleY);
        fctx.translate(-w/2,-dstSplit);
        fctx.drawImage(img,0,0,iw,srcSplit,0,0,w,dstSplit);
        fctx.restore();
      }
      if(state==='hurt'){
        fctx.save();
        fctx.globalCompositeOperation='source-atop';
        fctx.fillStyle='rgba(255,235,190,.32)';
        fctx.fillRect(0,0,frame.width,frame.height);
        fctx.restore();
      }
      frames.push(frame);
    }
    return {frames,pad};
  }

  _getAnimatedFrames(id,w,h,state){
    const key=`${id}:${state}:${w}x${h}`;
    if(!this.spriteFrameCache.has(key)){
      const built=this._buildAnimatedFrames(id,w,h,state);
      if(!built) return null;
      this.spriteFrameCache.set(key,built);
    }
    return this.spriteFrameCache.get(key);
  }

  _drawAnimatedSprite(ctx,id,x,y,w,h,facing,state,freezeFrame=null){
    const pack=this._getAnimatedFrames(id,w,h,state);
    if(!pack||!pack.frames||!pack.frames.length) return false;
    const totalW=w+pack.pad*2;
    const totalH=h+pack.pad*2;
    let frameIndex=freezeFrame;
    if(frameIndex===null){
      if(state==='dead') frameIndex=pack.frames.length-1;
      else {
        const fps=this._fpsForState(state);
        frameIndex=Math.floor(performance.now()/1000*fps)%pack.frames.length;
      }
    }
    const frame=pack.frames[Math.max(0,Math.min(pack.frames.length-1,frameIndex))];
    ctx.save();
    ctx.imageSmoothingEnabled=false;
    if(facing<0){
      ctx.translate(x+w+pack.pad,y-pack.pad);
      ctx.scale(-1,1);
      ctx.drawImage(frame,0,0,totalW,totalH);
    } else {
      ctx.drawImage(frame,x-pack.pad,y-pack.pad,totalW,totalH);
    }
    ctx.restore();
    return true;
  }

  _playerAnimState(player){
    if(player.dead) return 'dead';
    if(player.stunTimer>0||player.invuln>24) return 'hurt';
    if(player.dodgeTimer>0) return 'dodge';
    if(!player.grounded) return player.vy<0?'jump':'fall';
    if(player.attackFlash>0) return 'shoot';
    if(Math.abs(player.vx)>1.25) return 'run';
    return 'idle';
  }

  _enemyAnimState(e){
    if(!e.alive) return 'dead';
    if(e.rollTimer>0) return 'dodge';
    if(e.hurt>0) return 'hurt';
    if(!e.grounded) return e.vy<0?'jump':'fall';
    if(e.attackFlash>0||e.sniperScope>0) return 'shoot';
    if(e.ramTimer>0||e.lungeTimer>0||Math.abs(e.vx)>0.48) return 'run';
    if(e.state==='aggro'&&Math.abs(e.vx)>0.12) return 'run';
    return 'idle';
  }

  _withFacing(ctx,x,y,w,facing,fn){
    ctx.save();
    if(facing<0){ ctx.translate(x+w,y); ctx.scale(-1,1); ctx.translate(-x,-y); }
    fn();
    ctx.restore();
  }

  _actorTransform(ctx,actor,bob=0,lean=0,alpha=1){
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(actor.x+actor.w/2,actor.y+actor.h);
    ctx.rotate(lean);
    ctx.translate(-(actor.x+actor.w/2),-(actor.y+actor.h+bob));
  }

  _drawWalkerLegs(ctx,x,y,width,phase,airborne=false,primary='#1a1a1a',secondary='#0d0d0d'){
    const stride=airborne?0:Math.sin(phase)*5.8;
    const lift=airborne?5:Math.abs(Math.cos(phase))*3.2;
    ctx.fillStyle=primary;
    ctx.fillRect(x+7,y+45-lift,7,14+lift);
    ctx.fillRect(x+19,y+45-(3.2-lift*.45),7,14+(3.2-lift*.45));
    ctx.fillStyle=secondary;
    ctx.fillRect(x+6+stride*0.38,y+57-lift*.24,10,4);
    ctx.fillRect(x+18-stride*0.38,y+57+(3.2-lift)*.18,10,4);
  }

  _drawMuzzleFlash(ctx,x,y,size,color='#ffd21c'){
    ctx.save();
    ctx.globalAlpha=.8;
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+size,y-size*.34);
    ctx.lineTo(x+size*.75,y);
    ctx.lineTo(x+size,y+size*.34);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawHero(ctx,player){
    const x=player.x, y=player.y, facing=player.facing, weapon=player.weapon;
    const heroW=36, heroH=52;
    ctx.fillStyle='rgba(0,0,0,.24)';
    ctx.beginPath();
    ctx.ellipse(x+17,y+58,17,5,0,0,Math.PI*2);
    ctx.fill();
    // Squash-and-stretch при приземлении
    const land=player.landTimer>0?player.landTimer/9:0;
    const squashActive=land>0;
    if(squashActive){
      ctx.save();
      const fx=x+player.w/2, fy=y+player.h;
      ctx.translate(fx,fy); ctx.scale(1+0.20*land,1-0.20*land); ctx.translate(-fx,-fy);
    }
    const animState=this._playerAnimState(player);
    if(this._drawAnimatedSprite(ctx,'hero',x-2,y+3,heroW,heroH,facing,animState)){
      this.drawWeapon(ctx,{x,y,w:player.w,h:player.h,facing,attackFlash:player.attackFlash,pose:player.pose,grounded:player.grounded,vx:player.vx,vy:player.vy},weapon);
      if(squashActive) ctx.restore();
      return;
    }
    const phase=performance.now()/88+player.x*.03;
    const airborne=!player.grounded;
    const running=player.pose==='run';
    const bob=player.dead?0:(airborne?-1.7:0);
    const lean=player.dead?-0.85*facing:player.dodgeTimer>0?-0.45*facing:airborne?(player.vy<0?-0.03:0.05):player.attackFlash>0?0.02*facing:0;
    this._actorTransform(ctx,player,bob,lean,player.dead?0.72:1);
    this._drawWalkerLegs(ctx,x,y,player.w,running?phase:phase*.45,airborne,'#1a1a1a','#070707');
    const drew=this.drawImg(ctx,'hero',x-2,y+3,heroW,heroH,facing<0);
    if(!drew){
      this._withFacing(ctx,x,y,34,facing,()=>{
      ctx.fillStyle='#211714'; ctx.fillRect(6,18,22,32);
      ctx.fillStyle='#d6b18f'; ctx.fillRect(9,2,17,17);
      ctx.fillStyle='#151515'; ctx.fillRect(6,-3,22,7);
      ctx.fillStyle='#111'; ctx.fillRect(13,8,3,3); ctx.fillRect(23,8,3,3);
      ctx.fillStyle='#7b4b20'; ctx.fillRect(7,37,21,4);
      });
    }
    this._withFacing(ctx,x,y,34,facing,()=>{
      ctx.fillStyle='#d2a47f'; ctx.fillRect(x+12,y+8,14,11);
      ctx.fillStyle='#111'; ctx.fillRect(x+14,y+12,3,2); ctx.fillRect(x+23,y+12,3,2);
      ctx.fillStyle='#5a2d13'; ctx.fillRect(x+14,y+17,8,2);
      ctx.fillStyle='rgba(255,255,255,.18)'; ctx.fillRect(x+10,y+5,10,3);
    });
    this.drawWeapon(ctx,{x,y,w:player.w,h:player.h,facing,attackFlash:player.attackFlash,pose:player.pose,grounded:player.grounded,vx:player.vx,vy:player.vy},weapon);
    ctx.restore();
    if(squashActive) ctx.restore();
  }

  drawWeapon(ctx,actor,weapon){
    const map={pistol:'pistolWeapon',mosin:'mosinWeapon',smg:'smgWeapon',flamethrower:'flamethrowerWeapon',gasSprayer:'gasWeapon',sabre:'sabreWeapon',shotgun:'shotgunWeapon'};
    const sizes={pistol:[34,20],mosin:[70,22],smg:[58,23],flamethrower:[68,27],gasSprayer:[66,24],sabre:[54,18],shotgun:[54,23]};
    const id=map[weapon]||'mosinWeapon';
    const [ww,hh]=sizes[weapon]||sizes.mosin;
    const {x,y,facing,attackFlash=0,pose='stand',grounded=true,vx=0}=actor;
    const phase=performance.now()/110+x*.025;
    const recoil=attackFlash>0?Math.min(6,attackFlash)*.8:0;
    const angle=pose==='dodge'?-0.28*facing:!grounded?(weapon==='sabre'?-0.35:-(0.12+Math.abs(vx)*0.01)):pose==='run'?Math.sin(phase)*0.07:attackFlash>0?-0.08:0;
    ctx.save();
    if(facing<0){ ctx.translate(x+16,y+28); ctx.scale(-1,1); }
    else ctx.translate(x+18,y+28);
    ctx.rotate(angle);
    ctx.translate(-recoil,pose==='run'?Math.sin(phase)*1.4:0);
    if(!this.drawImg(ctx,id,0,-hh/2,ww,hh,false)){
      ctx.fillStyle=weapon==='sabre'?'#d8f2ff':weapon==='flamethrower'?'#ff5b1a':weapon==='gasSprayer'?'#98d94a':'#6b3e1d';
      ctx.fillRect(0,-3,ww,6);
      ctx.fillStyle='#111'; ctx.fillRect(ww-12,-5,15,4);
    }
    if(attackFlash>0&&weapon!=='sabre') this._drawMuzzleFlash(ctx,ww-2,-1,10,weapon==='flamethrower'?'#ff7a22':weapon==='gasSprayer'?'#9fe95f':'#ffd21c');
    ctx.restore();
  }

  drawEnemy(ctx,e){
    const shadowW=e.kind==='horse'?24:(KP.Balance.enemies[e.kind]&&KP.Balance.enemies[e.kind].role==='boss'?Math.max(26,e.w*.4):18);
    ctx.fillStyle='rgba(0,0,0,.22)';
    ctx.beginPath();
    ctx.ellipse(e.x+e.w/2,e.y+e.h+2,shadowW,5.5,0,0,Math.PI*2);
    ctx.fill();
    const imageBackedKinds=['zombie','runner','pistol','gunner','rifleman','gasman','sniper','sabreur','horse','kamikaze','shielder','maxim','miniboss','mushroomBoss','treeBoss','sandBoss','swampBoss','factoryBoss','lenin'];
    if(imageBackedKinds.includes(e.kind)){
      const sizeMap={
        zombie:[44,58], runner:[44,58], pistol:[44,58], gunner:[55,60], rifleman:[44,58], gasman:[44,58],
        sniper:[44,58], sabreur:[46,58], horse:[78,52], kamikaze:[42,52], shielder:[50,56], maxim:[72,46], miniboss:[62,64],
        mushroomBoss:[110,92], treeBoss:[110,92], sandBoss:[110,92], swampBoss:[110,92], factoryBoss:[110,92], lenin:[88,92]
      };
      const offsMap={
        zombie:[-3,2], runner:[-3,2], pistol:[-3,2], gunner:[-3,2], rifleman:[-3,2], gasman:[-3,2],
        sniper:[-3,2], sabreur:[-3,2], horse:[-6,4], kamikaze:[-3,2], shielder:[-4,2], maxim:[-2,4], miniboss:[-4,0],
        mushroomBoss:[-10,-8], treeBoss:[-10,-8], sandBoss:[-10,-8], swampBoss:[-10,-8], factoryBoss:[-10,-8], lenin:[-2,-4]
      };
      const [dw,dh]=sizeMap[e.kind]||[e.w,e.h];
      const [ox,oy]=offsMap[e.kind]||[0,0];
      const state=this._enemyAnimState(e);
      if(this._drawAnimatedSprite(ctx,e.kind,e.x+ox,e.y+oy,dw,dh,e.facing,state)){
        if(e.attackFlash>0&&['pistol','gunner','miniboss','lenin'].includes(e.kind)){
          this._withFacing(ctx,e.x,e.y,e.w,e.facing,()=>this._drawMuzzleFlash(ctx,e.x+e.w-2,e.y+26,9,e.kind==='lenin'?'#ffb54f':'#9dff54'));
        }
        if(e.kind==='lenin'&&e.ramTimer>0){
          ctx.strokeStyle='#ff4040';
          ctx.lineWidth=4;
          ctx.beginPath();
          ctx.moveTo(e.x+41,e.y+12);
          ctx.lineTo(e.x+41+e.facing*80,e.y+12);
          ctx.stroke();
        }
        if((e.kind==='lenin'||['mushroomBoss','treeBoss','sandBoss','swampBoss','factoryBoss'].includes(e.kind))&&e.turboTimer>0) this.drawTurboMark(ctx,e);
        return;
      }
    }
    const phase=performance.now()/(Math.abs(e.vx)>0.55?78:118)+e.x*.018;
    const airborne=!e.grounded;
    const moving=e.alive&&Math.abs(e.vx)>0.55;
    const bob=e.alive?(moving?Math.abs(Math.sin(phase))*2.3:airborne?-2:0):0;
    const deathPhase=e.deathTimer>0?1-e.deathTimer/28:0;
    const lean=e.alive?(e.rollTimer>0?-0.5*e.facing:moving?Math.sin(phase)*0.09:0):(-0.85*e.facing*deathPhase);
    const alpha=e.alive?1:Math.max(.25,e.deathTimer/28);
    this._actorTransform(ctx,e,bob,lean,alpha);
    if(!['horse','maxim','mushroomBoss','treeBoss','sandBoss','swampBoss','factoryBoss','lenin'].includes(e.kind)) this._drawWalkerLegs(ctx,e.x,e.y,e.w,phase,airborne,'#232323','#101010');
    let usedArt=false;
    if(['mushroomBoss','treeBoss','sandBoss','swampBoss','factoryBoss'].includes(e.kind)){ this.drawBiomeBoss(ctx,e); usedArt=true; }
    else if(e.kind==='lenin'){ this.drawLenin(ctx,e); usedArt=true; }
    else if(e.kind==='kamikaze'){ this.drawKamikaze(ctx,e); usedArt=true; }
    else if(e.kind==='shielder'){ this.drawShielder(ctx,e); usedArt=true; }
    else if(e.kind==='sniper'){ this.drawSniper(ctx,e); usedArt=true; }
    else if(e.kind==='rifleman'){ this.drawRifleman(ctx,e); usedArt=true; }
    else if(e.kind==='gasman'){ this.drawGasman(ctx,e); usedArt=true; }
    else if(e.kind==='sabreur'){ this.drawSabreur(ctx,e); usedArt=true; }
    else if(e.kind==='maxim'){ this.drawMaxim(ctx,e); usedArt=true; }
    else if(e.kind==='horse'){
      usedArt=this.drawImg(ctx,'horse',e.x-6,e.y+4,78,52,e.facing<0);
    } else {
      const id=e.kind==='gunner'?'gunner':e.kind==='pistol'?'pistol':e.kind==='miniboss'?'miniboss':'zombie';
      const scale=e.kind==='miniboss'?1.02:0.88;
      const dw=Math.round((e.kind==='gunner'?54:44)*scale);
      const dh=Math.round((e.kind==='miniboss'?62:58)*scale);
      usedArt=this.drawImg(ctx,id,e.x-3,e.y+(e.h-dh)+2,dw,dh,e.facing<0);
      if(usedArt) this.drawEnemyWeapon(ctx,e);
    }
    if(!usedArt) this.drawFallbackSoldier(ctx,e);
    if(e.attackFlash>0&&['pistol','gunner','sniper','miniboss','lenin','rifleman','maxim'].includes(e.kind)){
      this._withFacing(ctx,e.x,e.y,e.w,e.facing,()=>this._drawMuzzleFlash(ctx,e.x+e.w-2,e.y+26,9,e.kind==='sniper'?'#ffee66':'#9dff54'));
    }
    ctx.restore();
  }

  drawEnemyWeapon(ctx,e){
    this._withFacing(ctx,e.x,e.y,e.w,e.facing,()=>{
      ctx.fillStyle='#111';
      if(e.kind==='pistol')   ctx.fillRect(e.x+24,e.y+28,22,5);
      if(e.kind==='gunner')   ctx.fillRect(e.x+20,e.y+27,42,6);
      if(e.kind==='miniboss'){ ctx.fillRect(e.x+18,e.y+26,48,7); ctx.fillStyle='#b00000'; ctx.fillRect(e.x+4,e.y-14,36,8); }
    });
  }

  drawFallbackSoldier(ctx,e){
    const x=e.x,y=e.y;
    ctx.save();
    if(e.facing<0){ctx.translate(x+e.w,y);ctx.scale(-1,1);}else ctx.translate(x,y);
    if(e.kind==='horse'){ctx.fillStyle='#5b351d';ctx.fillRect(0,34,68,21);ctx.fillStyle='#3b2416';ctx.fillRect(42,20,22,18);ctx.fillStyle='#111';ctx.fillRect(8,52,8,10);ctx.fillRect(48,52,8,10);}
    ctx.fillStyle=e.hurt>0?'#fff5c9':(e.kind==='miniboss'?'#ddd6c2':'#f1f1e5');
    ctx.fillRect(8,18,Math.min(30,e.w-14),34);
    ctx.fillStyle='#d5b48a'; ctx.fillRect(10,2,18,17);
    ctx.fillStyle='#ecece0'; ctx.fillRect(7,-4,24,9);
    ctx.fillStyle='#222'; ctx.fillRect(12,7,4,3); ctx.fillRect(23,7,4,3);
    ctx.fillStyle='#111';
    if(e.kind==='gunner') ctx.fillRect(2,25,44,5);
    else if(e.kind==='pistol') ctx.fillRect(4,26,25,4);
    else if(e.kind==='miniboss') ctx.fillRect(0,24,48,6);
    if(e.kind==='miniboss'){ctx.fillStyle='#b00000';ctx.fillRect(5,-13,34,9);ctx.fillStyle='#ffd21c';ctx.fillRect(12,-11,20,3);}
    ctx.restore();
  }

  drawRifleman(ctx,e){
    const x=e.x, y=e.y;
    ctx.save();
    if(e.facing<0){ ctx.translate(x+e.w,y); ctx.scale(-1,1); ctx.translate(-x,-y); }
    ctx.fillStyle=e.hurt?'#fff5c9':'#6e6248'; ctx.fillRect(x+7,y+18,28,30);
    ctx.fillStyle='#3f4630'; ctx.fillRect(x+9,y+22,24,10);
    ctx.fillStyle='#d1b08c'; ctx.fillRect(x+10,y+3,18,16);
    ctx.fillStyle='#4b4f37'; ctx.fillRect(x+9,y,22,8);
    ctx.fillStyle='#111'; ctx.fillRect(x+13,y+10,3,3); ctx.fillRect(x+22,y+10,3,3);
    ctx.fillStyle='#2a2016'; ctx.fillRect(x+18,y+25,44,5);
    ctx.fillStyle='#5f4120'; ctx.fillRect(x+40,y+22,12,10);
    ctx.fillStyle='#222'; ctx.fillRect(x+10,y+48,9,8); ctx.fillRect(x+24,y+48,9,8);
    ctx.restore();
  }

  drawGasman(ctx,e){
    const x=e.x, y=e.y;
    ctx.save();
    if(e.facing<0){ ctx.translate(x+e.w,y); ctx.scale(-1,1); ctx.translate(-x,-y); }
    ctx.fillStyle=e.hurt?'#fff5c9':'#46513e'; ctx.fillRect(x+7,y+18,28,30);
    ctx.fillStyle='#6e7f56'; ctx.fillRect(x+8,y+20,26,12);
    ctx.fillStyle='#314128'; ctx.fillRect(x+9,y+4,20,15);
    ctx.fillStyle='#dce2d1'; ctx.fillRect(x+11,y+10,15,7);
    ctx.fillStyle='#26331f'; ctx.beginPath(); ctx.arc(x+15,y+13,2.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+23,y+13,2.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#98d94a'; ctx.fillRect(x+20,y+25,36,5);
    ctx.fillStyle='#111'; ctx.fillRect(x+44,y+23,10,9);
    ctx.fillStyle='rgba(152,217,74,.28)'; ctx.beginPath(); ctx.arc(x+26,y+26,20,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  drawSabreur(ctx,e){
    const x=e.x, y=e.y;
    ctx.save();
    if(e.facing<0){ ctx.translate(x+e.w,y); ctx.scale(-1,1); ctx.translate(-x,-y); }
    ctx.fillStyle=e.hurt?'#fff5c9':'#1f2e36'; ctx.fillRect(x+7,y+17,30,32);
    ctx.fillStyle='#8b1d16'; ctx.fillRect(x+11,y+19,22,11);
    ctx.fillStyle='#d3ad86'; ctx.fillRect(x+11,y+2,18,16);
    ctx.fillStyle='#24282f'; ctx.fillRect(x+10,y,22,8);
    ctx.fillStyle='#c7d2dd'; ctx.fillRect(x+22,y+21,30,4);
    ctx.fillStyle='#9aa6b4'; ctx.fillRect(x+46,y+18,6,10);
    ctx.fillStyle='#222'; ctx.fillRect(x+11,y+49,9,8); ctx.fillRect(x+26,y+49,9,8);
    ctx.restore();
  }

  drawMaxim(ctx,e){
    const x=e.x, y=e.y+8;
    ctx.save();
    if(e.facing<0){ ctx.translate(x+e.w,y); ctx.scale(-1,1); ctx.translate(-x,-y); }
    ctx.fillStyle='#2a231e'; ctx.fillRect(x+4,y+24,52,12);
    ctx.fillStyle='#5f513e'; ctx.fillRect(x+18,y+17,34,8);
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+12,y+19,56,6);
    ctx.fillStyle='#7a2a1a'; ctx.fillRect(x+8,y+12,14,10);
    ctx.fillStyle='#333'; ctx.fillRect(x+2,y+36,10,5); ctx.fillRect(x+46,y+36,10,5);
    ctx.fillStyle='#6b5d47'; ctx.fillRect(x+10,y+39,2,10); ctx.fillRect(x+50,y+39,2,10);
    ctx.fillStyle='rgba(255,210,74,.18)'; ctx.fillRect(x+8,y+16,50,12);
    ctx.restore();
  }

  // --- Shop canvas sprite ---
  drawShop(ctx,x,y,w,h){
    ctx.save();
    const cx=x+w/2;
    // Body
    ctx.fillStyle='#2e1508'; ctx.fillRect(x-8,y,w+16,h);
    // Counter
    ctx.fillStyle='#8b5a20'; ctx.fillRect(x-14,y+h-22,w+28,6);
    ctx.fillStyle='#5c3610'; ctx.fillRect(x-14,y+h-16,w+28,16);
    // Awning
    ctx.fillStyle='#bb1800'; ctx.fillRect(x-16,y-30,w+32,30);
    for(let i=0;i<5;i++){
      ctx.fillStyle=i%2?'rgba(255,210,28,.2)':'rgba(0,0,0,.14)';
      ctx.fillRect(x-16+i*(w+32)/5,y-30,(w+32)/5,30);
    }
    ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(x-16,y-2,w+32,4);
    // Sign
    ctx.fillStyle='#ffd21c'; ctx.font='bold 11px Arial'; ctx.textAlign='center';
    ctx.fillText('СНАБЖЕНЕЦ',cx,y-12);
    ctx.textAlign='left';
    // Silhouette
    ctx.fillStyle='#1a1209'; ctx.fillRect(cx-9,y+8,18,h-30);
    ctx.fillStyle='#c8905a'; ctx.beginPath(); ctx.arc(cx,y+14,9,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2a1808'; ctx.fillRect(cx-9,y+4,18,12);
    // Glow border
    ctx.strokeStyle='rgba(255,210,28,.3)'; ctx.lineWidth=1;
    ctx.strokeRect(x-14,y-30,w+28,h+30);
    ctx.restore();
  }

  // --- Kamikaze ---
  drawKamikaze(ctx,e){
    const x=e.x, y=e.y;
    ctx.save();
    if(e.facing<0){ ctx.translate(x+e.w,y); ctx.scale(-1,1); ctx.translate(-x,-y); }
    // Body
    ctx.fillStyle=e.hurt?'#fff5c9':'#8b1a00'; ctx.fillRect(x+6,y+18,28,30);
    // X marker on chest
    ctx.strokeStyle='#ff4400'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(x+10,y+21); ctx.lineTo(x+30,y+42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+30,y+21); ctx.lineTo(x+10,y+42); ctx.stroke();
    // Head
    ctx.fillStyle='#d5a07a'; ctx.fillRect(x+10,y+2,18,17);
    ctx.fillStyle='#fff'; ctx.fillRect(x+12,y+7,5,4); ctx.fillRect(x+22,y+7,5,4);
    ctx.fillStyle='#ff2200'; ctx.fillRect(x+13,y+8,3,3); ctx.fillRect(x+23,y+8,3,3);
    // Bomb pack
    ctx.fillStyle='#444'; ctx.fillRect(x+2,y+22,6,22);
    ctx.fillStyle='#ff8800'; ctx.fillRect(x+3,y+26,4,4); ctx.fillRect(x+3,y+34,4,4);
    // Fuse
    ctx.strokeStyle='#ff6600'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(x+5,y+22); ctx.bezierCurveTo(x,y+10,x+14,y+8,x+14,y+4); ctx.stroke();
    // Flash when critical
    if(e.explodeArmed&&e.hp<e.maxHp*.4){
      const f=0.5+Math.sin(Date.now()/55)*0.5;
      ctx.globalAlpha=f*0.45; ctx.fillStyle='#ff4400';
      ctx.beginPath(); ctx.arc(x+e.w/2,y+e.h/2,28,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  // --- Shielder ---
  drawShielder(ctx,e){
    const x=e.x, y=e.y;
    ctx.save();
    if(e.facing<0){ ctx.translate(x+e.w,y); ctx.scale(-1,1); ctx.translate(-x,-y); }
    // Armour body
    ctx.fillStyle=e.hurt?'#fff5c9':'#2a3028'; ctx.fillRect(x+8,y+20,30,34);
    ctx.fillStyle='#3a4038'; ctx.fillRect(x+5,y+17,36,10);
    // Helmet
    ctx.fillStyle='#3a3a3c'; ctx.fillRect(x+12,y+2,22,18);
    ctx.fillStyle='#1a1a1c'; ctx.fillRect(x+14,y+8,18,5);
    ctx.fillStyle='rgba(255,80,0,.75)'; ctx.fillRect(x+15,y+9,16,3);
    // Front shield
    ctx.fillStyle='#8b8b7a'; ctx.fillRect(x+32,y+12,14,40);
    ctx.strokeStyle='#555'; ctx.lineWidth=1.5; ctx.strokeRect(x+32,y+12,14,40);
    ctx.fillStyle='#333'; ctx.beginPath(); ctx.arc(x+39,y+32,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#777'; ctx.beginPath(); ctx.arc(x+39,y+32,2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.1)'; ctx.fillRect(x+32,y+12,14,8);
    // Feet
    ctx.fillStyle='#222'; ctx.fillRect(x+10,y+52,9,6); ctx.fillRect(x+26,y+52,9,6);
    ctx.restore();
  }

  // --- Sniper ---
  drawSniper(ctx,e){
    const x=e.x, y=e.y;
    ctx.save();
    if(e.facing<0){ ctx.translate(x+e.w,y); ctx.scale(-1,1); ctx.translate(-x,-y); }
    // Camo body
    ctx.fillStyle=e.hurt?'#fff5c9':'#4a5a2e'; ctx.fillRect(x+6,y+18,26,30);
    ctx.fillStyle='#2a3a1a';
    ctx.fillRect(x+8,y+20,8,7); ctx.fillRect(x+18,y+30,10,8); ctx.fillRect(x+6,y+38,9,8);
    // Ghillie head
    ctx.fillStyle='#3a5022'; ctx.fillRect(x+8,y+2,20,18);
    ctx.fillStyle='#4a6030'; ctx.fillRect(x+6,y,24,8);
    ctx.fillStyle='#1a1a0a'; ctx.fillRect(x+12,y+8,5,4); ctx.fillRect(x+22,y+8,5,4);
    // Long rifle
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+22,y+24,52,5);
    ctx.fillStyle='#333'; ctx.fillRect(x+58,y+22,10,9);
    ctx.fillStyle='rgba(255,220,0,.55)'; ctx.fillRect(x+60,y+24,6,5);
    ctx.fillStyle='#111'; ctx.fillRect(x+22,y+28,20,3);
    // Feet
    ctx.fillStyle='#2a3018'; ctx.fillRect(x+8,y+46,9,8); ctx.fillRect(x+21,y+46,9,8);
    ctx.restore();
  }

  drawBiomeBoss(ctx,e){
    const id={mushroomBoss:'mushroomBoss',treeBoss:'treeBoss',sandBoss:'sandBoss',swampBoss:'swampBoss',factoryBoss:'factoryBoss'}[e.kind];
    if(id&&this.drawImg(ctx,id,e.x-10,e.y-8,110,92,e.facing<0)){
      if(e.turboTimer>0) this.drawTurboMark(ctx,e);
      return;
    }
    const x=e.x,y=e.y;
    ctx.save(); if(e.facing<0){ctx.translate(x+e.w,y);ctx.scale(-1,1);ctx.translate(-x,-y);}
    const pal={mushroomBoss:['#6fd15f','#2a6b2d','#f2f2d8'],treeBoss:['#6b3e1d','#1f6b2a','#3a2416'],sandBoss:['#c89042','#7b4b20','#ffe0a0'],swampBoss:['#2f7d65','#173f37','#8cff9e'],factoryBoss:['#585858','#2a2a2a','#ffd21c']}[e.kind]||['#777','#333','#fff'];
    ctx.fillStyle=pal[1]; ctx.fillRect(x+16,y+25,54,52);
    ctx.fillStyle=pal[0]; ctx.beginPath(); ctx.ellipse(x+43,y+25,42,24,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=pal[2]; ctx.fillRect(x+24,y+20,8,8); ctx.fillRect(x+52,y+20,8,8);
    ctx.fillStyle='#111'; ctx.fillRect(x+30,y+46,28,6);
    ctx.restore();
    if(e.turboTimer>0) this.drawTurboMark(ctx,e);
  }

  drawLenin(ctx,e){
    if(this.drawImg(ctx,'lenin',e.x-2,e.y-4,88,92,e.facing<0)){
      if(e.ramTimer>0){ctx.strokeStyle='#ff4040';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(e.x+41,e.y+12);ctx.lineTo(e.x+41+e.facing*80,e.y+12);ctx.stroke();}
      if(e.turboTimer>0) this.drawTurboMark(ctx,e);
      return;
    }
    const x=e.x,y=e.y;
    ctx.fillStyle=e.hurt?'#fff5c9':'#262626'; ctx.fillRect(x+13,y+31,56,52);
    ctx.fillStyle='#eee'; ctx.fillRect(x+28,y+33,26,18);
    ctx.fillStyle='#8b0000'; ctx.fillRect(x+37,y+38,8,23);
    ctx.fillStyle='#d7b08c'; ctx.beginPath(); ctx.ellipse(x+41,y+16,24,22,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#3a2419'; ctx.fillRect(x+30,y+25,24,5);
    ctx.fillStyle='#111'; ctx.fillRect(x+30,y+13,5,4); ctx.fillRect(x+49,y+13,5,4);
    ctx.fillRect(x+18,y+82,16,6); ctx.fillRect(x+50,y+82,16,6);
    if(e.ramTimer>0){ctx.strokeStyle='#ff4040';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+41,y+6);ctx.lineTo(x+41+e.facing*80,y+6);ctx.stroke();}
    if(e.turboTimer>0) this.drawTurboMark(ctx,e);
  }

  drawTurboMark(ctx,e){
    ctx.save();
    ctx.globalAlpha=.8; ctx.strokeStyle='#ff4040'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(e.x+e.w/2,e.y+e.h/2,Math.max(e.w,e.h)*.62,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(255,64,64,.16)'; ctx.fillRect(e.x-8,e.y-8,e.w+16,e.h+16);
    ctx.restore();
  }
};
