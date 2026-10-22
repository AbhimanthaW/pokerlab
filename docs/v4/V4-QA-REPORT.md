# PokerLab V4 QA report — The Living Table

22 October 2026. All three feature pillars are implemented and automated checks pass. Browser/visual acceptance is pending; a fully visually verified production completion is not claimed. No deployment, infrastructure, account, financial integration, external model, new dependency or V4.1 feature was introduced.

## Implementation and boundaries

- Living NPCs retain the original models and add personality movement, one-shot gestures, public-state expressions, public-only rolling memory, a bounded legal policy extension and optional original milestone dialogue.
- Read-only replay uses completed history plus optional version-1 metadata. It projects any timeline position into the existing scene and never calls game actions, pot resolution or NPC policy. Live work is paused and restored unchanged.
- Probability Lab uses a separate scenario, canonical cards and the existing evaluator. Exact draw ratios, bounded exact completion counts, seeded worker simulation, Wilson intervals, comparison/error and cancellation are implemented.
- V1 educational data, V2 active saves and V3 preferences keep their existing schemas. Legacy/corrupt optional replay metadata degrades to limited replay. V4 settings/public memory use separate version-1 keys. No hidden deck/burn/other private hand is copied to replay metadata or probability state.

Architecture details: V4-REPLAY-ARCHITECTURE.md, V4-NPC-SYSTEM.md, V4-PROBABILITY-LAB.md. Original supplied requirements are retained in V4-SPECIFICATION.md.

## Verification results

| Check | Actual result |
| --- | --- |
| Independently rerun baseline | 196 tests passed, one optional exhaustive census skipped |
| Final routine suite | 227 tests passed, one optional exhaustive census skipped |
| TypeScript | `npm run typecheck` passed |
| Lint | `npm run lint` passed |
| Production build | `npm run build` passed; existing lazy-scene size warning remains |
| Core stress (unchanged test) | 5,000 hands, 26,313 transitions, 710 sessions, 1,535 eliminations, 360 winners |
| V4 stress (seed 7412) | 600 hands, 78 sessions, 7,029 transitions, 12,914 checked replay snapshots; varied 1–5 opponents |
| Production worker bundle | Exact 1,081 completions and 2,000 simulation trials normalized; progress/termination verified in a real Node worker host |
| Browser collection | 36 scenarios in four files, seven new V4 scenarios |
| Browser execution | Focused V4 worker scenario attempted; blocked at Chrome launch before page creation |
| Actual screenshots/layout/touch/audio/fullscreen/GPU performance | Not verified in this run |

All 196 V1–V3.1 tests are retained. New coverage includes replay order, all-position conservation, arbitrary/reverse seeking, distinct pot awards/refunds, final-stack equality, folded/showdown privacy, legacy/corrupt metadata and field allowlists, controller speeds/cleanup, live-session immutability, NPC pause/resume, restoration, mathematical reference counts, dependent draws, wheel/flush cases, normalization, seeded sampling, confidence intervals, limits, worker stale-response rejection/cancellation, scenario editing and public-memory/profile boundaries.

A SHA-256 comparison against the retained pre-V3 domain baseline shows only three original domain files changed: `play/types.ts` (optional replay type), `play/engine.ts` (settlement history metadata only), `play/policy.ts` (optional bounded public-memory score). The other 22 original domain files, including cards/evaluator/rules invariants/pots/observation and original domain tests, match byte for byte. No existing tests were removed or weakened.

## Actual browser blocker and visual evidence

Command attempted:

```sh
POKERLAB_CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e -- --grep 'real worker exact'
```

Playwright launched installed Google Chrome, then reported `Target page, context or browser has been closed`. The subprocess exited `signal=SIGABRT`, and cleanup reported `Error: kill EPERM`. The failure occurs before any page/context, application assertion or rendered capture. There is no browser PASS. The prior V3 Mach-port error is historical, not substituted for this attempt's actual output. No sandbox restrictions were bypassed.

The E2E suite includes card editing at desktop/tablet/mobile sizes (1440×900, 768×1024, 390×844, 320×640), real Worker exact/simulation/cancel, replay navigation/scrub/speed, live-state identity, dialogue preference and restore. Original V1/V2/V3.1 scenarios remain, including six scene viewport sizes and renderer fallback. These are collected/committed coverage, not executed passes. Complete the full V4 20-step browser checklist and inherited V3.1 audio/fullscreen/control checks on a browser-capable host.

No V4 screenshots could be captured or inspected. The previously inspected V3 user screenshot remains a historical reference (`../v3-inputs/readability.png` in the working environment); it cannot demonstrate V4's new UI. After-capture paths are declared in `e2e/v4.spec.ts` and will be produced by a successful browser run. No fabricated visual comparison is supplied.

## Performance findings

The built main module is approximately 382 kB minified (118 kB gzip), CSS approximately 75 kB (16 kB gzip), lazy scene 941 kB (251 kB gzip), and probability worker 5.8 kB. The roughly 500 kB chunk warning applies to the existing lazy scene and is documented, not hidden. The original local music asset remains unchanged.

