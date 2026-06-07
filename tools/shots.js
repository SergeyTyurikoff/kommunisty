'use strict';
// Снимает скриншоты ключевых сцен через настоящий Chrome (playwright-core).
// Результат: tmp/shots/*.png
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');

const projectRoot = path.resolve(__dirname, '..');
const serverScript = path.join(projectRoot, 'tools', 'dev_server.js');
const testPort = 4275;
const outDir = path.join(projectRoot, 'tmp', 'shots');
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];
const wait = ms => new Promise(r => setTimeout(r, ms));

function startServer(){
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [serverScript], {
      cwd: projectRoot, env: { ...process.env, KP_PORT: String(testPort) }, stdio: ['ignore','pipe','pipe']
    });
    let settled = false;
    child.stdout.on('data', c => { if(String(c).includes('KP server running')){ settled = true; resolve(child); } });
    child.on('exit', code => { if(!settled) reject(new Error('server exit '+code)); });
  });
}

async function main(){
  const executablePath = chromeCandidates.find(p => fs.existsSync(p));
  fs.mkdirSync(outDir, { recursive: true });
  const server = await startServer();
  let browser;
  try {
    browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({ viewport: { width: 1024, height: 576 } });
    await page.goto(`http://127.0.0.1:${testPort}/`, { waitUntil: 'networkidle' });
    await wait(1200);
    const canvas = await page.$('#game');
    const shot = name => canvas.screenshot({ path: path.join(outDir, name) });

    // 1. Меню
    await shot('01_menu.png');

    // Старт
    await page.evaluate(() => window.KP_TEST.startGame());
    await wait(400);

    // 2. Геймплей: враги рядом, агрятся
    await page.evaluate(() => {
      const g = window.__KP_GAME__;
      window.KP_TEST.movePlayer(900);
      ['zombie','pistol','runner'].forEach((k,i)=>window.KP_TEST.spawnEnemy(k,140+i*90));
    });
    await wait(600);
    await shot('02_gameplay.png');

    // 3. Турбо активно
    await page.evaluate(() => { const g=window.__KP_GAME__; g.player.abilities.turbo=true; g.player.tryTurbo(g); });
    await wait(200);
    await shot('03_turbo.png');

    // 4. Гибы + кровь сразу после убийств
    await page.evaluate(() => {
      const g = window.__KP_GAME__;
      window.KP_TEST.clearEnemies();
      for(const k of ['zombie','runner','horse','pistol','gunner']){
        const e = window.KP_TEST.spawnEnemy(k, 120);
        e.takeDamage(9999,0,e.x,{},g); g.onEnemyHit(e,true,9999);
      }
    });
    await wait(90);
    await shot('04_gibs_blood.png');

    // 5. Часы перед волной
    await page.evaluate(() => {
      const g = window.__KP_GAME__;
      window.KP_TEST.goToBiome(1);
      const t = g.world.rushTriggers[0];
      window.KP_TEST.movePlayer(t.x - 120);
    });
    await wait(500);
    await shot('05_wave_clock.png');

    // 6. Цель волны (после спавна)
    await wait(2600);
    await shot('06_wave_objective.png');

    // 7. Босс Ленин + телеграф тарана
    await page.evaluate(() => {
      const g = window.__KP_GAME__;
      window.KP_TEST.goToBiome(5);
      const lenin = g.enemies.find(e=>e.kind==='lenin');
      if(lenin){ window.KP_TEST.movePlayer(lenin.x - 280); g.player.y = lenin.y; }
    });
    await wait(1500);
    await shot('07_boss_lenin.png');

    // 8. Экран смерти со статистикой
    await page.evaluate(() => { const g=window.__KP_GAME__; g.player.time=0; g.player.dead=true; });
    await wait(300);
    await shot('08_death.png');

    console.log('SHOTS_OK ->', outDir);
  } finally {
    if(browser) await browser.close();
    server.kill();
  }
}
main().catch(e => { console.error(e.stack||String(e)); process.exit(1); });
