# Plan — RUINS OF THE SECOND SUN (independent Metal Slug 2 Mission 2 homage)

Status: **Implementation pending**. `research.md` complete. Repository boundary: only `OGLOCBABY/pong-game`, with all writes contained in `metal-slug-2/` and optional additive launcher link in root (default: no root modifications).

## Contracts

- Preserve existing root Pong game, package.json scripts, `src/` engine and all existing tests unchanged.
- Start URL: `./metal-slug-2/index.html`; ES module entry `./main.js`.
- `engine.js`: `export class RuinsGame`, deterministic browser-free simulation; methods `start`, `reset`, `setInput`, `step(dt)`; public phase/player/enemies/boss/camera/events; constructor with optional seed.
- Coordinates: logical 960 x 540 px, continuous world X; timestep in seconds at 1/120 Hz; no browser dependencies in engine.
- Asset provenance: entirely original CSS/Canvas/code and synthesized sound. No ROM assets or imported proprietary material.
- Checkpoints, death, win screen, score all inspectable by browser tests.

## Delivery sequence/checklist

### Phase I — Research
- [x] Verify reference stage identity and four-act sequence.
- [x] Read entire GitHub recursive tree, existing documentation and protected game contracts.
- [x] Record source and license restrictions.

### Phase II — Planning / adversarial annotation
- [x] Choose additive subdirectory, static app, pure JS engine, procedural visuals, fixed tick.
- [x] Specify state/controls, test gates and asset provenance.
- [x] Reject: replacing Pong; copying sprites/sound; framework/install requirements; fake 10/10 rating.
- [x] Map main risks and acceptance criteria.

### Phase III — Implementation
- [ ] Implement deterministic game state, physics, collision, enemy behaviors, weapons, pickups and checkpoints.
- [ ] Implement multi-act hand-authored stage with coherent visual art and boss patterns.
- [ ] Add Web Audio sound, accessible interface, keyboard/touch/gamepad interactions and HUD.
- [ ] Add gameplay unit tests and actual Chromium autoplay smoke with screenshots.
- [ ] Run tests, inspect screenshots, fix gameplay/visual issues, score honestly.
- [ ] Commit only repository-scoped game files and verify remote contents, CI or equivalent.

## Input map

A/D or ArrowLeft/ArrowRight movement; W/ArrowUp aim up; S/ArrowDown crouch; Space jump; J/Z continuous fire; K/X grenade; P/Escape pause; Enter start/retry; M mute. Touch pads: movement, up, jump, fire, grenade.

## Mechanics

- Player velocity grounded/airborne, dual-axis aiming, semi-automatic projectile cadence, 3 lives with checkpoints, temporary invulnerability, no unavoidable damage.
- Soldiers fire bullets; mummies approach and spit clouds; bats dive; turret stationary; generators spawn limited waves. Curse causes slow mummy form until antidote or timed cure.
- Pickups: weapon H, spread S, ammo, grenades, health, gems, POW rescues with score rewards; secrets trigger by attack.
- Act breaks using scenery gradients and banners; optional stair/ledge ascent, camera smoothly follows; final mechanical worm boss with telegraphed shots, close-range bite, exposed core, phase escalation.
- Win after boss defeat only; retry restarts cleanly; no timer-based auto-win.

## Acceptance gates and honest scoring

- Determinism, jump/ground, bullet/enemy collisions, grenade splash, checkpoint revival, curse cure, boss damage/death, pause freeze, complete-win path unit tested.
- At least 1 real Chromium run: start, move, jump, shoot, grenade, pause, touch and no page errors; screenshots at desert/tomb/boss/victory.
- Automated agents can use developer diagnostics to travel through the entire stage; this does not establish human difficulty balance.
- Score weighted 25% play feel, 25% visual design, 15% stage fidelity, 15% reliability, 10% controls/accessibility, 10% polish. 10/10 only with fully evidenced gates, never assumed.

## Annotation / challenge decisions

- **Approved:** additive game subdirectory: lowest chance to break existing Pong and simplest rollback.
- **Approved:** illustrations via code: no license/dependency ambiguity and coherent pixel-inspired visuals.
- **Rejected:** copied SNK maps or scraped sprite packs: authorization and attribution not established.
- **Rejected:** random spawn-only arcade demo: lacks a recognizable Egyptian-ruin arc and handcrafted boss.
- **Correction:** use finite combat zones, cap enemy counts and keep a deterministic test mode to avoid unrecoverable boss/softlocks.
