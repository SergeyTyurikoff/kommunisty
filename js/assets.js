'use strict';
window.KP = window.KP || {};
KP.Assets = class Assets {
  constructor(){
    this.images={};
    this.load({
      hero:          'img/sliced/units/hero_revolutionary.png',
      zombie:        'img/sliced/units/mold_zombie_light.png',
      runner:        'img/sliced/units/mold_zombie_light.png',
      pistolEnemy:   'img/sliced/units/mold_zombie_light.png',
      gunner:        'img/sliced/units/mold_gunner.png',
      horse:         'img/sliced/units/cavalry_enemy.png',
      tank:          'img/sliced/units/tank_enemy.png',
      miniboss:      'img/sliced/units/mold_officer.png',
      mushroomBoss:  'img/sliced/bosses/mushroom_boss.png',
      treeBoss:      'img/sliced/bosses/tree_boss.png',
      sandBoss:      'img/sliced/bosses/sandworm_boss.png',
      swampBoss:     'img/sliced/bosses/swamp_boss.png',
      factoryBoss:   'img/sliced/bosses/mech_tank_boss.png',
      leninBoss:     'img/sliced/bosses/lenin_boss.png',
      shop:          'img/shop.svg',
      menuPoster:    'img/menu_poster_v1018.png',
      forestBg:      'img/backgrounds/forest.jpg',
      winterBg:      'img/backgrounds/winter.jpg',
      desertBg:      'img/backgrounds/desert.jpg',
      swampBg:       'img/backgrounds/swamp.jpg',
      cityBg:        'img/backgrounds/city.jpg',
      mausoleumBg:   'img/backgrounds/mausoleum.jpg',
      pistolWeapon:  'img/sliced/weapons/pistol.png',
      shotgunWeapon: 'img/sliced/weapons/shotgun.png',
      mosinWeapon:   'img/sliced/weapons/mosin_rifle.png',
      smgWeapon:     'img/sliced/weapons/smg.png',
      flamethrowerWeapon:'img/sliced/weapons/flamethrower.png',
      sabreWeapon:   'img/sliced/weapons/saber.png',
      hpIcon:        'img/sliced/ui_tiles/hp_heart.png',
      moneyIcon:     'img/sliced/ui_tiles/money_stack.png',
      minimap:       'img/sliced/ui_tiles/ui_minimap.png',
      forestTile:    'img/sliced/ui_tiles/forest_platform.png',
      snowTile:      'img/sliced/ui_tiles/snow_platform.png',
      desertTile:    'img/sliced/ui_tiles/desert_platform.png',
      swampTile:     'img/sliced/ui_tiles/swamp_platform.png',
      factoryPlatform:'img/sliced/ui_tiles/factory_platform.png',
      moldPlatform:  'img/sliced/ui_tiles/mold_platform.png',
      portalExit:    'img/sliced/ui_tiles/portal_exit.png'
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

  // ─── Pixel-art canvas drawing helpers ───────────────────────────────────────

  _r(ctx,x,y,w,h,fill,stroke=null,sw=1.5){
    if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=sw; ctx.strokeRect(x-.5,y-.5,w+1,h+1); }
    ctx.fillStyle=fill; ctx.fillRect(x,y,w,h);
  }

  _star(ctx,cx,cy,r,fill='#cc2200'){
    ctx.fillStyle=fill;
    ctx.beginPath();
    for(let i=0;i<5;i++){
      const a=i*Math.PI*2/5-Math.PI/2;
      const a2=a+Math.PI/5;
      if(i===0) ctx.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
      else ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);
      ctx.lineTo(cx+Math.cos(a2)*r*.42,cy+Math.sin(a2)*r*.42);
    }
    ctx.closePath(); ctx.fill();
  }

  _circle(ctx,cx,cy,r,fill,stroke=null){
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.fillStyle=fill; ctx.fill();
    if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=1.5; ctx.stroke(); }
  }

  // ─── HERO ───────────────────────────────────────────────────────────────────

  drawHero(ctx,x,y,pose,facing,weapon,dodgeTimer=0){
    ctx.save();
    const flip=facing<0;
    if(flip){ ctx.translate(x+34,y); ctx.scale(-1,1); } else ctx.translate(x,y);

    // Shadow
    ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(17,60,16,5,0,0,Math.PI*2); ctx.fill();

    // Boots
    this._r(ctx,4,50,11,10,'#111','#000');
    this._r(ctx,19,50,11,10,'#111','#000');
    // Leg crease
    ctx.fillStyle='#0a0a0a'; ctx.fillRect(14,50,2,10);

    // Coat body
    this._r(ctx,3,18,28,35,'#1a1a2a','#0a0a14');
    // Red center line
    ctx.fillStyle='#8b0000'; ctx.fillRect(14,18,6,35);
    // Buttons
    ctx.fillStyle='#ffd21c';
    [24,31,38,45].forEach(yy=>{ ctx.beginPath(); ctx.arc(17,yy,1.5,0,Math.PI*2); ctx.fill(); });
    // Shoulder boards
    this._r(ctx,2,18,10,7,'#8b0000','#4a0000');
    this._r(ctx,22,18,10,7,'#8b0000','#4a0000');
    // Collar white
    ctx.fillStyle='#eeeedd'; ctx.fillRect(12,18,10,6);
    // Belt
    this._r(ctx,3,40,28,5,'#5a3c10','#3a2408');
    ctx.fillStyle='#ffd21c'; ctx.fillRect(14,41,6,3); // buckle

    // Head
    this._r(ctx,9,2,16,17,'#d5a07a','#b8835e');
    // Peaked cap (budyonovka)
    ctx.fillStyle='#1a1a2a'; ctx.fillRect(6,-5,22,9); // brim
    // Top of cap — triangle peak
    ctx.beginPath(); ctx.moveTo(9,-5); ctx.lineTo(17,-14); ctx.lineTo(25,-5); ctx.closePath();
    ctx.fillStyle='#1a1a2a'; ctx.fill();
    // Red star on cap
    this._star(ctx,17,-6,5.5,'#cc2200');
    // Eyes
    ctx.fillStyle='#1a0a00'; ctx.fillRect(11,9,3,3); ctx.fillRect(20,9,3,3);
    // Moustache-hint
    ctx.fillStyle='#5a2a00'; ctx.fillRect(13,17,8,2);
    // Cigarette (faces right)
    ctx.fillStyle='#f5f5d8'; ctx.fillRect(25,13,10,2);
    ctx.fillStyle='rgba(255,90,26,.8)'; ctx.beginPath(); ctx.arc(36,14,2.2,0,Math.PI*2); ctx.fill();

    // Turbo glow arms
    ctx.restore();

    this.drawWeapon(ctx,x,y,facing,weapon);
  }

  drawWeapon(ctx,x,y,facing,weapon){
    const map={pistol:'pistolWeapon',mosin:'mosinWeapon',smg:'smgWeapon',flamethrower:'flamethrowerWeapon',sabre:'sabreWeapon',shotgun:'shotgunWeapon'};
    const id=map[weapon]||'mosinWeapon';
    const sizes={pistol:[34,20],mosin:[70,22],smg:[58,23],flamethrower:[68,27],sabre:[54,18],shotgun:[54,23]};
    const [ww,hh]=sizes[weapon]||sizes.mosin;
    ctx.save();
    if(facing<0){ ctx.translate(x+16,y+28); ctx.scale(-1,1); } else ctx.translate(x+18,y+28);
    if(!this.drawImg(ctx,id,0,-hh/2,ww,hh,false)){
      // Fallback weapon drawing
      const wcolors={sabre:'#d8f2ff',flamethrower:'#ff5b1a',pistol:'#aaa',shotgun:'#8b5a00',smg:'#ff9a26',mosin:'#6b3e1d'};
      ctx.fillStyle=wcolors[weapon]||'#6b3e1d'; ctx.fillRect(0,-3,ww,5);
      ctx.fillStyle='#111'; ctx.fillRect(ww-12,-5,15,3);
    }
    ctx.restore();
  }

  // ─── ENEMIES ────────────────────────────────────────────────────────────────

  drawEnemy(ctx,e){
    const h=e.hurt>0;
    switch(e.kind){
      case 'zombie':      this._drawZombie(ctx,e,h); break;
      case 'runner':      this._drawRunner(ctx,e,h); break;
      case 'pistol':      this._drawPistolEnemy(ctx,e,h); break;
      case 'gunner':      this._drawGunner(ctx,e,h); break;
      case 'horse':       this._drawHorse(ctx,e,h); break;
      case 'tank':        this._drawTank(ctx,e,h); break;
      case 'miniboss':    this._drawMiniboss(ctx,e,h); break;
      case 'mushroomBoss':this._drawMushroomBoss(ctx,e,h); break;
      case 'treeBoss':    this._drawTreeBoss(ctx,e,h); break;
      case 'sandBoss':    this._drawSandBoss(ctx,e,h); break;
      case 'swampBoss':   this._drawSwampBoss(ctx,e,h); break;
      case 'factoryBoss': this._drawFactoryBoss(ctx,e,h); break;
      case 'lenin':       this._drawLenin(ctx,e,h); break;
      default:            this._drawFallback(ctx,e,h);
    }
  }

  _flip(ctx,e,cb){
    ctx.save();
    if(e.facing<0){ ctx.translate(e.x+e.w,e.y); ctx.scale(-1,1); ctx.translate(-e.x,-e.y); }
    cb();
    ctx.restore();
  }

  // Zombie — shambling mold grunt, green-tinted
  _drawZombie(ctx,e,hurt){
    const x=e.x,y=e.y;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x+21,y+54,18,5,0,0,Math.PI*2); ctx.fill();
    // Body — ragged coat
    const body=hurt?'#c8ffcc':'#3a5a2e';
    this._r(ctx,x+7,y+20,28,34,body,'#1a2a14');
    // Mold patches
    ctx.fillStyle='#5ab84a';
    ctx.fillRect(x+9,y+22,8,6); ctx.fillRect(x+25,y+38,6,8);
    ctx.fillRect(x+12,y+44,10,5);
    // Arms outstretched (zombie pose)
    this._r(ctx,x+1,y+22,8,6,'#3a5a2e','#1a2a14');   // left arm
    this._r(ctx,x+33,y+20,9,6,'#3a5a2e','#1a2a14');  // right arm
    // Head
    this._r(ctx,x+9,y+2,24,20,hurt?'#c8ffcc':'#4a7a3a','#1a2a14');
    // Glowing eyes
    this._circle(ctx,x+14,y+10,3,'#88ff44'); this._circle(ctx,x+14,y+10,1.5,'#ffffff');
    this._circle(ctx,x+28,y+10,3,'#88ff44'); this._circle(ctx,x+28,y+10,1.5,'#ffffff');
    // Mouth
    ctx.fillStyle='#1a0a00'; ctx.fillRect(x+15,y+18,12,3);
    ctx.fillStyle='#88ff44'; ctx.fillRect(x+17,y+19,3,3); ctx.fillRect(x+22,y+19,3,3);
    // Spores
    ctx.fillStyle='rgba(100,220,70,.6)';
    ctx.beginPath(); ctx.arc(x+5,y+8,3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+38,y+15,2.5,0,Math.PI*2); ctx.fill();
    // Legs
    this._r(ctx,x+10,y+52,10,6,'#2a3a20','#111');
    this._r(ctx,x+22,y+52,10,6,'#2a3a20','#111');
  }

  // Runner — lean, aggressive, orange-tinted mold
  _drawRunner(ctx,e,hurt){
    const x=e.x,y=e.y;
    ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x+21,y+54,15,4,0,0,Math.PI*2); ctx.fill();
    const body=hurt?'#ffddaa':'#6a6a20';
    // Body — leaner, angled forward
    this._r(ctx,x+8,y+22,26,30,body,'#3a3a10');
    ctx.fillStyle='#cc8800'; ctx.fillRect(x+10,y+24,7,5); ctx.fillRect(x+24,y+36,5,7);
    // Clawed arms
    this._r(ctx,x,y+22,10,5,'#6a6a20','#3a3a10');
    this._r(ctx,x+32,y+20,10,5,'#6a6a20','#3a3a10');
    ctx.fillStyle='#cc8800'; ctx.fillRect(x,y+25,3,5); ctx.fillRect(x+7,y+25,3,5); // claws
    // Small feral head
    this._r(ctx,x+10,y+4,22,18,hurt?'#ffddaa':'#7a7a28','#3a3a10');
    this._circle(ctx,x+15,y+12,3,'#dd8800'); this._circle(ctx,x+15,y+12,1.5,'#fff');
    this._circle(ctx,x+27,y+12,3,'#dd8800'); this._circle(ctx,x+27,y+12,1.5,'#fff');
    ctx.fillStyle='#3a3a10'; ctx.fillRect(x+16,y+19,10,3);
    // Legs
    this._r(ctx,x+9,y+50,10,6,'#4a4a14','#111');
    this._r(ctx,x+21,y+50,10,6,'#4a4a14','#111');
  }

  // Pistol enemy — khaki soldier, upright
  _drawPistolEnemy(ctx,e,hurt){
    const x=e.x,y=e.y;
    ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x+21,y+54,16,4,0,0,Math.PI*2); ctx.fill();
    const uni=hurt?'#ffeecc':'#8b7355';
    // Body — military coat
    this._r(ctx,x+7,y+18,28,36,uni,'#5a4030');
    ctx.fillStyle='#7a6240'; ctx.fillRect(x+9,y+20,6,4); ctx.fillRect(x+27,y+20,6,4); // shoulder boards
    // Belt
    this._r(ctx,x+7,y+38,28,5,'#4a3010','#2a1a08');
    ctx.fillStyle='#c89000'; ctx.fillRect(x+17,y+39,8,3);
    // Head with helmet
    this._r(ctx,x+9,y+2,24,18,'#c8a47a','#8b6040');
    this._r(ctx,x+7,-3,28,8,'#6a7050','#3a4030');  // helmet
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x+7,y+5,28,4); // visor shadow
    // Eyes
    ctx.fillStyle='#1a0a00'; ctx.fillRect(x+13,y+9,4,3); ctx.fillRect(x+25,y+9,4,3);
    // Pistol — drawn in hand
    this._flip(ctx,e,()=>{
      this._r(ctx,x+e.w-2,y+25,22,6,'#333','#111');
      ctx.fillStyle='#555'; ctx.fillRect(x+e.w+10,y+24,8,8);
    });
    // Legs + boots
    this._r(ctx,x+9,y+52,11,8,'#6a5030','#3a2a18');
    this._r(ctx,x+22,y+52,11,8,'#6a5030','#3a2a18');
    this._r(ctx,x+8,y+58,12,4,'#111','#000');
    this._r(ctx,x+21,y+58,12,4,'#111','#000');
  }

  // Gunner — heavy, armored, gas mask
  _drawGunner(ctx,e,hurt){
    const x=e.x,y=e.y;
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x+27,y+54,22,5,0,0,Math.PI*2); ctx.fill();
    const body=hurt?'#dde8ff':'#4a4a5a';
    // Heavy torso
    this._r(ctx,x+5,y+18,44,36,body,'#2a2a3a');
    // Armor plates
    ctx.fillStyle='#5a5a6a'; ctx.fillRect(x+8,y+20,16,12); ctx.fillRect(x+30,y+20,16,12);
    ctx.fillStyle='#3a3a4a'; ctx.fillRect(x+24,y+18,8,36); // center line
    // Big gun
    this._flip(ctx,e,()=>{
      this._r(ctx,x+e.w+2,y+26,48,8,'#2a2a2a','#111');
      ctx.fillStyle='#1a1a1a'; ctx.fillRect(x+e.w+38,y+24,12,12);
      ctx.fillStyle='#3a3a3a'; ctx.fillRect(x+e.w+2,y+28,8,4);
    });
    // Gas mask head
    this._r(ctx,x+9,y+0,36,20,hurt?'#dde8ff':'#3a3a4a','#1a1a2a');
    // Goggle eyes
    this._circle(ctx,x+17,y+9,5,'#1a1a1a','#88aacc');
    this._circle(ctx,x+17,y+9,3,'#003366');
    this._circle(ctx,x+31,y+9,5,'#1a1a1a','#88aacc');
    this._circle(ctx,x+31,y+9,3,'#003366');
    // Filter
    ctx.fillStyle='#2a2a2a'; ctx.beginPath(); ctx.arc(x+24,y+18,5,0,Math.PI*2); ctx.fill();
    // Legs
    this._r(ctx,x+8,y+52,16,10,'#3a3a4a','#111');
    this._r(ctx,x+30,y+52,16,10,'#3a3a4a','#111');
  }

  // Horse — cavalry unit
  _drawHorse(ctx,e,hurt){
    const x=e.x,y=e.y;
    ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x+35,y+64,30,7,0,0,Math.PI*2); ctx.fill();
    const hc=hurt?'#ffe0bb':'#6b4020';
    // Horse body
    this._r(ctx,x+4,y+30,62,28,hc,'#3a2010');
    // Horse head & neck
    ctx.fillStyle=hc; ctx.fillRect(x+42,y+10,20,28);
    ctx.fillStyle='#3a2010'; ctx.strokeRect(x+42,y+10,20,28);
    this._r(ctx,x+52,y+4,16,14,hc,'#3a2010');
    // Eye
    this._circle(ctx,x+58,y+9,3,'#111','#8b5a00');
    // Nostrils
    ctx.fillStyle='#4a2010'; ctx.fillRect(x+58,y+16,4,3);
    // Mane
    ctx.fillStyle='#3a1a08'; for(let i=0;i<5;i++) ctx.fillRect(x+42+i*3,y+10,2,14);
    // Legs
    [[8,56],[20,56],[38,56],[50,56]].forEach(([lx,ly])=>{
      this._r(ctx,x+lx,y+ly,10,14,'#5a3010','#2a1008');
      this._r(ctx,x+lx,y+ly+12,10,6,'#111','#000');
    });
    // Rider
    this._r(ctx,x+22,y+8,24,26,'#3a6a30','#1a3a18');
    this._r(ctx,x+26,y+0,16,10,'#d5a07a','#8b6040');
    this._r(ctx,x+24,-6,20,8,'#1a1a2a','#0a0a14');
    this._star(ctx,x+34,-2,4,'#cc2200');
    // Sabre arm
    this._flip(ctx,e,()=>{
      ctx.fillStyle='#d8f2ff'; ctx.fillRect(x+e.w+2,y+12,28,3);
      ctx.fillStyle='#888'; ctx.fillRect(x+e.w,y+12,6,6);
    });
  }

  // Tank — heavy siege unit
  _drawTank(ctx,e,hurt){
    const x=e.x,y=e.y;
    // Shadow
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x+52,y+64,48,8,0,0,Math.PI*2); ctx.fill();
    const hull=hurt?'#aaffaa':'#3a4a3a';
    // Treads
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(x,y+42,e.w,22); ctx.strokeStyle='#333'; ctx.lineWidth=1.5; ctx.strokeRect(x,y+42,e.w,22);
    for(let i=0;i<7;i++){ this._circle(ctx,x+14+i*12,y+54,7,'#252525','#3a3a3a'); }
    // Hull
    this._r(ctx,x+6,y+22,92,24,hull,'#1a2a1a');
    // Turret
    this._r(ctx,x+28,y+8,48,18,'#2a3a2a','#111');
    // Barrel
    this._flip(ctx,e,()=>{ this._r(ctx,x+e.w+2,y+14,44,8,'#1a2a1a','#0a0a0a'); });
    // Hatch
    this._r(ctx,x+48,y+6,20,6,'#2a3a2a','#111');
    // Red star
    this._star(ctx,x+52,y+17,8,'#cc0000');
    // Vision slit
    ctx.fillStyle='rgba(255,200,50,.6)'; ctx.fillRect(x+42,y+12,24,4);
  }

  // Miniboss — elite officer in heavy gear
  _drawMiniboss(ctx,e,hurt){
    const x=e.x,y=e.y;
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x+25,y+62,22,5,0,0,Math.PI*2); ctx.fill();
    const body=hurt?'#ffcccc':'#3a3030';
    this._r(ctx,x+5,y+18,40,44,body,'#1a1010');
    // Armor plates
    ctx.fillStyle='#4a3030'; ctx.fillRect(x+8,y+20,16,14); ctx.fillRect(x+26,y+20,16,14);
    // Red beret
    this._r(ctx,x+8,y+0,34,10,'#8b0000','#4a0000');
    ctx.fillStyle='#8b0000'; ctx.beginPath(); ctx.ellipse(x+25,y+2,18,6,0,0,Math.PI*2); ctx.fill();
    this._star(ctx,x+32,y+2,5,'#ffd21c');
    // Head
    this._r(ctx,x+10,y+2,30,18,'#c8a47a','#8b6040');
    // Eyes — angry brow
    ctx.fillStyle='#1a0a00'; ctx.fillRect(x+14,y+9,5,4); ctx.fillRect(x+31,y+9,5,4);
    ctx.fillStyle='#1a0a00'; ctx.fillRect(x+12,y+6,8,2); ctx.fillRect(x+30,y+6,8,2); // brow
    // Moustache
    ctx.fillStyle='#3a1a00'; ctx.fillRect(x+17,y+18,16,4);
    // Gold epaulettes
    ctx.fillStyle='#ffd21c'; ctx.fillRect(x+5,y+18,8,5); ctx.fillRect(x+37,y+18,8,5);
    // Dual pistols
    this._flip(ctx,e,()=>{
      this._r(ctx,x+e.w+2,y+28,24,6,'#333','#111');
      this._r(ctx,x+e.w+2,y+38,24,6,'#333','#111');
    });
    // Legs + boots
    this._r(ctx,x+8,y+60,16,10,'#2a1a1a','#111');
    this._r(ctx,x+26,y+60,16,10,'#2a1a1a','#111');
  }

  // ─── BOSSES ─────────────────────────────────────────────────────────────────

  _drawMushroomBoss(ctx,e,hurt){
    if(this.drawImg(ctx,'mushroomBoss',e.x-10,e.y-8,106,96,e.facing<0)){
      this._drawBossEffects(ctx,e); return;
    }
    const x=e.x,y=e.y;
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x+43,y+90,42,8,0,0,Math.PI*2); ctx.fill();
    const cap=hurt?'#ccffcc':'#6fd15f';
    // Stem
    this._r(ctx,x+20,y+36,46,54,'#e8e0c8','#a8a088');
    // Cap — large dome
    ctx.fillStyle=cap; ctx.beginPath();
    ctx.ellipse(x+43,y+38,50,32,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#2a5a2a'; ctx.lineWidth=2; ctx.stroke();
    // Spots
    ctx.fillStyle='#f0f0d8';
    [[x+18,y+20,9],[x+50,y+14,7],[x+68,y+28,8],[x+28,y+32,6]].forEach(([cx,cy,r])=>this._circle(ctx,cx,cy,r,'#f0f0d8'));
    // Face
    this._circle(ctx,x+30,y+54,5,'#1a0a00');
    this._circle(ctx,x+56,y+54,5,'#1a0a00');
    ctx.fillStyle='#ff4040'; ctx.beginPath(); ctx.arc(x+43,y+68,10,0,Math.PI); ctx.fill();
    // Spore arms
    ctx.fillStyle='rgba(100,200,70,.5)';
    ctx.fillRect(x-16,y+48,18,8); ctx.fillRect(x+84,y+42,16,8);
    // Phase 2 — spore burst rings
    if(e.phase2){
      ctx.strokeStyle='rgba(100,220,70,.6)'; ctx.lineWidth=3;
      [0,1,2].forEach(i=>{ ctx.beginPath(); ctx.arc(x+43,y+50,(30+i*18)*(0.8+Math.sin(Date.now()/200+i)*0.2),0,Math.PI*2); ctx.stroke(); });
    }
    this._drawBossEffects(ctx,e);
  }

  _drawTreeBoss(ctx,e,hurt){
    if(this.drawImg(ctx,'treeBoss',e.x-10,e.y-8,106,96,e.facing<0)){
      this._drawBossEffects(ctx,e); return;
    }
    const x=e.x,y=e.y;
    const bark=hurt?'#dfc8a0':'#6b3e1d';
    // Roots / feet
    ctx.fillStyle='#4a2a0a'; ctx.fillRect(x+10,y+80,14,10); ctx.fillRect(x+62,y+80,14,10);
    ctx.fillRect(x+0,y+82,16,8); ctx.fillRect(x+68,y+80,18,8);
    // Trunk
    this._r(ctx,x+22,y+20,42,64,bark,'#3a1e08');
    // Bark texture
    ctx.fillStyle='#4a2a10';
    for(let i=0;i<5;i++) ctx.fillRect(x+26,y+24+i*12,10,4+i%2*2);
    // Branch arms
    ctx.fillStyle=bark; ctx.beginPath();
    ctx.moveTo(x+22,y+30); ctx.lineTo(x-10,y+18); ctx.lineTo(x-4,y+38); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x+64,y+30); ctx.lineTo(x+96,y+18); ctx.lineTo(x+90,y+38); ctx.closePath(); ctx.fill();
    // Leaves
    ctx.fillStyle='#1f6b2a'; ctx.beginPath(); ctx.arc(x-12,y+16,16,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x+98,y+16,16,0,Math.PI*2); ctx.fill();
    // Face — carved in bark
    this._circle(ctx,x+32,y+44,5,hurt?'#eecc88':'#2a1008');
    this._circle(ctx,x+54,y+44,5,hurt?'#eecc88':'#2a1008');
    ctx.fillStyle='#1a0800'; ctx.fillRect(x+30,y+56,26,5);
    // Phase 2 — glowing
    if(e.phase2){
      ctx.fillStyle='rgba(150,80,20,.3)'; ctx.beginPath(); ctx.ellipse(x+43,y+48,50,46,0,0,Math.PI*2); ctx.fill();
    }
    this._drawBossEffects(ctx,e);
  }

  _drawSandBoss(ctx,e,hurt){
    if(this.drawImg(ctx,'sandBoss',e.x-10,e.y-8,106,96,e.facing<0)){
      this._drawBossEffects(ctx,e); return;
    }
    const x=e.x,y=e.y;
    const sand=hurt?'#ffe8a0':'#c89042';
    // Worm segments
    const segs=5;
    for(let i=0;i<segs;i++){
      const sy=y+12+i*16, sw=72-i*6, sx=x+(86-sw)/2;
      this._r(ctx,sx,sy,sw,18,i%2===0?sand:'#b07832',i===0?'#7a4a20':'#5a3410');
      if(i===0){
        // Mouth / head
        ctx.fillStyle='#ff4400'; ctx.beginPath(); ctx.arc(sx+sw/2,sy+10,14,Math.PI,Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; for(let j=0;j<6;j++) ctx.fillRect(sx+sw/2-15+j*6,sy+5,3,8);
        this._circle(ctx,sx+14,sy+5,5,'#aa0000','#ff4400');
        this._circle(ctx,sx+sw-14,sy+5,5,'#aa0000','#ff4400');
      }
    }
    // Sand particles
    ctx.fillStyle='rgba(200,160,70,.5)';
    for(let i=0;i<8;i++) ctx.beginPath(), ctx.arc(x+10+i*10,y+85,2+i%3,0,Math.PI*2), ctx.fill();
    if(e.phase2){
      ctx.fillStyle='rgba(200,150,50,.25)'; ctx.beginPath(); ctx.ellipse(x+43,y+50,52,48,0,0,Math.PI*2); ctx.fill();
    }
    this._drawBossEffects(ctx,e);
  }

  _drawSwampBoss(ctx,e,hurt){
    if(this.drawImg(ctx,'swampBoss',e.x-10,e.y-8,106,96,e.facing<0)){
      this._drawBossEffects(ctx,e); return;
    }
    const x=e.x,y=e.y;
    const slime=hurt?'#aaffcc':'#2f7d65';
    // Blob body
    ctx.fillStyle=slime; ctx.beginPath(); ctx.ellipse(x+43,y+50,44,42,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#153f37'; ctx.lineWidth=2; ctx.stroke();
    // Slime drips
    ctx.fillStyle=slime;
    [[x+20,y+88],[x+35,y+90],[x+52,y+88],[x+66,y+86]].forEach(([dx,dy])=>{
      ctx.beginPath(); ctx.ellipse(dx,dy,5,8,0,0,Math.PI*2); ctx.fill();
    });
    // Tentacles
    ctx.strokeStyle='#1a5a48'; ctx.lineWidth=8;
    [[x-6,y+50,x-20,y+36],[x+92,y+44,x+106,y+30],[x+10,y+86,x-4,y+100],[x+76,y+82,x+90,y+96]].forEach(([x1,y1,x2,y2])=>{
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });
    // Eyes
    this._circle(ctx,x+28,y+36,7,'#00ff88','#003322');
    this._circle(ctx,x+28,y+36,4,'#00cc66');
    this._circle(ctx,x+58,y+36,7,'#00ff88','#003322');
    this._circle(ctx,x+58,y+36,4,'#00cc66');
    // Fang mouth
    ctx.fillStyle='#0a1a10'; ctx.beginPath(); ctx.arc(x+43,y+60,16,0.2,Math.PI-.2); ctx.fill();
    ctx.fillStyle='#fff'; for(let i=0;i<4;i++) ctx.fillRect(x+28+i*8,y+58,4,8);
    if(e.phase2){
      ctx.fillStyle='rgba(40,150,100,.25)'; ctx.beginPath(); ctx.ellipse(x+43,y+50,54,50,0,0,Math.PI*2); ctx.fill();
    }
    this._drawBossEffects(ctx,e);
  }

  _drawFactoryBoss(ctx,e,hurt){
    if(this.drawImg(ctx,'factoryBoss',e.x-10,e.y-8,106,96,e.facing<0)){
      this._drawBossEffects(ctx,e); return;
    }
    const x=e.x,y=e.y;
    const metal=hurt?'#dde8ff':'#5a5a6a';
    // Base / legs
    this._r(ctx,x+10,y+70,66,20,metal,'#2a2a3a');
    for(let i=0;i<4;i++) ctx.fillStyle='#1a1a2a', ctx.fillRect(x+16+i*16,y+78,8,14);
    // Body — chassis
    this._r(ctx,x+6,y+22,74,52,metal,'#2a2a3a');
    // Rivet details
    ctx.fillStyle='#3a3a4a';
    [[x+10,y+28],[x+18,y+28],[x+68,y+28],[x+76,y+28],[x+10,y+64],[x+76,y+64]].forEach(([rx,ry])=>this._circle(ctx,rx,ry,3,'#3a3a4a'));
    // Exhaust pipes
    this._r(ctx,x-2,y+24,8,30,'#2a2a3a','#111');
    this._r(ctx,x+80,y+24,8,30,'#2a2a3a','#111');
    // Smoke
    ctx.fillStyle='rgba(100,100,110,.5)';
    this._circle(ctx,x+2,y+20,6,'rgba(100,100,110,.5)');
    this._circle(ctx,x+84,y+18,7,'rgba(100,100,110,.45)');
    // Piston arms
    this._flip(ctx,e,()=>{
      this._r(ctx,x+e.w+2,y+36,28,12,'#4a4a5a','#2a2a3a');
      this._r(ctx,x+e.w+24,y+30,16,24,'#cc2200','#880000');
    });
    // Head — square robot head
    this._r(ctx,x+18,y+2,50,24,metal,'#2a2a3a');
    // Eye sensor
    this._circle(ctx,x+43,y+14,9,'#cc0000','#880000');
    this._circle(ctx,x+43,y+14,6,'#ff0000');
    this._circle(ctx,x+43,y+14,3,'#ff8888');
    // Vents
    for(let i=0;i<5;i++) ctx.fillStyle='#2a2a3a', ctx.fillRect(x+24+i*6,y+22,4,4);
    if(e.phase2){
      ctx.fillStyle='rgba(200,60,60,.2)'; ctx.beginPath(); ctx.ellipse(x+43,y+48,52,48,0,0,Math.PI*2); ctx.fill();
      // More smoke when phase 2
      ctx.fillStyle='rgba(80,80,90,.7)'; this._circle(ctx,x+2,y+14,9,'rgba(80,80,90,.7)'); this._circle(ctx,x+84,y+12,11,'rgba(80,80,90,.65)');
    }
    this._drawBossEffects(ctx,e);
  }

  _drawLenin(ctx,e,hurt){
    // Try PNG first
    if(this.drawImg(ctx,'leninBoss',e.x-2,e.y-4,90,92,e.facing<0)){
      if(e.ramTimer>0){
        ctx.strokeStyle='#ff4040'; ctx.lineWidth=4;
        ctx.beginPath(); ctx.moveTo(e.x+45,e.y+12); ctx.lineTo(e.x+45+e.facing*80,e.y+12); ctx.stroke();
      }
      this._drawBossEffects(ctx,e); return;
    }
    const x=e.x,y=e.y;
    ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x+43,y+90,38,7,0,0,Math.PI*2); ctx.fill();
    // Boots
    this._r(ctx,x+16,y+74,20,14,'#111','#000');
    this._r(ctx,x+44,y+74,20,14,'#111','#000');
    // Trousers
    this._r(ctx,x+16,y+48,48,30,'#1a1a2a','#0a0a14');
    // Coat/jacket — dark
    this._r(ctx,x+10,y+20,66,34,hurt?'#ddddff':'#262626','#111');
    // Red armband
    ctx.fillStyle='#cc2200'; ctx.fillRect(x+10,y+34,14,8);
    // Lapels white
    ctx.fillStyle='#eee'; ctx.fillRect(x+26,y+20,12,18);
    ctx.fillStyle='#cc2200'; ctx.fillRect(x+30,y+22,4,24); // red tie
    // Iconic head — bald, goatee
    this._r(ctx,x+20,y+2,46,22,'#d7b08c','#b8835e');
    ctx.fillStyle='#c8a07a'; ctx.beginPath(); ctx.ellipse(x+43,y+8,24,16,0,0,Math.PI*2); ctx.fill();
    // Eyes — squinting
    ctx.fillStyle='#1a0800'; ctx.fillRect(x+28,y+10,7,4); ctx.fillRect(x+51,y+10,7,4);
    // Brow furrowed
    ctx.fillStyle='#8b5a30'; ctx.fillRect(x+26,y+7,10,2); ctx.fillRect(x+50,y+7,10,2);
    // Goatee
    ctx.fillStyle='#8b6a40'; ctx.beginPath(); ctx.ellipse(x+43,y+26,7,6,.2,0,Math.PI*2); ctx.fill();
    // Pointing arm
    this._flip(ctx,e,()=>{
      this._r(ctx,x+e.w,y+28,28,12,'#262626','#111');
      ctx.fillStyle='#d7b08c'; ctx.fillRect(x+e.w+26,y+30,14,8);
    });
    // Ram effect
    if(e.ramTimer>0){
      ctx.strokeStyle='#ff4040'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(x+43,y+12); ctx.lineTo(x+43+e.facing*80,y+12); ctx.stroke();
      ctx.strokeStyle='rgba(255,60,60,.4)'; ctx.lineWidth=8;
      ctx.beginPath(); ctx.moveTo(x+43,y+12); ctx.lineTo(x+43+e.facing*80,y+12); ctx.stroke();
    }
    if(e.phase2){
      ctx.fillStyle='rgba(200,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x+43,y+48,52,48,0,0,Math.PI*2); ctx.fill();
    }
    this._drawBossEffects(ctx,e);
  }

  _drawBossEffects(ctx,e){
    if(e.turboTimer>0){
      ctx.save(); ctx.globalAlpha=.7;
      ctx.strokeStyle='#ff4040'; ctx.lineWidth=3;
      const r=Math.max(e.w,e.h)*.58+Math.sin(Date.now()/80)*4;
      ctx.beginPath(); ctx.arc(e.x+e.w/2,e.y+e.h/2,r,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(255,64,64,.12)'; ctx.fillRect(e.x-10,e.y-10,e.w+20,e.h+20);
      ctx.restore();
    }
  }

  _drawFallback(ctx,e,hurt){
    const x=e.x,y=e.y;
    const body=hurt?'#fff5c9':'#7a7a7a';
    this._r(ctx,x+6,y+16,e.w-12,e.h-16,body,'#333');
    this._r(ctx,x+8,y+2,e.w-16,16,'#c8a07a','#8b6040');
    ctx.fillStyle='#111'; ctx.fillRect(x+12,y+7,4,3); ctx.fillRect(x+22,y+7,4,3);
  }
};
