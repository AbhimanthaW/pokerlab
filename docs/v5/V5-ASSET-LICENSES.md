# V5 asset origins and licenses

No third-party art, commercial game soundtrack, remote model, speech service or paid asset was added. Existing V3 asset/license records remain applicable in V3-ASSET-LICENSES.md. Dependency notices remain in their packages.

| Asset/system | Source | Origin and terms |
| --- | --- | --- |
| Player/dealer polygon hands | `night-room/handGeometry.ts`, `HandModel.tsx` | Original project-generated geometry; same CC0-1.0 dedication as existing project procedural artwork |
| Sleeves/cuffs and articulated arms | `PlayerHands3D.tsx`, `DealerArms.tsx` | Original procedural geometry/poses; CC0-1.0 artwork |
| Window/rain/burn/shuffle visuals | `Atmosphere3D.tsx` | Original generated geometry/instancing; CC0-1.0 artwork |
| Room/felt/rail/chip palettes | `preferences.ts`, existing scene components | Original palette variations of the existing room; CC0-1.0 artwork |
| Lattice/burgundy card-back designs | `scene/cardTexture.ts` | Original canvas designs using basic geometric shapes/text glyphs; CC0-1.0 design; fonts remain system fonts |
| Slide/tap/award/reaction effects and ambience variations | Existing `audio/AudioManager.ts`, `soundCues.ts` | Original local Web Audio synthesis; no samples, voice likeness or external license; CC0-1.0 generated audio |
| Additional short dialogue variants | `living-npcs/behavior.ts` | Original project text; no external model/service |
| Hand geometry study generator | `scripts/render-hand-study.mjs` | Original model projection using existing Three.js/jsdom development dependencies; not a browser capture |

The original 146-second `midnight-study.wav` is retained unchanged. Its approximately 6.44 MB PCM representation was reviewed and retained for compatibility and existing verification; V5 adds no audio-file payload. The existing generator/original asset dedication remain documented in the V3 report. No licensed material has been fabricated or extracted from another game.

Procedural art/audio dedications describe the original generated assets, not a relicensing of Three.js, React, fonts or other dependencies. Their existing licenses remain unchanged. Local generated diagnostic projections are not bundled runtime assets.
