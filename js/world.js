'use strict';
window.KP = window.KP || {};
KP.World = class World {
  constructor(levelIndex=0){
    this.levelIndex=levelIndex;
    this.levelW=3200; this.worldH=700;
    this.biomes=['Лес','Зима','Пустыня','Болото','Город','Мавзолей'];
    this.bgIds=['forestBg','winterBg','desertBg','swampBg','cityBg','mausoleumBg'];
    this.platforms=[]; this.walls=[]; this.doors=[]; this.chests=[]; this.shops=[];
    this.acid=[]; this.rushTriggers=[]; this.portal=null; this.enemySpawns=[];
    this.tutorialHints=[];
    this.crates=[];
    this.build();
  }
  get worldW(){ return this.levelW; }
  biomeName(){ return this.biomes[this.levelIndex]||'???'; }
  addPlatform(x,y,w,h,type='ground'){ const p={x,y,w,h,type}; this.platforms.push(p); return p; }
  findDropPlatform(o){
    const footY=o.y+o.h;
    return this.platforms.find(p=>
      p.type==='sky' &&
      o.x+o.w>p.x+4 &&
      o.x<p.x+p.w-4 &&
      Math.abs(footY-p.y)<=18
    )||null;
  }

  build(){
    const i=this.levelIndex;
    const tutorial=i===0;
    if(tutorial) this.levelW=2240;
    const ground=this.addPlatform(0,485,this.levelW,80,'ground');

    const sky=[];
    for(let n=0;n<(tutorial?7:12);n++){
      const x=170+n*230, y=390-(n%3)*38;
      sky.push(this.addPlatform(x,y,175,18,'sky'));
      if(n%3===1) sky.push(this.addPlatform(x+95,y-76,155,18,'sky'));
    }
    const high1=this.addPlatform(700,285,240,18,'sky');
    const high2=this.addPlatform(tutorial?1350:1550,292,255,18,'sky');
    const high3=this.addPlatform(tutorial?1860:2380,300,240,18,'sky');

    this.shops.push({x:185,y:415,w:70,h:70,name:`Снабженец: ${this.biomeName()}`});

    if(tutorial){
      this.chests.push({x:730,y:444,w:38,h:26,open:false,loot:'heal'});
      this.chests.push({x:1260,y:444,w:38,h:26,open:false,loot:'gasMask'});
      this.chests.push({x:1710,y:444,w:38,h:26,open:false,loot:'money'});
    } else {
      this.chests.push({x:760,  y:444,w:38,h:26,open:false,loot:i%3===0?'heal':(i%2===0?'money':'ammo')});
      this.chests.push({x:1320, y:444,w:38,h:26,open:false,loot:['sabre','smg','gasSprayer','shotgun','ammo','gasSprayer'][i]||'money'});
      this.chests.push({x:1980, y:444,w:38,h:26,open:false,loot:['money','heal','sabre','gasSprayer','shotgun','heal'][i]||'money'});
    }

    // Crates — destructible, spread across level
    const crateXs=tutorial?[560,980,1460]:[540,880,1180,1520,1840,2200,2480];
    for(const cx of crateXs){
      this.crates.push(new KP.Crate(cx,449));
    }

    if(!tutorial){
      // 1 раш на биом; на последнем (Мавзолей, i===5) — 2.
      this.rushTriggers.push({x:1500,done:false,floorY:485,wave:0});
      if(i===5) this.rushTriggers.push({x:2520,done:false,floorY:485,wave:1});
    } else {
      this.tutorialHints.push({x:90,text:'Иди вправо и прыгай на платформы. Первый биом короткий и учебный.',done:false});
      this.tutorialHints.push({x:520,text:'Стреляй мышью. Q меняет оружие, цифры 1-6 теперь для предметов.',done:false});
      this.tutorialHints.push({x:1160,text:'Аптечки уходят в инвентарь. Используй их цифрой 1.',done:false});
      this.tutorialHints.push({x:1620,text:'В конце будет быстрый враг. Держи темп и реагируй сразу.',done:false});
    }
    this.portal={x:tutorial?2040:2960,y:395,w:70,h:90,active:true};

    this.buildEnemySpawns([ground,high1,high2,high3,...sky]);
  }

  buildEnemySpawns(platforms){
    if(this.levelIndex===0){
      const ground=platforms.find(p=>p.type==='ground');
      if(ground){
        [
          {x:760,kind:'zombie'},
          {x:1120,kind:'pistol'},
          {x:1490,kind:'zombie'},
          {x:1860,kind:'runner'}
        ].forEach(sp=>{
          this.enemySpawns.push({x:sp.x,floorY:ground.y,min:Math.max(620,sp.x-120),max:Math.min(1980,sp.x+120),kind:sp.kind,platformType:'ground'});
        });
      }
      return;
    }
    const normalByLevel=[
      ['zombie','runner','pistol'],
      ['zombie','runner','pistol','gasman'],
      ['runner','rifleman','sabreur','gasman','horse'],
      ['runner','gunner','gasman','sabreur','kamikaze'],
      ['rifleman','gunner','gasman','maxim','shielder','miniboss'],
      ['gunner','rifleman','maxim','horse','shielder','sniper','kamikaze','sabreur']
    ][this.levelIndex]||['zombie'];

    const add=(p,xFrac,kind,radius=125)=>{
      const x=p.x+p.w*xFrac;
      if(x<620||x>2580) return;
      const min=KP.Utils.clamp(x-radius,p.x+8,p.x+p.w-95);
      const max=KP.Utils.clamp(x+radius,p.x+110,p.x+p.w-8);
      if(max-min<100) return;
      this.enemySpawns.push({x,floorY:p.y,min,max,kind,platformType:p.type});
    };

    const ground=platforms.find(p=>p.type==='ground');
    if(ground){
      const xs=[720,1020,1320,1620,1940,2260,2520];
      xs.forEach((x,idx)=>{
        const kind=normalByLevel[idx%normalByLevel.length];
        const min=Math.max(620,x-120), max=Math.min(2650,x+120);
        this.enemySpawns.push({x,floorY:ground.y,min,max,kind,platformType:ground.type});
      });
    }

    platforms.forEach((p,idx)=>{
      if(p.type!=='sky'||p.x<620||p.x>2550||p.w<140) return;
      if(idx%2===0) add(p,.5,normalByLevel[(idx+1)%normalByLevel.length],Math.min(100,p.w*.42));
    });

    const bossKind=['mushroomBoss','treeBoss','sandBoss','swampBoss','factoryBoss','lenin'][this.levelIndex];
    if(bossKind) this.enemySpawns.push({x:2700,floorY:485,min:2520,max:2860,kind:bossKind,platformType:'ground'});
  }

  solid(){ return [...this.platforms]; }

  collide(o){
    const prevBottom=o.y+o.h;
    o.grounded=false;
    o.floorContact=null;
    o.x+=o.vx;
    const hardSolids=this.platforms.filter(p=>p.type==='ground');
    for(const p of hardSolids) if(KP.Utils.rects(o,p)){
      if(o.vx>0) o.x=p.x-o.w;
      else if(o.vx<0) o.x=p.x+p.w;
      o.vx=0;
      if(o instanceof KP.Enemy) o.facing*=-1;
    }
    o.y+=o.vy;
    for(const p of this.platforms) if(KP.Utils.rects(o,p)){
      const oneWay=p.type==='sky';
      const droppingCurrent=o instanceof KP.Player&&o.dropTimer>0&&(o.dropPlatform===p||oneWay);
      if(droppingCurrent) continue;
      if(oneWay){
        if(o.vy>=0&&prevBottom<=p.y+12){ o.y=p.y-o.h; o.grounded=true; o.vy=0; o.floorContact=p; }
        continue;
      }
      if(o.vy>0){ o.y=p.y-o.h; o.grounded=true; o.floorContact=p; }
      else if(o.vy<0) o.y=p.y+p.h;
      o.vy=0;
    }
    if(o instanceof KP.Player&&o.dropPlatform&&!KP.Utils.rects(o,o.dropPlatform)) o.dropPlatform=null;
    o.x=KP.Utils.clamp(o.x,0,this.worldW-o.w);
    o.y=KP.Utils.clamp(o.y,0,this.worldH-o.h);
    if(o instanceof KP.Enemy&&o.floorY){
      const targetY=o.floorY-o.h;
      if(Math.abs(o.y-targetY)<12&&o.vy>=0){ o.y=targetY; o.vy=0; o.grounded=true; }
      if(o.y>o.floorY-o.h+16||o.y<o.floorY-o.h-90){ o.y=o.floorY-o.h; o.vy=0; o.grounded=true; }
      o.x=KP.Utils.clamp(o.x,o.patrolMin,Math.max(o.patrolMin,o.patrolMax-o.w));
    }
  }

  groundTileId(){
    return ['forestTile','snowTile','desertTile','swampTile','factoryPlatform','moldPlatform'][this.levelIndex]||'forestTile';
  }
  skyTileId(){
    // Sky platforms use a lighter/different tile for visual distinction
    return ['snowTile','desertTile','forestTile','moldPlatform','snowTile','desertTile'][this.levelIndex]||'snowTile';
  }

  draw(ctx,cameraX,cameraY,W,H,assets){
    this.drawBg(ctx,cameraX,cameraY,W,H,assets);

    // Platforms — neutral stone/dirt, subtle biome tint on top strip only
    for(const p of this.platforms) if(this.visible(p,cameraX,cameraY,W,H)){
      const isSky=p.type==='sky';
      // Stone body — dark neutral, same for all biomes
      ctx.fillStyle=isSky?'#30303a':'#252530';
      ctx.fillRect(p.x,p.y,p.w,p.h);
      // Very subtle tile texture overlay (low opacity so it doesn't dominate)
      const imgId=isSky?this.skyTileId():this.groundTileId();
      if(assets&&assets.ready(imgId)){
        const img=assets.images[imgId];
        const pat=ctx.createPattern?ctx.createPattern(img,'repeat'):null;
        if(pat){ ctx.globalAlpha=0.14; ctx.fillStyle=pat; ctx.fillRect(p.x,p.y,p.w,p.h); ctx.globalAlpha=1; }
      }
      // Thin biome-tinted surface strip (top 5px)
      const surfColor=['#3a5228','#a0b8c2','#8a6038','#2a5038','#404050','#5a2020'][this.levelIndex]||'#404040';
      ctx.fillStyle=surfColor; ctx.fillRect(p.x,p.y,p.w,5);
      // Top edge glint
      ctx.fillStyle='rgba(255,255,255,.16)'; ctx.fillRect(p.x,p.y,p.w,2);
      // Stone texture: horizontal seam lines
      ctx.fillStyle='rgba(0,0,0,.18)';
      if(p.h>10) ctx.fillRect(p.x,p.y+8,p.w,1);
      if(p.h>22) ctx.fillRect(p.x,p.y+20,p.w,1);
      // Vertical brick joints (every 32px)
      ctx.fillStyle='rgba(0,0,0,.12)';
      for(let bx=p.x+16;bx<p.x+p.w-4;bx+=32) ctx.fillRect(bx,p.y+5,1,p.h-5);
      // Bottom underside — darker "hanging" face for sky platforms
      if(isSky){
        ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillRect(p.x,p.y+p.h-4,p.w,4);
        ctx.fillStyle='rgba(0,0,0,.22)'; ctx.fillRect(p.x,p.y+p.h,p.w,6);
      } else {
        // Ground: dark side edges
        ctx.fillStyle='rgba(0,0,0,.30)'; ctx.fillRect(p.x,p.y+5,4,p.h-5); ctx.fillRect(p.x+p.w-4,p.y+5,4,p.h-5);
      }
    }

    // Crates
    for(const c of this.crates) if(c.alive&&this.visible(c,cameraX,cameraY,W,H)) c.draw(ctx);

    // Chests
    for(const c of this.chests) if(this.visible(c,cameraX,cameraY,W,H)){
      if(assets&&assets.ready('chestImg')){
        assets.drawImg(ctx,'chestImg',c.x-4,c.y-10,c.w+8,c.h+12,false);
        if(c.open){ ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillRect(c.x-4,c.y-10,c.w+8,c.h+12); }
        continue;
      }
      ctx.fillStyle=c.open?'#3a2010':'#6b3e10';
      ctx.fillRect(c.x,c.y,c.w,c.h);
      ctx.strokeStyle=c.open?'#5a3018':'#c89042';
      ctx.lineWidth=2; ctx.strokeRect(c.x,c.y,c.w,c.h);
      if(!c.open){
        ctx.fillStyle='#c89042'; ctx.fillRect(c.x+10,c.y+8,c.w-20,5);
        ctx.fillStyle='#ffd21c'; ctx.beginPath(); ctx.arc(c.x+c.w/2,c.y+c.h/2-2,4,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(c.x+2,c.y+6,c.w-4,c.h-8);
      }
    }

    // Shops — спрайт, иначе процедурная отрисовка
    for(const s of this.shops) if(this.visible(s,cameraX,cameraY,W,H)){
      if(assets&&assets.ready('shopImg')) assets.drawImg(ctx,'shopImg',s.x-12,s.y-30,s.w+24,s.h+30,false);
      else if(assets) assets.drawShop(ctx,s.x,s.y,s.w,s.h);
    }

    // Portal
    if(this.portal){
      const p=this.portal;
      if(assets&&assets.ready('portalExit')) assets.drawImg(ctx,'portalExit',p.x-16,p.y-10,104,110,false);
      else {
        ctx.fillStyle=this.levelIndex>=this.biomes.length-1?'rgba(180,0,0,.45)':'rgba(255,210,28,.32)';
        ctx.fillRect(p.x,p.y,p.w,p.h);
        ctx.strokeStyle='#ffd21c'; ctx.lineWidth=3; ctx.strokeRect(p.x,p.y,p.w,p.h);
      }
      ctx.fillStyle='#ffd21c'; ctx.font='bold 13px Arial';
      ctx.fillText(this.levelIndex>=this.biomes.length-1?'ФИНАЛ':'ВЫХОД',p.x+8,p.y-8);
    }
  }

  _groundColor(){
    return ['#2d4a22','#4a5f6a','#7a5a28','#2a4a3a','#3a3a42','#5a1818'][this.levelIndex]||'#333';
  }
  _skyColor(){
    // Lighter, contrasting variant of each biome
    return ['#3a6a2a','#5a7a8a','#9a7a42','#3a6a52','#4a4a5e','#7a2222'][this.levelIndex]||'#4d4a65';
  }

  drawBg(ctx,cameraX,cameraY,W,H,assets){
    const bgId=this.bgIds[this.levelIndex];
    if(assets&&assets.ready(bgId)){
      const img=assets.images[bgId];
      const scale=Math.max(W/img.width,H/img.height);
      const iw=img.width*scale, ih=img.height*scale;
      const px=cameraX-(cameraX*.18%(iw-W+1));
      ctx.globalAlpha=.78;
      ctx.drawImage(img,px,cameraY,iw,ih);
      if(px+iw<cameraX+W) ctx.drawImage(img,px+iw,cameraY,iw,ih);
      ctx.globalAlpha=1;
      ctx.fillStyle='rgba(0,0,0,.38)'; ctx.fillRect(cameraX,cameraY,W,H);
    } else {
      const palettes=[['#18301f','#0b130d'],['#26333b','#101820'],['#3a2b18','#17100b'],['#12302b','#071512'],['#241f24','#0d0d10'],['#3b1111','#090909']];
      const p=palettes[this.levelIndex]||palettes[0];
      const g=ctx.createLinearGradient(0,cameraY,0,cameraY+H);
      g.addColorStop(0,p[0]); g.addColorStop(1,p[1]);
      ctx.fillStyle=g; ctx.fillRect(cameraX,cameraY,W,H);
    }

    // Decorative silhouettes per biome
    for(let i=0;i<18;i++){
      const x=i*160+40;
      if(this.levelIndex===0){
        ctx.fillStyle='rgba(20,42,22,.75)'; ctx.fillRect(x,360,24,125);
        ctx.fillStyle='rgba(36,82,42,.7)'; ctx.beginPath(); ctx.arc(x+12,340,42,0,Math.PI*2); ctx.fill();
      } else if(this.levelIndex===1){
        ctx.fillStyle='rgba(213,232,242,.75)'; ctx.fillRect(x,340,80,145);
        ctx.fillStyle='rgba(255,255,255,.8)'; ctx.fillRect(x,340,80,10);
      } else if(this.levelIndex===2){
        ctx.fillStyle='rgba(106,75,37,.75)'; ctx.fillRect(x+30,390,18,95); ctx.fillRect(x+8,430,62,18);
      } else if(this.levelIndex===3){
        ctx.fillStyle='rgba(36,68,61,.75)'; ctx.fillRect(x,390,95,95);
        ctx.fillStyle='rgba(80,180,120,.16)'; ctx.fillRect(x,330,100,155);
      } else if(this.levelIndex===4){
        ctx.fillStyle='rgba(31,31,36,.75)'; ctx.fillRect(x,330,90,155);
        ctx.fillStyle='rgba(255,210,28,.12)'; ctx.fillRect(x+18,360,18,10); ctx.fillRect(x+52,390,18,10);
      } else {
        ctx.fillStyle='rgba(90,18,18,.75)'; ctx.fillRect(x,360,90,125);
        ctx.fillStyle='rgba(140,29,29,.75)'; ctx.fillRect(x-8,340,106,20);
      }
    }
    // Biome name watermark
    ctx.fillStyle='rgba(255,210,28,.18)'; ctx.font='bold 36px Arial';
    ctx.fillText(this.biomeName().toUpperCase(),cameraX+34,cameraY+62);
  }

  visible(o,cx,cy,W,H){ return o.x+o.w>cx-80&&o.x<cx+W+80&&o.y+o.h>cy-80&&o.y<cy+H+80; }
};
