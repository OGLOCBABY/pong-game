# QA — RUINS OF THE SECOND SUN (Metal Slug 2 Mission 2-inspired)

Date: 2026-10-09. Project branch: `feature/ruins-of-second-sun`.

**IMPORTANT: Work in progress.** Evidence gate labels deliberately distinguish *model-level* deterministic checks from actual GitHub CI, headless Playwright keyboard, published production website, and human play evaluation.

## Implementation-level evidence already obtained

- [PR #2](https://github.com/OGLOCBABY/pong-game/pull/2): R1–R2, 16 inline review comments, A1–A8 closures, G01–G20 executable plan; merged to feature branch, not root.
- [PR #3](https://github.com/OGLOCBABY/pong-game/pull/3): all engineering modifications are constrained to same repository. Draft until green implementation, full browser and release checks.
- Initial simulation source tested by running original pure engine JavaScript in isolated JavaScript runtime: 26/26 added Node-style assertion functions now pass after correcting two fixture errors. **This is a partial independent test, not an `npm test` / GitHub CI substitute**.
- Deterministic Practice-mode scripted engine input reached real boss defeat in ~27 virtual seconds for seeds `7098`, `1`, `42`, `1234`, and `9999` with nonzero camera Y travel and mounted Slugnoid. This is **engine-level automated play**, not a human or headless-browser outcome.
- Input-only, no-jump case stalled at the ascent gate (boss inactive). Direct batched game state computation is acceptable for unit tests but **not a visual acceptance substitute**.
- Root Pong historically: GitHub Actions run [37814781401](https://github.com/OGLOCBABY/pong-game/actions/runs/37814781401) passed 21/21 existing Node tests and original three-browser smoke. Later branch checks must establish no regression; historic run alone is not enough.
- Original reference fidelity: see [reference-map.md](reference-map.md), explicitly not frame-accurate.
- Code-gen asset provenance: see [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md).

## Open live gates

| Gate | Status | Required evidence |
| --- | --- | --- |
| G02 original comparison | PARTIAL | Film segments and actual behavior mapped, not pixel exact |
| G03-04 map and 2D camera | SIMULATED, browser pending | 6 scenes and >400px y camera movement during non-cheating play |
| G05-10 fighting, Slugnoid and boss | SIMULATED, browser pending | Actual live keyboard play to victory, death paths and real sprites |
| G11 controls/accessibility | NOT_YET_VERIFIED | Chromium mobile, 320px, Firefox/WebKit + axe logs |
| G12 26 new Node tests | SOURCE/JS ISOLATE 26/26 | Explicit successful child `npm test` CI run |
| G13 full browser smoke | NOT_YET_VERIFIED | Github Actions Playwright logs, stage screenshots and victory |
| G14 old Pong preserved | HISTORICAL, current PR pending | Main quality CI original Pong steps |
| G15 license | CODE AUDITED | No copied media, recheck final artifact |
| G16 Pages QA gate | IMPLEMENTED, pending run | pages workflow can only follow successful main quality |
| G17 public URL | NOT_LIVE_VERIFIED | Live HTTPS, JS/CSS, browser key input, start, pause + interact |
| G18 human-quality/10 | NOT_CERTIFIED | Human play/independent comparison missing |
| G19-G20 scope, rollback | SOURCE DIFF pending | GitHub comparison, exact source commit |

## Honest scoring state

Do not infer `10/10` or an equivalence to Opus 5.5 from unit test counts. Full stage fidelity, difficulty/pacing (script ~27 s; original longplay ~5m), audiovisual polish and real human feel remain disputed until evidence closes. Current status: **NOT_READY_FOR_RELEASE until CI/browser/Pages gates pass**. No subjective numeric final score certified.

If tests show a real failure, log run URL, error, fixture if mistaken, fix commit, rerun at exact SHA, and leave a public trace here. Never use a skipped Pages job as proof of deployment.
