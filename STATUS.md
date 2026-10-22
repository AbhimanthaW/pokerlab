# PokerLab V4 status — The Living Table

**All three V4 pillars are implemented. Automated acceptance passes; actual browser/visual acceptance remains pending. Do not treat this as a verified production visual release.** No deployment, backend, accounts, financial integration or V4.1 work.

| Area | State |
| --- | --- |
| V1 Learn and V2 Hold'em | Preserved; original regression suite and 5,000-hand invariants pass |
| V3.1 immersive room and controls | Retained, including legal compact Raise workflow, renderer fallback and local saves |
| Living NPCs | Personality movement, facial cues, public-only bounded memory, small legal policy extension and optional milestone text |
| Cinematic replay | Last-hand/history entries, existing 3D scene reuse, read-only timeline, controls, speed, direct seeking and legacy fallback |
| Probability Lab | Separate card editor, exact drawing ratios/distributions, seeded worker simulation, comparison/intervals and cancellation |
| Strict TypeScript, lint, build | Passed |
| Routine tests | 227 passed, one optional exhaustive census skipped; 196 V1–V3.1 baseline tests retained |
| Core stress | 5,000 hands, 26,313 transitions, 710 sessions, 1,535 eliminations, 360 winners |
| V4 memory/replay stress | 600 hands, 78 sessions, 7,029 transitions, 12,914 replay snapshots, seed 7412 |
| Production probability worker | Executed in a Node worker host: exact 1,081 outcomes, 2,000 seeded samples and cancellation pass |
| Browser suite | 36 cases collected; focused V4 execution blocked before page creation |
| Actual rendered captures, audio listening, fullscreen, GPU/FPS/memory measurements | Pending; no pass claimed |

Fresh browser attempt: installed Google Chrome launched under Playwright then exited SIGABRT before a page/context opened; cleanup reported kill EPERM. Existing browser-dependent V3/V3.1 acceptance is carried forward. Tests with mocked scenes do not establish real 3D quality or layout.

Saves: `pokerlab.v1`, `pokerlab.play.v2` schema 2 and `pokerlab.immersive.v3` schema 1 remain compatible. New completed hands add optional version-1 replay metadata; old/corrupt optional metadata falls back honestly. V4 settings/public memory use separate version-1 keys. Replay/history are bounded to 100 hands; memory to 12 hands and bounded action lists. No active deck is copied into probability or replay state.

Known limits: legacy hands may lack earlier human cards; replay uses ordered records and nominal playback timing; characters remain lightweight procedural models; memory-aware NPCs remain heuristic; exact enumeration caps at 25,000 completions and simulation at 100,000 trials; saved single-tab data remains local/inspectable/unencrypted. Existing ~941 kB lazy-scene warning and 6.44 MB local music asset remain. Browser visual acceptance is the next verification priority, followed by measured device profiling and targeted V4.1 refinements.

See V4-QA-REPORT.md and the three V4 design documents for evidence and implementation boundaries. Historical V2/V3/V3.1 reports remain available.
