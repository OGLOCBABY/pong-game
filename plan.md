# Plan — Metal Slug 2 / Mission 2: Monument of Depression

**Stage gate: PLANNING + ANNOTATION / NOT APPROVED / DO NOT IMPLEMENT**
Updated: 2026-10-09 (UTC+08:00)
Repo and absolute write boundary: **OGLOCBABY/pong-game**
Branch for review: **research/metal-slug2-mission2-20261009**
Baseline: main `1bcb7163f9a5af12376e644d54866accfdcdbeda`; see [research.md](research.md).

This is a proposed technical plan. **No implementation permission is assumed from the existence of this file.** The user's comments under **Section 12** determine what is accepted, amended or rejected. After those comments, revise the plan into approved atomic checklists, then and only then implement.

## 0. North star / priority hierarchy

Produce a **playable, coherent, highly faithful mechanical and structural recreation** of the **1998 Metal Slug 2 Mission 2**, from the nighttime ruins to the final Aeshi Nero defeat, playable in a modern browser, with polished original/authorized pixel art and sound. **No original game ROM, pirated asset pack, or unlicensed SNK media enters the runtime.** This limitation is part of product truthfulness, not a reason to reduce game quality.

Priority order when tradeoffs conflict:
1. Playable mission from beginning to boss defeat (no fake cutscene win).
2. Responsive controls, credible jumps/shooting, reliable terrain/enemy/boss combat.
3. Faithful encounter order, camera behavior, mummy state, Slugnoid and optional secrets.
4. Rich, style-cohesive authored pixel animation, backgrounds, explosions and sound.
5. Original POW/score economy, local co-op, nonessential hidden collectibles, comfort/accessibility options.

Do **not** label a vertical slice, static image, or an auto-play-only scenario “complete”. Do **not** give a self-awarded 10/10 because tests passed; evaluation must record evidence and outstanding gates.

## 1. Protected interfaces and repository boundary — NON-NEGOTIABLE

- All remote reads/writes for this work under **`OGLOCBABY/pong-game`**; no sibling repos, external GitHub content mutation, linked-drive mutation, credential access, external accounts or remote deployment action.
- Keep the **Pong game playable at its existing root route** during implementation. No deletion or in-place rewrite of its runtime unless the user annotates an explicit migration.
- Frozen existing public Pong API and behavior (until a separately approved migration):
  - `src/engine.js` exports **`WIDTH`, `HEIGHT`, `WIN_SCORE`, `MAX_SCORE`, `DIFFICULTIES`, `clamp`, `reflectY`, `PongGame`**.
  - `new PongGame({mode,difficulty,seed})`; methods `reset/start/togglePause/setMode/setDifficulty/setInput/step(dt)`; `step` takes seconds and returns events.
  - Pong UI IDs/classes referenced by `tests/browser-smoke.mjs` remain valid.
  - `window.__STRIKELINE_DIAGNOSTICS__` stays stable; Pong localStorage key `strikeline:settings:v1` remains untouched.
  - `npm test`, `npm run smoke`, `npm run check` must still work; do not remove existing suites to force green CI.
  - Root `index.html`, `styles.css`, `favicon.svg`, and source modules remain served; Pages workflow must continue shipping them.
- Do not force-push, rewrite existing history, alter project visibility, modify repo settings, write elsewhere or claim an unverified Pages URL.
- Current documentation branch may change only **`research.md` and `plan.md`** until annotation is settled. `main` remains unchanged.
- Any third-party file must have explicit asset-level license evidence. **MIT for an engine does not license its sprites; an “open source” repository does not automatically grant SNK asset rights.**
- If a new game architecture proves wrong, revert its isolated commit/branch rather than layering patches on an invalid direction.

## 2. Architecture selection and alternatives (annotation required)

### Option A — Recommended: isolated game under `mission2/`

`mission2/index.html`, `mission2/styles.css`, `mission2/src/*`, `mission2/assets/*`, `mission2/tests/*`. Keep current Pong at repository root. Add optional root navigation only with consent. GitHub Pages project URL would place the new game at relative path **`mission2/`** when Pages exists.

