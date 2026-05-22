# Default Work Context

Version: `V 1.0.18`

Project shape:
- Static browser game on plain HTML/CSS/JS.
- Main entry: `index.html`.
- Runtime modules are loaded in order from `js/`.

Core files:
- `js/game.js`: game loop, state transitions, pickups, bullets, level flow.
- `js/ui.js`: HUD, overlays, menu, death/end screens.
- `js/player.js`: movement, attacks, abilities, time economy.
- `js/entities.js`: enemies, bullets, pickups, particles.
- `js/world.js`: biome layout, platforms, spawns, collision.
- `js/assets.js`: image loading and drawing helpers.
- `js/audio.js`: music and WAV sound effects.
- `js/balance.js`: gameplay numbers and enemy tuning.

Current gameplay assumptions:
- Side-scrolling action game with six biomes and one boss per biome.
- Time is both health and a spendable resource.
- Enemies are expected to stay on their assigned floor/platform.
- The main menu appears before gameplay begins.

Working conventions:
- Prefer fitting changes into the current lightweight architecture over adding frameworks.
- Keep new assets local in the repo and avoid external runtime dependencies.
- Preserve smoke-test compatibility when adding new modules or browser APIs.
