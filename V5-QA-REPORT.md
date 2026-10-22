# PokerLab V5 QA report — The Night Room Expansion

22 October 2026. All six V5 pillars are implemented and automated checks pass. **The actual browser/visual acceptance gate remains open. A polished production visual completion or achieved FPS target is not claimed.** No deployment, infrastructure, new dependency, external service, financial feature or extra game variant.

## Delivered implementation

| Pillar | Implementation |
| --- | --- |
| First-person hands | Original merged five-finger palm/wrist geometry, sleeves/cuffs, human action gestures, temporary own-card inspection, visibility and material choices |
| Dealer | Existing character retained, closer coherent deck reach, articulated arms, cosmetic shuffle packets, ordered private dealing, burns/reveals, showdown/award/collection stages |
| NPC interaction | Public actor/dealer/winner gaze, bounded pupil movement, phase-varied blinking, restrained public-win expressions, varied milestone dialogue and rotating speakers |
| Customization | Night/Golden/Rainy palettes; felt, raised rail/wood, card backs, chip palette, sleeve/skin; preview/apply/cancel/defaults; isolated persisted schema |
| Camera | Standard/Cinematic/Instant, bounded optional event framing, human-turn priority, reset, inspection and reduced-motion convergence |
| Atmosphere/audio | Framed instanced rain window; room ambience variants; slide/tap/award/reaction effects; panning; deduplicated scheduling, independent character level and cleanup |

Architecture is described in V5-ANIMATION-SYSTEM.md. Original art, palettes and limitations are described in V5-ART-DIRECTION.md; asset origins/terms in V5-ASSET-LICENSES.md. Full supplied requirements are retained in V5-SPECIFICATION.md.

## Automated evidence

| Check | Result |
| --- | --- |
| Independently rerun V4 baseline | 227 passed, one optional exhaustive census skipped |
| V5 routine suite | 260 passed, one optional exhaustive census skipped; 35 files passed, one skipped |
| TypeScript | `npm run typecheck` passed; build also runs strict TypeScript |
| Lint | `npm run lint` passed |
| Production build | Passed; existing >500 kB lazy-scene warning retained |
| Domain preservation | SHA-256 compared all 32 domain files with PokerLab-V4.zip: zero changes |
| Core stress | 5,000 hands, 26,313 transitions, 710 sessions, 1,535 eliminations, 360 winners |
| V4 memory/replay stress | 600 hands, 7,029 transitions, 78 sessions, 12,914 checked replay snapshots (seed 7412) |
| Probability worker | Unchanged production bundle exact/simulation/cancellation checks passed in Node worker host |
| Browser collection | 42 scenarios in five files, including six V5 viewport/preset cases |

All 227 prior tests are retained. The 33 additions cover public dealer ordering/runouts/coalescing, human gesture mapping, immediate human card priority, reduced-motion cancellation, stable flight/tilt behavior, gaze/camera bounds, instant audio and replay speed, no engine mutation, optional preferences/corruption, preview/apply/cancel/restore, keyboard/touch inspection, shared geometry lifetime and audio ambience/panning/deduplication/resource cleanup. No existing test was removed or weakened. The optional exhaustive evaluator census was not rerun; the original evaluator remains unchanged.

The complete domain directory is unchanged: rules, random dealing, legal amounts, pot resolution, chip accounting, NPC strategy/memory, replay reconstruction and probability math remain V4's authority. Cosmetic preview/application tests compare the full active session before/after and remount it unchanged. Scene APIs still accept public projections rather than live Session or engine dispatchers.

## Browser execution and precise blocker

Fresh command:

```sh
POKERLAB_CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- --grep 'V5 customization, inspection and intact session 1440'
```

Installed Chrome launched under Playwright, then the tool reported `Target page, context or browser has been closed`. The subprocess exited `signal=SIGABRT`; cleanup reported `Error: kill EPERM`. This happened before page/context creation or application assertions. No browser PASS or in-game screenshot was obtained. It is an environment launch failure, not an observed application assertion failure. No repeated permission-bypass attempts were made.

The six committed V5 cases cover 1920×1080, 1440×900, 1280×800, 768×1024, 390×844 and 320×640. Each opens the real canvas, inspects cards, applies all room presets, requests screenshots, disables hands/changes camera mode, compares the exact saved hand and refreshes cosmetics. Original browser scenarios remain. These are collected scenarios, not executed passes.

Actual in-room hand/dealer/furniture clipping, lighting/readability, event alignment, physical touch, fullscreen, listening/mix balance, replay appearance and long-session GPU/audio retention require a working browser. Carry forward the unresolved V3/V3.1/V4 visual/audio acceptance checks. Performance targets of 60 FPS capable desktop, 45–60 FPS mid-range laptop and 30+ FPS supported mobile are unmeasured.

## Available visual inspection

The actual procedural hand mesh was software-projected with Three.js SVGRenderer via `scripts/render-hand-study.mjs`, rasterized locally and visually inspected. That study identified a detached thumb segment; it was replaced by an integrated beveled thumb/palm shape, then the corrected five-finger silhouette was inspected. The mesh has 816 vertices / 272 triangles, shared across mirrored player/dealer hands. No primitive sphere/cylinder hands remain in the new hand asset.

This study is **model-only**, not a browser/WebGL capture and not evidence that the full room's collision/composition gate passed. Internal study paths were `/tmp/pokerlab-v5-visual/hands.svg` and `hands.png`; the SVG can be regenerated with the source script. No actual before/after in-game screenshots are available from this run.

## Performance/resource findings

The production scene is approximately 956 kB minified / 255 kB gzip, versus V4's approximately 941/251 kB. Main module is approximately 396/123 kB, CSS 77/17 kB; the probability worker remains 5.8 kB. The original 6.44 MB PCM music asset is unchanged and no audio-file payload/dependency was added. Compression was reviewed and not changed in this patch to preserve known compatibility and the original asset checks.