Advantages: zero Pong API churn, clear rollback, no framework/build by default, easy separate screenshot & autoplay tests. Cost: new link needs to be supplied; separate routes share same repository. **Recommended** until changed in Section 12.

### Option B — Replace home page, archive Pong under `pong/`

Makes shooter the default homepage but forces moving/rewriting existing URLs, test paths, CI packaging, and documentation. **Reject by default**: more risk and gratuitous interface churn without explicit instruction to displace Pong.

### Option C — Third-party framework (Phaser 3/4 + bundler)

Pros: camera/tilemap/animation utilities. Cons: runtime/build complexities and different collision/game-feel semantics. Phantom claims about “best engine” should not drive adoption. **Defer**; use only if actual constraints defeat a small deterministic Canvas model. Phaser MIT reference: https://phaser.io/download/license.

**Decision checkpoint G0:** confirm A/B and rights mode via annotations before any implementation.

## 3. Proposed implementation layout and responsibilities

All paths below are **future**, not existing, unless specifically marked:

```text
pong-game/                         # repository root; existing Pong remains usable
├── index.html                    # PROTECTED Pong
├── styles.css                    # PROTECTED Pong
├── src/{engine,main,audio}.js     # PROTECTED Pong
├── tests/*.mjs                   # PROTECTED existing Pong suites
├── research.md                   # this research
├── plan.md                       # this plan
├── qa.md                         # existing Pong QA; leave intact, no misleading reuse
├── mission2/
│   ├── index.html                # standalone accessible shell/canvas/HUD
│   ├── styles.css                # nearest-neighbor game presentation and touch UI
│   ├── src/
│   │   ├── game.js               # pure MissionGame core / deterministic state
│   │   ├── physics.js            # swept AABB / one-way/sloped platform resolution
│   │   ├── entities.js           # player, mummies, bats, infantry, POWs, collectibles
│   │   ├── weapons.js            # pistol/HMG/shotgun/grenade/projectiles
│   │   ├── mission-data.js       # scene layout, triggers, enemy and secret placements
│   │   ├── camera.js             # side scroll -> constrained vertical follow
│   │   ├── boss.js               # Aeshi Nero FSM, telegraphs, attacks, destruction
│   │   ├── slugnoid.js           # jump vehicle, boarding, hits, guns, downward cannon
│   │   ├── input.js              # keyboard/gamepad/touch -> action intents
│   │   ├── render.js             # visual layers, art atlases, VFX and palette
│   │   ├── audio.js              # independent sound cues/mixer, gesture unlock
│   │   └── main.js               # DOM wiring, time accumulator, boot/pause/reset
│   ├── assets/
│   │   ├── sprites/              # original/authorized pixel art ONLY
│   │   ├── backgrounds/          # original/authorized parallax layers
│   │   ├── audio/                # only licensed authored recordings if needed
│   │   └── SOURCES.md            # per-asset provenance & licenses (including CC0)
│   └── tests/
│       ├── game.test.mjs
│       ├── physics.test.mjs
│       ├── enemies.test.mjs
│       ├── boss.test.mjs
│       ├── route.test.mjs
│       ├── property.test.mjs
│       └── browser-play.test.mjs
├── package.json                  # add mission scripts, do not replace old ones
└── .github/workflows/*.yml       # extend existing QA and static packaging only
```

**Simplification rule:** these are responsibility boundaries, **not an instruction to create empty abstraction files**. Combine modules where smaller is clearer (e.g. `entities.js` + `weapons.js` when tiny). Never add a generic entity-component system, external database, backend or network protocol for a single local stage.

## 4. New engine contract (proposed; protect after approval)

The old Pong public API is not repurposed. The shooter gets its own, documented core:

```js
// mission2/src/game.js — PROPOSED CONTRACT, NOT IMPLEMENTED
export class MissionGame {
  constructor({ seed = 1, difficulty = 'arcade', players = 1 } = {}) {}
  reset({ seed } = {}) {}                       // returns to mission start
  start() {}                                   // idle -> intro -> playing
  setInput(playerIndex, intents) {}            // normalized move/aim/fire/jump/grenade
  step(seconds) {}                            // advances deterministic simulation, emits events
  togglePause() {}                            // freezes sim; never alters elapsed world time
  snapshot() {}                               // readonly serializable deterministic diagnostics
}
```

