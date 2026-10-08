# Plan — STRIKELINE / Pong

Status: **Implemented and tested** (21/21 Node tests, 72 completed property-test matches; real Chromium/Firefox/WebKit quality gate; see [qa.md](qa.md)).
Related research: [research.md](research.md).

## Product vision
A distinctive, polished, modern single-screen Pong arcade: deep midnight arena, electric-cyan and warm-coral paddles, satisfying precise contact, measured particles and native synthesised sound. Prominent score, delightful controls and a clear "Play / Pause / Rematch" lifecycle. Responsive from desktop to phone. No framework, fonts CDN, telemetry, API keys, accounts or paid assets.

## Protected contract and repository boundary
- All writes remain in `OGLOCBABY/pong-game`. No writes to other repositories, local projects or external services.
- Original README promise preserved: player-vs-computer Pong in HTML/CSS/JavaScript.
- `main` is the delivery branch; only fast-forward updates, never rewrite existing commits.
- Portable modern browser support: HTML5 Canvas, Pointer Events, ResizeObserver, Web Audio (optional), ES Modules.
- Pure engine contract in `src/engine.js`:
  - exports `WIDTH`, `HEIGHT`, `WIN_SCORE`, `MAX_SCORE`, `DIFFICULTIES`, `PongGame`.
  - `new PongGame({mode, difficulty, seed})`, `reset()`, `start()`, `togglePause()`, `setInput(partial)`, `step(dt)`.
  - `step(dt)` advances game using **seconds**, returns event objects, and never touches browser APIs.
  - game state includes `phase`, `score`, `ball`, `paddles`, `rally`, `bestRally`, `winner`.
  - coordinate system fixed to 960×540 logical px; canvas scales to viewport and DPR independently of physics.
  - scoring: first to seven, win by two, hard cap of eleven.
- The controller must not depend on private mutable engine internals beyond that public state.

## Files and implementation checklist

### Stage A — Research
- [x] Inspect recursive tree, README, default branch, commit history and Pages metadata.
- [x] Record baseline and risks in `research.md`.

### Stage B — Planning + annotation cycle
- [x] Select platform, visual direction, architectural boundaries and test strategy.
- [x] Document engine interfaces and non-negotiable repository boundary.
- [x] Reject excessive framework/power-up/online-multiplayer scope (see annotation below).
- [x] Decompose to executable checklist (this document).

### Stage C — Implementation
- [x] `index.html`: semantic menu, score, controls, canvas, match overlay, accessible action buttons.
- [x] `styles.css`: bespoke responsive visual system, mobile controls, focus, contrast and reduced motion.
- [x] `src/engine.js`: deterministic state machine, fixed-step ready/serve, continuous/swept collisions, angled paddle rebounds, rally and match end, varied bounded CPU.
- [x] `src/audio.js`: gesture-unlocked synthesis, optional mute, no network fetch.
- [x] `src/main.js`: responsive hi-DPI Canvas painter, keyboard/mouse/touch/pointer/gamepad controls, particles, HUD, life-cycle, save settings and best rally locally.
- [x] `README.md`: screenshots/feature description, instructions to run, keyboard/touch controls, local and Pages hosting notes, test commands.
- [x] `package.json`: Node tests, browser tests; no production dependencies.
- [x] `tests/engine.test.mjs`: state transitions, deterministic serves, wall reflections, paddle hit, paddle miss, scoring cap, pause, AI limits and timestep invariants.
- [x] `tests/ai-balance.test.mjs`: completed expert-vs-Pro and pressure-gradient stress simulations.
- [x] `tests/property.test.mjs`: 72 complete games and numerical/scoring/paddle invariants across modes and difficulties.
- [x] `tests/audio.test.mjs`: Web Audio and muted suspended-context safety.
- [x] `.gitignore`: exclude local dependencies and generated screenshot artifacts.
- [x] `tests/browser-smoke.mjs`: Playwright Chromium script controlling a real browser, checking start/pause/restart, keys/pointer/mobile/local multiplayer, runtime errors, screenshot and an automated rally session.
- [x] `.github/workflows/quality.yml`: unit test + Playwright smoke on pushes/PRs; screenshot artifact when available.
- [x] `.github/workflows/pages.yml`: conditionally publish this repository's static site after a green quality run, only if owner has enabled Pages.
- [x] Run and fix all available tests; audit visual output where browser evidence can be accessed.
- [x] Complete `qa.md` with evidence-based scoring, observed failures and any unresolved limitations.
- [x] Close checkboxes, keep clear revision history, verify final repository tree/commit.

