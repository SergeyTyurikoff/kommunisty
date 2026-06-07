'use strict';
window.KP = window.KP || {};
KP.Balance = {
  player:{
    maxTime:140,            // здоровье героя (исторически называлось «время», см. docs)
    speed:.32,
    runSpeed:1.95,
    jump:-8.4,
    turboDuration:300,      // режим «Турбо» (клавиша C): единственный, что тратит здоровье
    turboCooldown:300,
    turboSpeed:1.55,
    turboDamage:1.38,
    turboHealthPerFrame:.12, // сколько здоровья жрёт турбо за кадр
    weakSpeed:.52,
    weakDamage:.68,
    timeStopDuration:300,
    timeStopCooldown:420,   // стоп-время теперь без затрат здоровья, ограничено откатом
    gasWarningFrames:170,
    // Газ больше НЕ отнимает здоровье у ГГ — только замедляет (зона контроля).
    gasSlowFrames:26,
    gasSlowMul:.5,
    // Противогаз: 3 c действия, 5 c отката.
    gasMaskDuration:180,
    gasMaskCooldown:300,
    hitStunHits:5,
    hitStunDuration:120,
    hitStunResetFrames:240,
    healPickupAmount:22,
    dodge:{ cost:0, duration:14, cooldown:58, speed:10.5, hitDmg:18, knock:10 }, // перекат бесплатный, ограничен откатом
    // Прыжок на врага сверху: урон + отскок, без потери здоровья.
    stomp:{ dmg:30, knock:13, bounce:-7.6 },
    combo:{ window:130, thresholds:[1,4,8,14], multipliers:[1,1.5,2.2,3.5] }
  },
  economy:{ moneyMult:.5, medkitDropChance:.26 },
  // Способности открываются по входу в биом: abilityUnlocks[levelIndex].
  // Биом 0 (Лес) — стартовый, без новой способности.
  abilityUnlocks:[
    null,
    {id:'doubleJump',   name:'Двойной прыжок', desc:'второй прыжок в воздухе'},
    {id:'turbo',        name:'Турбо', desc:'C/С: 5 секунд быстрее и сильнее, но тратит здоровье; потом слабость'},
    {id:'timeStop',     name:'Остановка времени', desc:'F/А замораживает врагов на 5 секунд'},
    {id:'meleeMastery', name:'Мастер шашки', desc:'шашка сильнее и отталкивает дальше'},
    {id:'finalResolve', name:'Финальная решимость', desc:'урон по боссам выше, перекат быстрее'}
  ],
  ammoTypes:{
    pistol:      {name:'пистолетные', short:'Пст', start:36, max:90, buyAmount:24, price:10},
    rifle:       {name:'винтовочные', short:'Внт', start:20, max:70, buyAmount:12, price:14},
    machinegun:  {name:'пулемётные', short:'Плм', start:0, max:180, buyAmount:45, price:14},
    shells:      {name:'картечь', short:'Дрб', start:0, max:34, buyAmount:8, price:18},
    gas:         {name:'газовые баллоны', short:'Газ', start:0, max:120, buyAmount:26, price:18}
  },
  items:{
    medkit:{ name:'Аптечка', heal:38, max:9, desc:'лечит из быстрого инвентаря' },
    gasMask:{ name:'Противогаз', desc:'защищает только от газа' }
  },
  weapons:{
    pistol:      { name:'Пистолет', type:'gun', ammoType:'pistol', ammoUse:1, dmg:18, delay:270, speed:8.0, range:315, price:0, knock:2.7, color:'#f5f5f5', sprite:'pistolWeapon', desc:'короткая дистанция, быстрый темп' },
    mosin:       { name:'Винтовка Мосина', type:'gun', ammoType:'rifle', ammoUse:1, dmg:66, delay:760, speed:13.2, range:820, price:0, knock:6.2, color:'#ffd21c', sprite:'mosinWeapon', desc:'редко, больно, по-старому' },
    smg:         { name:'Пулемёт', type:'gun', ammoType:'machinegun', ammoUse:1, dmg:13, delay:85, speed:12.5, range:610, price:26, knock:1.7, color:'#ff9a26', sprite:'smgWeapon', desc:'быстро жрёт пулемётные патроны' },
    gasSprayer:  { name:'Газомет', type:'gas', ammoType:'gas', ammoUse:1, dmg:2.8, delay:68, speed:3.8, range:240, price:38, knock:.2, cloudLife:190, cloudRadius:64, cloudTick:8.5, color:'#98d94a', sprite:'gasWeapon', desc:'облако газа, давит зоной' },
    sabre:       { name:'Шашка', type:'melee', ammoType:null, ammoUse:0, dmg:40, delay:390, speed:0, range:70, price:24, knock:8, color:'#d8f2ff', sprite:'sabreWeapon', desc:'ближний бой, рискованно, без патронов' },
    shotgun:     { name:'Обрез', type:'shotgun', ammoType:'shells', ammoUse:1, dmg:18, pellets:5, delay:640, speed:9.8, range:340, price:48, knock:5.0, color:'#ffcf7a', sprite:'shotgunWeapon', desc:'картечь, конусный выстрел' }
  },
  enemies:{
    zombie:      { hp:82,  speed:.10,  dmg:11, hitTime:7,  xp:16,  money:[5,10],    detect:400, attackRange:38,  shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:1,    role:'melee',   patrol:'floor' },
    runner:      { hp:68,  speed:.16,  dmg:9,  hitTime:6,  xp:18,  money:[5,11],    detect:460, attackRange:34,  shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:.9,   role:'melee',   patrol:'floor' },
    pistol:      { hp:90,  speed:.075, dmg:14, hitTime:8,  xp:23,  money:[7,14],    detect:560, attackRange:365, shoot:true,  fireDelay:105, keepDistance:240, bulletSpeed:4.6, jump:true,  weight:1.1,  role:'ranged',  patrol:'floor' },
    gunner:      { hp:118, speed:.068, dmg:8,  hitTime:5,  xp:34,  money:[9,18],    detect:620, attackRange:455, shoot:true,  fireDelay:44,  keepDistance:310, bulletSpeed:5.4, jump:false, weight:1.25, role:'ranged',  patrol:'floor' },
    rifleman:    { hp:98,  speed:.092, dmg:10, hitTime:7,  xp:28,  money:[8,16],    detect:620, attackRange:470, shoot:true,  fireDelay:36,  keepDistance:280, bulletSpeed:6.2, jump:true,  weight:1.05, role:'ranged',  patrol:'floor' },
    gasman:      { hp:108, speed:.11,  dmg:7,  hitTime:6,  xp:34,  money:[10,19],   detect:560, attackRange:155, shoot:true,  fireDelay:74,  keepDistance:80,  bulletSpeed:4.1, jump:false, weight:1.2,  role:'ranged',  patrol:'floor' },
    sabreur:     { hp:104, speed:.19,  dmg:18, hitTime:11, xp:30,  money:[8,16],    detect:520, attackRange:56,  shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:1.05, role:'melee',   patrol:'floor' },
    horse:       { hp:160, speed:.27,  dmg:20, hitTime:13, xp:48,  money:[16,32],   detect:600, attackRange:44,  shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:1.8,  role:'charger', patrol:'floor' },
    kamikaze:    { hp:55,  speed:.20,  dmg:50, hitTime:50, xp:28,  money:[4,10],    detect:500, attackRange:42,  shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:.65, role:'melee',   patrol:'floor', explodeRadius:100, explodeDmg:50 },
    shielder:    { hp:220, speed:.062, dmg:20, hitTime:18, xp:64,  money:[20,42],   detect:480, attackRange:44,  shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:false, weight:2.6,  role:'melee',   patrol:'floor' },
    sniper:      { hp:80,  speed:.042, dmg:60, hitTime:50, xp:55,  money:[16,30],   detect:700, attackRange:640, shoot:true,  fireDelay:240, keepDistance:440, bulletSpeed:9.5, jump:false, weight:1.0,  role:'ranged',  patrol:'floor', scopeFrames:80 },
    maxim:       { hp:245, speed:0,    dmg:9,  hitTime:5,  xp:58,  money:[18,34],   detect:760, attackRange:560, shoot:true,  fireDelay:16,  keepDistance:0,   bulletSpeed:7.2, jump:false, weight:4.8,  role:'turret',  patrol:'ground' },
    miniboss:    { hp:300, speed:.105, dmg:21, hitTime:14, xp:96,  money:[38,70],   detect:680, attackRange:420, shoot:true,  fireDelay:70,  keepDistance:230, bulletSpeed:5.0, jump:true,  weight:2.2,  role:'elite',   patrol:'floor' },
    mushroomBoss:{ hp:430, speed:.09,  dmg:22, hitTime:15, xp:120, money:[60,90],   detect:700, attackRange:360, shoot:true,  fireDelay:88,  keepDistance:200, bulletSpeed:4.0, jump:true,  weight:2.8,  role:'boss',    patrol:'floor' },
    treeBoss:    { hp:485, speed:.068, dmg:26, hitTime:17, xp:135, money:[65,100],  detect:720, attackRange:390, shoot:true,  fireDelay:100, keepDistance:230, bulletSpeed:3.8, jump:false, weight:3.8,  role:'boss',    patrol:'floor' },
    sandBoss:    { hp:450, speed:.12,  dmg:20, hitTime:14, xp:135, money:[65,100],  detect:760, attackRange:340, shoot:false, fireDelay:0,   keepDistance:0,   bulletSpeed:0,   jump:true,  weight:2.4,  role:'boss',    patrol:'floor' },
    swampBoss:   { hp:520, speed:.065, dmg:24, hitTime:16, xp:150, money:[70,110],  detect:740, attackRange:430, shoot:true,  fireDelay:65,  keepDistance:260, bulletSpeed:4.6, jump:false, weight:4.0,  role:'boss',    patrol:'floor' },
    factoryBoss: { hp:580, speed:.068, dmg:26, hitTime:17, xp:170, money:[80,125],  detect:800, attackRange:510, shoot:true,  fireDelay:50,  keepDistance:310, bulletSpeed:5.5, jump:false, weight:4.5,  role:'boss',    patrol:'floor' },
    lenin:       { hp:670, speed:.10,  dmg:30, hitTime:22, xp:280, money:[140,200], detect:860, attackRange:520, shoot:true,  fireDelay:58,  keepDistance:265, bulletSpeed:5.8, jump:false, weight:3.4,  role:'boss',    patrol:'floor', ramCd:180, ramSpeed:12, ramDuration:42 }
  },
  shop:{ timePrice:20, timeAmount:44 }
};
