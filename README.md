# STRIKELINE — The Pong Arcade

**The original duel, reengineered.** A complete, beautifully minimal Pong game built with HTML, CSS and JavaScript. Compete against the computer or another person. No account, no download, no advertising, no external runtime assets, no build step.

![CI](https://github.com/OGLOCBABY/pong-game/actions/workflows/quality.yml/badge.svg)

## Play

**[Open the game files](./index.html)** or run a tiny static HTTP server from this repository:

`python3 -m http.server 4173`

Visit **http://localhost:4173**. You can also use `npx serve .` if Node is installed. ES modules should be loaded over HTTP(S); opening `index.html` directly with a `file://` URL may be blocked by the browser.

To publish on this repository's own GitHub Pages site, go to **Settings → Pages → Build and deployment → Source → GitHub Actions**. The included `STRIKELINE Pages` workflow automatically publishes the minimal static runtime after the quality workflow passes, or can be run manually from Actions. **Pages is not enabled until the repository owner chooses that source**; no live URL should be assumed before a successful deployment. All game assets use relative URLs, so a GitHub Pages project path works.

## Second playable game

The same repository also contains **[RUINS OF THE SECOND SUN — Mission 02](./metal-slug-2/index.html)**, an independently illustrated browser run-and-gun homage to the dramatic structure of *Metal Slug 2* Mission 2 (1998). The existing Pong game is unchanged.

Once [GitHub Pages](https://oglocbaby.github.io/pong-game/) finishes the new QA-gated release, open the separate game directly at **https://oglocbaby.github.io/pong-game/metal-slug-2/**. The release must pass actual public-browser verification before this URL can be claimed functional. See [Mission 02's controls and QA](./metal-slug-2/README.md).

## Inside the arena

- **Solo** — adjustable CPU: **Rookie**, **Pro**, **Legend**. The AI predicts bank shots but is constrained by reaction time, movement speed, imperfect aiming and additional pressure in long rallies.
- **2 Players** — challenge a friend on one keyboard or with two touch pointers.
- **Real Pong physics** — continuous paddle-edge collisions, angled returns, motion-driven spin, acceleration on rallies and deterministic match simulation.
- **Clear win condition** — first to **7 points**, win by **2**; sudden death at **11**.
- **Built to feel alive** — original high-DPI Canvas artwork, particle impacts, synthesized arcade sound, spatial depth, responsive HUD and accessible controls.
- **Respectful defaults** — pausing when the page loses focus, reduced-motion support, sound/effects toggles, and your highest rally saved only in local browser storage.

## Controls

| Action | Keyboard | Mouse / Touch |
| --- | --- | --- |
| Left paddle | **W / S** | Move / drag inside arena |
| Solo paddle (alternative) | **↑ / ↓** | Move / drag inside arena |
| Right paddle (2-player mode) | **↑ / ↓** | Drag on right half of arena |
| Pause / resume | **Space** or **P** | PAUSE / RESUME |
| Start / rematch | **Enter** | START MATCH / PLAY AGAIN |
| Restart | **R** | RESTART |
| Sound | **M** | SOUND FX toggle |

A standard controller's left analog stick or D-pad can also control player one in browsers supporting the Gamepad API.

On touchscreens, tap and hold at your preferred paddle height; drag to follow the ball. With two players, each half of the screen controls its own paddle. Landscape orientation is recommended for small screens.

## Technology and source layout

| Path | Purpose |
| --- | --- |
| `index.html` | Accessible markup and game dashboard |
| `styles.css` | Responsive, original arcade visual design |
| `favicon.svg` | Original vector icon |
| `src/engine.js` | Pure deterministic game engine, difficulty models, swept collision physics |
| `src/main.js` | Browser UI, inputs, Canvas painting, match state and visual effects |
| `src/audio.js` | Browser-native Web Audio tones; nothing downloaded |
| `tests/engine.test.mjs` | Node physics, controls, scoring and autonomous match tests |
| `tests/ai-balance.test.mjs` | Long-running simulated matches to keep Pro beatable and Legend demanding |
| `tests/property.test.mjs` | 72 completed matches across modes and skill levels, plus numerical invariants |
| `tests/audio.test.mjs` | Mocked Web Audio sound generation and mute-safe behavior |
| `tests/browser-smoke.mjs` | Chromium desktop/mobile tests with scripted live gameplay and screenshots |
| `.github/workflows/quality.yml` | Continuous quality checks on pushes and PRs |
| `.github/workflows/pages.yml` | Publish GitHub Pages only after quality passes and Pages is enabled |
| `research.md`, `plan.md`, `qa.md` | Audited baseline, staged implementation, validation and limitations |

**The game has zero production dependencies.** Dev-only Playwright and axe-core are pinned for reproducible browser and accessibility verification. Fonts use local/system fallbacks, artwork is rendered by CSS/Canvas and all audio is synthesized.

## Test the game

Node.js 20+ required for tests:

`npm install`

`npm test`

`npx playwright install chromium`

`npm run smoke`

For the full cross-browser suite, install `npx playwright install --with-deps chromium firefox webkit` on Linux or `npx playwright install chromium firefox webkit` on desktop. The automated suite runs **21 engine, audio, property and AI balance tests**, including a 72-match sweep, and uses real Chromium, Firefox and WebKit. It checks keyboard shortcuts, simultaneous multitouch, persistent settings, complete matches and rematches, phone portrait/landscape layouts, **zero external network requests**, and **axe-core WCAG 2.1 AA** automated accessibility rules. Screenshots are saved to `test-results/` within the repository and uploaded as a GitHub Actions artifact.

See **[GitHub Actions](https://github.com/OGLOCBABY/pong-game/actions/workflows/quality.yml)** for actual run results. See [qa.md](qa.md) for evidence-based scores and any limitations. A pass is not inferred from the existence of a workflow file.

## License and assets

Original source, shapes and synthesized tones only. No imported third-party game artwork, sound recordings or fonts. An open-source license has **not** been granted by the repository owner; GitHub's default copyright rules apply until a LICENSE file is added.

## Project approach

Read [research.md](research.md) → [plan.md](plan.md) → [qa.md](qa.md). The documented stages, invariants and rollback boundaries are kept in this repository, not in a separate workspace.
