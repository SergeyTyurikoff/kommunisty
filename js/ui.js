'use strict';
window.KP = window.KP || {};
KP.UI = class UI {
  constructor(){
    this.inventoryOpen=false; this.shopOpen=null;
    this.intro=true; this.ending=false;
    this.menuItems=['controls','start'];
    this.menuIndex=1; this.controlsOpen=false;
    this.shopAmmoOpen=false;
  }

  draw(game){
    const ctx=game.ctx;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    this.hud(ctx,game);
    if(this.shopOpen) this.shop(ctx,game);
    if(this.inventoryOpen) this.inventory(ctx,game);
    if(this.intro) this.mainMenu(ctx,game);
    if(this.ending) this.endScreen(ctx);
    if(game.player.dead) this.dead(ctx,game);
    if(game.levelTransition>0) this.transition(ctx,game);
    if(game.paused&&!this.intro&&!this.ending&&!game.player.dead) this.pauseScreen(ctx,game);
    ctx.restore();
  }

  hud(ctx,game){
    const p=game.player;
    const U=KP.Utils;
    const w=KP.Balance.weapons[p.weapon];
    const at=w.ammoType;
    const rightX=710, topY=10, panelW=300, panelH=78;

    if(game.combatPressure>0){
      const v=Math.min(1,game.combatPressure/90)*0.13;
      ctx.fillStyle=`rgba(200,0,0,${v})`;
      ctx.fillRect(0,0,8,576); ctx.fillRect(1016,0,8,576);
      ctx.fillRect(0,0,1024,8); ctx.fillRect(0,568,1024,8);
    }

    const bossAlive=game.enemies.some(e=>e.alive&&KP.Balance.enemies[e.kind]&&KP.Balance.enemies[e.kind].role==='boss');
    const missionText=game.levelTransition>0?'Переход между биомами':
      bossAlive?'Цель: добить босса и открыть выход':
      'Цель: зачистить путь и дойти до портала';
    ctx.fillStyle='rgba(8,8,8,.74)';
    ctx.fillRect(14,12,480,38);
    ctx.strokeStyle='rgba(255,210,28,.45)';
    ctx.lineWidth=1.5;
    ctx.strokeRect(14,12,480,38);
    ctx.fillStyle='#f3e7c9';
    ctx.font='bold 15px Arial';
    ctx.fillText(missionText,28,36);

    ctx.fillStyle='rgba(5,7,10,.86)';
    ctx.fillRect(rightX,topY,panelW,panelH);
    ctx.strokeStyle='rgba(90,190,255,.45)';
    ctx.lineWidth=1.5;
    ctx.strokeRect(rightX,topY,panelW,panelH);

    if(game.assets&&w.sprite) game.assets.drawImg(ctx,w.sprite,rightX+10,topY+11,42,24,false);
    ctx.fillStyle='#f7f7f7';
    ctx.font='bold 15px Arial';
    ctx.fillText(w.name,rightX+58,topY+22);
    ctx.fillStyle=at&&p.ammoBag[at]<p.maxAmmoBag[at]*0.25?'#ff5b5b':'#aab8c4';
    ctx.font='13px Arial';
    ctx.fillText(at?`${p.ammoBag[at]} / ${p.maxAmmoBag[at]} ${KP.Balance.ammoTypes[at].short}`:'∞',rightX+58,topY+39);

    const timeRatio=U.clamp(p.time/p.maxTime,0,1);
    const xpRatio=U.clamp(p.xp/p.xpNext,0,1);
    ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillRect(rightX+12,topY+50,148,10);
    ctx.fillStyle=timeRatio>.35?'#65e8ff':'#ff6b5e'; ctx.fillRect(rightX+12,topY+50,148*timeRatio,10);
    ctx.fillStyle='rgba(255,255,255,.13)'; ctx.fillRect(rightX+12,topY+50,148*timeRatio,3);
    ctx.fillStyle='#d7f6ff'; ctx.font='bold 11px Arial';
    ctx.fillText(`Время ${Math.ceil(p.time)}/${p.maxTime}`,rightX+12,topY+74);

    ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillRect(rightX+170,topY+50,74,10);
    ctx.fillStyle='#7ad62a'; ctx.fillRect(rightX+170,topY+50,74*xpRatio,10);
    ctx.fillStyle='#b4f26a'; ctx.font='bold 11px Arial';
    ctx.fillText(`XP ${p.xp}/${p.xpNext}`,rightX+170,topY+74);

    if(game.assets) game.assets.drawImg(ctx,'moneyIcon',rightX+248,topY+10,18,18,false);
    ctx.fillStyle='#ffd21c'; ctx.font='bold 14px Arial';
    ctx.fillText(`${p.money}`,rightX+270,topY+24);
    ctx.fillStyle='#f0efe8'; ctx.font='bold 12px Arial';
    ctx.fillText(`LVL ${p.level}`,rightX+248,topY+44);
    ctx.fillStyle='#bdbdbd'; ctx.font='12px Arial';
    ctx.fillText(`★ ${game.kills}`,rightX+248,topY+60);

    const hitsLeft=Math.max(0,KP.Balance.player.hitStunHits-p.enemyHitChain);
    const status=p.stunTimer>0?`ОГЛУШЕН ${Math.ceil(p.stunTimer/60)}с`:`До стана: ${hitsLeft}`;
    ctx.fillStyle=p.stunTimer>0?'#ffcc33':'#7aa4c0';
    ctx.font='bold 11px Arial';
    ctx.fillText(status,rightX+170,topY+39);
    ctx.fillStyle='#74808c';
    ctx.font='10px Arial';
    ctx.fillText(KP.VERSION||'V 1.2.0',rightX+12,topY+8);

    if(game.comboCount>=4){
      const mulStr=`КОМБО x${game.comboMul.toFixed(1)}`;
      const pulse=0.88+Math.sin(Date.now()/80)*0.12;
      ctx.save();
      ctx.globalAlpha=pulse;
      ctx.fillStyle=game.comboMul>=3?'#ff4400':game.comboMul>=2?'#ff8800':'#ffd21c';
      ctx.font=`bold ${game.comboMul>=3?24:20}px Arial`;
      ctx.strokeStyle='#000'; ctx.lineWidth=4;
      ctx.strokeText(mulStr,16,118); ctx.fillText(mulStr,16,118);
      ctx.restore();
    }

    const boss=game.enemies.find(e=>e.alive&&KP.Balance.enemies[e.kind]&&KP.Balance.enemies[e.kind].role==='boss');
    if(boss){
      const bbx=212, bby=58, bbw=470, bbh=18;
      ctx.fillStyle='rgba(0,0,0,.82)';
      ctx.fillRect(bbx-4,bby-4,bbw+8,bbh+18);
      ctx.strokeStyle=boss.phase2?'#ff4040':'#ffd21c';
      ctx.lineWidth=2;
      ctx.strokeRect(bbx-4,bby-4,bbw+8,bbh+18);
      ctx.fillStyle=boss.phase2?'#9f1010':'#7e2b00';
      ctx.fillRect(bbx,bby,bbw,bbh);
      ctx.fillStyle=boss.phase2?'#ff3322':'#ff6b00';
      ctx.fillRect(bbx,bby,bbw*U.clamp(boss.hp/boss.maxHp,0,1),bbh);
      ctx.fillStyle='rgba(255,255,255,.12)';
      ctx.fillRect(bbx,bby,bbw*U.clamp(boss.hp/boss.maxHp,0,1),5);
      const bossName={mushroomBoss:'ГРИБ-БОСС',treeBoss:'ДЕРЕВО-БОСС',sandBoss:'ПЕСЧАНЫЙ БОСС',swampBoss:'БОЛОТНЫЙ БОСС',factoryBoss:'ЗАВОД-БОСС',lenin:'ЛЕНИН'}[boss.kind]||boss.kind.toUpperCase();
      ctx.fillStyle='#fff0d6';
      ctx.font='bold 13px Arial';
      ctx.textAlign='center';
      ctx.fillText(`${bossName}${boss.phase2?' • ФАЗА 2':''}`,bbx+bbw/2,bby+14);
      ctx.textAlign='left';
    }

    if(game.toastTimer>0){
      const alpha=Math.min(1,game.toastTimer/30);
      ctx.fillStyle=`rgba(0,0,0,${0.84*alpha})`;
      ctx.fillRect(0,552,1024,24);
      ctx.strokeStyle=`rgba(160,120,14,${0.5*alpha})`;
      ctx.lineWidth=1;
      ctx.strokeRect(0,552,1024,24);
      ctx.globalAlpha=alpha;
      ctx.fillStyle='#ffd21c';
      ctx.font='13px Arial';
      const txt=game.toastText.length>118?game.toastText.slice(0,115)+'...':game.toastText;
      ctx.fillText(txt,12,568);
      ctx.globalAlpha=1;
    }

    if(game.timeStopFrames>0){
      ctx.fillStyle='rgba(101,232,255,.92)';
      ctx.font='bold 18px Arial';
      ctx.fillText(`ВРЕМЯ СТОИТ: ${Math.ceil(game.timeStopFrames/60)}с`,18,84);
    }
  }

  shop(ctx,game){
    ctx.fillStyle='rgba(0,0,0,.90)'; ctx.fillRect(202,70,620,420);
    ctx.strokeStyle='#b98945'; ctx.lineWidth=3; ctx.strokeRect(202,70,620,420);
    ctx.fillStyle='#ffd21c'; ctx.font='bold 26px Arial';
    ctx.fillText('МАГАЗИН СНАБЖЕНЦА',238,110);
    ctx.fillStyle='#eee'; ctx.font='17px Arial';
    ctx.fillText(`Деньги: ${game.player.money}  •  Время: ${Math.round(game.player.time)}/${game.player.maxTime}`,238,142);

    const items=[
      ['1','ammo','Боеприпасы: выбрать тип','под оружие из инвентаря'],
      ['2','smg','Пулемёт',KP.Balance.weapons.smg.desc],
      ['3','flamethrower','Огнемёт',KP.Balance.weapons.flamethrower.desc],
      ['4','sabre','Шашка',KP.Balance.weapons.sabre.desc],
      ['5','shotgun','Обрез',KP.Balance.weapons.shotgun.desc]
    ];
    let yy=192;
    for(const [slot,id,title,desc] of items){
      const owned=id==='ammo'||game.player.inventory.includes(id);
      const price=id==='ammo'?'по типу':`${KP.Balance.weapons[id].price} мон.`;
      ctx.fillStyle=owned?'rgba(30,22,10,.92)':'rgba(18,12,6,.92)';
      ctx.fillRect(236,yy-24,548,42);
      ctx.strokeStyle=owned?'rgba(180,140,20,.35)':'rgba(80,60,20,.28)';
      ctx.lineWidth=1; ctx.strokeRect(236,yy-24,548,42);
      ctx.fillStyle=owned?'#f0f0f0':'#d0d0d0';
      ctx.font='15px Arial';
      ctx.fillText(`${slot}  ${title}`,252,yy-4);
      ctx.fillStyle='#8ec7ff';
      ctx.fillText(price,560,yy-4);
      ctx.fillStyle='#888'; ctx.font='12px Arial';
      ctx.fillText(desc,252,yy+12);
      yy+=56;
    }
    ctx.fillStyle='#888'; ctx.font='14px Arial';
    ctx.fillText(this.shopAmmoOpen?'1-6 — купить тип | E / Esc — назад':'E / Esc — закрыть.  1 — выбрать тип патронов',236,450);

    if(this.shopAmmoOpen){
      const options=game.getShopAmmoOptions();
      ctx.fillStyle='rgba(8,8,8,.94)'; ctx.fillRect(522,166,262,206);
      ctx.strokeStyle='rgba(255,210,28,.48)'; ctx.lineWidth=2; ctx.strokeRect(522,166,262,206);
      ctx.fillStyle='#ffd21c'; ctx.font='bold 18px Arial'; ctx.fillText('ТИП БОЕПРИПАСОВ',540,194);
      let sy=226;
      options.forEach((opt,idx)=>{
        const amount=game.player.ammoBag[opt.id];
        const max=game.player.maxAmmoBag[opt.id];
        ctx.fillStyle='rgba(30,22,10,.9)'; ctx.fillRect(538,sy-18,228,32);
        ctx.strokeStyle='rgba(180,140,20,.25)'; ctx.strokeRect(538,sy-18,228,32);
        ctx.fillStyle='#f2f2f2'; ctx.font='14px Arial';
        ctx.fillText(`${idx+1}  ${opt.name}  +${opt.buyAmount}`,550,sy);
        ctx.fillStyle='#9ec8ff'; ctx.fillText(`${amount}/${max}`,704,sy);
        ctx.fillStyle='#888'; ctx.fillText(`${opt.price} мон.`,550,sy+14);
        sy+=38;
      });
      if(!options.length){
        ctx.fillStyle='#bbb'; ctx.font='14px Arial';
        ctx.fillText('Нет оружия с боеприпасами.',540,232);
      }
    }
  }

  inventory(ctx,game){
    ctx.fillStyle='rgba(10,7,4,.92)'; ctx.fillRect(680,84,326,392);
    ctx.strokeStyle='#b98945'; ctx.lineWidth=2; ctx.strokeRect(680,84,326,392);
    ctx.fillStyle='#ffd21c'; ctx.font='bold 22px Arial'; ctx.fillText('ИНВЕНТАРЬ',714,122);
    ctx.fillStyle='#888'; ctx.font='12px Arial'; ctx.fillText('I — закрыть',872,122);
    let y=164;
    for(const id of game.player.inventory){
      const weapon=KP.Balance.weapons[id];
      const active=id===game.player.weapon;
      if(active){ ctx.fillStyle='rgba(180,0,0,.32)'; ctx.fillRect(700,y-18,290,34); }
      ctx.fillStyle=active?'#ffd21c':'#eee'; ctx.font='bold 16px Arial';
      ctx.fillText((active?'▶ ':'• ')+weapon.name,714,y);
      ctx.fillStyle='#888'; ctx.font='12px Arial'; ctx.fillText(weapon.desc,730,y+16);
      y+=46;
    }
    ctx.fillStyle='#666'; ctx.font='12px Arial'; ctx.fillText('Q — следующее  |  1-6 — прямой выбор',706,444);
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

    ctx.fillStyle='rgba(0,0,0,.62)'; ctx.fillRect(28,378,388,126);
    ctx.strokeStyle='rgba(255,210,28,.35)'; ctx.lineWidth=1.5; ctx.strokeRect(28,378,388,126);
    ctx.fillStyle='#ffd21c'; ctx.font='bold 18px Arial'; ctx.fillText(KP.VERSION||'V 1.2.0',46,404);
    ctx.font='bold 44px Arial'; ctx.fillText('КОММУНИСТЫ',42,450); ctx.fillText('ПРОТИВ... ПЛЕСЕНИ!',42,492);
    ctx.fillStyle='#f2dfc7'; ctx.font='18px Arial'; ctx.fillText('Главное меню операции',46,524);

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
      ctx.fillStyle='rgba(7,7,7,.92)'; ctx.fillRect(48,322,520,222);
      ctx.strokeStyle='rgba(255,210,28,.58)'; ctx.lineWidth=2; ctx.strokeRect(48,322,520,222);
      ctx.fillStyle='#ffd21c'; ctx.font='bold 22px Arial'; ctx.fillText('УПРАВЛЕНИЕ',74,358);
      ctx.fillStyle='#f2dfc7'; ctx.font='15px Arial';
      const lines=[
        'A/D или Ф/В — ходьба | Shift — бег',
        'W/↑ — прыжок | S/↓ — спуск через платформу',
        'ЛКМ/J/О — атака | Q — смена оружия | 1-6 — слот',
        'Z/Я — перекат | E — взаимодействие | I — инвентарь',
        'F — стоп-время | Esc — пауза | R — рестарт',
        'Турбо и выкачивание времени временно отключены'
      ];
      lines.forEach((line,i)=>ctx.fillText(line,74,392+i*26));
      ctx.fillStyle='#9cc8ff'; ctx.font='13px Arial'; ctx.fillText('Esc или повторный выбор — закрыть.',74,528);
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
      ctx.fillText(`Биом: ${s.biome} (${s.biomeIndex+1} из 6)`,512,248);
      ctx.fillText(`Уровень: ${s.level} | Уничтожено: ${s.kills}`,512,280);
      ctx.fillStyle=s.maxCombo>=3?'#ff8800':s.maxCombo>=2?'#ffd21c':'#aaa';
      ctx.font='18px Arial';
      ctx.fillText(`Максимальное комбо: x${s.maxCombo.toFixed(1)}`,512,316);
    }
    ctx.fillStyle='#888'; ctx.font='18px Arial';
    ctx.fillText('R — рестарт. Плесень пишет отчёт.',512,394);
    ctx.textAlign='left';
  }

  pauseScreen(ctx,game){
    ctx.fillStyle='rgba(0,0,0,.76)'; ctx.fillRect(0,0,1024,576);
    ctx.textAlign='center';
    const pulse=0.92+Math.sin(Date.now()/400)*0.08;
    ctx.fillStyle=`rgba(255,210,28,${pulse})`; ctx.font='bold 54px Arial'; ctx.fillText('ПАУЗА',512,190);
    ctx.fillStyle='rgba(20,10,5,.8)'; ctx.fillRect(312,218,400,148);
    ctx.strokeStyle='rgba(180,140,20,.6)'; ctx.lineWidth=1.5; ctx.strokeRect(312,218,400,148);
    ctx.fillStyle='#ddd'; ctx.font='20px Arial';
    ctx.fillText(`${game.world.biomeName()} ${game.levelIndex+1}/6`,512,252);
    ctx.fillText(`Уровень ${game.player.level} | Убито: ${game.kills}`,512,284);
    ctx.fillText(`Время: ${Math.round(game.player.time)} / ${game.player.maxTime}`,512,316);
    ctx.fillStyle='#aaa'; ctx.font='16px Arial';
    ctx.fillText('Esc — продолжить | R — рестарт',512,346);
    ctx.textAlign='left';
  }

  transition(ctx,game){
    ctx.fillStyle=`rgba(0,0,0,${Math.min(.88,game.levelTransition/45)})`;
    ctx.fillRect(0,0,1024,576);
    ctx.fillStyle='#ffd21c'; ctx.textAlign='center'; ctx.font='bold 32px Arial';
    ctx.fillText('ПЕРЕХОД В НОВЫЙ БИОМ',512,285); ctx.textAlign='left';
  }
};