Suggested immutable stable terms:

- Core phases: `idle`, `intro`, `playing`, `paused`, `bossIntro`, `bossFight`, `missionClear`, `gameOver`.
- Player state: `human` / `cursed` / `dead` / `respawning`; location `onFoot` or `inSlugnoid`. Don't mix independent flags into one giant combinatorial enum.
- 2D world: logical coordinates, positive x right / positive y down; finite bounds, tile and platform collision separation; fixed-step `dt=1/120` seconds proposed.
- `step()` never consults wall-clock time, browser APIs, DOM, global random, or asset-loading promises. Seeded PRNG controls spawn and visual-event variants; rendering interpolation must not mutate simulation.
- Input schema normalized example: `{ moveX: -1|0|1, aim: 'up'|'forward'|'down', crouch: boolean, jumpPressed: boolean, fireHeld: boolean, grenadePressed: boolean, enterPressed: boolean }`. A held key and a just-pressed edge are different; don't lose button edges across frame rates.
- Output events: `shot`, `knife`, `hit`, `explode`, `rescue`, `pickup`, `curse`, `cure`, `boardSlug`, `slugDamaged`, `bossPhase`, `bossDefeated`, `missionClear`. **Only events** drive audio, particles, HUD announcements; no audio calls in the core.
- Diagnostic browser namespace: `window.__MONUMENT_DIAGNOSTICS__ = { snapshot, inputForTest? }`. Normal gameplay continues with that hook unavailable; no privileged win/teleport state mutation in acceptance tests.
- Difficulty: `arcade` baseline first. If accessibility options added, never call them original arcade balancing or let them affect deterministic reference benchmark.
- Side camera, vertical camera and boss arena boundaries provided as data rather than scattered magic numbers.

**Implementation sketches (architecture, not working code):**

```js
const FIXED_DT = 1 / 120;
accumulator = Math.min(accumulator + frameSeconds, 0.10);
let steps = 0;
while (accumulator >= FIXED_DT && steps < 12) {
  for (const evt of mission.step(FIXED_DT)) present(evt);
  accumulator -= FIXED_DT;
  steps++;
}
renderer.draw(mission.snapshot(), accumulator / FIXED_DT);
```

```js
// Mission data instead of a long hardcoded 'if (player.x > ...)' chain.
export const route = [
  { id: 'M2-00', camera: 'horizontal', trigger: 'ruinsEntrance', spawns: [] },
  { id: 'M2-01', camera: 'horizontal', trigger: 'mineDoor', spawns: [] },
  { id: 'M2-02', camera: 'slope',      trigger: 'mummyHill', spawns: [] },
  { id: 'M2-03', camera: 'transition', trigger: 'columnBase', spawns: [] },
  { id: 'M2-04', camera: 'vertical',   trigger: 'towerUpper', spawns: [] },
  { id: 'M2-05', camera: 'boss',       trigger: 'aeshinero', spawns: [] },
];
```

These coordinate-free skeletons are intentional: fill map positions, frame values and boss cadence only after reference measurement and recorded evidence. Do not present placeholders as extracted original layout.

## 5. Mechanic-by-mechanic build specification

