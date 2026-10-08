# Asset Provenance — RUINS OF THE SECOND SUN

**Release gate G15:** Every published visual/audio runtime asset must have a verified source and redistributable license. This project intentionally uses no proprietary extracted game artwork.

| Published file | Origin | License consideration | External fetch |
| --- | --- | --- | --- |
| `index.html`, `style.css` | Original project code in this repository | Repo owner retains copyright (no root LICENSE granted) | none |
| `engine.js`, `level.js`, `main.js` | Original gameplay implementation here | Repo owner retains copyright | none |
| `art.js` | Original Canvas 2D code-generated illustrations/shapes, new statues, backgrounds, humanoid poses, vehicle and Boss | No copied SNK sprite pixels, music files or ROM | none |
| `audio.js` | Original Web Audio oscillator/noise synthesized at runtime | No downloaded samples or SNK audio recordings | none |
| System fonts (Impact, Arial, system-ui) | Client OS font selection; not bundled or transmitted | No font binary distribution | none |
| `tests/*` | Project-only automated tests; not published by Pages | Development tooling | none in production |
| Reference documentation URLs | Research only | External copyright remains with owners; links are not image-license grants | not loaded in game |

**Denied asset classes:** SNK spritesheets, ripped emulator dumps, exact proprietary backgrounds, original score, copyrighted gameplay video embedded into game, copied logos/attribution implying official endorsement. Any future third-party candidate requires original download link, version, license text and SHA-256 (before commit), with cancellation on uncertainty.

**Trademark positioning:** `Metal Slug 2` and character names are solely *research references* in documentation. Public game title is `RUINS OF THE SECOND SUN`, original artwork and original program code, no official affiliation stated.

**Audit commands (planned runtime):** inspect tracked asset list and direct HTTP requests, verify `art.js` not fetching URLs and Pages artifact contains only documented runtime files. CI screenshot artifacts are evidence, not production assets.
