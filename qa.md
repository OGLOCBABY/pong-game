# Quality Assurance — STRIKELINE

Assessment date: 2026-10-08 UTC.
Repository scope: `OGLOCBABY/pong-game` only.
Status: **Playable, automated tests passing; 10/10 certification NOT claimed**.

## Primary evidence

- [Latest CI workflow / runs](https://github.com/OGLOCBABY/pong-game/actions/workflows/quality.yml).
- [Verified all-green 21-test, multi-browser run (37813971290)](https://github.com/OGLOCBABY/pong-game/actions/runs/37813971290):
  - **21/21** physics, scoring, deterministic AI balance, audio/mute and property tests passed (0 failed).
  - Automated expert beat the Pro CPU **7–0 in 39,991 simulated 120 Hz steps**, proving the intermediate CPU difficulty can concede under pressure.
  - Against the Legend CPU, the same scripted player scored 1 point in 20,000 steps and 4 points in 80,000 steps. The highest difficulty remains materially harder without absolute perfect aim. These are deterministic scenario results, **not estimates of a real human win rate**.
  - Independent simulated Rookie match: **7–0**, 57 paddle collisions, 37 wall bounces, maximum 27-hit rally; match finished cleanly.
  - **72/72 additional full matches** completed across seeded CPU difficulties and local two-player, with **543 awarded points, 242 paddle hits, 272 wall impacts** and zero reported out-of-bounds/NaN/score-invariant defects.
  - Chromium desktop: page boot, keyboard response, pause freezes physics, resume, 2-player controls, user settings **persisted after reload**, Enter/P/Space/R hotkeys, scripted mouse tracking, a **complete actual browser match 7–0**, game-over overlay and rematch.
  - Chromium mobile: 390px portrait touch, simultaneous two-pointer local controls, 320px viewport with no horizontal overflow, 844px landscape, system reduced-motion behavior and accurate disabled-control semantics.
  - **Firefox + WebKit:** real engine initialization, match starts, keyboard moves paddle, pause works.
  - **axe-core WCAG 2.1 AA** automated audits on desktop, mobile and complete-game overlay: zero detected violations.
  - No captured browser page errors, console errors or third-party network requests (all runtime assets remain self-contained).
- [Visual artifact and completed-match run (37803856143)](https://github.com/OGLOCBABY/pong-game/actions/runs/37803856143), with full-page desktop, duel, completed-match, mobile, narrow-phone, Firefox, and WebKit screenshots. Screenshots were manually inspected; an initial WebKit image taken at the start of the CSS fade-in was corrected by waiting 350ms before capture. The settled overlay rendered correctly.

## Rubric and provisional self-assessment

This is an **evidence-based subjective rating**, not a third-party review, a benchmark against other LLMs, or an assertion of perfection.

| Domain | Weight | Self-rating / 10 | Evidence and qualification |
| --- | ---: | ---: | --- |
| Physics & game balance | 25% | 9.7 | Swept collision, balanced pressure and 72 deterministic complete-match property cases; no extensive human tournament |
| Input & responsiveness | 20% | 9.6 | Keyboard, pointer, drag, two-finger touch, persisted preferences, three browser engines and landscape tested; real iOS hardware not manually tested |
| Visual & sound presentation | 20% | 9.7 | Original coherent HUD and vector artwork reviewed across screenshots; synthesized sound has not been auditorily reviewed on physical speakers |
| Functional reliability | 15% | 9.8 | 21/21 tests, 72 complete-match simulations, clean full-browser rematch and zero external requests; no real-device mobile soak |
| Accessibility | 10% | 9.3 | Keyboard path, live announcements, effective reduced-motion controls, desktop/mobile/game-over axe WCAG checks; manual screen reader evaluation remains undone |
| Performance & maintainability | 10% | 9.4 | No runtime dependencies or external asset requests, fixed-step capped simulation, DPR rendering, documented interfaces and generated-file exclusions; physical-device performance unbenchmarked |
| **Weighted total** | **100%** | **9.6 / 10 (rounded)** | **Not certified 10/10** |

Calculation: `0.25×9.7 + 0.20×9.6 + 0.20×9.7 + 0.15×9.8 + 0.10×9.3 + 0.10×9.4 = 9.625`, rounded to one decimal = **9.6**.

## Observed iterations and corrections

1. Starting repository had only a README. Created a real application, pure engine, tests and responsive UI rather than trying to patch nonexistent code.
2. Original deuce test incorrectly considered 7:5 unfinished; corrected fixture to 7:6, retaining first-to-seven/win-by-two rules.
3. Verified actual two-finger interactions and added an extremely narrow screen check.
4. Found a mobile overlay overlap and dimmed scoreboard while showing the compact welcome overlay.
5. Fixed restart behavior: a single key/click now begins a new match, not a detour through the idle menu.
6. Added full-browser game-over and rematch testing, not just ten seconds of movement.
7. Expanded acceptance across Chromium, Firefox and WebKit, and axe-core accessibility audits.
8. Discovered that an expert simulator produced extremely long no-score rallies against Pro; introduced bounded tracking error and long-rally estimation pressure. Added fixed-seed match regressions and validated the Pro/Legend skill gradient.
9. Hardened browser testing to wait explicitly for ES module boot before reading diagnostics.
10. Aligned the effects toggle with effective OS reduced-motion state; system-disabled controls now accurately communicate the reason.
11. Found and fixed an asynchronous reduced-motion control mismatch when media-query change events are delayed or omitted; verified the browser eventually agrees with the actual system preference.
12. Added property tests for 72 varied full matches and verified no nonfinite coordinates or state invariant violations.
13. Added real-browser persistence, Enter/P/Space hotkeys, landscape, cross-engine keyboard controls, dynamic game-over accessibility and external-network checks.
14. Patched audio initialization so a muted game never resumes a suspended AudioContext; added two offline synth/audio tests.
15. Added `.gitignore` for local dependencies and QA screenshots; prepared repository-scoped, gated GitHub Pages automation.

## Outstanding validation gates

- **Public URL not verified.** Static game and QA-gated `.github/workflows/pages.yml` are committed, but GitHub reports `has_pages: false`. Only the repository owner can enable Pages under **Settings → Pages → Build and deployment → Source → GitHub Actions**. The workflow explicitly skips deployment when Pages is disabled. Do not assert an unverified live URL.
- **Physical human usability testing not done** on representative desktop browsers and real iOS/Android devices. Scripted Playwright input is a useful regression tool but not a substitute for real humans.
- **Manual assistive-technology audit not done** (VoiceOver, NVDA or TalkBack). Passing axe does not prove complete WCAG conformance.
- **Real speaker/headphone audio quality and latency** not verified. Headless tests exercise sound settings but cannot subjectively hear waveforms.
- **Performance/energy on slow phones** not benchmarked. The simulation caps catch-up steps and particles but performance varies by device.

## Completion rules

All implementation items in `plan.md` can be completed within this repository. A genuine subjective **10/10** would require closing the above externally dependent gates, plus independent comparative human game review. The numerical target cannot be proven by a unit-test count or by simply declaring success.

The application remains fully playable locally over HTTP and continuously verified by GitHub Actions. No other user repositories or projects were modified.