| System | Minimum fidelity before “playable mission” | 10/10-candidate verification extension |
| --- | --- | --- |
| Player movement | Smooth walk, turnaround, crouch, responsive jump, variable airborne control bounded by reference, gravity and landing | Side-by-side measured jump apex/flight and near-pixel collision feel, stable at 30/60/120 fps; optional gamepad |
| Aim/shoot/melee | Horiz./up/down shoot, automatic proximity knife, different projectile behaviors | Realistic shot cadence, recoil, muzzle flash, casing, animation windup; verified no arbitrary diagonal firing |
| Arsenal | Pistol unlimited, HMG and shotgun finite ammo, standard grenades, pickups and fallback | Reference-consistent damage tiers, knockback, ammo HUD, reload/empty effects where applicable |
| Normal/cursed | First curse hit changes state, impairs actions, cure returns to human, further cursed hit lethal | Specific movement delay, frame animation, altered jump arc, slowed pistol and grenade recovery |
| Threats | Arabian infantry, bat droppers, mummy gas, poison ball, destructible generator | Distinct attack windups/sprites/audio, hitbox fairness, spawn budget, diverse deterministic tactics |
| Scenery | Tomb, Sphinx, ruin, horizontal mine, ascending hill, platforms, destructible props | Fine parallax/occlusion, visibility rules, staged prop destruction and coherent lighting |
| Rescue/secret | Rescuable POW, weapon rewards, treasure, secret lamp event | Reconcile 14 POW positions with evidence; combo/score and escape timing; hidden genie scene |
| Camera | Horizontal follow with soft clamp, transition to vertical tower, no sudden jump/clip | Reference-matched thresholds and two-player safe-zone strategy; no unfair offscreen deaths |
| Slugnoid | Board/exit, jumping vehicle, two arm guns, down cannon, hits and destruction | Arm-loss/damage visuals, vehicle-specific physics, self-destruct guard / emergency exit |
| Boss | Full Aeshi Nero fight, telegraphed attacks, damage/death animation, real health exhaustion | Pattern cadence/phase transitions tuned by reference; defeat on foot or in vehicle, no boss-freeze exploit |
| Mission lifecycle | title/start, intro, life/loss, restart, boss clear, score/POW result | Continue/co-op flow, accessibility options, persistent audio prefs and sensible mobile landscape layout |

**Visual asset minimum to be scoped during art production**: player sprites must have independently readable idle/run/fire(up/forward/down)/jump/crouch/knife/curse/hit/death; mummies crawl/breathe/roll projectile/fall; bat fly/drop; Slugnoid idle/move/jump/fire/damage; boss pose/attack/tell/damage/death; props distinct impact and debris; all backgrounds coherent at one fixed pixel scale. **Frame counts are TBD** after shot-list study; avoid invented “authentic” counts.

## 6. Reference-capture and art-pipeline gating

### G1 — evidence board **before** claiming mechanical fidelity

- Record footage/video timecodes for each M2 segment, camera transition, enemy introduction, weapon drop and boss attack: `mission2/reference-checklist.md` (text and self-created timing annotations only).
- Reconcile primary question: night MS2 versus daylight MSX (pick MS2 only), mummy pistol versus rumor, no free diagonal shots, no dog mummies, removed vehicle hover.
- Measure observed relative jump height, speed, animation rhythm, bullet speed, mummy reaction window, camera follow anchors and boss telegraph intervals from lawfully accessible reference. **Unknown values remain TBD.**
- If original footage access/measurement is unavailable, make calibrated approximations and **record uncertainty**. Exact-frame parity is a gated claim, not assumed.

### G2 — authorization-aware art pipeline

- Create a consistent art bible: Egyptian ruins, warm sandy entrance, desaturated cavern/greenish stone, hand-crafted 1990s arcade-style silhouette, atmospheric dust and highly legible hit flashes, all **new** art.
- Original/CC0 only; imported image/audio gets `mission2/assets/SOURCES.md`: creator, URL, license/version/date, transformation record, file list. Do **not** download unverified rips because they “look perfect.”
- Programmatic render screenshot audit: reference **composition** and behavior, not pixel-for-pixel copying of protected art. Score final scene art for readability, animation density, consistency and frame pacing.
- First asset pack prototype may use Kenney CC0 + custom generated shapes; **must be replaced/retouched to coherent quality before declaring final**. Asset engine/framework MIT licenses must be logged separately.

### G3 — audiovisual acceptance

- Intro/mummy valley/tower/boss have recognizable atmosphere transitions; every shot, impact, rescue, jump, vehicle and boss move gets distinctive original sound family.
- Real browsers unlock audio only after user gesture; muting never spawns an AudioContext or network request. Respect reduced motion and page visibility.
- No unlicensed soundtrack or exact sampled callouts from original Metal Slug.

