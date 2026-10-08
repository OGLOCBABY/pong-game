# RUINS OF THE SECOND SUN — Mission 02

An independent, original-art browser run-and-gun inspired by the dramatic sequence of **Metal Slug 2's second mission (1998)**, without shipping SNK ROMs, sprite rips, musical recordings or proprietary source code.

Play locally from repository root:

```bash
python3 -m http.server 4173
# open http://localhost:4173/metal-slug-2/
```

The repository's existing GitHub Pages workflow is intended to expose the standalone route `/pong-game/metal-slug-2/` *after* CI passes and a verified deploy. The root Pong game remains the site's homepage.

## Controls

| Action | Keyboard | Mobile |
| --- | --- | --- |
| Run | A / D or Left / Right | Left / Right |
| Aim upward | W or Up | Up |
| Crouch / downward aim (while airborne, or Slugnoid) | S or Down | Down |
| Jump / continuous hops when held | Space | Jump |
| Fire weapon | J / Z / left Ctrl (hold) | FIRE |
| Grenade / mounted downward main cannon | K / X | B |
| Mount or dismount Slugnoid | E | E (touch button) |
| Pause / resume | P / Esc | PAUSE |
| Restart / replay | R / Enter | UI buttons |
| Sound | M | SOUND button |

**Arcade:** one-hit fatal damage, 3 lives. A mummy curse slows and disarms; a second valid curse hit is fatal; antidotes cure it.

**Practice:** five hit points per life, 5 lives, more forgiving second curse and checkpoints; displayed as distinct game mode. Playthrough bot uses Practice; it **does not prove Arcade no-death completion**.

Objective: night desert → explode Danger barrel → pyramid tomb → vertical tower → ride Slugnoid → defeat the upward-rising mechanical serpent, Aeshi Nero. A true camera Y scroll and altitude gates prevent bypassing the tower by simply holding right.

## Quality and boundaries

```bash
npm install                   # from repository root, dev-only playwright and axe-core
npm test                      # original Pong engine
npm run smoke                 # original Pong browser tests
npm --prefix metal-slug-2 test
npm --prefix metal-slug-2 run smoke
```

All run-time imports are ES modules with relative paths. Production has no runtime dependencies and does not request outside network assets. The new browser smoke test boots the actual path and uses real Playwright keyboard/touch and screenshots; it cannot mutate the game's diagnostic snapshot directly.

See [research.md](research.md), [plan.md](plan.md), [reference-map.md](reference-map.md), [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md), and [qa.md](qa.md) for the stage matrix, bounded uncertainties, copyright, and current test evidence.

**Scope boundary:** only `OGLOCBABY/pong-game`. Root STRIKELINE Pong code preserved; only additive CI and Pages changes.
