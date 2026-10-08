# Quality Assurance — STRIKELINE

Assessment date: 2026-10-08 UTC.
Repository scope: `OGLOCBABY/pong-game` only.
Status: **Playable, automated tests passing; 10/10 certification NOT claimed**.

## Primary evidence

- [Latest CI workflow / runs](https://github.com/OGLOCBABY/pong-game/actions/workflows/quality.yml).
- [Verified all-green cross-browser and balance run (37804691132)](https://github.com/OGLOCBABY/pong-game/actions/runs/37804691132):
  - **18/18** physics, scoring, determinism, AI-pressure and simulated-match tests passed (0 failed).
  - Automated expert beat the Pro CPU **7–0 in 39,991 simulated 120 Hz steps**, proving the intermediate CPU difficulty can concede under pressure.
  - Against the Legend CPU, the same scripted player scored 1 point in 20,000 steps and 4 points in 80,000 steps. The highest difficulty remains materially harder without absolute perfect aim. These are deterministic scenario results, **not estimates of a real human win rate**.
  - Independent simulated Rookie match: **7–0**, 57 paddle collisions, 37 wall bounces, maximum 27-hit rally; match finished cleanly.
  - Chromium desktop: page boot, keyboard response, pause freezes physics, resume, 2-player controls, settings, keyboard restart, scripted mouse tracking, **complete actual browser match 0–7**, game-over overlay and rematch.
  - Chromium mobile: 390px viewport touch, simultaneous two-pointer local controls, 320px viewport with no horizontal overflow, system reduced-motion behavior.
  - **Firefox + WebKit:** real engine initialization, match starts, can pause.
  - **axe-core WCAG 2.1 AA** automated audits on desktop and mobile: zero detected violations.
  - No captured browser page errors or console errors.
- [Visual artifact and completed-match run (37803856143)](https://github.com/OGLOCBABY/pong-game/actions/runs/37803856143), with full-page desktop, duel, completed-match, mobile, narrow-phone, Firefox, and WebKit screenshots. Screenshots were manually inspected; an initial WebKit image taken at the start of the CSS fade-in was corrected by waiting 350ms before capture. The settled overlay rendered correctly.

## Rubric and provisional self-assessment

This is an **evidence-based subjective rating**, not a third-party review, a benchmark against other LLMs, or an assertion of perfection.

| Domain | Weight | Self-rating / 10 | Evidence and qualification |
| --- | ---: | ---: | --- |
| Physics & game balance | 25% | 9.6 | Swept collision and accelerated rallies; 18 tests incl. expert-vs-AI; still no extensive human tournament |
| Input & responsiveness | 20% | 9.5 | Keyboard, pointer, drag, dual touch and viewport behavior tested; gamepad and actual iOS hardware not manually tested |
| Visual & sound presentation | 20% | 9.7 | Original coherent HUD and vector artwork reviewed across screenshots; synthesized sound has not been auditorily reviewed on physical speakers |
| Functional reliability | 15% | 9.7 | Full browser match/rematch and three browser engines; no long-duration mobile manual soak |
| Accessibility | 10% | 9.2 | Keyboard path, live announcements, prefers-reduced-motion, automated axe WCAG checks; manual screen reader evaluation is not done |
| Performance & maintainability | 10% | 9.3 | No runtime dependencies, fixed-step capped simulation, DPR rendering, documented interfaces; no independent real-device energy/performance benchmarks |
| **Weighted total** | **100%** | **9.5 / 10 (rounded)** | **Not certified 10/10** |

Calculation: `0.25×9.6 + 0.20×9.5 + 0.20×9.7 + 0.15×9.7 + 0.10×9.2 + 0.10×9.3 = 9.545`, rounded to one decimal = **9.5**.

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

## Outstanding validation gates

- **Public URL not verified.** The repository currently provides a portable static site, not an automatically enabled GitHub Pages service. The repository owner must enable Pages in repository **Settings → Pages**, selecting `main` and `/(root)`. Do not interpret an expected Pages URL as a tested live deployment.
- **Physical human usability testing not done** on representative desktop browsers and real iOS/Android devices. Scripted Playwright input is a useful regression tool but not a substitute for real humans.
- **Manual assistive-technology audit not done** (VoiceOver, NVDA or TalkBack). Passing axe does not prove complete WCAG conformance.
- **Real speaker/headphone audio quality and latency** not verified. Headless tests exercise sound settings but cannot subjectively hear waveforms.
- **Performance/energy on slow phones** not benchmarked. The simulation caps catch-up steps and particles but performance varies by device.

## Completion rules

All implementation items in `plan.md` can be completed within this repository. A genuine subjective **10/10** would require closing the above externally dependent gates, plus independent comparative human game review. The numerical target cannot be proven by a unit-test count or by simply declaring success.

The application remains fully playable locally over HTTP and continuously verified by GitHub Actions. No other user repositories or projects were modified.