Local Node worker-host round trips including startup: exact 1,081-completion scenario approximately 72 ms, simulation 2,000 trials approximately 87 ms, cancellation after first progress approximately 29 ms. These are host measurements, not browser benchmarks or FPS claims. Progress messages are throttled to at most roughly 20/second to avoid excessive UI updates. UI-thread probability work is limited to small deck/count calculations; all completion evaluation uses the worker.

Replay stores compact records rather than per-frame snapshots. Memory remains bounded to 12 completed hands × 64 actions plus 64 current actions. Existing 100-hand history cap and quality/DPR settings remain. NPCs use imperative scalar transforms within the existing frame loop, without per-frame React state or new heavy dependencies. Replay timers and calculation workers have tested cleanup. GPU draw calls, sustained frame time, resource retention and physical-device interaction remain unmeasured due the browser blocker.

## Defects corrected during review

- Unknown optional metadata fields were removed through explicit allowlists before replay serialization/scene projection.
- Speed changes/pause no longer reset timestamps for the current visual event.
- Returning from replay establishes a silent live-scene revision rather than replaying past visual effects.
- Probability scenario edits terminate work and clear comparison results; cancellation rejects stale completion messages.
- Optional V4 storage access is guarded against unavailable localStorage.
- Narrow bottom navigation supports the additional Learn destination without overflowing the document.

## Known limitations and V4.1 priorities

Legacy hands lack earlier human cards and original presentation personality data; limited replay is labeled honestly. Replay timing is a nominal cinematic cadence, not original timestamps. Memory-aware policy remains heuristic with a deliberately small adjustment, not a solver. Facial cues use simple existing geometry. Dialogue is text only. Exact enumeration caps at 25,000 outcomes; Monte Carlo at 100,000 trials. Saves remain local, single-tab and inspectable. Optional sidecar memory is rebuilt from authoritative history on restore rather than trusted over newer public events.

Next: finish real desktop/mobile acceptance, inspect replay/Probability Lab captures, measure GPU and long-session cleanup, then make targeted V4.1 refinements from observed usability/performance evidence. No unverified visual success or claim of advanced poker AI is made.

## Local launch and checks

```sh
npm ci
npm run dev
# Open http://127.0.0.1:5173/
# Learn → Probability Lab; Play → completed hand/history → Replay
npm test
npm run typecheck
npm run lint
npm run build
node scripts/verify-probability-worker.mjs
npm run test:e2e
```

Source ZIP excludes dependencies, build outputs, caches, browser traces/reports and unrelated files. Installing dependencies/browser binaries may require registry access; running the local application requires no external API.

## Files created and modified

Created:

- `V4-NPC-SYSTEM.md`
- `V4-PROBABILITY-LAB.md`
- `V4-QA-REPORT.md`
- `V4-REPLAY-ARCHITECTURE.md`
- `V4-SPECIFICATION.md`
- `e2e/v4.spec.ts`
- `scripts/verify-probability-worker.mjs`
- `src/domain/play/publicMemory.test.ts`
- `src/domain/play/publicMemory.ts`
- `src/domain/probability-lab/engine.test.ts`
- `src/domain/probability-lab/engine.ts`
- `src/domain/replay/timeline.test.ts`
- `src/domain/replay/timeline.ts`
- `src/domain/replay/v4Stress.test.ts`
- `src/features/living-npcs/Dialogue.tsx`
- `src/features/living-npcs/behavior.test.ts`
- `src/features/living-npcs/behavior.ts`
- `src/features/probability-lab/ProbabilityLab.test.tsx`
- `src/features/probability-lab/ProbabilityLab.tsx`
- `src/features/probability-lab/lab.worker.ts`
- `src/features/probability-lab/probability.css`
- `src/features/probability-lab/protocol.ts`
- `src/features/probability-lab/useCalculation.test.tsx`
- `src/features/probability-lab/useCalculation.ts`
- `src/features/replay/Replay.integration.test.tsx`
- `src/features/replay/ReplayViewer.tsx`
- `src/features/replay/useReplay.test.ts`
- `src/features/replay/useReplay.ts`
- `src/lib/v4Storage.ts`

Modified:

- `ARCHITECTURE.md`
- `README.md`
- `STATUS.md`
- `TESTING.md`
- `package-lock.json`
- `package.json`
- `src/app/App.tsx`
- `src/domain/play/engine.ts`
- `src/domain/play/policy.ts`
- `src/domain/play/types.ts`
- `src/features/immersive-play/ImmersivePlay.tsx`
- `src/features/immersive-play/immersive.css`
- `src/features/immersive-play/presentation.ts`
- `src/features/immersive-play/scene/NPCCharacter3D.tsx`
- `src/features/immersive-play/scene/PokerScene.tsx`
- `src/features/play/HandHistory.tsx`
- `src/features/play/usePlay.ts`
- `src/styles.css`
