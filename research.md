# Research — Metal Slug 2 / Mission 2: Monument of Depression

Status: **RESEARCH COMPLETE / IMPLEMENTATION NOT STARTED / AWAITING USER ANNOTATION**
Date: 2026-10-09 (UTC+08:00)
Repository: **OGLOCBABY/pong-game** only
Target reference: **Metal Slug 2 (1998), Mission 2**, NOT the altered Metal Slug X variant.
Research branch: **research/metal-slug2-mission2-20261009** (based on main at `1bcb7163f9a5af12376e644d54866accfdcdbeda`).

> Scope invariant: only read/write objects of this repository; do not alter another repository, account, service, local project, or any user file outside this repository. This phase edits only root `research.md` and `plan.md`. No gameplay source files, assets, tests, workflows, releases, deployed website, or main branch have been changed.

## 1. Research methodology and evidence limitations

1. Inspected repository metadata, full recursive main tree, existing project documents, engine, controller, audio, page, stylesheet, five test modules, two GitHub Actions workflows, and configuration using repository-scoped GitHub access.
2. Cross-checked game identity and stage route using a named mission guide, a detailed walkthrough, a contemporary developer interview transcription, a full-game gameplay video's chapter timestamps, and SNK's Steam storefront description.
3. Cross-checked core mechanics (three action buttons, directional aiming, mummy curse, Slugnoid, boss) against multiple sources. A source disagreement is explicitly documented below.
4. Checked licensing statements for candidate CC0 art, a game framework, and SNK copyright/trademark notice.
5. **Not done:** instrumented original game run, original-ROM access, pixel-by-pixel footage analysis, frame-accurate timings, collision-box extraction, speed/frame benchmarks, art/audio downloads, local `npm test`, live game play, end-to-end new-game testing or final quality rating. Video chapters are reference anchors, not proof of frame-by-frame inspection.

Evidence categories: **H** = official statement or two independent consistent descriptions; **M** = one specialized walkthrough plus supporting context; **L** = disputed, incomplete, or still requiring frame-level measurement. Exact positions, frame windows, physics coefficients and boss damage remain **TBD**, not fabricated.

## 2. Audited starting repository

### 2.1 Snapshot (read-only)

- Main branch head at inspection: `1bcb7163f9a5af12376e644d54866accfdcdbeda` (2026-10-08 17:12:37 UTC, last message `test: verify numbered matches across start, restart and rematch`). Main branch unprotected at inspection.
- Repository is public, non-archived. Recursive tree request returned `truncated: false`.
- Existing playable product: **STRIKELINE Pong**; this is **not** an empty repository or a Metal Slug prototype.
- Root runtime: `index.html` + `styles.css` + `favicon.svg`; JavaScript ES modules `src/main.js`, `src/engine.js`, `src/audio.js`.
- `src/engine.js`: exports `WIDTH=960`, `HEIGHT=540`, `WIN_SCORE=7`, `MAX_SCORE=11`, `DIFFICULTIES`, `clamp`, `reflectY`, and class `PongGame`. Constructor `new PongGame({mode,difficulty,seed})`; public lifecycle `reset()`, `start()`, `togglePause()`, `setMode()`, `setDifficulty()`, `setInput()`, `step(dt)`. `step(dt)` takes **seconds**, returns events, with no DOM dependency. Pong logic uses a 960×540 logical field and swept ball collision.
- `src/main.js`: Canvas 2D renderer, hi-DPI resize, requestAnimationFrame with fixed-step accumulator, keyboard/pointer/touch/gamepad behavior, HUD, audio integration, reduced motion and focus pause. Existing diagnostic global: `window.__STRIKELINE_DIAGNOSTICS__`.
- `src/audio.js`: exported `ArcadeAudio`, gesture-unlocked synthesized sound and mute behavior.
- `package.json`: type=module, Node >=20, scripts `npm test`, `npm run smoke`, `npm run check`; development packages `playwright@1.56.1` and `axe-core@4.14.0`; zero declared production dependencies.
- Tests: `tests/engine.test.mjs`, `tests/ai-balance.test.mjs`, `tests/property.test.mjs`, `tests/audio.test.mjs`, `tests/browser-smoke.mjs`. Browser smoke includes real Chromium/Firefox/WebKit flows, automated axe checks, screenshots, game-state diagnostics and external-request assertions.
- CI: `.github/workflows/quality.yml` performs Node tests and Playwright browser checks on push/PR; `.github/workflows/pages.yml` builds and conditionally deploys a static site after successful quality, *only* if Pages Actions source is enabled. Its assembly currently copies only root HTML/CSS/favicon and `src/*.js`.
- The referenced historic Actions run `37813971290` has `conclusion=success` for commit `a9cb39604891f183115b936bce07e3b945af490b`. **That does not independently certify current head, the new branch, or the future game.**
- Previous `qa.md` describes a provisional Pong score and historical automated results. **Those results must not be carried forward as Metal Slug validation.** Current live Pages enablement and URL were not independently verified on this pass.