## 7. Sequential milestones + atomic execution checklist (all implementation unchecked)

**Planning gate is currently closed.** The checkboxes below are the proposed future execution order, *not* evidence of work done.

### P0 — evidence + approval

- [x] Review current main recursive tree, source, docs, workflows and QA history without changing game.
- [x] Research game identity, reference flow, core mechanics and mismatches across sources.
- [x] Check candidate reusable assets/frameworks and document intellectual-property constraints.
- [x] Produce repository-scoped `research.md` + `plan.md` on isolated review branch.
- [ ] Get user annotations A1–A8; resolve rejected assumptions in these documents.
- [ ] Re-issue a revised, user-approved `plan.md` with selected decisions and exact acceptance matrix.
- [ ] **Only then** begin implementation.

### P1 — standalone mission skeleton

- [ ] Add `mission2/index.html`, local styles and module entry; keep root Pong unchanged.
- [ ] Make start, pause, gameover, reset, restart and missionClear transitions explicit.
- [ ] Provide responsive pixel-perfect letterboxing at logical target (provisional 320×224), Canvas nearest-neighbor and touch-safe sizing.
- [ ] Implement new deterministic `MissionGame`, seeded randomness, event stream and immutable diagnostics snapshots.
- [ ] Add 120Hz fixed-step accumulator (or documented correction), capped simulation catch-up and invariant assertions.
- [ ] Unit-test state transitions, paused freeze, seeded replay equality and boundary finite values.
- [ ] Browser-smoke Chromium initial render, input, pause/restart, no exceptions and screenshot; no “game complete” claim at this point.

### P2 — terrain + complete traversable stage

- [ ] Implement swept actor/world solid collisions, one-way platforms, slopes, wall/platform interaction and stepping off ledges.
- [ ] Implement horizontal tracking, horizontal→vertical camera transition, vertical clamping and boss-camera lock.
- [ ] Author M2-00 through M2-05 geometry and stage event triggers, with explicit route data separate from rendering.
- [ ] Implement local coordinate debug view (development only; not hidden cheat in normal mode).
- [ ] Add tests: never fall through one-way platforms; never tunnel on coarse dt; no camera teleport; full path traversal by scripted legal inputs.
- [ ] Verify checkpoint-by-checkpoint screenshots for entrance, hill, tower, arena; no overlapping/torn tile seams.

### P3 — combat + curse

- [ ] Implement walk/run/crouch/aim/jump/knife/shoot/grenade intent routing and key rollover.
- [ ] Implement projectile pooling, collision and simple ballistic grenade logic; pistol/HMG/shotgun.
- [ ] Implement Arabian infantry, bats, mummy poison cloud/rolling curse, mummy generators with distinct FSM and animation tells.
- [ ] Implement human/cursed/recovered/respawn interactions, ammo loss and cure behavior.
- [ ] Add POW rescue, hidden pickups, score, weapon drops, secret genie event and enough equipment to defeat boss.
- [ ] Unit-test curse first-hit/nonlethal, second-hit fatal, cure restores; projectile bounds/damage, pickup/reward once-only, no hostile spawn overflow.
- [ ] Script-play full route with enemies enabled; player reaches top **without debug teleport**.

### P4 — Slugnoid + Aeshi Nero

- [ ] Implement boarding/exiting, twin weapons, vehicle gravity/jump, downward special, health/damage and destruction.
- [ ] Implement boss intro, attack pattern rotation, explicit telegraphs, collision harm, damage windows and deterministic phase FSM.
- [ ] Boss fight must support victory using vehicle and on foot (different difficulty, not exploit).
- [ ] Boss defeat plays original authored animation/effects, advances to actual `missionClear` and score/POW summary.
- [ ] Tests: pattern sequence and seeds, projectile limits, telegraph before damage, damage interval, no softlock, restart after defeat/loss.
- [ ] End-to-end browser playthrough from M2-00 → M2-06 **using real input events / simulation without direct mission-state mutation**.
- [ ] Add 30–100 seeded simulated route attempts to catch softlocks; record deaths, completion rates and failure locations (coverage goal, **not** a fabricated original win rate).

