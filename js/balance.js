'use strict';
window.KP = window.KP || {};
KP.Balance = {
  player:{
    maxTime:140,
    baseTimeDecay:0.006,
    speed:.32,
    jump:-8.4,
    turboDuration:300,
    turboCooldown:300,
    turboSpeed:1.55,
    turboDamage:1.38,
    turboTimeCostPerFrame:.09,
    weakSpeed:.52,
    weakDamage:.68,
    timeStopDuration:300,
    timeStopCost:18,
    timeStopDrainPerFrame:.038,
    drainRange:160,
    drainGainPerFrame:.26,
    drainEnemyDamagePerFrame:.24,
    dodge:{ cost:8, duration:14, cooldown:58, speed:10.5 },
    combo:{ window:130, thresholds:[1,4,8,14], multipliers:[1, 1.5, 2.2, 3.5] }
  },
  abilityUnlocks:[
    {id:'drain',        name:'Выкачивание времени', desc:'удерживай E/У рядом с врагом'},
    {id:'doubleJump',   name:'Двойной прыжок',      desc:'второй прыжок в воздухе'},
    {id:'turbo',        name:'Турбо',               desc:'5 секунд быстрее и сильнее, потом слабость'},
    {id:'timeStop',     name:'Остановка времени',   desc:'F/А замораживает врагов на 5 секунд'},
    {id:'meleeMastery', name:'Мастер шашки',        desc:'шашка сильнее и отталкивает дальше'},
    {id:'finalResolve', name:'Финальная решимость', desc:'урон по боссам выше, перекат быстрее'}
  ],
  ammoTypes:{
    pistol:      {name:'пистолетные', short:'Пст', start:36, max:90,  buyAmount:24, price:10},
    rifle:       {name:'винтовочные', short:'Внт', start:20, max:70,  buyAmount:12, price:14},
    machinegun:  {name:'пулемётные',  short:'Плм', start:0,  max:180, buyAmount:45, price:14},
    shells:      {name:'картечь',     short:'Дрб', start:0,  max:34,  buyAmount:8,  price:18},
    fuel:        {name:'топливо',     short:'Огн', start:0,  max:160, buyAmount:40, price:16}
  },
  weapons:{
    pistol:      { name:'Пистолет',       type:'gun',     ammoType:'pistol',     ammoUse:1, dmg:18,  delay:270, speed:8.0,  range:315, price:0,  knock:2.7, color:'#f5f5f5', sprite:'pistolWeapon',      desc:'короткая дистанция, быстрый темп' },
    mosin:       { name:'Винтовка Мосина',type:'gun',     ammoType:'rifle',      ammoUse:1, dmg:66,  delay:760, speed:13.2, range:820, price:0,  knock:6.2, color:'#ffd21c', sprite:'mosinWeapon',       desc:'редко, больно, по-старому' },
    smg:         { name:'Пулемёт',        type:'gun',     ammoType:'machinegun', ammoUse:1, dmg:13,  delay:85,  speed:12.5, range:610, price:26, knock:1.7, color:'#ff9a26', sprite:'smgWeapon',         desc:'быстро жрёт пулемётные патроны' },
    flamethrower:{ name:'Огнемёт',        type:'flame',   ammoType:'fuel',       ammoUse:1, dmg:4.8, delay:45,  speed:5.0,  range:210, price:34, knock:.9,  burn:105, burnDps:.055, color:'#ff5b1a', sprite:'flamethrowerWeapon', desc:'топливо, огонь и дебафф по толпе' },
    sabre:       { name:'Шашка',          type:'melee',   ammoType:null,         ammoUse:0, dmg:40,  delay:390, speed:0,    range:70,  price:24, knock:8,   color:'#d8f2ff', sprite:'sabreWeapon',       desc:'ближний бой, рискованно, без патронов' },
    shotgun:     { name:'Обрез',          type:'shotgun', ammoType:'shells',     ammoUse:1, dmg:18,  pellets:5, delay:640, speed:9.8, range:340, price:48, knock:5.0, color:'#ffcf7a', sprite:'shotgunWeapon', desc:'картечь, конусный выстрел' }
  },
  enemies:{
    zombie:      { hp:82,  speed:.075, dmg:11, hitTime:7,  xp:16,  money:[5,10],    detect:360, attackRange:38,  shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:1,   role:'melee',   patrol:'floor' },
    runner:      { hp:68,  speed:.12,  dmg:9,  hitTime:6,  xp:18,  money:[5,11],    detect:405, attackRange:34,  shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:.9,  role:'melee',   patrol:'floor' },
    pistol:      { hp:90,  speed:.055, dmg:12, hitTime:8,  xp:23,  money:[7,14],    detect:520, attackRange:365, shoot:true,  fireDelay:130, keepDistance:260, bulletSpeed:4.2, jump:true,  weight:1.1, role:'ranged',  patrol:'floor' },
    gunner:      { hp:118, speed:.05,  dmg:7,  hitTime:5,  xp:34,  money:[9,18],    detect:575, attackRange:455, shoot:true,  fireDelay:55,  keepDistance:330, bulletSpeed:5.0, jump:false, weight:1.25,role:'ranged',  patrol:'floor' },
    horse:       { hp:160, speed:.22,  dmg:18, hitTime:13, xp:48,  money:[16,32],   detect:560, attackRange:44,  shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:1.8, role:'charger', patrol:'floor' },
    tank:        { hp:300, speed:.055, dmg:25, hitTime:18, xp:82,  money:[26,52],   detect:620, attackRange:470, shoot:true,  fireDelay:150, keepDistance:375, bulletSpeed:4.1, jump:false, weight:4.2, role:'siege',   patrol:'floor' },
    miniboss:    { hp:300, speed:.08,  dmg:19, hitTime:14, xp:96,  money:[38,70],   detect:630, attackRange:420, shoot:true,  fireDelay:90,  keepDistance:250, bulletSpeed:4.7, jump:true,  weight:2.2, role:'elite',   patrol:'floor' },
    mushroomBoss:{ hp:430, speed:.07,  dmg:20, hitTime:15, xp:120, money:[60,90],   detect:650, attackRange:360, shoot:true,  fireDelay:115, keepDistance:220, bulletSpeed:3.7, jump:true,  weight:2.8, role:'boss',    patrol:'floor' },
    treeBoss:    { hp:485, speed:.052, dmg:24, hitTime:17, xp:135, money:[65,100],  detect:670, attackRange:390, shoot:true,  fireDelay:135, keepDistance:250, bulletSpeed:3.5, jump:false, weight:3.8, role:'boss',    patrol:'floor' },
    sandBoss:    { hp:450, speed:.09,  dmg:18, hitTime:14, xp:135, money:[65,100],  detect:710, attackRange:340, shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:2.4, role:'boss',    patrol:'floor' },
    swampBoss:   { hp:520, speed:.048, dmg:22, hitTime:16, xp:150, money:[70,110],  detect:690, attackRange:430, shoot:true,  fireDelay:85,  keepDistance:280, bulletSpeed:4.3, jump:false, weight:4.0, role:'boss',    patrol:'floor' },
    factoryBoss: { hp:580, speed:.052, dmg:24, hitTime:17, xp:170, money:[80,125],  detect:760, attackRange:510, shoot:true,  fireDelay:65,  keepDistance:330, bulletSpeed:5.1, jump:false, weight:4.5, role:'boss',    patrol:'floor' },
    lenin:       { hp:670, speed:.08,  dmg:28, hitTime:22, xp:280, money:[140,200], detect:800, attackRange:520, shoot:true,  fireDelay:76,  keepDistance:285, bulletSpeed:5.4, jump:false, weight:3.4, role:'boss',    patrol:'floor', ramCd:220, ramSpeed:10, ramDuration:42 }
  },
  shop:{ timePrice:20, timeAmount:44 }
};