### 2.2 Compatibility and reuse judgment

| Existing piece | Decision | Rationale |
| --- | --- | --- |
| Pong engine + `PongGame` exports | **PROTECT; DO NOT ADAPT INTO SHOOTER** | Pong swept ball/paddle model does not represent gravity, one-way platforms, enemy projectiles, AI and vertical camera. Rewriting in place would break an existing working game. |
| `src/main.js` controller | **PROTECT; PATTERN ONLY** | Reuse fixed-step/render separation and pause/reduced-motion ideas, but not its DOM IDs or STRIKELINE diagnostics. |
| `src/audio.js` | **PROTECT; PATTERN ONLY** | Valid simple Web Audio design; shooter needs spatial/event mixing, explosive transient variation and independent mute. |
| Root `index.html`, `styles.css`, `favicon.svg` | **KEEP WORKING by default** | Existing Pong home continues loading; new mission gets a standalone route pending user annotation. |
| Existing Node and browser tests | **KEEP GREEN; ADD shooter-specific suites** | Shared repo quality must not regress. Existing tests measure Pong only. |
| Pages workflow | **SURGICAL EXTENSION in implementation** | Current copy recipe will omit a new mission directory; deployment must explicitly include new runtime assets. |
| No production dependency / no build | **PREFERRED** | Pure ES modules + Canvas 2D remain viable for one two-dimensional mission and preserve static hosting. |
| Original `research.md` / `plan.md` | **RE-PURPOSE on research branch** | Historical Pong planning remains available in Git history; `qa.md` and README still document existing Pong. |

## 3. Precise game/reference identity

- Original product: SNK's **Metal Slug 2**, arcade 1998; six missions. Mission 2 is **Monument of Depression**, boss **Aeshi Nero**; playable vehicle **Slugnoid**. Official Steam listing confirms arcade and mission-select modes.
- **Metal Slug X is a different revision:** its Mission 2 outdoor opening is in daylight versus the night opening in Metal Slug 2; Dog Mummy enemies were added to X and are **not** included in the 1998 Mission 2 baseline. Do not mix X/Attack/3 mechanics with target without annotation.
- The old guide may describe boss 2 as **Iron Claw**, while the stage-specific wiki and other guides use **Aeshi Nero**. Treat Iron Claw as guide terminology, **not as evidence of a second boss**.
- Full-game no-commentary video chapter reference: **03:55–10:28 for Mission 2**, a 6m33s chapter in that edited recording; **NOT** a calibrated target completion duration.
  Video: https://www.youtube.com/watch?v=t3Jqo1OBqh8
- Why this stage is difficult: original designers explicitly discuss the **vertical scrolling** and its co-op camera conflict; an initially considered Slugnoid hover action was **removed** to preserve jump tempo. Do not invent free flight/hover for faithful mode.
  Interview: https://shmuplations.com/metalslug2/

## 4. Reconstructed mission flow (order verified; geometry not yet measured)

| Segment ID | Required visual and interactive beats | Scroll/camera | Source confidence |
| --- | --- | --- | --- |
| M2-00: nighttime ruins entrance | Nighttime desert/ruins, Sphinx area, charging Arabian guards, destructible explosive/barrel unlocking tomb path; optional Sphinx eye secret | Primarily horizontal | H |
| M2-01: excavation/tomb | Miners, frightened workers, bats dropping hazards, stone cave/architecture, rescued POWs, collectibles and exploding props | Horizontal with elevation | H |
| M2-02: mummy hill | Ascending sandy slope, normal mummy pursuit, poison clouds and rolling curse projectiles, mummy generators, curative vials; combat tempo changes | Diagonal hill / horizontal progression | H |
| M2-03: deep temple transition | Rumi Aikawa cameo, seated dead explorer with gem and dynamite retaliation, guarded corridor and first upward platforms | Transition to vertical | M–H |
| M2-04: column climb | Tall carved vertical tower with ledges, mummy encounters, treasure chests and POW placements, Bastet-like statues, optional secret lamp/genie event | **Dominant vertical follow** with clamps | H |
| M2-05: Slugnoid + boss | Two-armed jump vehicle on upper ledge, enemy approach and towering mechanical excavator **Aeshi Nero**; fight through telegraphed projectile patterns and vertical lunge/charge while using platforms | Constrained vertical boss arena | H for identity / M for specific attack timings |
| M2-06: result | Boss destruction, falling debris and end-of-mission state, stats including prisoners/score and restart | Camera locked | M |