### P5 — art/audio/polish + performance

- [ ] Replace prototype primitive visuals with authored/authorized high-density pixel animations; implement parallax/background, foreground and props.
- [ ] Validate coherent color/material, silhouette/readability, enemy tell frames and shot-to-hit visual feedback in screenshots.
- [ ] Original weapon/explosion/mummy/vehicle/Boss sounds and mixing; audio-off/mute tests.
- [ ] Add camera shake, impact freeze, debris and palette flashes with motion-reduction support; performance-budget particles by scene.
- [ ] Tune feel against captured source evidence: acceleration, jump apex, spawn pacing, curse timings, boss phases; log measured-vs-target values.
- [ ] Accessibility: start/pause/replay via keyboard, focus, captions/labels for controls, adequate menu contrast and optional no-shake mode.
- [ ] Run real Chromium, Firefox and WebKit; desktop + narrow-phone portrait + phone landscape, gamepad/touch if implemented.
- [ ] Capture visual checkpoints and test artifacts inside the repository's `test-results/` only.

### P6 — full fidelity, co-op, distribution and quality gates

- [ ] Evaluate feasibility and implement two-player local co-op camera constraints; if omitted, mark **fidelity blocker** rather than quietly calling complete.
- [ ] Reconcile 14 reference POW locations, optional rewards and hidden lamp(s) with recorded evidence.
- [ ] Add scripts `npm run test:mission2`, `npm run smoke:mission2` while preserving existing `npm test`, `npm run smoke`, `npm run check`.
- [ ] Extend CI to test **both games** on PR and main, with mission screenshots/artifacts; do not weaken original Pong suite.
- [ ] Extend Pages artifact assembly to include `mission2/` runtime files and needed authorized assets, preserving the root Pong packaging.
- [ ] Browser navigate relative `./mission2/` path; verify nested Pages path uses no leading-slash CDN URLs or broken imports.
- [ ] Recheck no unauthorized game assets, no third-party runtime request, no secrets, no remote writes beyond this repo.
- [ ] Create `mission2/qa.md` evidence log (test commands, builds, ref timings, browser/screenshots, playthrough outcomes, unresolved gates).
- [ ] Perform true scripted gameplay and independent visual inspection; record failures, fix root cause, rerun suite and full route.
- [ ] Record all quality subscores with supporting evidence, gaps and known constraints.
- [ ] When all approved gates pass, ask for review and only then merge using a fast-forward/standard PR workflow; **do not force push**.

## 8. Testing, autoplayer and honest scoring

### 8.1 Evidence pyramid

1. **Pure unit/property tests**: deterministic/replay state, finite coordinates, collisions, player/enemy FSM, pickups and camera invariants.
2. **Simulation-driven agents**: scripted legal inputs navigate stages, fight enemies, operate Slugnoid and boss; agent cannot set `boss.hp=0`, teleport, grant infinite ammo or invoke debug win.
3. **Real browser input**: Playwright sends keydowns, pointer/touch and gamepad events where supported, handles pause/blur/fullscreen, plays a complete round including death/rematch and mission clear.
4. **Art inspection**: evidence screenshots from multiple camera states, matched by shot-list and visible in the repo/CI artifacts. No automated “zero pixels different” benchmark to unlicensed original artwork.
5. **Manual/sensory audits**: actual input feel, audio, device performance and comparative qualitative review. Unperformed checks stay open.

### 8.2 Deterministic acceptance invariants

