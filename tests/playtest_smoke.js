'use strict';
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright-core');

const projectRoot = path.resolve(__dirname, '..');
const serverScript = path.join(projectRoot, 'tools', 'dev_server.js');
const nodeExe = process.execPath;
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

function wait(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

function startServer(){
  return new Promise((resolve, reject) => {
    const child = spawn(nodeExe, [serverScript], {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let settled = false;
    const onData = chunk => {
      const text = String(chunk);
      if(text.includes('KP server running')){
        settled = true;
        resolve(child);
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', chunk => {
      if(!settled){
        settled = true;
        reject(new Error(String(chunk)));
      }
    });
    child.on('exit', code => {
      if(!settled) reject(new Error(`Server exited early with code ${code}`));
    });
  });
}

async function main(){
  const executablePath = chromeCandidates.find(candidate => require('fs').existsSync(candidate));
  if(!executablePath) throw new Error('No supported Chrome/Edge executable found.');

  const server = await startServer();
  let browser;
  try {
    browser = await chromium.launch({
      executablePath,
      headless: true
    });
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const consoleErrors = [];
    const networkErrors = [];
    page.on('pageerror', err => consoleErrors.push(`pageerror: ${err.message}`));
    page.on('console', msg => {
      if(msg.type() === 'error') consoleErrors.push(`console: ${msg.text()}`);
    });
    page.on('response', response => {
      if(response.status() >= 400) networkErrors.push(`${response.status()} ${response.url()}`);
    });

    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await wait(1500);

    const before = await page.evaluate(() => window.KP_TEST.snapshot());
    if(!before.intro) throw new Error('Expected intro menu to be visible on load.');

    await page.keyboard.press('Enter');
    await wait(250);
    const afterStart = await page.evaluate(() => window.KP_TEST.snapshot());
    if(afterStart.intro) throw new Error('Start game action did not close the intro menu.');

    await page.keyboard.down('d');
    await wait(500);
    await page.keyboard.up('d');
    await wait(200);
    const afterMove = await page.evaluate(() => window.KP_TEST.snapshot());
    if(afterMove.player.x <= before.player.x) throw new Error('Player did not move right during smoke test.');

    await page.evaluate(() => {
      const g = window.__KP_GAME__;
      const targetEnemy = g.enemies.find(e => e.alive);
      if(!targetEnemy) throw new Error('No alive enemy found for smoke contact.');
      g.player.weapon = g.player.inventory.includes('pistol') ? 'pistol' : g.player.weapon;
      g.player.x = Math.max(80, targetEnemy.x - 190);
      g.player.y = targetEnemy.y;
      g.player.vx = 0;
      g.player.vy = 0;
      g.player.facing = 1;
      g.updateCamera();
    });
    await wait(250);

    const beforeShot = await page.evaluate(() => {
      const g = window.__KP_GAME__;
      const weapon = g.player.weapon;
      const ammoType = window.KP.Balance.weapons[weapon].ammoType;
      return {
        weapon,
        ammoType,
        ammo: ammoType ? g.player.ammoBag[ammoType] : null,
        attackCd: g.player.attackCd
      };
    });

    await page.mouse.down();
    await wait(120);
    await page.mouse.up();
    await wait(700);
    const afterShot = await page.evaluate(() => window.KP_TEST.snapshot());
    const shotState = await page.evaluate(() => {
      const g = window.__KP_GAME__;
      const weapon = g.player.weapon;
      const ammoType = window.KP.Balance.weapons[weapon].ammoType;
      return {
        ammo: ammoType ? g.player.ammoBag[ammoType] : null,
        attackCd: g.player.attackCd
      };
    });
    const ammoSpent = beforeShot.ammoType ? shotState.ammo < beforeShot.ammo : shotState.attackCd > beforeShot.attackCd;
    if(!ammoSpent) throw new Error('Attack input did not trigger a real shot.');

    const aggressionSeen = await page.evaluate(() => {
      const g = window.__KP_GAME__;
      if(!g || !g.enemies.length) return false;
      return g.enemies.some(e => e.state === 'aggro' || e.memoryTimer > 0 || e.underFireTimer > 0);
    });
    if(!aggressionSeen) throw new Error('Enemies did not enter an aggressive reaction state during smoke test.');

    const screenshotPath = path.join(projectRoot, 'tmp', 'playtest_menu_smoke.png');
    require('fs').mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const meaningfulConsoleErrors = consoleErrors.filter(item => !item.includes('Failed to load resource'));
    const meaningfulNetworkErrors = networkErrors.filter(item => !item.includes('/favicon.ico'));
    if(meaningfulConsoleErrors.length || meaningfulNetworkErrors.length){
      throw new Error([...meaningfulConsoleErrors, ...meaningfulNetworkErrors].join('\n'));
    }
    console.log('PLAYTEST_OK');
    console.log(`Screenshot: ${screenshotPath}`);
  } finally {
    if(browser) await browser.close();
    server.kill();
  }
}

main().catch(err => {
  console.error(err.stack || String(err));
  process.exit(1);
});