**Not inferred:** exact map tiles, original length in world pixels, enemy counts/spawn coordinates, every hidden 14-POW location, boss HP, invulnerability frame counts, exact scoring values, projectile speeds or original collision rectangles. These require frame-by-frame measurement or verified primary gameplay instrumentation before a pixel-/frame-accurate claim.

There are **14 POWs** according to the specialist stage guide; initially implement data-driven placements, and mark the 14/14 route as an acceptance gate rather than claiming placement precision now.

### Stage design priorities

- Spatial grammar matters more than decorative similarity: **entry → curse onboarding → hill pressure → vertical precision → mobility reward → vertical Boss**.
- The highest-leverage fidelity features are: input latency/acceleration, readable attack tells, hitstop, crisp sprite animation, persistent event persistence, foreground occlusion, camera timing, projectile speed, and boss vulnerability windows.
- Background layers can use original parallax pixel art evocative of Egypt; copying SNK foreground/background drawings at pixel level is a separate rights issue.

## 5. Gameplay mechanics — truth table

| Mechanic | Verified reference | Proposed acceptance |
| --- | --- | --- |
| Motion + aim | 8-direction joystick, **three action buttons** (A shoot/knife, B jump, C grenade). The original developer interview specifically says they *did not allow diagonal shooting* for approachability. | Movement left/right, crouch, up-shot and down-shot while airborne; no free diagonal bullet vector in faithful baseline; independent key rollover. |
| Weapons | Default pistol, special limited-ammo weapon drops, grenade count; automatic nearby knife when normal | Finite ammo fallback, recoil/cadence and distinct hitboxes; at least pistol, heavy machine gun, shotgun, grenade; extra weapons only if evidenced for MS2 Mission 2. |
| Enemy touch | Normal lethal collision/damage by enemy projectiles; classic arcade stock/respawn and short invulnerability | Clear hit animation, stock depletion, game-over/continue, deterministic respawn, never fake immunity. |
| Mummy curse | Purple poison changes the player into mummy; slow movement and fire, pistol-only, slower grenades, abnormal jump timing, loss of knife; one additional curse hit kills; vial cures | Explicit `human -> cursed -> recovered/dead` FSM; tests for equipment transition, cure and second hit. **Not** a bandage-whip attack (conflicting low-quality third-party guide). |
| Enemies | Arabian infantry, bats, mummies, generators; special mummy with rolling curse projectile | Distinct movement, anticipation, spawn caps and attack cadence; 3+ true behavior types; version X dog mummy excluded. |
| Terrain | Destructible scenery, one-way platforms, steep hill and tall tower, secret rewards | Swept collision, slopes/one-way rules, never trapping character between colliders, scripted reveal events. |
| POW/bonus | Hostages, food, weapon drops, hidden treasures and lamp/genie | Rescuable NPC, rewards/stat accounting and hidden-path reproducibility; cannot score as fully mirrored until positions checked. |
| Slugnoid | Twin guns, heavy downward attack, armored vehicle and jumping traversal; hover mechanic was deliberately cut | Board/exit, independent animation/collision, damage progression, down-facing special attack and loss conditions. |
| Boss | Aeshi Nero rising/climbing giant machine; telegraphed projectiles, lunge/charge, platform navigation; equipment drops may appear | Deterministic FSM: intro/pattern A/pattern B/lunge/stagger/death, independent projectile collision; full clear in scripted play. |
| Cooperative play | Original supports two players; vertical scrolling was a known challenge | Two-player architecture considered from day one, optional local cooperative acceptance stage after solo baseline; **not** silently count a solo-only build as complete arcade fidelity. |

References:
- https://metalslug.fandom.com/wiki/Monument_of_Depression
- https://retrogamehub.org/en/game/arcade-mslug2/
- https://www.trueachievements.com/game/ACA-NEOGEO-METAL-SLUG-2/walkthrough/3
- https://metalslug.fandom.com/wiki/Transformations
- https://metalslug.fandom.com/wiki/Mummies
- https://shmuplations.com/metalslug2/
- https://store.steampowered.com/app/366260/METAL_SLUG_2/

**Conflict resolution:** One third-party online-game summary calls the mummy weapon a “bandage shot” and another says diagonal/8-way shooting. Specialist guides and descriptions of the native game consistently indicate slowed **pistol** in mummy form; the original developer interview explicitly cautions against **diagonal shooting**. Choose the better-evidenced behaviors, record disputed minutiae as TBD pending gameplay verification.

