# PokerLab V3.1 status

**V3.1 polish implemented; visual/browser acceptance remains pending.** No deployment or financial integration.

The existing V2 baseline passed 152 routine tests, strict TypeScript, lint and build. V3 adds a full-viewport Play shell without the global sidebar, a modeled procedural 3D room/table, distinct seated avatars, physical cards, instanced representative chips, bounded camera, presentation effects, minimal legal-action HUD, pause/history/result overlays, optional fullscreen, independent local audio and quality settings. Renderer failure retains the active session in the existing 2D interface.

| Verification | Result |
| --- | --- |
| Strict TypeScript and lint | Passed |
| Routine tests | 196 passed: 152 existing + 44 V3/V3.1; optional exhaustive census skipped |
| Production build | Passed; lazy scene size warning retained |
| Domain integrity | All V1/V2 domain files byte-identical to V3 baseline |
| Stress regression | Unchanged 5,000-hand invariant test passed |
| Browser suite | 29 cases collected; focused V3.1 attempt blocked at Chromium launch |
| Actual rendered screenshots, audio listening, FPS/memory/device measurements | Pending; no pass claimed |

The current attempt found the bundled browser absent; installed Google Chrome then exited with SIGABRT before page creation. New component tests use a mocked scene and do not establish rendering quality. Full acceptance requires actual desktop/mobile inspection, complete-session UI testing, real fullscreen/audio review and performance measurement.

Known limits: procedural rather than skeletal avatars; representative rather than one-mesh-per-chip stacks; heuristic Auto quality rather than measured adaptive FPS; a roughly 940 kB lazy scene chunk and 6.44 MB local WAV; simplified digital TDA procedures; heuristic NPCs; single-tab unencrypted saves. Camera framing and readability need visual review. V3 does not add multiplayer, accounts, purchases, rebuys, real stakes or deployment.

V3.1 adds contextual wager controls, on-demand accessible table details, inward labels and a wider seated camera composition. See `V3.1-POLISH-REPORT.md` for changes and verification limits.

Next priorities: complete the browser/manual visual gate at all six target sizes, measure actual device performance and resource retention, then refine lighting/animation/character art from observed evidence. The V2 QA history is retained separately.
