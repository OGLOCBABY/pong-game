# QA — RUINS OF THE SECOND SUN / Mission 02

**Assessment:** 2026-10-09. **Status:** IMPLEMENTED / RELEASE GATES STILL ACTIVE.
**Repository:** [OGLOCBABY/pong-game](https://github.com/OGLOCBABY/pong-game) · [Implementation PR #3](https://github.com/OGLOCBABY/pong-game/pull/3) · [Planning review PR #2](https://github.com/OGLOCBABY/pong-game/pull/2).

## Evidence hierarchy (do not confuse them)

1. **Actual GitHub Actions PASS on a prior feature SHA:** [run 37838455168](https://github.com/OGLOCBABY/pong-game/actions/runs/37838455168) — original Pong and Mission 2 Node tests and real browser smoke all green. It is not yet the final HEAD SHA.
2. **New Mission 2 pure-engine QA:** 29 named Node tests cover deterministic simulation, authored six-scene route, no-jump gate, 2-axis/monotonic camera, fall-to-checkpoint recovery, one-hit Arcade / forgiving Practice, curses, power-ups, double Vulcan and down cannon, damageable Slugnoid, swept bullet collision, enemy death, POW/secret scoring, boss warnings, full input-driven Practice victory.
3. **Real Chromium auto-play evidence:** [run 37838455168](https://github.com/OGLOCBABY/pong-game/actions/runs/37838455168) records a real HTTP/ES-module session with keyboard (not direct engine mutation), six scene screenshots, camera ascent, boss defeat, win screen, rematch and restart. Human hand-play is **not** claimed.
4. **Real browsers:** Previous green runs include Chromium, Firefox, WebKit, 390px phone, 320px narrow, and axe-core WCAG 2.1 AA automated auditing. The latest CI additionally attempts native three-finger simultaneous run/fire/jump and a real-visible boss screenshot with each attack telegraph.
5. **Visual inspection:** reviewed actual GitHub Actions PNGs of the intro, desert, tomb, ascent, Slugnoid, boss intro, win and mobile states. Findings: art direction coherent and scenes visually distinct; sprites smaller than native 1998 low-res graphics; intro banners originally obscured action for too long (shortened); boss intro screenshot lacked visible boss (new screenshot coverage added). No hand-drawn original SNK pixels or music imported.
6. **Public Pages:** [existing Pages workflow](https://github.com/OGLOCBABY/pong-game/blob/feature/ruins-of-second-sun/.github/workflows/pages.yml) now packages both games after successful main-branch CI and runs `metal-slug-2/tests/live-smoke.mjs` against public HTTPS. **The new game is NOT verified published until these actual production checks pass.**

## Evidence and open gates

| Gate | Present evidence | Close condition | Current disposition |
| --- | --- | --- | --- |
| Research + annotations | [research](research.md), [plan](plan.md), A1–A8 and G01–G20 reviewed | R1/R2 review closed | PASS |
| Scope G01/G19 | PR diff touches only this repo; root Pong source and engine untouched | No unintended changes at final HEAD | PASS on feature diff, recheck before merge |
| Reference G02 | [reference map](reference-map.md): version labeled, source confidence, six staged sequence | Frame-accurate 1998 video breakdown & human cross-compare for perfect fidelity | PARTIAL |
| Stage G03/G04 | Six scenes, actual Y camera scroll, no direct rightward tower bypass | Real-browser finish + one-way camera and fall regression | PASS on earlier verified run; final HEAD pending |
| Combat G05–G08 | 29 engine checks, guns/grenades, curse, enemy, POW/secret, state/lives | All Node tests 0 fail on final HEAD | PASS on earlier verified run; final HEAD pending |
| Slugnoid + Aeshi G09/G10 | Vehicle entity, mount/dismount, twin guns, cannon, damaged guns; Boss electric/missile/laser/lunge modes | Browser captures real boss visible & attack telegraphs, win via legitimate input | PARTIAL; extra screenshot pending |
| Responsive + a11y G11 | Chromium desktop/phone/narrow + Firefox/WebKit/axe on previous green CI | Native three finger + all checks green at HEAD | PARTIAL, final touch check pending |
| Engine + browser G12/G13 | Previous fully green CI and multiple browser wins | HEAD-specific all green | PENDING HEAD |
| Pong regression G14 | Root test suite and smoke remained green in previous CI | HEAD-specific green | PENDING HEAD |
| Asset rights G15 | [Original art/sound manifest](ASSET_PROVENANCE.md) and zero external runtime resources | Audit final static files and release assets | PASS for sources reviewed |
| Quality gate + Pages G16 | Existing Pages workflow, main CI gating, no manual bypass, additional live Chromium step | CI on merged main → Pages deploy → actual post-deploy step all green | NOT_YET_RUN |
| Public URL G17 | Target: https://oglocbaby.github.io/pong-game/metal-slug-2/ | HTTP 200, ESM/CSS all load, keyboard move/shoot/pause; Pong root still works | NOT_YET_VERIFIED |
| Score G18 | Six scenes and automated/browser visual feedback reviewed | Independent human play, timing/fidelity comparisons, perf, audio listening | NOT_CERTIFIED_10 |
| Rollback G20 | PR/branch, bounded commits and main unchanged | Green production and retained rollback SHA | PENDING_DEPLOY |

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

- Only merge [PR #3](https://github.com/OGLOCBABY/pong-game/pull/3) after *current HEAD* Node, desktop, three-browser, mobile, actual win/lose and multi-touch checks pass.
- Reuse repository's existing GitHub Pages workflow; no Vercel, external repositories or Work/Codex threads.
- After successful Pages live smoke, record deployment run and exact commit in PR conversation; do not infer online availability from a green deploy status alone.
- If Pages or old Pong fails: stop the release, revert the scoped merge/update, use the previously green Pong main commit as rollback boundary. Do not patch an invalid architecture in place.
