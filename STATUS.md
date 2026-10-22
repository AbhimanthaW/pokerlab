# PokerLab V5 — The Night Room Expansion

**PokerLab V5.0.0 is finalized.** All six V5 feature pillars are implemented. The routine unit suite, TypeScript checks, lint, production build, and native Chromium Playwright suite have passed.

On 22 October 2026, the complete native macOS Playwright suite passed **42/42 tests**, following repair of an outdated Action History test locator.

Manual audio listening, real-device touch testing, comprehensive visual inspection, and sustained GPU/FPS profiling remain separate acceptance activities. No deployment was performed.

Implemented:

- Optional first-person hands/forearms with original shared geometry, action gestures, sleeve/skin choices and temporary own-card inspection.
- Existing dealer with articulated hands/arms, shuffle/deal/burn/runout/showdown/award/collection choreography.
- Public-only NPC gaze, pupil/blink variation, restrained public-result expressions, rotating milestone dialogue and retained V4 personalities/memory/policy.
- Three room palettes, four felts, three finishes/card backs/chip styles, preview/apply/cancel/defaults and version-1 cosmetic persistence.
- Standard/Cinematic/Instant camera modes with human-turn priority and reduced-motion behavior.
- Rain-window atmosphere, expanded local effects, room ambience, stereo panning and independent character-audio level.

| Verification | Result |
| --- | --- |
| Baseline | 227 tests passed; original optional exhaustive census skipped |
| V5 routine suite | 260 passed, one optional exhaustive census skipped; all 227 baseline tests retained |
| TypeScript/lint/build | Passed; existing lazy-scene size warning remains |
| Domain compatibility | All 32 domain files byte-identical to V4, including rules, NPC policy, replay reconstruction and probability algorithms |
| Original stress | 5,000 hands / 26,313 transitions / 710 sessions / 1,535 eliminations / 360 winners |
| V4 memory/replay stress | 600 hands / 7,029 transitions / 78 sessions / 12,914 replay snapshots |
| Production probability worker | Exact, simulation and cancellation bundle checks pass in Node worker host |
| Browser collection | 42 scenarios; six V5 viewport/preset scenarios added |
| Fresh browser attempt | Installed Chrome exited SIGABRT before page creation; cleanup reported kill EPERM |
| Model-only study | Actual polygon hand geometry software-projected and inspected; thumb connectivity corrected |
| Actual room captures, lighting/collision review, touch/fullscreen/audio listening/GPU profiling | Pending; no pass claimed |
| Native Playwright browser suite | 42/42 passed on 22 October 2026 |
| Previously blocked browser execution | Resolved in native macOS Terminal using Playwright-managed Chromium |
| Manual audio, physical touch and GPU/FPS profiling | Remain unverified |

All original save keys/schemas remain. `pokerlab.room.v5` adds validated optional version-1 cosmetics; corrupt/missing data resets only those cosmetics. No new dependency, financial feature, reward/purchase system, game variant or online service.

Known limits: procedural rather than full skeletal rigs, representative chip meshes, no physical finger simulation, synthetic non-speech acknowledgements, existing large PCM music asset, local single-tab inspectable saves and unresolved browser visual gate. Performance aims remain 60 FPS capable desktop, 45–60 FPS mid-range laptop and at least 30 FPS supported mobile; these were not measured. See V5-QA-REPORT.md and the V5 animation/art/license documents.
