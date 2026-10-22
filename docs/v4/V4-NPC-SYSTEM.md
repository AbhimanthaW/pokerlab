# V4 living NPC system

## Presentation

The original low-poly characters, clothing, face geometry, room and lighting remain. `living-npcs/behavior.ts` defines cautious, aggressive, casual and analytical presentation profiles with distinct movement amplitude, tempo, lean and gaze. A hash of public session/hand/seat identity supplies deterministic variation; private strength and game randomness are not inputs. Replays derive variation from public replay identity.

States include IDLE, OBSERVING, THINKING, CHECKING, CALLING, RAISING, FOLDING, ALL_IN, WAITING_FOR_SHOWDOWN, SHOWDOWN, HAND_COMPLETE and ELIMINATED; the existing dealer ACTING state remains. Action gestures use a bounded one-shot envelope, with smoothing across rapid changes. Existing head/body/hands are transformed imperatively inside R3F's existing frame loop, without per-frame React state. Lightweight brow position and mouth scale provide neutral/focused/pleased/disappointed/surprised/relaxed cues. Expressions reflect public action states, not hidden hand strength. Reduced motion removes oscillation and gesture excursions and snaps to a static public-state pose.

Optional original text reactions occur at hand/session milestones, not every action. They contain no card predictions or wagering advice, expire after roughly 5.5 seconds, pause with the table, and have no voice asset/dependency. The Character dialogue setting persists under `pokerlab.v4.settings`, version 1. Existing motion, graphics, audio and pacing settings are unchanged.

## Public memory and policy

`domain/play/publicMemory.ts` constructs version-1 public memory through an explicit field allowlist: last 12 completed hands, at most 64 actions per hand, up to 64 current actions, participation and legitimately tabled cards. It never serializes replay metadata, unseen folded cards, human private cards, burns, deck order or seeds. The existing frozen NPC observation API remains unchanged and still supplies only the actor's own cards and permitted public information.

`chooseNpcAction(observation, random?, memory?)` retains the original policy and safe legal fallback. The optional memory argument is a purpose-built public summary, never Session. At least eight relevant opponent actions are required. Public aggression frequency can adjust the heuristic score by at most ±0.035; Beginner retains the unadjusted baseline. Active opponents only are considered. No solver, external service, trained model or altered dealing is introduced. Original personality/difficulty differences remain. The controller validates resulting commands using the same engine validator as human commands.

The controller rebuilds memory from the authoritative saved public history/current action log on each revision and on restoration. A bounded version-1 sidecar is also persisted under `pokerlab.v4.public-memory`; runtime validation, session identity and field filtering govern its reader. A stale or corrupted sidecar is never trusted over the current saved history, so it cannot introduce future knowledge or change the live session. A new/discarded session resets the memory scope. This is a rolling public observation window, not indefinite opponent profiling.

## Verification and limits

Tests cover allowlists, detached copies, reveal legitimacy, truncation, validation, persistence/reset, inaccessible card/deck changes, seeded legal decisions, bounded tendency adjustment, profile differences, all behavior states, reduced motion and one-shot gesture convergence. The extra 600-hand suite uses memory-aware NPC decisions with injected randomness and engine invariants after each transition. Original 5,000-hand rules/NPC regression tests remain unchanged.

No advanced poker-solving equivalence, deceptive hidden-card tells, persistent cross-session opponent identity, speech synthesis, full skeletal/facial rigging or measured GPU improvement is claimed. Actual visual smoothness and facial readability await browser inspection.