## 6. Visual, audio and source-license audit

### 6.1 Separation of reference vs distributable assets

**Reference material for analysis only:** original-game footage, wiki screenshots, character frames, boss screenshots and maps. **Not authorized as shipped game assets** merely because an image is online, ripped, in an open GitHub repository, or used in a fan game. Name, trademarks, distinctive character designs, level artwork, music and sound may be protected. SNK notices specifically assert IP in the game universe; this plan grants no license.

A faithful **playable tribute/prototype** can aim at the **structure, tempo and interactions**, using **new original pixel art, original sound and CC0 assets**. A literal audiovisual/content-identical mirror requires a separate authorization decision with evidence of applicable rights; do not assume “noncommercial” or public GitHub is permission.

**Do not**:
- extract/commit ROMs, spritesheets, background rips, copyrighted score/sound effects or game binaries;
- hotlink game media at runtime;
- use a repository's OSS code license to infer its embedded SNK sprites are redistributable;
- ship a branded representation that could suggest SNK endorsement.

### 6.2 Reusable permissive asset candidates (not yet downloaded)

| Resource | Specific verified license | Likely use | Limitation |
| --- | --- | --- | --- |
| Kenney Pixel Platformer — https://kenney.nl/assets/pixel-platformer | **CC0**, source page states 200+ 18×18 sprites | Terrain/pickups as prototyping scaffolds | Too generic/bright for final arcade style; palette and silhouette redraw required. |
| Kenney Platformer Art Pixel — https://kenney.nl/assets/platformer-art-pixel | **CC0**, 900+ tiles | Platforms, breakables, decorative inspiration | Not SNK-equivalent craft; verify included license for imported files. |
| Kenney Pixel Platformer Blocks — https://kenney-assets.itch.io/pixel-platformer-blocks | **CC0**, 80+ colored tiles | Stone construction/block variation | A tile bank, not detailed ruins. |
| Pixel Explosion — https://opengameart.org/content/pixel-explosion | **CC0** on file page | Study or interim FX sprite | Verify archive contents, animation speed and provenance before bundling. |
| 16x16 Explosion — https://opengameart.org/content/16x16-explosion | **CC0** on file page | Tiny sparks/explosions | Need upscale/redo for coherent large effects. |
| Phaser (alternative engine) — https://phaser.io/download/license | **MIT** | Camera, tilemaps and animations if custom rendering proves too expensive | Bundler/runtime weight and engine-physics behavior diverge from existing architecture; not the default. |

Recommended artistic pipeline: create an **original** palette, material language and frame-based characters; reuse CC0 as temporary collision-shape or fill-in only. Use pixel-art layer separation (sky/mid/back/foreground), animation state sheets, camera-driven parallax, palette swaps, dust, muzzle flash and original procedural sound synthesis. Asset manifest must list source URL, creator, exact license, version/download date, whether transformed, and local path; no asset enters runtime without traceable permissions.

MDN reference: `CanvasRenderingContext2D.imageSmoothingEnabled = false` keeps pixel scaling crisp:
https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled

### 6.3 Art production bottleneck

Authentic high-density pixel art and nuanced character animation are **not solved by installing a framework**. A playable stage with plain rectangles and a boss HP bar is only a proof of mechanics, not a faithful mirror. Require defined sprite frame budgets (see plan) and screenshot review against **visual references**, not copy/paste of protected images.

## 7. Architecture decision from first principles

**Preferred option: separate static ES-module mission inside this repository**, keeping original Pong intact:

`mission2/index.html` + `mission2/styles.css` + `mission2/src/*` + `mission2/assets/*` + `mission2/tests/*` (plus strictly necessary changes to root `package.json` and workflows once approved).

- Deterministic **pure simulation** at fixed substeps; simulation must not call DOM, Date.now, Math.random, network or render.
- Separate input adapter, scene data, collision physics, actor systems, enemy AI, boss FSM, camera controller, renderer, audio, HUD and diagnostics.
- Layered stage descriptors drive scrolling camera, boundaries, triggers, spawns, pickups and hidden events. Favor simple arrays and state machines; **no generic ECS framework** necessary.
- Resolution proposal: **320×224 logical pixels**, integer or nearest-neighbor scaling with letterboxing and optional UI overlay. This is a **provisional design target**, not yet a verified exact Neo Geo active viewport measurement.
- Use asset atlases where justified, but no CDN at runtime.
- Fixed simulation step proposal: **1/120 s**, render at refresh and cap catch-up; exact movement coefficients will be measured and tuned against reference. Rationale: repeatable collision logic and event replay, not a claim the 1998 game simulated at 120Hz.
- Start with keyboard/gamepad; offer remappable controls and feasible multitouch after test. Avoid simultaneous actions that trigger unwanted vehicle self-destruct.
- Avoid overengineering: Phaser 3/4, Vite, Tiled exporters or custom scripting languages are not prerequisites. Consider only if measured limitations show benefit. Phaser MIT confirmed, so a *licensed* fallback exists.