- All actor coordinates, velocities, HP, ammo and timers finite; no NaN/Infinity; actor remains within world or explicitly documented death plane.
- No passing through thin solids at normal or worst-case fixed-step speeds; no collision softlock between one-way platform and wall.
- Identical inputs + seed + step schedule => identical world and boss state sequence (renderer/audio nondeterminism excluded).
- Every scripted stage trigger fires **once** or only per documented cycle; player can return between map segments without re-awarding pickups.
- Curse must apply only once on first hit and kill on second cursed hit; vial restores form, not missing lives.
- Weapon ammo decreases correctly and pistol remains operable at zero special ammo; sprite state matches weapon/mount state.
- Boss gives visible attack tell before every damaging move; cannot damage dead/paused player, cannot stall forever.
- Same mission reachable/clearable at 30, 60 and 120 Hz browser rendering. Browser frame cadence must not alter fixed-step sim.
- Paused, backgrounded, lost-focus and restart states suppress unintended input and physics; localStorage failure must not prevent starting.
- Baseline Pong old API and suites remain passing.

### 8.3 Evaluation: target 10/10, not a self-issued badge

Weighted candidate rubric (0–10 per category):

| Domain | Weight | Evidence for a high score |
| --- | ---: | --- |
| Mechanics and original game feel | 25% | Timed input, jump/shoot/curse/grenade/Slugnoid tested, reference comparison |
| Stage route and secrets fidelity | 20% | All major beats M2-00 to M2-06, POW/collectible reconciliation |
| Visual animation and effects | 20% | Art continuity, expressive animations, multiple screenshot checkpoints |
| Enemies and boss execution | 15% | Distinct enemy patterns, verified boss FSM, full victory and replay |
| Reliability, performance and automated QA | 10% | Green old+new tests, cross-browser full route, no runtime errors/softlocks |
| Sound and feedback | 5% | Audio audit, balanced authored cues, mute and motion settings |
| Control accessibility and platform coverage | 5% | Keyboard/gamepad/mobile, readable UI and recovery affordances |
| **Total** | **100%** | **Evidence based; never inferred from intent** |

**No numerical claim of superiority/equivalence to “Opus 5.5”** without a matched implementation, same test protocol and evaluators. The phrase is a desired workmanship benchmark, not an objective metric here. A supposed “10/10” is **not** valid until every approved critical gate is verified and no known critical defect remains; missing manual real-device or legal-rights evidence must be plainly stated.

### 8.4 Reproduction commands (future after code exists)

```bash
npm install
npm test                      # legacy Pong regression suite
npm run smoke                 # legacy Pong browser tests
npm run test:mission2         # NEW deterministic mission physics/routes/enemies
npm run smoke:mission2        # NEW browser mission playthrough + screenshots
npm run check                 # all required suites after integrated script update
```

CI browser installation and screenshot path policies remain repository-scoped. **These new scripts currently do not exist; this is not a test-pass report.**

## 9. Branching, rollback and no-leak discipline

- Research artifacts live on one **review branch** only; base original Pong main remains untouched.
- User annotates this `plan.md` directly in the branch (or in its PR review) and optionally `research.md`. Each resolved annotation is checked/linked in revision history.
- After gate approval, implementation commits should be small, ordered by P1…P6. Never preemptively modify root Pong.
- If `mission2` architecture, rights basis or camera model fails a critical test, **revert to last passing isolated commit** and revise plan rather than “stabilizing” a fundamentally wrong base with patches.
- Asset provenance checked *before* commit (no suspicious graphics embedded in code, no ROM, no commercial soundtrack or ripped sprite).
- A GitHub Actions deployment to Pages is a **future user-authorized distribution event**, not a consequence of merely writing documents.
- All scratch logs/screenshots/temporary art created **inside this repository** and excluded as appropriate; no sibling paths.
- If main moves after the research SHA, refresh protected contracts and rebase/merge normally; never overwrite concurrent changes with a stale blob SHA.

## 10. Risk tradeoff log / adversarial annotations

