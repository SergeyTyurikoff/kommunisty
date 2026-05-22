'use strict';
window.KP = window.KP || {};
KP.UI = class UI {
  constructor(){
    this.inventoryOpen=false;
    this.shopOpen=null;
    this.intro=true;
    this.ending=false;
  }

  draw(game){
    const ctx=game.ctx,p=game.player;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    this.hud(ctx,game);
    if(this.shopOpen) this.shop(ctx,game);
    if(this.inventoryOpen) this.inventory(ctx,game);
    if(this.intro) this.mainMenu(ctx,game);
    if(this.ending) this.endScreen(ctx);
    if(p.dead) this.dead(ctx);
    if(game.levelTransition>0) this.transition(ctx,game);
    ctx.restore();
  }

  hud(ctx,g){
    const p=g.player,U=KP.Utils,w=KP.Balance.weapons[p.weapon],at=w.ammoType;
    const x=690,y=14,wid=318;
    ctx.fillStyle='rgba(0,0,0,.68)';
    ctx.fillRect(x,y,wid,154);
    ctx.strokeStyle='rgba(255,210,28,.65)';
    ctx.strokeRect(x,y,wid,154);
    if(g.assets){
      g.assets.drawImg(ctx,'moneyIcon',x+10,y+8,26,26,false);
      g.assets.drawImg(ctx,'hpIcon',x+10,y+52,26,28,false);
    }
    ctx.fillStyle='#ffd21c';
    ctx.font='bold 20px Arial';
    ctx.fillText('',x+40,y+30);
    if(g.assets && w.sprite) g.assets.drawImg(ctx,w.sprite,x+54,y+14,54,24,false);
    ctx.fillStyle='#fff';
    ctx.font='bold 17px Arial';
    ctx.fillText(w.name,x+116,y+30);
    const ammoText=at?`${p.ammoBag[at]}/${p.maxAmmoBag[at]} ${KP.Balance.ammoTypes[at].short}`:'∞';
    ctx.fillStyle='#ddd';
    ctx.font='14px Arial';
    ctx.fillText(ammoText,x+116,y+52);
    ctx.fillStyle='#65e8ff';
    ctx.font='13px Arial';
    ctx.fillText('ВРЕМЯ',x+40,y+72);
    U.drawBar(ctx,x+78,y+60,210,16,p.time/p.maxTime,'#65e8ff');
    ctx.fillStyle='#9df542';
    ctx.fillText(`XP ${p.xp}/${p.xpNext}`,x+18,y+98);
    U.drawBar(ctx,x+78,y+86,120,12,p.xp/p.xpNext,'#9df542');
    ctx.fillStyle=p.weak>0?'#888':'#ff8a1c';
    ctx.fillText(`Турбо: ${p.turbo>0?'ON':p.weak>0?'слабость':p.abilities.turbo?'готово':'закрыто'}`,x+210,y+98);

    const mx=x+18,my=y+116,mw=270,mh=18;
    if(g.assets&&g.assets.ready('minimap')){
      ctx.globalAlpha=.22;
      g.assets.drawImg(ctx,'minimap',mx,my-6,mw,32,false);
      ctx.globalAlpha=1;
    }
    ctx.fillStyle='#111';
    ctx.fillRect(mx,my,mw,mh);
    ctx.strokeStyle='#ffd21c';
    ctx.strokeRect(mx,my,mw,mh);
    const progress=KP.Utils.clamp(g.player.x/g.world.worldW,0,1);
    ctx.fillStyle='rgba(255,210,28,.35)';
    ctx.fillRect(mx,my,mw*progress,mh);
    ctx.fillStyle='#ff4040';
    ctx.beginPath();
    ctx.arc(mx+mw*progress,my+mh/2,5,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle='#ffd21c';
    ctx.font='bold 12px Arial';
    ctx.fillText(`${g.world.biomeName()} ${g.levelIndex+1}/6`,mx,my-6);

    const ability=(KP.Balance.abilityUnlocks||[]).filter(a=>p.abilities[a.id]).map(a=>a.name).slice(-2).join(' · ');
    ctx.fillStyle='#aaa';
    ctx.font='12px Arial';
    ctx.fillText(ability||'способности ещё открываются',x+18,y+150);

    ctx.fillStyle='rgba(255,210,28,.75)';
    ctx.font='bold 11px Arial';
    ctx.fillText(KP.VERSION||'V 1.0.18',x+232,y+151);

    if(g.toastTimer>0){
      ctx.fillStyle='rgba(0,0,0,.80)';
      ctx.fillRect(22,520,820,34);
      ctx.fillStyle='#ffd21c';
      ctx.font='15px Arial';
      ctx.fillText(g.toastText,42,542);
    }
    if(g.timeStopFrames>0){
      ctx.fillStyle='rgba(101,232,255,.9)';
      ctx.font='bold 18px Arial';
      ctx.fillText(`ВРЕМЯ СТОИТ: ${Math.ceil(g.timeStopFrames/60)}с`,26,34);
    }
  }

  shop(ctx,g){
    ctx.fillStyle='rgba(0,0,0,.88)';
    ctx.fillRect(210,70,620,420);
    ctx.strokeStyle='#b98945';
    ctx.lineWidth=3;
    ctx.strokeRect(210,70,620,420);
    ctx.fillStyle='#ffd21c';
    ctx.font='bold 26px Arial';
    ctx.fillText('МАГАЗИН СНАБЖЕНЦА',250,118);
    ctx.fillStyle='#eee';
    ctx.font='17px Arial';
    ctx.fillText(`Деньги: ${g.player.money} · Время: ${Math.round(g.player.time)}/${g.player.maxTime}`,250,152);
    const items=[
      ['1','time',`Купить время +${KP.Balance.shop.timeAmount}`,KP.Balance.shop.timePrice,'ресурс на жизнь и способности'],
      ['2','ammo','Боеприпасы к текущему оружию',(() => { const w=KP.Balance.weapons[g.player.weapon]; const at=w.ammoType||'rifle'; return KP.Balance.ammoTypes[at].price; })(),'магазин продаёт нужный тип патронов'],
      ['3','smg','Пулемёт',KP.Balance.weapons.smg.price,KP.Balance.weapons.smg.desc],
      ['4','flamethrower','Огнемёт',KP.Balance.weapons.flamethrower.price,KP.Balance.weapons.flamethrower.desc],
      ['5','sabre','Шашка',KP.Balance.weapons.sabre.price,KP.Balance.weapons.sabre.desc],
      ['6','shotgun','Обрез',KP.Balance.weapons.shotgun.price,KP.Balance.weapons.shotgun.desc]
    ];
    let yy=194;
    ctx.font='16px Arial';
    for(const it of items){
      ctx.fillStyle='#2b1d12';
      ctx.fillRect(250,yy-24,500,36);
      ctx.fillStyle='#eee';
      ctx.fillText(`${it[0]} - ${it[2]} · ${it[3]} денег`,270,yy);
      ctx.fillStyle='#aaa';
      ctx.font='13px Arial';
      ctx.fillText(it[4],480,yy);
      ctx.font='16px Arial';
      yy+=48;
    }
    ctx.fillStyle='#aaa';
    ctx.fillText('E / Esc - закрыть.',250,462);
  }

  inventory(ctx,g){
    ctx.fillStyle='rgba(15,10,5,.9)';
    ctx.fillRect(685,85,310,390);
    ctx.strokeStyle='#b98945';
    ctx.strokeRect(685,85,310,390);
    ctx.fillStyle='#ffd21c';
    ctx.font='bold 22px Arial';
    ctx.fillText('ИНВЕНТАРЬ',720,126);
    let y=166;
    ctx.font='16px Arial';
    for(const id of g.player.inventory){
      const w=KP.Balance.weapons[id];
      ctx.fillStyle=id===g.player.weapon?'#ffd21c':'#eee';
      ctx.fillText('• '+w.name,720,y);
      ctx.fillStyle='#aaa';
      ctx.font='12px Arial';
      ctx.fillText(w.desc,735,y+17);
      ctx.font='16px Arial';
      y+=42;
    }
    ctx.fillStyle='#aaa';
    ctx.fillText('Q - следующее оружие',720,440);
  }

  mainMenu(ctx,game){
    const pulse=.72+.28*Math.sin(Date.now()/260);
    ctx.fillStyle='rgba(0,0,0,.78)';
    ctx.fillRect(0,0,1024,576);
    ctx.fillStyle='rgba(255,210,28,.08)';
    ctx.fillRect(66,58,892,460);
    ctx.strokeStyle='rgba(255,210,28,.42)';
    ctx.lineWidth=2;
    ctx.strokeRect(66,58,892,460);

    ctx.fillStyle='#ffd21c';
    ctx.textAlign='left';
    ctx.font='bold 18px Arial';
    ctx.fillText(KP.VERSION||'V 1.0.18',86,94);
    ctx.font='bold 42px Arial';
    ctx.fillText('КОММУНИСТЫ ПРОТИВ... ПЛЕСЕНИ!',84,148);
    ctx.fillStyle='#eee';
    ctx.font='20px Arial';
    ctx.fillText('Главное меню операции',86,182);

    ctx.fillStyle='rgba(20,20,20,.86)';
    ctx.fillRect(86,220,372,188);
    ctx.strokeStyle='rgba(255,210,28,.5)';
    ctx.strokeRect(86,220,372,188);
    ctx.fillStyle='#ffd21c';
    ctx.font='bold 26px Arial';
    ctx.fillText('НАЧАТЬ ИГРУ',112,270);
    ctx.fillStyle='#ddd';
    ctx.font='17px Arial';
    ctx.fillText('Enter / Space / ЛКМ / E',112,304);
    ctx.fillText('Стартует музыка, бой и основной цикл.',112,334);
    ctx.fillStyle=`rgba(255,210,28,${.35*pulse})`;
    ctx.fillRect(106,356,272,26);
    ctx.fillStyle='#111';
    ctx.font='bold 16px Arial';
    ctx.fillText('Нажми, чтобы открыть рейд',124,374);

    ctx.fillStyle='rgba(20,20,20,.86)';
    ctx.fillRect(500,220,392,188);
    ctx.strokeStyle='rgba(255,210,28,.5)';
    ctx.strokeRect(500,220,392,188);
    ctx.fillStyle='#ffd21c';
    ctx.font='bold 24px Arial';
    ctx.fillText('ОПЕРАЦИОННАЯ СВОДКА',526,270);
    ctx.fillStyle='#ddd';
    ctx.font='16px Arial';
    const brief=[
      'Шесть биомов, один босс на каждый.',
      'Время - это и здоровье, и ресурс способностей.',
      'Противники держат свои платформы и давят умнее.',
      'Музыка и эффекты загружаются локально в WAV.'
    ];
    brief.forEach((line,i)=>ctx.fillText(line,526,304+i*28));

    ctx.fillStyle='rgba(20,20,20,.86)';
    ctx.fillRect(86,432,806,58);
    ctx.strokeStyle='rgba(255,210,28,.38)';
    ctx.strokeRect(86,432,806,58);
    ctx.fillStyle='#aaa';
    ctx.font='15px Arial';
    ctx.fillText('A/D - ходьба · W/↑ - прыжок · S/↓ - спуск через платформу · F - стоп-время · Q - смена оружия · R - рестарт',108,466);
    ctx.fillStyle='#65e8ff';
    ctx.fillText('Музыка включится после первого нажатия, как только начнётся игра.',108,486);
    ctx.textAlign='left';
  }

  endScreen(ctx){
    ctx.fillStyle='rgba(0,0,0,.84)';
    ctx.fillRect(0,0,1024,576);
    ctx.fillStyle='#ffd21c';
    ctx.textAlign='center';
    ctx.font='bold 42px Arial';
    ctx.fillText('ЛЕНИН ПОВЕРЖЕН',512,190);
    ctx.fillStyle='#eee';
    ctx.font='20px Arial';
    ctx.fillText('Феликс выкачал из эпохи лишнюю плесень и вернул времени право течь вперёд.',512,250);
    ctx.fillText('R - начать заново и снова пройти все биомы.',512,340);
    ctx.textAlign='left';
  }

  dead(ctx){
    ctx.fillStyle='rgba(0,0,0,.78)';
    ctx.fillRect(0,0,1024,576);
    ctx.fillStyle='#ff4040';
    ctx.textAlign='center';
    ctx.font='bold 42px Arial';
    ctx.fillText('ВРЕМЯ ФЕЛИКСА ИСТЕКЛО',512,250);
    ctx.fillStyle='#eee';
    ctx.font='20px Arial';
    ctx.fillText('R - рестарт. Плесень записывает это в отчёт.',512,304);
    ctx.textAlign='left';
  }

  transition(ctx,g){
    ctx.fillStyle=`rgba(0,0,0,${Math.min(.85,g.levelTransition/45)})`;
    ctx.fillRect(0,0,1024,576);
    ctx.fillStyle='#ffd21c';
    ctx.textAlign='center';
    ctx.font='bold 30px Arial';
    ctx.fillText('ПЕРЕХОД В НОВЫЙ БИОМ',512,285);
    ctx.textAlign='left';
  }
};
