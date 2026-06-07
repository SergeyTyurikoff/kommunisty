'use strict';
// Генерирует data/balance.csv из единственного источника правды — js/balance.js.
// Запуск: npm run gen:balance  (или node tools/gen_balance_csv.js)
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
// balance.js рассчитан на браузер (window.KP). Делаем глобальный шим.
global.window = global;
require(path.join(root, 'js', 'balance.js'));
const B = global.KP && global.KP.Balance;
if (!B) { console.error('Не удалось загрузить KP.Balance из js/balance.js'); process.exit(1); }

const rows = [['category', 'id', 'name', 'hp', 'speed', 'damage', 'range', 'delay', 'ammo_type', 'extra', 'notes']];
const csvCell = v => {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

// Игрок
const p = B.player;
rows.push(['player', 'felix', 'Феликс', p.maxTime, p.speed, '', '', '', '', `jump ${p.jump}`,
  'здоровье (тема: «время»); авто-убывания нет; турбо тратит здоровье']);

// Оружие
for (const [id, w] of Object.entries(B.weapons)) {
  const dmg = w.pellets ? `${w.dmg}x${w.pellets}` : w.dmg;
  rows.push(['weapon', id, w.name, '', w.speed, dmg, w.range, w.delay, w.ammoType || 'none',
    `price ${w.price}`, w.desc || '']);
}

// Боеприпасы
for (const [id, a] of Object.entries(B.ammoTypes)) {
  rows.push(['ammo', id, a.name, '', '', '', '', '', id,
    `start ${a.start}/max ${a.max}`, `покупка ${a.buyAmount} за ${a.price}`]);
}

// Враги и боссы
for (const [id, e] of Object.entries(B.enemies)) {
  rows.push([e.role === 'boss' ? 'boss' : 'enemy', id, id, e.hp, e.speed, e.dmg, e.attackRange,
    e.fireDelay || '', e.shoot ? 'стрелок' : 'ближний', `role ${e.role}`,
    `xp ${e.xp}, деньги ${e.money[0]}-${e.money[1]}`]);
}

// Способности (по биомам)
(B.abilityUnlocks || []).forEach((ab, i) => {
  if (ab) rows.push(['ability', ab.id, ab.name, '', '', '', '', '', '', `биом ${i}`, ab.desc || '']);
});

const csv = rows.map(r => r.map(csvCell).join(',')).join('\n') + '\n';
const out = path.join(root, 'data', 'balance.csv');
fs.writeFileSync(out, csv, 'utf8');
console.log(`balance.csv обновлён: ${rows.length - 1} строк -> ${path.relative(root, out)}`);