- **Rejected:** repurpose `PongGame` into 2D platformer physics. It violates protected contracts and adds migration effort.
- **Rejected:** proof-of-concept with moving squares branded as a final “mirror”. Route completion and art polish are mandatory.
- **Rejected:** import real SNK sprites from a GitHub repo simply because its code has a license. Embedded copyright stays with rightsholder.
- **Rejected:** invent diagonal weapon aim because movement uses an 8-way joystick. Creator interview explicitly states diagonal shooting restriction.
- **Rejected:** add Metal Slug X Dog Mummy or daylight opening by mistake. Target is the 1998 release at night.
- **Rejected:** implement removed Slugnoid hover, or intentionally preserve boss-freeze exploit or performance lag as central gameplay.
- **Accepted provisionally:** 320×224 pixel view, 120Hz deterministic physics, Canvas 2D, separate mission route, solo first, co-op later. These are **engineering choices subject to calibration**, not confirmed historical facts.
- **Unresolved:** licensing for an *exact* audiovisual mirror, POW/secret pixel coordinates, vertical co-op behavior, level route landing page and precise original frame windows.
- **Conservative rule:** when close visual fidelity and legally usable art conflict, keep the mechanics and use expressive original art. Do not quietly ship third-party protected files.

## 11. Stage gates and deliverables

| Gate | Exit deliverable | Current |
| --- | --- | --- |
| R — Research | `research.md`, source register, repo audit | **DONE**, factual research only |
| P — Plan + annotation | `plan.md` user-approved scope, interfaces and atomic checklist | **OPEN / AWAITING COMMENTS** |
| I1 — Vertical slice | One responsive section with robust movement and browser screenshot | NOT STARTED |
| I2 — Mission content | Fully traversable M2 route, weapons/mummies/POWs/secrets | NOT STARTED |
| I3 — Boss | Slugnoid and a genuinely beatable Aeshi Nero to mission clear | NOT STARTED |
| I4 — Polish/verification | Original art/audio, full browser play, old/new CI green, QA and documentation | NOT STARTED |
| I5 — Delivery | User-approved merge/deployment verification, risk disclosure and final score | NOT STARTED |

## 12. User annotation sheet — edit these entries directly

Replace `[DECIDE]` with `[APPROVE]`, `[REVISE: …]` or `[REJECT: …]`. The developer must update affected sections before implementing anything.

**A1 — Landing route**
- [DECIDE] **Recommended:** leave Pong at root, make new game `/mission2/`. Alternative: move Pong to `/pong/` and use root for Mission 2.
- Annotation:

**A2 — Artistic/IP fidelity boundary**
- [DECIDE] **Recommended:** accurate gameplay/route, wholly original or confirmed-permissive visuals/audio. Literal SNK audiovisual copying requires demonstrated permission/license and another review.
- Annotation:

**A3 — Mechanics vs completeness**
- [DECIDE] **Recommended:** M2-00 to M2-06, Slugnoid, boss, mummy state mandatory. All 14 POWs and secret genie required before full-fidelity final, but not before first playable vertical slice.
- Annotation:

**A4 — Multiplayer**
- [DECIDE] **Recommended:** solo first, local two-player camera model designed up front and implemented before claiming complete original fidelity. No online multiplayer.
- Annotation:

**A5 — Tools and dependencies**
- [DECIDE] **Recommended:** pure ES modules/Canvas 2D + Node/Playwright; defer Phaser or build tool unless needed by measured bottleneck. No remote runtime CDNs.
- Annotation:

**A6 — Controls and target platform**
- [DECIDE] **Recommended:** keyboard + gamepad desktop first, responsive mobile/touch after physics; real browsers Chrome/Firefox/WebKit; remappable controls and pause/mute.
- Annotation:

**A7 — Reference precision**
- [DECIDE] **Recommended:** reconstruct and calibrate stage beats from lawful public gameplay references; do not claim exact HP, pixels or original sprite timings without evidence. User may provide owned footage/scoring data for better calibration.
- Annotation:

**A8 — Publication and scoring**
- [DECIDE] **Recommended:** code + QA evidence in review PR; merge only after review; deployment only to owner-enabled Pages, with rights gate. “10/10” requires all accepted gates observed, not self-assertion.
- Annotation:

## 13. Revision history

- **v1 — 2026-10-09:** Created from the audited live Pong source tree and evidence in `research.md`. Only planning files modified on isolated repository branch. All implementation checkboxes deliberately unchecked. Awaiting user's annotations.

**Explicit stop condition now:** Research delivered. Await user review of `plan.md`. No implementation, no project root mutation, no newly added game content, and no claims of having played or scored the new game.