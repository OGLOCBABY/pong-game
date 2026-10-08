# Research — RUINS OF THE SECOND SUN

2026-10-09. Target repository: `OGLOCBABY/pong-game`. The pre-existing STRIKELINE Pong entry and all its contracts are **read-only**.

## Reference identification

The requested "second classic level" is interpreted as the second mission of **Metal Slug 2** (1998), also called *Monument of Depression / Valley of the Pharaohs*. Verified references:
- https://metalslug.fandom.com/wiki/Monument_of_Depression — Egypt-themed desert approach, tomb, mummies, mummy generator, bats, Slugnoid, Aeshi Nero boss.
- https://retrogamehub.org/en/game/arcade-mslug2/ — detailed walkthrough; Sphinx secret, soldiers and miners, ramps, mummy transformation/healing, gems, prisoner rescues, vertical ascent, mechanical boss.
- https://www.arcade-history.com/game/1614/metal-slug-2-super-vehicle-001/ii-model-ngm-241 — historical stage progression.

## Repository baseline (read-only)

Existing repository at inspection: public `OGLOCBABY/pong-game`, default branch `main`; root includes `index.html`, `styles.css`, `src/{engine,main,audio}.js`, `tests/`, GitHub Actions, README, and research/plan/qa. The Pong project has separately recorded 18 Node tests and 3 browser-engine test runs. **Do not modify or replace it.** The new game lives entirely in `metal-slug-2/`, with its own static HTML, JS, CSS, tests, reports and assets.

## Creative translation and hard constraints

- This is an independently programmed **playable homage** inspired by a well-known stage, not an SNK ROM, frame-for-frame copy, sprite rip, music rip or distribution of proprietary game files.
- Preserve dramatic sequencing: desert excavation -> torch-lit pyramid chambers -> elevated ruin with platforms -> mechanical worm boss.
- Original illustration in crisp programmatic 2D Canvas vector/pixel hybrid; procedural particle effects; original Web Audio cues. No network requests, CDN runtime dependencies, proprietary art or unverified third-party licenses.
- Fixed timestep game engine, deterministic seeded spawns, explicit update/render separation, robust rectangle collisions and viewport bounds. Keep browser entry thin.
- Keyboard and pointer controls; mobile on-screen buttons; accessible state text and pause on blur; 60fps target on common desktop browsers.
- Honest verification: Node gameplay tests, headless Chromium scripted play including a full win sequence, screenshot inspection, complete-game stress test and review notes. Browser automation is not human playtesting.

## Findings / tradeoffs

1. A fully exact original level would require decades-old source / copyrighted sprites and cannot be responsibly represented as original work. Reproduce **mechanic and rhythm**, with different geography and original artwork.
2. Animation quality comes from layers, readable poses, hit-stop/impact effects and intentional palette rather than downloading unlicensed sprite sheets.
3. A linear, several-thousand-pixel stage with curated spawn zones is superior to a random infinite runner for level identity.
4. Built-in browser Canvas and Web Audio eliminate broken asset fetches and preserve compatibility with GitHub Pages' subdirectory paths.
5. Save no external credentials or data; repository-scoped GitHub writes only.

## Risks to test

- Camera clipping platform edges; projectile tunneling; curse and invulnerability interfering; enemies spawning on top of player; boss unwinnable; controls colliding with page scrolling; overlay stuck after victory; high-DPI resizing; mobile touch hold/release; sound unlock restrictions.
