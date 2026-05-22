'use strict';
window.KP = window.KP || {};
KP.UI = class UI {
  constructor(){
    this.inventoryOpen=false;
    this.shopOpen=null;
    this.intro=true;
    this.ending=false;
    this.menuItems=['controls','start'];
    this.menuIndex=1;
    this.controlsOpen=false;
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
    if(game.assets && game.assets.ready('menuPoster')) game.assets.drawImg(ctx,'menuPoster',0,0,1024,576,false);
    else {
      ctx.fillStyle='#150a08';
      ctx.fillRect(0,0,1024,576);
    }

    const topFade=ctx.createLinearGradient(0,0,0,260);
    topFade.addColorStop(0,'rgba(0,0,0,.7)');
    topFade.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=topFade;
    ctx.fillRect(0,0,1024,260);

    const sideFade=ctx.createLinearGradient(610,0,1024,0);
    sideFade.addColorStop(0,'rgba(0,0,0,0)');
    sideFade.addColorStop(.45,'rgba(0,0,0,.32)');
    sideFade.addColorStop(1,'rgba(0,0,0,.82)');
    ctx.fillStyle=sideFade;
    ctx.fillRect(560,0,464,576);

    const bottomFade=ctx.createLinearGradient(0,360,0,576);
    bottomFade.addColorStop(0,'rgba(0,0,0,0)');
    bottomFade.addColorStop(1,'rgba(0,0,0,.78)');
    ctx.fillStyle=bottomFade;
    ctx.fillRect(0,360,1024,216);

    ctx.fillStyle='#ffd21c';
    ctx.font='bold 18px Arial';
    ctx.fillText(KP.VERSION||'V 1.0.18',46,48);
    ctx.font='bold 44px Arial';
    ctx.fillText('КОММУНИСТЫ',42,98);
    ctx.fillText('ПРОТИВ... ПЛЕСЕНИ!',42,144);
    ctx.fillStyle='#f2dfc7';
    ctx.font='18px Arial';
    ctx.fillText('Главное меню операции',46,178);

    const menuX=736;
    const menuY=402;
    const boxW=244;
    const boxH=58;
    const gap=18;
    for(let i=0;i<this.menuItems.length;i++){
      const y=menuY+i*(boxH+gap);
      const selected=i===this.menuIndex;
      ctx.fillStyle=selected?'rgba(188,22,14,.88)':'rgba(10,10,10,.72)';
      ctx.fillRect(menuX,y,boxW,boxH);
      ctx.strokeStyle=selected?'rgba(255,210,28,.92)':'rgba(255,255,255,.18)';
      ctx.lineWidth=selected?3:1;
      ctx.strokeRect(menuX,y,boxW,boxH);
      ctx.fillStyle=selected?'#ffd21c':'#f4e5cf';
      ctx.font=selected?'bold 24px Arial':'bold 22px Arial';
      ctx.fillText(this.menuItems[i]==='start'?'НАЧАТЬ ИГРУ':'УПРАВЛЕНИЕ',menuX+18,y+37);
    }

    ctx.fillStyle='#f2dfc7';
    ctx.font='14px Arial';
    ctx.fillText('↑/↓ или W/S - выбор',738,548);
    ctx.fillText('Enter / Space / ЛКМ / E - подтвердить',738,568);

    if(this.controlsOpen){
      ctx.fillStyle='rgba(7,7,7,.9)';
      ctx.fillRect(62,340,458,188);
      ctx.strokeStyle='rgba(255,210,28,.58)';
      ctx.lineWidth=2;
      ctx.strokeRect(62,340,458,188);
      ctx.fillStyle='#ffd21c';
      ctx.font='bold 24px Arial';
      ctx.fillText('УПРАВЛЕНИЕ',88,378);
      ctx.fillStyle='#f2dfc7';
      ctx.font='16px Arial';
      const lines=[
        'A/D или Ф/В - ходьба',
        'W/↑ - прыжок, S/↓ - спуск через платформу',
        'ЛКМ/J/О - атака, Q - смена оружия',
        'E - взаимодействие и выкачивание времени',
        'Shift - турбо, F - стоп-время, R - рестарт'
      ];
      lines.forEach((line,i)=>ctx.fillText(line,88,414+i*28));
      ctx.fillStyle='#9cc8ff';
      ctx.fillText('Esc или повторное подтверждение по пункту закроет окно.',88,504);
    }
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