## 8. Baseline risks, blockers and priorities

| Severity | Finding / blocker | Treatment |
| --- | --- | --- |
| Critical | Rights to exact SNK sprite/audio/level assets **not established** | Default to original/CC0 distributable art, never claim original assets licensed; user must explicitly resolve any literal-copy route. |
| Critical | Original frame geometry & animation timings **not measured** | Before claiming high fidelity, create a timecoded reference checklist and mark evidence for each transition; keep estimates labeled. |
| High | Vertical camera + two players may produce unfair fall deaths | Camera safe-zone/catch-up design and tests; design for co-op before optional rollout. |
| High | Mummy mechanics vary in low-quality secondary sources | Lock evidence-based pistol/slow/jump/cure/second-hit behavior; verify visually. |
| High | Boss fight can deadlock due to camera/FSM/pathing | Deterministic phases and live scripted boss victory + death/restart regression. |
| High | Reusing Pong files in place breaks legacy game | Isolate new runtime under `mission2/` by default; no change to protected Pong exports. |
| High | Pages build copies only root + `src/*.js` | New mission omitted until deployment job explicitly updated and verified. |
| Medium | UI/menu/input conflicts with legacy scripts | Separate route/DOM and diagnostics namespace. |
| Medium | Asset dimension mismatches / visual incoherence | Fixed palette, spritesheet scale, automated lint+visual comparisons, provenance manifest. |
| Medium | CI availability ≠ human playtest | Report exact tested cases; score remains provisional while real play/input/audio gates remain open. |
| Medium | Original slowdown/bugs might seem “authentic” | Preserve design rhythm, not engine lag or exploit freezes; make bug replication opt-in only if supported. |

## 9. Research deliverable checklist

- [x] Repo confined to `OGLOCBABY/pong-game`; existing source and infrastructure enumerated.
- [x] Current contract and main head recorded; historic CI success qualified.
- [x] Original MS2 versus MSX stage differences and core chronological flow mapped.
- [x] Source agreement/disagreement recorded, with unmeasured facts identified.
- [x] Engine, level, animation and control implications identified.
- [x] Candidate CC0 and MIT external options researched, **none copied/imported**.
- [x] Legal/technical and 10/10-certification gates documented.
- [ ] User annotations on `plan.md` and scope gates.
- [ ] **Implementation**, assets, code tests, browser play and release: NOT STARTED.

## 10. Source register (readable, verifiable references)

- [S1] Official game description / original mission mode: https://store.steampowered.com/app/366260/METAL_SLUG_2/
- [S2] Mission 2 route, named boss, vehicle, MS2 vs X: https://metalslug.fandom.com/wiki/Monument_of_Depression
- [S3] Arcade game guide with detailed mission 2 sequence: https://retrogamehub.org/en/game/arcade-mslug2/
- [S4] Contemporary developer interview originally in Gamest, English transcription and editor's attribution: https://shmuplations.com/metalslug2/
- [S5] Edited playthrough; Mission 2 chapter 03:55–10:28, **not** measured frame-by-frame: https://www.youtube.com/watch?v=t3Jqo1OBqh8
- [S6] Mummy mechanics / transformation: https://metalslug.fandom.com/wiki/Transformations and https://metalslug.fandom.com/wiki/Mummies
- [S7] Alternate walkthrough: https://www.trueachievements.com/game/ACA-NEOGEO-METAL-SLUG-2/walkthrough/3
- [S8] Stage 2 boss: https://metalslug.fandom.com/wiki/Aeshi_Nero
- [S9] SNK IP notice (a separate SNK Metal Slug product's terms, **not legal opinion on Metal Slug 2**): https://game.snk-corp.co.jp/official/metalslug_attack/terms/
- [S10] CC0 source assets: https://kenney.nl/assets/pixel-platformer ; https://kenney.nl/assets/platformer-art-pixel ; https://opengameart.org/content/pixel-explosion
- [S11] Phaser MIT license: https://phaser.io/download/license
- [S12] MDN nearest-neighbor Canvas scaling: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled

This research is a **technical specification baseline**, not a representation that an exact copyrighted audiovisual clone is already legally cleared, developed or evaluated.