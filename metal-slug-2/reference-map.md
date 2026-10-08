# Original Mission Reference Map — Metal Slug 2, Mission 2 (1998)

Status: **research-supported, not frame-accurate**. This is a playable original-art recreation, NOT redistributed SNK source/game assets or a 1:1 sprite ROM reproduction.

## Canonical versions and evidentiary limits

- Canonical original: **Metal Slug 2 (Neo Geo 1998), Mission 2: Monument of Depression**. Do not substitute the remixed **Metal Slug X**, whose second stage opens in daylight.
- Developer interview: https://shmuplations.com/metalslug2/ — confirms vertical-scrolling intent and Slugnoid jump (hover removed).
- SNK official game history: https://www.snk-corp.co.jp/us/anniversary/metalslug30th/history/ — official history/context for 1998 title.
- Retrospective original game overview: https://www.arcade-history.com/game/1614/metal-slug-2-super-vehicle-001/ii-model-ngm-241 — scripted Sphinx eye/Danger barrel/POW references, subject to independent play verification.
- Metal Slug Wiki https://metalslug.fandom.com/wiki/Monument_of_Depression and https://metalslug.fandom.com/wiki/Aeshi_Nero — community-maintained mission and Boss behavior descriptions.
- Video https://www.youtube.com/watch?v=FY4XlenEtog — **description labels**: Mission 2 starts ~04:48, Aeshi Nero ~09:47, Mission 3 ~10:31. **No subscene frame-by-frame timestamps have been verified; platform is described as Neo Geo CD, not an MVS controller timing oracle.** Do not invent timestamps.
- Visual screenshot collection https://www.mobygames.com/game/16852/metal-slug-2-super-vehicle-001ii/screenshots/ — comparison only, not redistributable sprites.

## Scene-to-reference-to-test matrix

| Scene | Original feature (source authority) | Project behavior | Test / status |
| --- | --- | --- | --- |
| desert | Dark Egyptian desert, Sphinx eye secret, soldiers, explosives, captives (wiki + walkthrough) | Night parallax, secret, shootable Danger barrel required to proceed | `tests/engine.test.mjs` entrance & secret; browser desert screenshot — automated comparison pending |
| descent | Pyramid opening, mining crew, bats, mummies, curse and antidote (walkthrough + wiki) | Corridor transition with mummy/bat and antidote; mining characters remain **approximate, not claimed exact** | deterministic enemies; screenshot pending |
| tomb | Mummy spawners, ruins, POW and treasure (walkthrough/wiki) | Destructible spawners, treasure/POW; authored platforms | Node secret/reward; visual comparison pending |
| ascent | **Vertical camera and jumping** (1998 interview) | Multiple rising platforms and non-skippable height-gates; camera `{x,y}` | tests: cannot walk through, camera y<-400, height<-600 |
| slugnoid | Two Vulcan guns + downward cannon, legs/jump, damaged guns (history/wiki) | Vehicle `mounted,hp,gunsLeft`, enter/exit, twin Vulcan and down cannon | vehicle Node unit tests; browser vehicle screenshot pending |
| boss | Aeshi Nero rising mechanical serpent, missile/electric/laser/charge repertoire (wiki + original video must confirm) | Rises from below, threat telegraph lanes, destructible missiles and multi-state attacks | boss Node tests and full-playthrough screenshot; manual comparison pending |

## Fidelity uncertainty register

| Detail | Confidence | Further validation before 10/10 fidelity claim |
| --- | --- | --- |
| Darkness/night at original Mission 2 opening | high | screenshots with MS2 version label |
| Intentional vertically scrolling segment | high | compare ledge and camera transitions with longplay |
| Slugnoid no-hover jump constraint | high | separate mounted jump test |
| Exact enemies per screen, POW placement, item count | low | manually indexed original walkthrough/screenshot reference |
| Boss attack intervals/hit damage, projectile speed | low | frame-measured capture with version and frame rate; current game patterns **original approximation** |
| Exact length, art and timing (currently game bot ~27sec simulated) | low | real-human session + adjusted stage pacing |
| Original music/SFX | irrelevant to asset reuse | never import unless directly licensed |
| Licensed rights to SNK trademark, sprites and music | **not established** | prohibit assets, keep independent game title |

All references are used solely as research and are NOT copied into the published static game. This document intentionally avoids asserting unavailable frame-accurate measurements.
