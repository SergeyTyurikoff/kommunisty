'use strict';
window.KP = window.KP || {};
KP.UI = class UI {
  constructor(){
    this.inventoryOpen=false; this.shopOpen=null;
    this.intro=true; this.ending=false;
    this.menuItems=['controls','start'];
    this.menuIndex=1; this.controlsOpen=false;
  }

  draw(game){
    const ctx=game.ctx;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    this.hud(ctx,game);
    if(this.shopOpen)      this.shop(ctx,game);
    if(this.inventoryOpen) this.inventory(ctx,game);
    if(this.intro)         this.mainMenu(ctx,game);
    if(this.ending)        this.endScreen(ctx);
    if(game.player.dead)   this.dead(ctx,game);
    if(game.levelTransition>0) this.transition(ctx,game);
    if(game.paused&&!this.intro&&!this.ending&&!game.player.dead) this.pauseScreen(ctx,game);
    ctx.restore();
  }

  hud(ctx,game){
    const p=game.player;
    const U=KP.Utils;
    const w=KP.Balance.weapons[p.weapon];
    const at=w.ammoType;
    const x=688, y=12, wid=328, ht=166;

    // Panel background
    ctx.fillStyle='rgba(8,6,4,.78)';
    ctx.fillRect(x,y,wid,ht);
    ctx.strokeStyle='rgba(180,140,20,.7)';
    ctx.lineWidth=1.5; ctx.strokeRect(x,y,wid,ht);

    // --- ROW 1: weapon + ammo ---
    if(game.assets&&w.sprite) game.assets.drawImg(ctx,w.sprite,x+6,y+8,52,22,false);
    ctx.fillStyle='#fff'; ctx.font='bold 16px Arial';
    ctx.fillText(w.name,x+64,y+22);
    const ammoText=at?`${p.ammoBag[at]}/${p.maxAmmoBag[at]} ${KP.Balance.ammoTypes[at].short}`:'∞';
    ctx.fillStyle='#bbb'; ctx.font='13px Arial'; ctx.fillText(ammoText,x+64,y+40);

    // --- ROW 2: TIME bar ---
    ctx.fillStyle='#65e8ff'; ctx.font='bold 12px Arial'; ctx.fillText('ВРЕМЯ',x+6,y+58);
    U.drawBar(ctx,x+52,y+46,268,16,p.time/p.maxTime,'#65e8ff');
    ctx.fillStyle='rgba(0,0,0,.65)'; ctx.font='bold 11px Arial';
    ctx.fillText(`${Math.round(p.time)}/${p.maxTime}`,x+170,y+58);

    // --- ROW 3: Money | Level | Kills ---
    // Money icon + value
    if(game.assets) game.assets.drawImg(ctx,'moneyIcon',x+6,y+68,20,20,false);
    ctx.fillStyle='#ffd21c'; ctx.font='bold 14px Arial';
    ctx.fillText(`${p.money}`,x+30,y+83);
    // Level badge
    ctx.fillStyle='#cc2200'; ctx.fillRect(x+84,y+67,56,20);
    ctx.fillStyle='#ffd21c'; ctx.font='bold 12px Arial';
    ctx.fillText(`ЛВЛ ${p.level}`,x+88,y+81);
    // Kills
    ctx.fillStyle='#aaa'; ctx.font='12px Arial';
    ctx.fillText(`☆ ${game.kills}`,x+152,y+81);

    // --- ROW 4: XP bar ---
    ctx.fillStyle='#9df542'; ctx.font='bold 11px Arial'; ctx.fillText('XP',x+6,y+100);
    U.drawBar(ctx,x+24,y+90,180,11,p.xp/p.xpNext,'#9df542');
    ctx.fillStyle='#9df542'; ctx.font='11px Arial'; ctx.fillText(`${p.xp}/${p.xpNext}`,x+210,y+100);

    // Turbo status
    ctx.fillStyle=p.turbo>0?'#ff8a1c':p.weak>0?'#888':p.abilities.turbo?'#ff6600':'#555';
    ctx.font='bold 11px Arial';
    ctx.fillText(p.turbo>0?'ТУРБО ON':p.weak>0?'слабость':p.abilities.turbo?'турбо ГТВ':'турбо —',x+210,y+81);

    // --- ROW 5: Minimap ---
    const mx=x+6, my=y+108, mw=314, mh=18;
    if(game.assets&&game.assets.ready('minimap')){
      ctx.globalAlpha=.22; game.assets.drawImg(ctx,'minimap',mx,my-5,mw,30,false); ctx.globalAlpha=1;
    }
    ctx.fillStyle='#0a0a0a'; ctx.fillRect(mx,my,mw,mh);
    ctx.strokeStyle='#ffd21c'; ctx.lineWidth=1; ctx.strokeRect(mx,my,mw,mh);
    const progress=KP.Utils.clamp(game.player.x/game.world.worldW,0,1);
    ctx.fillStyle='rgba(180,0,0,.45)'; ctx.fillRect(mx,my,mw*progress,mh);
    ctx.fillStyle='#ff4040'; ctx.beginPath(); ctx.arc(mx+mw*progress,my+mh/2,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffd21c'; ctx.font='bold 11px Arial';
    ctx.fillText(`${game.world.biomeName()} ${game.levelIndex+1}/6`,mx,my-4);

    // --- ROW 6: abilities + version ---
    const ability=(KP.Balance.abilityUnlocks||[]).filter(a=>p.abilities[a.id]).map(a=>a.name).slice(-2).join(' · ');
    ctx.fillStyle='#888'; ctx.font='11px Arial';
    ctx.fillText(ability||'способности открываются',x+6,y+142);
    ctx.fillStyle='rgba(255,210,28,.6)'; ctx.font='bold 10px Arial';
    ctx.fillText(KP.VERSION||'V 1.1.0',x+252,y+142);

    // Dodge cooldown pip
    const dc=KP.Balance.player.dodge;
    if(p.dodgeCd>0){
      ctx.fillStyle='rgba(100,220,255,.35)';
      ctx.fillRect(x+6,y+148,Math.round(314*(1-p.dodgeCd/dc.cooldown)),6);
      ctx.fillStyle='rgba(0,0,0,.5)'; ctx.font='10px Arial';
      ctx.fillText('ПЕРЕКАТ',x+6,y+162);
    } else {
      ctx.fillStyle='rgba(100,220,255,.8)'; ctx.font='bold 10px Arial';
      ctx.fillText('ПЕРЕКАТ ГТВ',x+6,y+162);
    }

    // --- COMBO display ---
    if(game.comboCount>=4){
      const mulStr=`КОМБО ×${game.comboMul.toFixed(1)}`;
      const pulse=0.85+Math.sin(Date.now()/80)*0.15;
      ctx.save();
      ctx.globalAlpha=pulse;
      ctx.fillStyle=game.comboMul>=3?'#ff4400':game.comboMul>=2?'#ff8800':'#ffd21c';
      ctx.font=`bold ${game.comboMul>=3?22:18}px Arial`;
      ctx.strokeStyle='#000'; ctx.lineWidth=3;
      ctx.strokeText(mulStr,26,80);
      ctx.fillText(mulStr,26,80);
      // Combo pips
      const pips=Math.min(game.comboCount,14);
      for(let i=0;i<pips;i++){
        ctx.fillStyle=i<4?'#ffd21c':i<8?'#ff8800':'#ff4400';
        ctx.fillRect(26+i*14,84,11,5);
      }
      ctx.restore();
    }

    // --- BOSS health bar (top-center) ---
    const boss=game.enemies.find(e=>e.alive&&KP.Balance.enemies[e.kind]&&KP.Balance.enemies[e.kind].role==='boss');
    if(boss){
      const bx=250, by=10, bw=524, bh=22;
      ctx.fillStyle='rgba(0,0,0,.85)'; ctx.fillRect(bx-4,by-4,bw+8,bh+24);
      ctx.strokeStyle=boss.phase2?'#ff4040':'#ffd21c'; ctx.lineWidth=2; ctx.strokeRect(bx-4,by-4,bw+8,bh+24);
      ctx.fillStyle=boss.phase2?'#cc0000':'#aa3300';
      ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=boss.phase2?'#ff2200':'#ff5500';
      ctx.fillRect(bx,by,bw*KP.Utils.clamp(boss.hp/boss.maxHp,0,1),bh);
      // Shine
      ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(bx,by,bw*KP.Utils.clamp(boss.hp/boss.maxHp,0,1),bh/3);
      ctx.fillStyle=boss.phase2?'#ff8888':'#ffddaa'; ctx.font='bold 12px Arial'; ctx.textAlign='center';
      const bossName={mushroomBoss:'ГРИБ-БОСС',treeBoss:'ДЕРЕВО-БОСС',sandBoss:'ПЕСОЧНЫЙ БОСС',swampBoss:'БОЛОТНЫЙ БОСС',factoryBoss:'ЗАВОД-БОСС',lenin:'ЛЕНИН'}[boss.kind]||boss.kind.toUpperCase();
      ctx.fillText(`${bossName}  ${Math.max(0,Math.round(boss.hp))}/${boss.maxHp}${boss.phase2?' ⚡ ФАЗА 2':''}`,bx+bw/2,by+16);
      ctx.textAlign='left';
    }

    // --- Toast ---
    if(game.toastTimer>0){
      const alpha=Math.min(1,game.toastTimer/30);
      ctx.fillStyle=`rgba(0,0,0,${0.82*alpha})`;
      ctx.fillRect(16,514,860,36);
      ctx.strokeStyle=`rgba(180,140,20,${0.6*alpha})`; ctx.lineWidth=1;
      ctx.strokeRect(16,514,860,36);
      ctx.globalAlpha=alpha;
      ctx.fillStyle='#ffd21c'; ctx.font='14px Arial';
      // Truncate toast if too long
      const txt=game.toastText.length>100?game.toastText.slice(0,97)+'…':game.toastText;
      ctx.fillText(txt,34,537);
      ctx.globalAlpha=1;
    }

    // Time-stop overlay text
    if(game.timeStopFrames>0){
      ctx.fillStyle='rgba(101,232,255,.92)'; ctx.font='bold 18px Arial';
      ctx.fillText(`ВРЕМЯ СТОИТ: ${Math.ceil(game.timeStopFrames/60)}с`,26,34);
    }
  }

  shop(ctx,game){
    ctx.fillStyle='rgba(0,0,0,.90)'; ctx.fillRect(190,60,644,444);
    ctx.strokeStyle='#b98945'; ctx.lineWidth=3; ctx.strokeRect(190,60,644,444);
    ctx.fillStyle='#ffd21c'; ctx.font='bold 26px Arial';
    ctx.fillText('МАГАЗИН СНАБЖЕНЦА',230,108);
    ctx.fillStyle='#eee'; ctx.font='17px Arial';
    ctx.fillText(`Деньги: ${game.player.money}  ·  Время: ${Math.round(game.player.time)}/${game.player.maxTime}`,230,142);

    const items=[
      ['1','time',   `Купить время +${KP.Balance.shop.timeAmount}`,KP.Balance.shop.timePrice,'жизненно важный ресурс'],
      ['2','ammo',   'Боеприпасы к текущему оружию',(()=>{ const w=KP.Balance.weapons[game.player.weapon]; const at=w.ammoType||'rifle'; return KP.Balance.ammoTypes[at].price; })(),'нужный тип патронов'],
      ['3','smg',    'Пулемёт',                     KP.Balance.weapons.smg.price,           KP.Balance.weapons.smg.desc],
      ['4','flamethrower','Огнемёт',                KP.Balance.weapons.flamethrower.price,  KP.Balance.weapons.flamethrower.desc],
      ['5','sabre',  'Шашка',                       KP.Balance.weapons.sabre.price,         KP.Balance.weapons.sabre.desc],
      ['6','shotgun','Обрез',                        KP.Balance.weapons.shotgun.price,       KP.Balance.weapons.shotgun.desc]
    ];
    let yy=186;
    for(const it of items){
      const owned=it[1]==='time'||it[1]==='ammo'||game.player.inventory.includes(it[1]);
      ctx.fillStyle=owned?'rgba(30,22,10,.9)':'rgba(18,12,6,.9)';
      ctx.fillRect(230,yy-24,504,38);
      ctx.strokeStyle=owned?'rgba(180,140,20,.4)':'rgba(80,60,20,.3)';
      ctx.lineWidth=1; ctx.strokeRect(230,yy-24,504,38);
      ctx.fillStyle=owned?'#ddd':'#aaa';
      ctx.font='15px Arial';
      ctx.fillText(`${it[0]}  ${it[2]}  —  ${it[3]} монет`,248,yy-4);
      ctx.fillStyle='#888'; ctx.font='12px Arial'; ctx.fillText(it[4],480,yy-4);
      ctx.font='15px Arial'; yy+=52;
    }
    ctx.fillStyle='#888'; ctx.font='14px Arial';
    ctx.fillText('E / Esc — закрыть.',230,462);
  }

  inventory(ctx,game){
    ctx.fillStyle='rgba(10,7,4,.92)'; ctx.fillRect(680,80,326,400);
    ctx.strokeStyle='#b98945'; ctx.lineWidth=2; ctx.strokeRect(680,80,326,400);
    ctx.fillStyle='#ffd21c'; ctx.font='bold 22px Arial'; ctx.fillText('ИНВЕНТАРЬ',714,120);
    ctx.fillStyle='#888'; ctx.font='12px Arial'; ctx.fillText('I — закрыть',850,120);
    let y=160;
    for(const id of game.player.inventory){
      const w=KP.Balance.weapons[id];
      const active=id===game.player.weapon;
      if(active){ ctx.fillStyle='rgba(180,0,0,.35)'; ctx.fillRect(700,y-18,290,34); }
      ctx.fillStyle=active?'#ffd21c':'#eee'; ctx.font='bold 16px Arial';
      ctx.fillText((active?'▶ ':' • ')+w.name,714,y);
      ctx.fillStyle='#888'; ctx.font='12px Arial'; ctx.fillText(w.desc,730,y+16);
      y+=46;
    }
    ctx.fillStyle='#666'; ctx.font='12px Arial'; ctx.fillText('Q — следующее  |  1-6 — прямой выбор',706,448);
  }

  mainMenu(ctx,game){
    if(game.assets&&game.assets.ready('menuPoster')) game.assets.drawImg(ctx,'menuPoster',0,0,1024,576,false);
    else { ctx.fillStyle='#150a08'; ctx.fillRect(0,0,1024,576); }

    const topFade=ctx.createLinearGradient(0,0,0,260);
    topFade.addColorStop(0,'rgba(0,0,0,.7)'); topFade.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=topFade; ctx.fillRect(0,0,1024,260);
    const sideFade=ctx.createLinearGradient(610,0,1024,0);
    sideFade.addColorStop(0,'rgba(0,0,0,0)'); sideFade.addColorStop(.45,'rgba(0,0,0,.32)'); sideFade.addColorStop(1,'rgba(0,0,0,.82)');
    ctx.fillStyle=sideFade; ctx.fillRect(560,0,464,576);
    const botFade=ctx.createLinearGradient(0,360,0,576);
    botFade.addColorStop(0,'rgba(0,0,0,0)'); botFade.addColorStop(1,'rgba(0,0,0,.78)');
    ctx.fillStyle=botFade; ctx.fillRect(0,360,1024,216);

    ctx.fillStyle='#ffd21c'; ctx.font='bold 18px Arial'; ctx.fillText(KP.VERSION||'V 1.1.0',46,48);
    ctx.font='bold 44px Arial'; ctx.fillText('КОММУНИСТЫ',42,98); ctx.fillText('ПРОТИВ... ПЛЕСЕНИ!',42,144);
    ctx.fillStyle='#f2dfc7'; ctx.font='18px Arial'; ctx.fillText('Главное меню операции',46,178);

    const menuX=730, menuY=396, boxW=256, boxH=58, gap=18;
    for(let i=0;i<this.menuItems.length;i++){
      const y=menuY+i*(boxH+gap);
      const selected=i===this.menuIndex;
      ctx.fillStyle=selected?'rgba(188,22,14,.90)':'rgba(10,10,10,.75)';
      ctx.fillRect(menuX,y,boxW,boxH);
      ctx.strokeStyle=selected?'rgba(255,210,28,.95)':'rgba(255,255,255,.18)';
      ctx.lineWidth=selected?3:1; ctx.strokeRect(menuX,y,boxW,boxH);
      ctx.fillStyle=selected?'#ffd21c':'#f4e5cf';
      ctx.font=selected?'bold 24px Arial':'bold 22px Arial';
      ctx.fillText(this.menuItems[i]==='start'?'НАЧАТЬ ИГРУ':'УПРАВЛЕНИЕ',menuX+18,y+37);
    }
    ctx.fillStyle='#f2dfc7'; ctx.font='14px Arial';
    ctx.fillText('↑/↓ или W/S — выбор',732,548);
    ctx.fillText('Enter / Space / ЛКМ — подтвердить',732,568);

    if(this.controlsOpen){
      ctx.fillStyle='rgba(7,7,7,.92)'; ctx.fillRect(48,330,474,206);
      ctx.strokeStyle='rgba(255,210,28,.58)'; ctx.lineWidth=2; ctx.strokeRect(48,330,474,206);
      ctx.fillStyle='#ffd21c'; ctx.font='bold 22px Arial'; ctx.fillText('УПРАВЛЕНИЕ',74,366);
      ctx.fillStyle='#f2dfc7'; ctx.font='15px Arial';
      const lines=[
        'A/D или Ф/В — ходьба | W/↑ — прыжок',
        'S/↓ — спуск через платформу',
        'Z/Я — ПЕРЕКАТ (неуязвимость)',
        'ЛКМ/J/О — атака | Q — смена оружия | 1-6 — слот',
        'E — взаимодействие / выкачивание времени',
        'Shift — турбо | F — стоп-время | Esc — пауза | R — рестарт'
      ];
      lines.forEach((line,i)=>ctx.fillText(line,74,400+i*26));
      ctx.fillStyle='#9cc8ff'; ctx.font='13px Arial'; ctx.fillText('Esc или повторный выбор — закрыть.',74,522);
    }
  }

  endScreen(ctx){
    ctx.fillStyle='rgba(0,0,0,.86)'; ctx.fillRect(0,0,1024,576);
    ctx.textAlign='center';
    ctx.fillStyle='#cc0000'; ctx.font='bold 48px Arial'; ctx.fillText('ЛЕНИН ПОВЕРЖЕН',512,180);
    ctx.fillStyle='#ffd21c'; ctx.font='bold 26px Arial'; ctx.fillText('РЕВОЛЮЦИЯ ЗАВЕРШЕНА',512,232);
    ctx.fillStyle='#eee'; ctx.font='20px Arial';
    ctx.fillText('Феликс выкачал из эпохи лишнюю плесень и вернул времени право течь вперёд.',512,290);
    ctx.fillStyle='#aaa'; ctx.font='18px Arial'; ctx.fillText('R — начать заново',512,360);
    ctx.textAlign='left';
  }

  dead(ctx,game){
    ctx.fillStyle='rgba(0,0,0,.82)'; ctx.fillRect(0,0,1024,576);
    ctx.textAlign='center';
    ctx.fillStyle='#cc0000'; ctx.font='bold 46px Arial'; ctx.fillText('ВРЕМЯ ФЕЛИКСА ИСТЕКЛО',512,148);
    if(game&&game.deathStats){
      const s=game.deathStats;
      ctx.fillStyle='rgba(30,10,5,.75)'; ctx.fillRect(280,180,464,180);
      ctx.strokeStyle='#8b0000'; ctx.lineWidth=2; ctx.strokeRect(280,180,464,180);
      ctx.fillStyle='#ffd21c'; ctx.font='bold 22px Arial'; ctx.fillText('ИТОГ ОПЕРАЦИИ',512,212);
      ctx.fillStyle='#ddd'; ctx.font='20px Arial';
      ctx.fillText(`Биом: ${s.biome}  (${s.biomeIndex+1} из 6)`,512,248);
      ctx.fillText(`Уровень: ${s.level}  |  Уничтожено: ${s.kills}`,512,280);
      ctx.fillStyle=s.maxCombo>=3?'#ff8800':s.maxCombo>=2?'#ffd21c':'#aaa';
      ctx.font='18px Arial';
      ctx.fillText(`Максимальное комбо: ×${s.maxCombo.toFixed(1)}`,512,316);
    }
    ctx.fillStyle='#888'; ctx.font='18px Arial';
    ctx.fillText('R — рестарт. Плесень пишет отчёт.',512,394);
    ctx.textAlign='left';
  }

  pauseScreen(ctx,game){
    ctx.fillStyle='rgba(0,0,0,.76)'; ctx.fillRect(0,0,1024,576);
    ctx.textAlign='center';
    const pulse=0.92+Math.sin(Date.now()/400)*0.08;
    ctx.fillStyle=`rgba(255,210,28,${pulse})`; ctx.font='bold 54px Arial'; ctx.fillText('— ПАУЗА —',512,190);
    ctx.fillStyle='rgba(20,10,5,.8)'; ctx.fillRect(312,218,400,148);
    ctx.strokeStyle='rgba(180,140,20,.6)'; ctx.lineWidth=1.5; ctx.strokeRect(312,218,400,148);
    ctx.fillStyle='#ddd'; ctx.font='20px Arial';
    ctx.fillText(`${game.world.biomeName()}  ${game.levelIndex+1}/6`,512,252);
    ctx.fillText(`Уровень ${game.player.level}  |  Убито: ${game.kills}`,512,284);
    ctx.fillText(`Время: ${Math.round(game.player.time)} / ${game.player.maxTime}`,512,316);
    ctx.fillStyle='#aaa'; ctx.font='16px Arial';
    ctx.fillText('Esc — продолжить  |  R — рестарт',512,346);
    ctx.textAlign='left';
  }

  transition(ctx,game){
    ctx.fillStyle=`rgba(0,0,0,${Math.min(.88,game.levelTransition/45)})`;
    ctx.fillRect(0,0,1024,576);
    ctx.fillStyle='#ffd21c'; ctx.textAlign='center'; ctx.font='bold 32px Arial';
    ctx.fillText('ПЕРЕХОД В НОВЫЙ БИОМ',512,285); ctx.textAlign='left';
  }
};