## Current disposition

- Completed: original game, visual identity, local multiplayer, three AI skill levels, audio, accessible controls, physics and automated three-engine browser tests.
- Independently reported rating: **9.6/10 provisional** (see [qa.md](qa.md)). Passing all automated checks is not the same as a defensible perfect score.
- External/manual gates still unclosed: owner-controlled GitHub Pages enablement (Pages reports disabled), real-device and human playtesting, physical audio listening and manual assistive-technology assessment. These do not require changes to other user repositories and have not been fabricated as passes.
- Evidence: [most recent CI runs](https://github.com/OGLOCBABY/pong-game/actions/workflows/quality.yml) and screenshot artifacts.

## Game logic
```js
// Called in main.js on a fixed 120 Hz accumulator.
while (accumulator >= 1 / 120 && steps < 12) {
  for (const event of game.step(1 / 120)) dispatch(event);
  accumulator -= 1 / 120;
  steps++;
}
```
For every substep: constrain paddle movement; advance the ball to the **earliest** candidate collision time (top/bottom rail, leading edge of paddle, goal line); reflect or award a point; consume remaining fractional step. Cap extra collision loops to guard numerical edge cases. Collision is decided at impact Y, not the final frame Y. CPU prediction mirrors the ball's projected Y across the top/bottom walls; difficulty constrains reaction interval, target error and max speed.

## UX states and interaction
- `idle` initial overlay → `ready` with serve countdown → `playing` → `ready` after point → `gameover`; `paused` resumes previous live phase.
- Keyboard: W/S or ArrowUp/ArrowDown for solo; W/S left and arrows right in versus mode. Space/P pause, R reset, M mute, Enter start/rematch.
- Pointer/touch mapped via Canvas rect. In two-player mode each half controls its nearest paddle; show touch affordances.
- Mobile canvas remains 16:9; controls and panels stack; avoid browser scroll while actively dragging the arena. Focus-visible support.
- Settings: solo / local, three difficulties, audio, reduced effects. Persist only innocuous local preference values, catch storage failures.
- Match-end UI includes final score, winner and rematch.

## Testing gates and scoring
Unit tests are authoritative on numerical behaviors. Browser tests are authoritative on UI operability; browser screenshot/interaction is required for final visual claims. Full-credit self-review requires *passing real-browser tests plus human-level qualitative judgement*; never invent the latter.
Rubric weighting copied from research (physics 25%, control 20%, presentation 20%, reliability 15%, accessibility 10%, maintainability/performance 10%). Cap total reported score below 10 while any core gate remains unobserved.

## Annotation cycle (adversarial review)
1. **Rejected**: use React/Vite for a two-screen stateful arcade. Adds installation and build friction without improving core gameplay. Static ES modules and plain DOM are simpler.
2. **Rejected**: bitmap sprites, font CDNs, third-party sound packs. Native vector Canvas/CSS and Web Audio avoid broken links, attribution mistakes and licensing ambiguity.
3. **Corrected**: naive discrete collision could tunnel at high speeds. Use earliest-impact/swept contact, fixed-step simulation.
4. **Corrected**: impossible AI would make a high score misleading. Give difficulty speed/reaction/error caps and fair visual feedback.
5. **Corrected**: a repository commit alone is not a playable public URL. Document Pages setting; never state it is live unless verified.
6. **Corrected**: "play it yourself" needs evidence. Include a browser-driven scripted rally rather than relying only on assertions that code looks playable.
7. **Risk retained**: repository access does not guarantee runners, external browser engines or Pages configuration. Report blocked gates transparently.

## Rollback rule
If an implementation choice contradicts this plan or breaks core Pong, replace or revert the offending commit on the project branch; do not patch around a wrong architecture.
