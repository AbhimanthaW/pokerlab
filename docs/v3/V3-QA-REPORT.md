# V3 QA report

## Acceptance status

**V3 implementation is present, but V3 is not visually accepted or complete under the supplied definition of done.** Browser launch is blocked before page execution. No screenshot inspection, FPS number, GPU-memory measurement or real-device result is claimed. Nothing was deployed.

## Verified baseline and regression

The actual V2 repository passed strict TypeScript, lint, 152 routine tests and production build before V3. After integration, all 189 routine tests pass (152 existing + 37 new), with the optional exhaustive census skipped in the ordinary run. The entire src/domain directory, including the V1/V2 evaluators, rules, pot resolution and NPC policy, remains byte-identical to that baseline.

The unchanged stress test again passed its 5,000 seeded hands with card/chip/actor/lifecycle assertions after every transition. V2's earlier separate exhaustive 2,598,960-hand census remains historical evidence; V3 does not modify the evaluator.

## New automated coverage

- Public renderer projection excludes deck, burns and concealed opponent cards; only legitimate showdown cards are visible.
- Duplicate/stale event suppression, silent restoration, bounded queues, new-hand cancellation and convergence.
- Clockwise unique seat anchors for one to five opponents; camera clamp/reset; conservative quality presets.
- Application sidebar removal, Learn return, exact session preservation across repeated 2D/3D switches, renderer-failure fallback, paused NPC cancellation/resume and StrictMode audio-owner cleanup.
- Preferences have a separate validated key; malformed data/storage failures recover without modifying the session.
- Explicit fullscreen request and rejection behavior.
- Audio stays locked before enable; one media/ambient owner; volume, visibility suspension, cleanup, async cancellation and autoplay rejection.
- Bundled PCM file is valid mono 22,050Hz/16-bit audio lasting 146 seconds. This verifies file structure/duration, not subjective listening quality.

The scene is mocked in component tests: these tests verify integration behavior and do not prove WebGL geometry, screenshots or lighting.

## Browser attempt and exact blocker

The suite collects 28 cases: 17 retained V1/V2 flows plus 11 V3 cases. A focused attempt of the real 1440x900 V3 scene case failed before any page was created. The installed headless Chromium logged:

```text
FATAL:base/apple/mach_port_rendezvous_mac.cc:159
bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer:
Permission denied (1100)
process exit: SIGTRAP
```

A V1 browser retry had the same launcher restriction. No browser restrictions were bypassed. Transient development-runtime transport interruptions were recovered; interrupted checks were rerun rather than counted as passes.

## Performance evidence and limitations

The production build succeeds and lazy-loads the scene separately. Measured emitted artifacts before final documentation-only packaging: main JS approximately 350 kB (108 kB gzip), scene JS approximately 940 kB (251 kB gzip), CSS approximately 65 kB (14.5 kB gzip). Vite warns that the scene chunk exceeds 500 kB; the warning is retained, not suppressed. Music is approximately 6.44 MB WAV and is requested only after audio enable.

No 30/45/60 FPS target is claimed as achieved. Auto quality uses viewport width/CPU cores, not an FPS feedback controller. Runtime memory, thermal load, frame pacing, draw-call counts, mobile GPU behavior, sound listening and repeated real WebGL context creation remain unmeasured. Primitive geometry/material draw calls should be profiled before further complexity is added.

## Manual acceptance still required

Run npm ci, npm run dev, then open /#play in a normal browser. Inspect actual screenshots at 1920x1080, 1440x900, 1280x800, 768x1024, 390x844 and 320x640. Verify the modeled room/table/people, seated framing, readable physical cards, correct positions, labels, legal controls, no clipping/overlap and a consistent original style. Run through dealing, calls/raises/folds, community streets, all-in runout, side pots, result, next hand and a complete session. Check chips against the HUD and history.

Enable audio explicitly, listen through the full piece/loop and effects, adjust each volume, mute, hide/resume the tab, and repeatedly enter/exit Play to detect duplicate sound. Exercise pause, camera drag/touch/buttons/reset, reduced motion, Skip animations, all graphics levels, fullscreen entry/Escape/rejection, 2D/3D switching and refresh restoration. Simulate WebGL context loss and confirm the exact session survives in 2D. Inspect GPU/heap retention across repeated entry/exit and measure FPS on actual target hardware.

The committed browser scenarios automate part of this gate once Chromium can launch. Fullscreen compatibility, auditory quality and visual appeal also require human review. Formal screen-reader, Firefox/Safari and physical-device coverage remain pending.


## Screenshot follow-up: false WebGL fallback fixed

The user's 22 October screenshot showed the original 2D table and the message “WebGL is unavailable.” Inspection of the installed React Three Fiber 9.8.2 Canvas implementation confirmed that its fallback prop is always mounted as HTML canvas children. The application had placed a failure-reporting effect inside those children, so a supported canvas could incorrectly force 2D immediately. That banner did not establish a hardware/WebGL limitation.

The fallback content is now inert HTML. Genuine initialization errors still propagate to SceneBoundary, and actual context loss still selects the preserved 2D interface. Three new regressions model R3F's real fallback mounting behavior, assert that the 3D shell stays selected, and verify a real thrown renderer-initialization failure retains the exact saved hand. The full suite now passes 189 routine tests, strict TypeScript, lint and production build.

Fresh WebGL visual acceptance remains separate from this verified application fix. The focused browser retry is still subject to the documented launcher restriction; no rendered 3D pass is claimed. Reload Play and select Try 3D if a previous fallback/manual display preference remains active.


## Screenshot follow-up: repeated flips and card readability

The 12:01 user screenshot was visually inspected. It showed a successful preflop 3D render with a seat label overlapping the pot/status region, a tiny bottom card readout and crowded placement around the table. No community cards were present in that preflop screenshot; the user's reported later-street readability problem was traced separately to the flat board geometry in source. Coplanar artwork shapes also showed depth artifacts. This screenshot confirms the earlier fallback fix allowed the scene to render in the user's browser; it does not verify the latest changes.

The repeated flips were traced to effect dependencies on Card object references. Immutable engine transitions clone those objects, so ordinary actions recreated textures and restarted flips. Texture identity now depends on serialized rank/suit/ID values. Placement, fixed orientation and animated reveal rotation have separate groups. New physical cards can deal once; a concealed card flips only on an actual null-to-visible reveal. Restoring a hand, cloning a snapshot or toggling motion does not replay a reveal.

The board's physical cards are larger, raised and tilted toward the viewer; the pot moved behind the board. A compact accessible HTML strip clearly separates the flop, turn and river, with placeholders for undealt slots. A readable private-hand/stack dock replaces tiny text. Seat labels sit closer to seats, away from the status panel; portrait camera framing also applies to tablet aspect ratios. Medium-width controls and the stack dock occupy separate areas. Wall artwork layers have distinct depths.

Eight new tests cover one-time dealing/reveal, cloned snapshots, motion toggles, restoration, reduced motion, stable texture reuse/disposal, staged board visibility and stable DOM cards. The full suite passes 189 tests. Browser assertions now also check the community strip and stack/control non-overlap at all six viewport sizes. New rendered screenshots are still required: the previously documented automated-browser launch restriction has not been bypassed, and the revised layout is not claimed visually accepted.
