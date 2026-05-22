'use strict';
window.KP = window.KP || {};
KP.Assets = class Assets {
  constructor(){
    this.images={};
    this.load({
      // New sliced PNG assets, actually used by drawImage().
      hero:'img/sliced/units/hero_revolutionary.png',
      zombie:'img/sliced/units/mold_zombie_light.png',
      runner:'img/sliced/units/mold_zombie_light.png',
      pistol:'img/sliced/units/mold_zombie_light.png',
      gunner:'img/sliced/units/mold_gunner.png',
      horse:'img/sliced/units/cavalry_enemy.png',
      tank:'img/sliced/units/tank_enemy.png',
      miniboss:'img/sliced/units/mold_officer.png',

      mushroomBoss:'img/sliced/bosses/mushroom_boss.png',
      treeBoss:'img/sliced/bosses/tree_boss.png',
      sandBoss:'img/sliced/bosses/sandworm_boss.png',
      swampBoss:'img/sliced/bosses/swamp_boss.png',
      factoryBoss:'img/sliced/bosses/mech_tank_boss.png',
      lenin:'img/sliced/bosses/lenin_boss.png',

      shop:'img/shop.svg',
      menuPoster:'img/menu_poster_v1018.png',
      forestBg:'img/backgrounds/forest.jpg',
      winterBg:'img/backgrounds/winter.jpg',
      desertBg:'img/backgrounds/desert.jpg',
      swampBg:'img/backgrounds/swamp.jpg',
      cityBg:'img/backgrounds/city.jpg',
      mausoleumBg:'img/backgrounds/mausoleum.jpg',

      pistolWeapon:'img/sliced/weapons/pistol.png',
      shotgunWeapon:'img/sliced/weapons/shotgun.png',
      mosinWeapon:'img/sliced/weapons/mosin_rifle.png',
      smgWeapon:'img/sliced/weapons/smg.png',
      flamethrowerWeapon:'img/sliced/weapons/flamethrower.png',
      sabreWeapon:'img/sliced/weapons/saber.png',

      hpIcon:'img/sliced/ui_tiles/hp_heart.png',
      moneyIcon:'img/sliced/ui_tiles/money_stack.png',
      minimap:'img/sliced/ui_tiles/ui_minimap.png',
      timeStopEffect:'img/sliced/ui_tiles/time_stop_icon.png',
      forestTile:'img/sliced/ui_tiles/forest_platform.png',
      snowTile:'img/sliced/ui_tiles/snow_platform.png',
      desertTile:'img/sliced/ui_tiles/desert_platform.png',
      swampTile:'img/sliced/ui_tiles/swamp_platform.png',
      factoryPlatform:'img/sliced/ui_tiles/factory_platform.png',
      moldPlatform:'img/sliced/ui_tiles/mold_platform.png',
      portalExit:'img/sliced/ui_tiles/portal_exit.png',
      ammoCrateRifle:'img/sliced/weapons/ammo_crate_rifle.png',
      ammoBoxPistol:'img/sliced/weapons/ammo_box_pistol.png',
      shotgunShell:'img/sliced/weapons/shotgun_shell.png',
      fuelCanister:'img/sliced/weapons/fuel_canister.png'
    });
  }

  load(map){
    for(const [id,src] of Object.entries(map)){
      const img=new Image();
      img.src=src;
      this.images[id]=img;
    }
  }
  ready(id){ const img=this.images[id]; return img && img.complete && img.naturalWidth !== 0; }
  drawImg(ctx,id,x,y,w,h,flip=false){
    const img=this.images[id];
    if(!img || !img.complete) return false;
    ctx.save();
    if(flip){ ctx.translate(x+w,y); ctx.scale(-1,1); ctx.drawImage(img,0,0,w,h); }
    else ctx.drawImage(img,x,y,w,h);
    ctx.restore();
    return true;
  }

  drawHero(ctx,x,y,pose,facing,weapon){
    // v17: герой визуально уменьшен, оружие отдельным слоем, без приседаний и лежания.
    const heroW=36, heroH=52, heroX=x-2, heroY=y+3;
    const drew=this.drawImg(ctx,'hero',heroX,heroY,heroW,heroH,facing<0);
    if(!drew){
      ctx.save(); ctx.translate(x,y); if(facing<0){ ctx.translate(34,0); ctx.scale(-1,1); }
      ctx.fillStyle='#211714'; ctx.fillRect(6,18,22,32);
      ctx.fillStyle='#d6b18f'; ctx.fillRect(9,2,17,17);
      ctx.fillStyle='#151515'; ctx.fillRect(6,-3,22,7);
      ctx.fillStyle='#111'; ctx.fillRect(13,8,3,3); ctx.fillRect(23,8,3,3);
      ctx.fillStyle='#7b4b20'; ctx.fillRect(7,37,21,4);
      ctx.fillStyle='#111'; ctx.fillRect(8,50,7,8); ctx.fillRect(21,50,7,8);
      ctx.restore();
    }

    // Лицо и сигарета остаются читаемыми даже после уменьшения.
    ctx.save();
    if(facing<0){ ctx.translate(x+34,y); ctx.scale(-1,1); ctx.translate(-x,-y); }
    ctx.fillStyle='#d2a47f'; ctx.fillRect(x+12,y+8,14,11);
    ctx.fillStyle='#111'; ctx.fillRect(x+14,y+12,3,2); ctx.fillRect(x+23,y+12,3,2);
    ctx.fillStyle='#fff0c7'; ctx.fillRect(x+25,y+17,10,2);
    ctx.fillStyle='#ff5b1a'; ctx.beginPath(); ctx.arc(x+36,y+18,2.1,0,Math.PI*2); ctx.fill();
    ctx.restore();

    this.drawWeapon(ctx,x,y,facing,weapon);
  }

  drawWeapon(ctx,x,y,facing,weapon){
    const map={pistol:'pistolWeapon',mosin:'mosinWeapon',smg:'smgWeapon',flamethrower:'flamethrowerWeapon',sabre:'sabreWeapon',shotgun:'shotgunWeapon'};
    const id=map[weapon]||'mosinWeapon';
    const sizes={pistol:[34,20],mosin:[70,22],smg:[58,23],flamethrower:[68,27],sabre:[54,18],shotgun:[54,23]};
    const [ww,hh]=sizes[weapon]||sizes.mosin;
    ctx.save();
    if(facing<0){ ctx.translate(x+16,y+28); ctx.scale(-1,1); }
    else ctx.translate(x+18,y+28);
    if(!this.drawImg(ctx,id,0,-hh/2,ww,hh,false)){
      ctx.fillStyle=weapon==='sabre'?'#d8f2ff':weapon==='flamethrower'?'#ff5b1a':'#6b3e1d';
      ctx.fillRect(0,-3,ww,6);
      ctx.fillStyle='#111'; ctx.fillRect(ww-12,-5,15,4);
    }
    ctx.restore();
  }

  drawEnemy(ctx,e){
    if(['mushroomBoss','treeBoss','sandBoss','swampBoss','factoryBoss'].includes(e.kind)) return this.drawBiomeBoss(ctx,e);
    if(e.kind==='lenin') return this.drawLenin(ctx,e);
    if(e.kind==='tank') return this.drawTank(ctx,e);
    if(e.kind==='horse'){
      if(this.drawImg(ctx,'horse',e.x-6,e.y+4,78,52,e.facing<0))return;
    } else {
      const id=e.kind==='gunner'?'gunner':e.kind==='pistol'?'pistol':e.kind==='miniboss'?'miniboss':'zombie';
      const scale=e.kind==='miniboss'?1.02:0.88;
      const dw=Math.round((e.kind==='gunner'?54:44)*scale);
      const dh=Math.round((e.kind==='miniboss'?62:58)*scale);
      if(this.drawImg(ctx,id,e.x-3,e.y+(e.h-dh)+2,dw,dh,e.facing<0)){
        this.drawEnemyWeapon(ctx,e);
        return;
      }
    }
    this.drawFallbackSoldier(ctx,e);
  }

  drawEnemyWeapon(ctx,e){
    ctx.save();
    if(e.facing<0){ctx.translate(e.x+e.w,e.y);ctx.scale(-1,1);ctx.translate(-e.x,-e.y);}
    ctx.fillStyle='#111';
    if(e.kind==='pistol') ctx.fillRect(e.x+24,e.y+28,22,5);
    if(e.kind==='gunner') ctx.fillRect(e.x+20,e.y+27,42,6);
    if(e.kind==='miniboss'){ ctx.fillRect(e.x+18,e.y+26,48,7); ctx.fillStyle='#b00000'; ctx.fillRect(e.x+4,e.y-14,36,8); }
    ctx.restore();
  }

  drawFallbackSoldier(ctx,e){
    const x=e.x,y=e.y;
    ctx.save(); if(e.facing<0){ctx.translate(x+e.w,y);ctx.scale(-1,1);}else ctx.translate(x,y);
    if(e.kind==='horse'){ctx.fillStyle='#5b351d';ctx.fillRect(0,34,68,21);ctx.fillStyle='#3b2416';ctx.fillRect(42,20,22,18);ctx.fillStyle='#111';ctx.fillRect(8,52,8,10);ctx.fillRect(48,52,8,10);}
    ctx.fillStyle=e.hurt>0?'#fff5c9':(e.kind==='miniboss'?'#ddd6c2':'#f1f1e5'); ctx.fillRect(8,18,Math.min(30,e.w-14),34);
    ctx.fillStyle='#d5b48a';ctx.fillRect(10,2,18,17);ctx.fillStyle='#ecece0';ctx.fillRect(7,-4,24,9);
    ctx.fillStyle='#222';ctx.fillRect(12,7,4,3);ctx.fillRect(23,7,4,3);
    ctx.fillStyle='#111'; if(e.kind==='gunner')ctx.fillRect(2,25,44,5); else if(e.kind==='pistol')ctx.fillRect(4,26,25,4); else if(e.kind==='miniboss')ctx.fillRect(0,24,48,6);
    if(e.kind==='miniboss'){ ctx.fillStyle='#b00000';ctx.fillRect(5,-13,34,9); ctx.fillStyle='#ffd21c';ctx.fillRect(12,-11,20,3); }
    ctx.restore();
  }

  drawBiomeBoss(ctx,e){
    const id={mushroomBoss:'mushroomBoss',treeBoss:'treeBoss',sandBoss:'sandBoss',swampBoss:'swampBoss',factoryBoss:'factoryBoss'}[e.kind];
    if(id && this.drawImg(ctx,id,e.x-10,e.y-8,110,92,e.facing<0)){
      if(e.turboTimer>0)this.drawTurboMark(ctx,e);
      return;
    }

    const x=e.x,y=e.y;
    ctx.save(); if(e.facing<0){ctx.translate(x+e.w,y);ctx.scale(-1,1);ctx.translate(-x,-y);}
    const palettes={ mushroomBoss:['#6fd15f','#2a6b2d','#f2f2d8'], treeBoss:['#6b3e1d','#1f6b2a','#3a2416'], sandBoss:['#c89042','#7b4b20','#ffe0a0'], swampBoss:['#2f7d65','#173f37','#8cff9e'], factoryBoss:['#585858','#2a2a2a','#ffd21c'] }[e.kind] || ['#777','#333','#fff'];
    ctx.fillStyle=palettes[1]; ctx.fillRect(x+16,y+25,54,52);
    ctx.fillStyle=palettes[0]; ctx.beginPath(); ctx.ellipse(x+43,y+25,42,24,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=palettes[2]; ctx.fillRect(x+24,y+20,8,8); ctx.fillRect(x+52,y+20,8,8);
    ctx.fillStyle='#111'; ctx.fillRect(x+30,y+46,28,6);
    ctx.restore();
    if(e.turboTimer>0)this.drawTurboMark(ctx,e);
  }

  drawTank(ctx,e){
    if(this.drawImg(ctx,'tank',e.x-6,e.y+6,112,54,e.facing<0))return;
    const x=e.x,y=e.y; ctx.fillStyle=e.hurt?'#fff5c9':'#4f554f';ctx.fillRect(x,y+22,e.w,e.h-22);ctx.fillStyle='#2a302a';ctx.fillRect(x+12,y+8,58,24);ctx.fillStyle='#111';ctx.fillRect(x+70,y+26,42,8);ctx.fillStyle='#222';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x+16+i*17,y+52,7,0,Math.PI*2);ctx.fill();}
  }

  drawLenin(ctx,e){
    if(this.drawImg(ctx,'lenin',e.x-2,e.y-4,88,92,e.facing<0)){
      if(e.ramTimer>0){ctx.strokeStyle='#ff4040';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(e.x+41,e.y+12);ctx.lineTo(e.x+41+e.facing*80,e.y+12);ctx.stroke();}
      if(e.turboTimer>0)this.drawTurboMark(ctx,e);
      return;
    }
    const x=e.x,y=e.y; ctx.fillStyle=e.hurt?'#fff5c9':'#262626';ctx.fillRect(x+13,y+31,56,52);ctx.fillStyle='#eee';ctx.fillRect(x+28,y+33,26,18);ctx.fillStyle='#8b0000';ctx.fillRect(x+37,y+38,8,23);ctx.fillStyle='#d7b08c';ctx.beginPath();ctx.ellipse(x+41,y+16,24,22,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3a2419';ctx.fillRect(x+30,y+25,24,5);ctx.fillStyle='#111';ctx.fillRect(x+30,y+13,5,4);ctx.fillRect(x+49,y+13,5,4);ctx.fillStyle='#111';ctx.fillRect(x+18,y+82,16,6);ctx.fillRect(x+50,y+82,16,6); 
    if(e.ramTimer>0){ctx.strokeStyle='#ff4040';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+41,y+6);ctx.lineTo(x+41+e.facing*80,y+6);ctx.stroke();}
    if(e.turboTimer>0)this.drawTurboMark(ctx,e);
  }

  drawTurboMark(ctx,e){
    ctx.save();
    ctx.globalAlpha=.8;
    ctx.strokeStyle='#ff4040';
    ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(e.x+e.w/2,e.y+e.h/2,Math.max(e.w,e.h)*.62,0,Math.PI*2);
    ctx.stroke();
    ctx.fillStyle='rgba(255,64,64,.16)';
    ctx.fillRect(e.x-8,e.y-8,e.w+16,e.h+16);
    ctx.restore();
  }
};
