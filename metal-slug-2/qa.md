# QA — RUINS OF THE SECOND SUN / Mission 02

**Assessment:** 2026-10-09. **Status:** **PUBLICLY PLAYABLE — GITHUB PAGES VERIFIED**. Technical release gates green; **independent 10/10 fidelity certification NOT claimed**.
**Repository:** [OGLOCBABY/pong-game](https://github.com/OGLOCBABY/pong-game) · [Implementation PR #3](https://github.com/OGLOCBABY/pong-game/pull/3) · [Planning review PR #2](https://github.com/OGLOCBABY/pong-game/pull/2).

## Evidence hierarchy (do not confuse them)

1. **Actual GitHub Actions PASS on a prior feature SHA:** [run 37838455168](https://github.com/OGLOCBABY/pong-game/actions/runs/37838455168) — original Pong and Mission 2 Node tests and real browser smoke all green. It is not yet the final HEAD SHA.
2. **New Mission 2 pure-engine QA:** 29 named Node tests cover deterministic simulation, authored six-scene route, no-jump gate, 2-axis/monotonic camera, fall-to-checkpoint recovery, one-hit Arcade / forgiving Practice, curses, power-ups, double Vulcan and down cannon, damageable Slugnoid, swept bullet collision, enemy death, POW/secret scoring, boss warnings, full input-driven Practice victory.
3. **Real Chromium auto-play evidence:** [run 37838455168](https://github.com/OGLOCBABY/pong-game/actions/runs/37838455168) records a real HTTP/ES-module session with keyboard (not direct engine mutation), six scene screenshots, camera ascent, boss defeat, win screen, rematch and restart. Human hand-play is **not** claimed.
4. **Real browsers:** Previous green runs include Chromium, Firefox, WebKit, 390px phone, 320px narrow, and axe-core WCAG 2.1 AA automated auditing. The latest CI additionally attempts native three-finger simultaneous run/fire/jump and a real-visible boss screenshot with each attack telegraph.
5. **Visual inspection:** reviewed actual GitHub Actions PNGs of the intro, desert, tomb, ascent, Slugnoid, boss intro, win and mobile states. Findings: art direction coherent and scenes visually distinct; sprites smaller than native 1998 low-res graphics; intro banners originally obscured action for too long (shortened); boss intro screenshot lacked visible boss (new screenshot coverage added). No hand-drawn original SNK pixels or music imported.
6. **Public Pages:** [existing Pages workflow](https://github.com/OGLOCBABY/pong-game/blob/feature/ruins-of-second-sun/.github/workflows/pages.yml) now packages both games after successful main-branch CI and runs `metal-slug-2/tests/live-smoke.mjs` against public HTTPS. ****Verified published:** [main quality run #37839771114](https://github.com/OGLOCBABY/pong-game/actions/runs/37839771114) and [Pages deployment + public Chromium run #37840271669](https://github.com/OGLOCBABY/pong-game/actions/runs/37840271669) both completed successfully.**

## Evidence and open gates

| Gate | Present evidence | Close condition | Current disposition |
| --- | --- | --- | --- |
| Research + annotations | [research](research.md), [plan](plan.md), A1–A8 and G01–G20 reviewed | R1/R2 review closed | PASS |
| Scope G01/G19 | PR diff touches only this repo; root Pong source and engine untouched | No unintended changes at final HEAD | PASS on feature diff, recheck before merge |
| Reference G02 | [reference map](reference-map.md): version labeled, source confidence, six staged sequence | Frame-accurate 1998 video breakdown & human cross-compare for perfect fidelity | PARTIAL |
| Stage G03/G04 | Six scenes, actual Y camera scroll, no rightward tower bypass | Real-browser finish + one-way camera and fall regression | **PASS** — main CI #37839771114 |
| Combat G05–G08 | 29 engine checks, guns/grenades, curse, enemy, POW/secret, state/lives | All Node tests 0 fail on final HEAD | **PASS** — 29/29 on main CI |
| Slugnoid + Aeshi G09/G10 | Vehicle entity, mount/dismount, twin guns, cannon, damaged guns; Boss electric/missile/laser/lunge modes | Browser captures real boss visible & attack telegraphs, win via legitimate input | **PASS** — Chrome real game and screenshots |
| Responsive + a11y G11 | Chromium desktop/phone/narrow + Firefox/WebKit/axe on previous green CI | Native three finger + all checks green at HEAD | **PASS** automated checks, real iOS/Android manual testing remains unverified |
| Engine + browser G12/G13 | Previous fully green CI and multiple browser wins | Main SHA-specific all green | **PASS** — main quality run #37839771114 |
| Pong regression G14 | Root test suite and smoke remained green in previous CI | Main SHA-specific green | **PASS** — main CI + public Pong Chromium |
| Asset rights G15 | [Original art/sound manifest](ASSET_PROVENANCE.md) and zero external runtime resources | Audit final static files and release assets | PASS for sources reviewed |
| Quality gate + Pages G16 | Existing Pages workflow, main CI gating, no manual bypass, additional live Chromium step | CI on merged main → Pages deploy → actual post-deploy step all green | **PASS** — Pages #37840271669 |
| Public URL G17 | **https://oglocbaby.github.io/pong-game/metal-slug-2/** | HTTP 200, ESM/CSS all load, keyboard move/shoot/pause; Pong root still works | **PASS** — production Chromium #37840271669 |
| Score G18 | Six scenes and automated/browser visual feedback reviewed | Independent human play, timing/fidelity comparisons, perf, audio listening | NOT_CERTIFIED_10 |
| Rollback G20 | PR merged, original Pong history retained; previous main was 1bcb7163f9a5 | Green production and retained rollback SHA | **PASS** technical plan / live production |

### Actual failures found and fixed

- Node test initial heavy-weapon cadence expectation and long-running curse fixture were incorrect; corrected rather than changing physics to satisfy an invalid assertion.
- First browser smoke used a directory URL as an actual file path; fixed static HTTP index routing.
- axe mobile/desktop caught contrast and fade-transition timing failures; corrected CSS and audit timing while preserving real axe checks.
- Early WebKit movement assertion depended on an unrealistic fixed 180ms render budget; replaced with waiting for a real observed position change (5s upper bound).
- Previously recorded boss screenshot captured only the arrival warning. Separate visible-boss/attack screenshot evidence is now required.
- Added actual multi-touch (right+fire+jump) Chromium input; its most recent CI outcome remains a gating item.

## Provisional self-assessment — NOT independent 10/10 certification

This is a **subjective internal review**, not a demonstrated comparison to Opus 5.5, and not a claim of exact SNK replication.

| Domain | Weight | Provisional rating | Principal gaps |
| --- | ---: | ---: | --- |
| 1998 level sequence and architecture | 25% | 7.8/10 | Lacks frame-measured exact layouts/encounter counts, full original exploration |
| Movement, shooting, combat fairness | 25% | 7.5/10 | Simplified enemy tactics, unverified physical hand feel, no human difficulty review |
| Original visual/audio design | 20% | 8.1/10 | Coherent original art but limited sprite pose count and no licensed original music |
| Functional reliability and tests | 15% | 9.1/10 | Final CI/browser/public deployment still pending |
| Input accessibility and touch | 10% | 8.3/10 | Native 3-finger pending, no real iOS/Android device or manual screen-reader review |
| Performance/maintainability/provenance | 5% | 8.2/10 | CI headless Chromium p95 ~60ms under heavy load; no physical-device performance data |
| **Weighted current subjective assessment** | **100%** | **8.1/10 (provisional)** | **NOT certified 10/10; fidelity/human gates remain** |

**Honest distinction:** bot wins and a green CI prove *a functioning game build*, not perfect fidelity or subjective game feel. Missing external/human verification may never become literally provable through automated tools. The game can be published as a playable, original-art homage if objective release gates pass, with the remaining fidelity deficits disclosed instead of faking perfection.

## Release/rollback

- [PR #3](https://github.com/OGLOCBABY/pong-game/pull/3) was squash-merged after exact feature HEAD CI success and protected Pong checks.
- Reuse repository's existing GitHub Pages workflow; no Vercel, external repositories or Work/Codex threads.
- Post-deployment Chromium confirmed production Mission 02 move/fire/pause and legacy Pong startup: run [#37840271669](https://github.com/OGLOCBABY/pong-game/actions/runs/37840271669). This is *real network verification*, not a mere green deploy claim.
- If Pages or old Pong fails: stop the release, revert the scoped merge/update, use the previously green Pong main commit as rollback boundary. Do not patch an invalid architecture in place.

## Verified production release — final closure record

- **Release commit SHA:** `b11d7a3faace80420685f81108153f7422714535` (PR #3 merged to `main`).
- **Pong main quality gate:** [#37839771114](https://github.com/OGLOCBABY/pong-game/actions/runs/37839771114), status **success**; 21 existing Pong and 29 new Mission 02 engine tests, real browser full game smoke including multi-touch, Firefox/WebKit.
- **Existing GitHub Pages deployment:** [#37840271669](https://github.com/OGLOCBABY/pong-game/actions/runs/37840271669), status **success**. Actual deploy artifact upload, `deploy-pages@v4` and post-deploy public Chromium verification all succeeded.
- **Public playable URL:** **https://oglocbaby.github.io/pong-game/metal-slug-2/** — browser reached HTTP 200, loaded ES modules, started game, moved player `x=100 → 171.4`, fired 2 shots, paused successfully, and reported no page errors/network failures.
- **Original Pong homepage:** **https://oglocbaby.github.io/pong-game/** — public Chromium verified page boot and normal Enter-start. Root Pong implementation untouched.
- **Published assets:** static HTML/JS/CSS + generated Canvas art and synthesized Web Audio; project tree checked for downloaded ROM/sprite/audio binaries (zero found).
- **Scope compliance:** all changes were confined to `OGLOCBABY/pong-game`; protected root HTML/JS/CSS/tests/package scripts remain byte-identical to prior main.
- **Manual/Human limitations:** no hands-on iOS/Android physical-device study; no systematic frame-by-frame original-MVS fidelity review, no human independent benchmark against any AI model; **provisional self-assessment remains 8.1/10, NOT 10/10 certified**.

**Release classification:** `PUBLIC_PLAYABLE_VERIFIED` for objective technical requirements. `FIDELITY_10_CERTIFIED = false`. Future enhancement should focus on original-specific encounter pacing, more varied sprite animation, hand feel, and physical device profiling; use a separate documented review cycle and never overwrite the verified baseline without green CI.
