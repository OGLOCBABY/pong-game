# Research — pong-game

Date: 2026-10-08 (UTC)
Repository: `OGLOCBABY/pong-game`
Scope: **this repository only**.

## Baseline inspection (read-only)
- Default branch: `main`, initial head `1a1ec230593a15fd4e89083d91a807fc56ec8b2c`.
- Entire recursive tree: a single 101-byte `README.md` (`43e987e3c063bbdcf051e343940371368f6295df`).
- README says: “A classic Pong game with HTML, CSS, and JavaScript featuring player vs computer gameplay.”
- Commit history: one `Initial commit` on 2026-10-08 at 13:11:03 UTC. No pre-existing game code, tests, dependencies or build assets to rescue.
- Default branch was not protected at inspection; repository is public and not archived.
- GitHub metadata reported `has_pages: false`; **a hosted URL is not yet established**.
- Runtime/browser capability cannot be inferred from repository metadata. Automated browser checks must run before declaring browser validation complete.

## Diagnosis
The failed attempt never reached a committed playable implementation; this is a greenfield implementation, not a repair of an existing executable. Because the only stated original contract is player-vs-computer Pong in HTML/CSS/JavaScript, protect that as the minimum behavior, then extend conservatively.

## Product requirements
1. Immediately understandable Pong: move paddle, return ball, score on misses, play a complete match.
2. High-quality visual finish, responsive layout, delightful but restrained audiovisual feedback.
3. CPU difficulties that change *fair, constrained* tracking/anticipation; local two-player mode.
4. Robust physics at different frame rates and on small screens, proper game lifecycle, keyboard/touch/pointer controls.
5. Scores, pause, replay, mute, reduced-motion and assistive semantics.
6. Offline-capable static app with no remote assets or runtime dependencies.
7. A reproducible evaluation: physics unit tests, scripted browser flows, simulated autoplay and transparent self-scoring.

## Scope and hard constraints
- Change only files under this repository. Do not access or modify sibling repositories, local user projects, accounts, secrets or third-party services.
- Preserve `main` history and original game promise. No force pushes.
- Prefer small standard-web technologies over frameworks or external assets. No asset-license risk and no deployment token required.
- Keep public repository APIs clearly documented if introduced (notably `src/engine.js`).
- Run tools through repository-scoped GitHub operations; avoid creating cross-repository resources.
- Do not claim human playtesting, a hosted site, perfect score, or test success without evidence.

## Risks and mitigations
| Risk | Mitigation |
| --- | --- |
| Tunneling/large time steps skip paddle | fixed-step simulation with swept contact checks |
| AI feels unfair | visible difficulty settings; AI speed, prediction and reaction bounds |
| Input failure on touch | pointer mapping and left/right paddle routing; responsive controls |
| Animation overload | motion toggle, system reduced-motion detection, capped particles |
| Audio blocks/autoplay | synthesized sound created only after user gesture, mute |
| CI unavailable or browser unavailable | independently run Node physics checks, report browser gate status |
| Unfinished deployment | local preview and GitHub Pages setup instructions; avoid asserting a live URL |

## Evaluation rubric (each 0–10)
Gameplay/physics 25%, responsiveness/controls 20%, presentation 20%, reliability/tests 15%, accessibility 10%, performance/maintainability 10%. Overall rating is evidence-based and is **not** a claim of equivalence to a particular AI model. An unverified gate prevents a claimed 10/10.

## Architecture direction
Static entry `index.html`, styling `styles.css`, reusable pure engine `src/engine.js`, DOM and Canvas controller `src/main.js`, Web Audio synthesis `src/audio.js`. Tests under `tests/`, workflow under `.github/workflows/`. No production build system.