One R3F loop remains; no per-frame React updates or mesh/material construction. The new hand mesh is shared, and a unit test verifies stable ownership/disposal across cosmetic rerenders/unmount. Hidden-card backs share one scene texture; face textures do not regenerate when only card-back style changes. Geometry/material/texture cleanup is explicit. New fingers/palm comprise one merged mesh per hand, not dozens of individual finger draws.

Rain is bounded instancing: eight static Low streaks, 24 Medium, 48 High, confined to the background window; reduced motion is static. No new shadow-casting light, renderer, postprocessing or physics dependency was introduced. Existing DPR/quality bounds and inactive/demand rendering remain.

Public visual events stay bounded to 64, dealer cues to 48, sound cues to 96, deduplication to 512 IDs and active effect voices to 16. Pending audio is cancelled on pause, mute, scope changes and disposal. Ambient switching stops/disconnects the previous source rather than stacking loops. Camera/gaze values are bounded. These are code/resource tests; no measured FPS/draw-call/GPU-memory improvement is claimed.

## Review fixes

- Matched new card snapshots with their deal-event batch, so first mounting cannot miss its event.
- Added public old/new board counts to avoid reburning an existing flop during a turn/river all-in runout.
- Gave human decision cards immediate priority over cosmetic deal delays.
- Smoothed inspection tilt using the existing card frame hook; reduced motion snaps exactly.
- Integrated thumb geometry after actual model-study inspection.
- Coalesced simultaneous dealer pot gestures and aligned chip-flight/sound start with the dealer award cue.
- Cancelled delayed effects on interruptions; Instant collapses duplicate card sounds instead of producing a late burst.
- Applied cosmetic rail choices to the raised rail as well as the table wood.

## Compatibility and remaining limitations

All existing storage keys/schemas remain. V5 adds `pokerlab.room.v5`, version 1; invalid optional data falls back only for cosmetics. Existing volume values, quality, V4 settings/replays/memory, active sessions and educational progress are retained. No game outcome depends on animation/cosmetics. Hands can be disabled; cards/actions remain accessible through existing HTML controls and Table details.

Hands/arms are lightweight procedural approximations, not finger physics or full skeletal rigs. The visible shuffle is cosmetic; cards converge immediately on restoration/Instant/human priority. Burn visuals are anonymous. Dialogue remains optional text; character audio is non-speech synthesis. Single-tab local saves remain inspectable/unencrypted. Actual visual polish, contact/clipping and listening acceptance remain open due browser failure.

V5.1 priorities: finish real desktop/mobile captures and collision/timing review, profile sustained FPS/GPU/audio retention at all presets, then tune gesture reach, camera emphasis and mix levels from observed evidence. Consider a compatible compressed music alternative only with format/listening regression checks. No V5.1 feature work was started.

## Local launch and verification

```sh
npm ci
npm run dev
# Open http://127.0.0.1:5173/ → Play
# Pause/settings → Cardroom customization
# Eye footer control or I → inspect own cards; Escape → cancel
npm test
npm run typecheck
npm run lint
npm run build
node scripts/verify-probability-worker.mjs
npm run test:e2e
node --experimental-strip-types scripts/render-hand-study.mjs
```

Source package excludes dependencies, build outputs, caches, browser traces/reports and unrelated generated files. No deployment was performed.

## Source inventory relative to V4

Created:

- `V5-ANIMATION-SYSTEM.md`
- `V5-ART-DIRECTION.md`
- `V5-ASSET-LICENSES.md`
- `V5-QA-REPORT.md`
- `V5-SPECIFICATION.md`
- `e2e/v5.spec.ts`
- `scripts/render-hand-study.mjs`
- `src/features/night-room/Atmosphere3D.tsx`
- `src/features/night-room/DealerArms.tsx`
- `src/features/night-room/HandModel.test.tsx`
- `src/features/night-room/HandModel.tsx`
- `src/features/night-room/NightRoom.integration.test.tsx`
- `src/features/night-room/PlayerHands3D.tsx`
- `src/features/night-room/RoomSettings.tsx`
- `src/features/night-room/choreography.test.ts`
- `src/features/night-room/choreography.ts`
- `src/features/night-room/handGeometry.ts`
- `src/features/night-room/preferences.test.ts`
- `src/features/night-room/preferences.ts`
- `src/features/night-room/soundCues.ts`

Modified:

- `ARCHITECTURE.md`
- `README.md`
- `STATUS.md`
- `TESTING.md`
- `package-lock.json`
- `package.json`
- `src/app/App.tsx`
- `src/features/immersive-play/ImmersivePlay.tsx`
- `src/features/immersive-play/audio/AudioManager.test.ts`
- `src/features/immersive-play/audio/AudioManager.ts`
- `src/features/immersive-play/immersive.css`
- `src/features/immersive-play/presentation.ts`
- `src/features/immersive-play/scene/Card3D.tsx`
- `src/features/immersive-play/scene/ChipStack3D.tsx`
- `src/features/immersive-play/scene/NPCCharacter3D.tsx`
- `src/features/immersive-play/scene/PokerRoom.tsx`
- `src/features/immersive-play/scene/PokerScene.tsx`
- `src/features/immersive-play/scene/cardMotion.test.ts`
- `src/features/immersive-play/scene/cardMotion.ts`
- `src/features/immersive-play/scene/cardTexture.ts`
- `src/features/living-npcs/Dialogue.tsx`
- `src/features/living-npcs/behavior.ts`
- `src/features/replay/ReplayViewer.tsx`
- `src/features/replay/useReplay.ts`
