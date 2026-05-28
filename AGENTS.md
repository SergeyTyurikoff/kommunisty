# Kommunisty Root Notes

Version: `V 1.2.0`

This file replaces the old root `README.md` and is the first-stop context file for coding agents working in this repo.

## Project

- Static HTML5 canvas action-platformer.
- Entry point: `index.html`.
- Main runtime code lives in `js/`.
- The game starts from the intro menu, not directly in gameplay.

## Key Files

- `js/game.js`: loop, level flow, camera, scene state.
- `js/player.js`: movement, combat, abilities, time resource.
- `js/entities.js`: enemies, bullets, pickups, particles.
- `js/world.js`: biome layouts, platforms, collisions, spawns.
- `js/assets.js`: image loading, sprite rendering, animation helpers.
- `js/ui.js`: HUD, overlays, menus, inventory, end screens.
- `js/audio.js`: music and sound effects.
- `js/balance.js`: tuning and gameplay constants.

## Current Gameplay Notes

- Six biomes with one boss biome each.
- Time is both HP and a spendable ability resource.
- Enemies should stay bound to their lane or platform.
- Local smoke automation relies on `window.KP_TEST`.

## Hero Animation Note

- Base hero idle/combat art still comes from `img/sliced/units/hero_revolutionary.png`.
- Movement states now use dedicated sprites from `img/sliced/units/hero_move/`.
- In `js/assets.js`, `run`, `jump`, and `fall` for the hero are image-backed; the rest of the states still use the existing procedural animation path.

## Run Locally

- Preferred: `npm.cmd run serve`
- Open: `http://127.0.0.1:4173`
- If `node` is not in `PATH`, use the portable binary:
  `tools\node-v24.16.0-win-x64\node.exe tools\dev_server.js`

## Checks

- Smoke test: `npm.cmd test`
- Direct fallback:
  `tools\node-v24.16.0-win-x64\node.exe tests\playtest_smoke.js`
- Before handoff, try a real launch plus a visual menu/gameplay sanity check.

## Controls

- `A/D` or arrows: move
- `W` or up arrow: jump
- `S` or down arrow: drop through one-way platforms
- `Mouse1` / `J`: attack
- `E`: interact
- `Q`: next weapon
- `1-6`: slots
- `Shift`: turbo
- `F`: time stop
- `R`: restart

## Working Conventions

- Prefer extending the existing plain-JS architecture instead of adding new layers.
- Keep assets local in the repo.
- Preserve smoke-test compatibility when touching gameplay or browser APIs.
- If version, controls, launch flow, or test commands change, update this file too.
