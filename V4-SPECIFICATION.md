# PROJECT POKERLAB
## V4: The Living Table
### Full Production Implementation Specification

# YOUR ROLE

Act as a Principal Software Engineer, Game AI Engineer, TypeScript Architect, Three.js / React Three Fiber Specialist, Animation Engineer, Applied Probability and Combinatorics Specialist, Senior Frontend Engineer, Accessibility Engineer, Testing Engineer, and skeptical independent reviewer.

Your objective is to extend the EXISTING PokerLab V3.1 application into PokerLab V4: The Living Table.

**This is a complete implementation task, not a discovery exercise, research assignment, or prototype.**

You are authorized to inspect and modify the existing repository, install justified dependencies, implement new features, run tests, conduct browser verification, and update documentation.

The repository already contains the previous PokerLab implementations and their context.

Do not produce a separate discovery report or request approval before ordinary implementation steps.

Briefly inspect the relevant existing modules and baseline as part of development, then implement.

Do not deploy, provision infrastructure, or create external accounts.

---

# 1. EXISTING PROJECT

PokerLab currently contains:

## V1: Education

- Interactive poker training.
- Three hand-training modes.
- Hand-ranking reference.
- Feedback and explanations.
- Saved educational progress.
- Pure TypeScript hand evaluator.

## V2: Texas Hold'em

- Full single-player No-Limit Texas Hold'em simulation.
- Randomized dealing.
- Autonomous NPCs.
- Fictional chips.
- Betting-round mechanics.
- All-ins and side pots.
- Dealer and blind rotation.
- Last-player-standing sessions.
- Session persistence.
- Hand history.

## V3: Immersive 3D

- Real-time 3D card room.
- Low-poly NPC characters.
- 3D table, cards, and fictional chips.
- Seated first-person camera.
- Animation and audio systems.
- Immersive Play layout.
- Graphics settings and rendering fallback.

## V3.1: Polish

- Compact contextual action bar.
- Improved camera composition.
- Cleaner HUD.
- On-demand table details.
- Keyboard accessibility refinements.
- Responsive layout improvements.

The current visual identity is approved.

Do not redesign the environment or rewrite the existing game engine.

The last reported V3.1 automated baseline included 189 existing tests and seven additional tests, with 5,000 seeded simulated hands covered by the existing suite.

Independently verify the current repository state. Historical test results are not substitutes for running tests.

Fresh browser acceptance was previously blocked by a Chromium launch failure.

Do not claim that unresolved browser verification has passed.

---

# 2. V4 PRODUCT OBJECTIVE

PokerLab V4 introduces three major improvements:

1. **Living NPCs:** Enhance character expressiveness and introduce bounded public-session memory.
2. **Cinematic Hand Replay:** Allow completed hands to be replayed and inspected through the existing 3D environment.
3. **Probability Lab:** Provide interactive, mathematically correct card-probability experiments and educational explanations.

All three pillars are required deliverables.

These should feel like cohesive additions to the existing product.

Maintain two primary experiences:

**LEARN:** Training, reference materials, progress, and the new Probability Lab.

**PLAY:** The existing 3D simulation, enhanced NPCs, and completed-hand replay.

Do not clutter the normal Play interface with permanent analytical panels.

The game remains strictly fictional-chip-based, with no real-money play, currency exchange, purchases, prizes, or external gambling integrations.

---

# 3. ARCHITECTURAL PRINCIPLES

Follow these principles throughout implementation.

## 3.1 Preserve the authoritative engine

The existing poker engine controls:

- Deck composition.
- Randomness and dealing.
- Legal actions.
- Player turns.
- Chip accounting.
- Pot resolution.
- NPC decisions.
- Session progression.
- Elimination.
- Showdown.

V4 must not create a second authoritative game engine.

## 3.2 Read-only replay

The replay system must never mutate the active game session.

It must consume immutable completed-hand records or independently reconstructed read-only snapshots.

## 3.3 Probability isolation

Probability calculations must operate on separate card scenarios.

They must not access or alter the active session's private deck order, hidden NPC cards, randomness state, or card locations.

## 3.4 Hidden-information integrity

NPC decision-making may only use permitted observations.

Private opponent cards, burn cards, and undealt cards must remain inaccessible.

Character animations cannot reveal hidden information before the game permits it.

## 3.5 Maintain compatibility

Preserve existing saves wherever feasible.

Use explicit versioning and migrations for new persisted records.

Handle old records that lack V4 data without crashing or inventing missing information.

---

# 4. PILLAR ONE: LIVING NPCs

## 4.1 Objective

Make NPCs feel like individual characters rather than identical animated models.

Each should display personality through:

- Idle behavior.
- Posture.
- Eye and head movements.
- Gestures.
- Reaction timing.
- Context-sensitive expressions.
- Subtle differences in decision behavior where justified.

Do not equate sophistication with excessive animation.

The existing low-poly artistic style must be preserved.

## 4.2 Character behavior states

Support a structured presentation state model, including:

- IDLE
- OBSERVING
- THINKING
- CHECKING
- CALLING
- RAISING
- FOLDING
- ALL_IN
- WAITING_FOR_SHOWDOWN
- SHOWDOWN
- HAND_COMPLETE
- ELIMINATED

Use existing animation infrastructure where possible.

Create transitions that avoid sudden snapping or unnatural overlapping gestures.

## 4.3 Personality-consistent animation

Different NPC profiles should have recognizable tendencies.

Examples:

**Cautious:** Reserved gestures, restrained movement.

**Aggressive:** More assertive posture and quicker gestures.

**Casual:** Relaxed movements and more idle variation.

**Analytical:** Deliberate movements and attentive posture.

These are visual tendencies, not deterministic animation sequences.

Use controlled randomness to prevent identical repeated gestures.

Avoid caricatures and exaggerated personality stereotypes.

## 4.4 Facial expressions

Enhance existing faces where technically feasible.

Possible expression states:

- Neutral.
- Focused.
- Mildly pleased.
- Disappointed.
- Surprised.
- Relaxed.

Use the existing low-poly geometry and animation system, adding lightweight facial transformations or controlled expression variants.

Do not introduce a heavyweight facial-rigging dependency without a demonstrated need.

## 4.5 Public-session memory

Introduce a small bounded memory system for NPCs.

Memory should represent only information the NPC could have legitimately observed.

Potential data:

- Recent publicly observed actions.
- Completed-hand participation.
- Publicly revealed cards.
- Publicly observed behavioral tendencies.
- Previous interactions with other participants.

Memory should not contain:

- Hidden opponent cards.
- Unrevealed folded cards.
- Remaining deck order.
- Burn cards.
- Future community cards.
- Secret random seeds.
- Information not publicly available at the time of observation.

Use immutable or carefully controlled public-event summaries.

Bound memory storage to prevent indefinite growth.

Provide deterministic tests for memory creation, update, truncation, persistence, and reset.

## 4.6 Decision-policy integration

Preserve the existing NPC decision system as the baseline.

Where practical, introduce a small, testable memory-aware extension so public-session history can affect behavior.

Do not rewrite the entire decision policy.

Do not build a full game-theoretic solver.

Do not use an external LLM.

Any new policy behavior must:

- Remain legal under the existing action validator.
- Preserve personality distinctions.
- Use only permitted observations.
- Work with deterministic test randomness.
- Preserve existing game-state invariants.

Separate presentation personality from decision behavior so they can be tested independently.

## 4.7 Contextual dialogue

Add a lightweight optional dialogue or text-reaction system if it can be implemented cleanly.

Use short, original, context-sensitive lines.

Examples of eligible events:

- Beginning a session.
- Starting a new hand.
- Waiting for an action.
- Completing a hand.
- Reaching heads-up.
- Session completion.

Do not create intrusive dialogue after every action.

Ensure responses do not imply knowledge of hidden cards.

Provide a setting to disable character dialogue.

If voice audio is added, use original or appropriately licensed assets.

Do not integrate external speech-generation services.

Subtitles must be available for voiced lines.

---

# 5. PILLAR TWO: CINEMATIC HAND REPLAY

## 5.1 Objective

Allow the user to revisit completed hands in an interactive, read-only environment.

The replay should use the existing 3D room and table.

Do not build a separate duplicated 3D poker environment.

## 5.2 Replay entry points

Provide:

- Replay Last Hand after hand completion.
- Replay entry from the existing completed-hand history.
- Return to live Play.
- Exit replay to Learn where appropriate.

Replay must not interrupt, alter, or reset an active session.

## 5.3 Required controls

Implement:

- Play.
- Pause.
- Restart.
- Previous event.
- Next event.
- Timeline scrubbing.
- Playback speed.
- Exit replay.

Recommended playback speeds:

- 0.5×
- 1×
- 2×

Controls must be keyboard accessible.

Support reduced-motion settings.

## 5.4 Event timeline

Represent relevant hand events including:

- Hand start.
- Initial stacks.
- Dealer and blind assignments.
- Blind posting.
- Private-card dealing.
- Legal player actions.
- Community-card reveals.
- Showdown.
- Pot distribution.
- Final stacks.

Use existing hand-history records where sufficient.

Do not create a second event schema merely because it is convenient.

Extend existing typed records only where necessary.

## 5.5 Replay data model

Develop a versioned completed-hand record sufficient to reconstruct replay views.

Prefer a compact model containing:

- Session and hand identifiers.
- Participants and positions.
- Initial public state.
- Ordered game events.
- Revealed card information.
- Pot resolution.
- Final public state.
- Relevant timestamps or ordering indices.

Do not persist unnecessary animation frames or per-frame scene data.

Create a pure function or equivalent abstraction that can derive a read-only presentation snapshot for a requested replay position.

Replay must support jumping directly to an arbitrary event without requiring every previous animation to execute.

## 5.6 Information visibility

This is critical.

During replay:

- The human user's previously visible cards may be shown.
- Public community cards appear only when the relevant event occurs.
- Opponent cards appear only if legitimately revealed.
- Unrevealed folded hands remain hidden.
- Hidden deck order is never exposed.
- Historical views must not reveal information from later events prematurely.

Do not accidentally reveal private data through replay serialization or debug panels.

## 5.7 Replay presentation

Use the current 3D scene to show:

- Card distribution.
- Community-card progression.
- NPC actions.
- Card folding.
- Fictional-chip movement.
- Pot awards.
- Showdown.

Synchronize the action timeline with visible events.

Provide a compact event description adjacent to the replay controls.

Avoid permanently obscuring the scene with text.

## 5.8 Historical compatibility

Inspect the existing V2/V3 hand-history data.

If older records lack sufficient information for full replay:

- Support whatever can be represented accurately.
- Mark unavailable replay details honestly.
- Do not invent hidden cards or missing actions.
- Prefer full replay support for newly recorded V4 hands.

Do not corrupt older saved sessions.

## 5.9 Replay isolation

The replay controller must be independent of the live game controller.

Pausing, scrubbing, restarting, or exiting replay must not:

- Advance the live game.
- Trigger NPC decisions.
- Spend fictional chips.
- Recalculate actual pot awards.
- Alter persisted session state.
- Duplicate gameplay events.

Test this explicitly.

---

# 6. PILLAR THREE: PROBABILITY LAB

## 6.1 Objective

Add a mathematical learning environment to PokerLab.

The Probability Lab teaches how card probabilities arise from finite decks, combinations, and conditional information.

It should prioritize mathematical understanding rather than recommending wagering decisions.

Place it under the Learn experience.

## 6.2 Interactive card scenarios

Allow the user to construct valid card scenarios.

Support:

- Selecting two private cards.
- Selecting zero to five community cards.
- Marking additional known unavailable cards where appropriate.
- Resetting a scenario.
- Randomizing a valid scenario.
- Clearing individual selections.

Use the standard 52-card deck.

Reject duplicate cards.

Prevent invalid card counts.

Display remaining deck size clearly.

## 6.3 Exact probability calculations

Implement exact calculations where computationally feasible.

Examples:

- Probability of drawing a particular suit.
- Probability of drawing a particular rank.
- Probability of improving to a selected hand category.
- Distribution of final hand categories from a partial board.
- Straight and flush completion probabilities.
- Conditional card-drawing examples.

Use the existing poker hand evaluator where applicable.

Calculate using valid unseen-card combinations, without replacement.

Avoid incorrectly treating sequential dependent draws as independent events.

Use integer counts or exact combinatorial ratios where practical.

Convert to percentages only for presentation.

## 6.4 Exact enumeration

For tractable scenarios, enumerate all valid remaining-card combinations.

Use the existing evaluator to classify resulting hands.

Do not implement a separate hand-ranking algorithm.

Where appropriate, exploit combinations rather than enumerating irrelevant permutations.

Report:

- Total outcomes.
- Favorable outcomes.
- Exact probability.
- Percentage.
- A concise mathematical explanation.

Clearly specify assumptions and known cards.

## 6.5 Monte Carlo simulation

For computationally expensive scenarios, implement a separate simulation mode.

Requirements:

- Valid random draws without replacement.
- Configurable sample count.
- Deterministic seeded runs for tests.
- No alteration of live poker state.
- Responsive UI during computation.
- Cancellation.
- Progress indication when useful.
- Explicit labeling of estimated results.

Use a Web Worker where necessary to prevent long calculations from blocking rendering.

Provide an uncertainty estimate or confidence interval where mathematically appropriate.

Never label a simulation estimate as an exact probability.

## 6.6 Theoretical versus experimental

Allow users to compare:

- Exact mathematical probability.
- Simulated frequency.
- Number of trials.
- Estimation error.

Present results through clean charts or tables.

Explain why simulation frequencies fluctuate and tend to approach theoretical probabilities as the sample count increases.

Do not make unsupported claims that finite simulations must monotonically approach the theoretical value.

## 6.7 Example explanation

For a scenario with five visible cards, four of which are hearts:

- The deck contains 13 hearts.
- Four hearts are already visible.
- Nine hearts remain.
- There are 47 unseen cards.

Therefore:

P(next card is a heart) = 9 / 47.

The UI should provide the probability and explain the underlying counting.

All explanations must be generated from actual scenario data.

Do not hardcode explanations that become incorrect when cards change.

## 6.8 Probability Lab interface

Create a polished, educational interface consistent with PokerLab's existing visual identity.

Suggested layout:

- Interactive card selection.
- Current known cards.
- Remaining-card summary.
- Probability questions.
- Exact results.
- Simulation controls.
- Results visualization.
- Mathematical explanation.

Avoid turning this into another immersive 3D card room unless an existing lightweight component can be reused economically.

The Probability Lab may use 2D card components and diagrams.

Prioritize usability and mathematical clarity.

## 6.9 Computational limits

Set reasonable limits on exact enumeration.

For expensive scenarios, use:

- A mathematically justified alternative algorithm.
- Worker-based bounded computation.
- Or clearly labeled Monte Carlo estimation.

Do not freeze the browser by attempting enormous synchronous enumerations.

Keep numerical operations reliable.

Test normalization and edge cases.

---

# 7. UI/UX INTEGRATION

Maintain PokerLab's current navigation hierarchy.

## Learn

Add Probability Lab without disrupting:

- Existing trainer modes.
- Hand rankings.
- Progress.
- Settings.

## Play

Add replay entry points and richer NPC behavior without bringing back permanent page clutter.

The immersive scene remains the main focus.

Keep the V3.1 compact action controls.

Do not restore the old oversized HUD.

## Replay

Use a compact cinematic timeline.

Replay controls should appear when replay mode is active and disappear when exiting.

Avoid visual confusion between live gameplay and replay.

Provide a clearly visible Replay Mode indicator.

## Settings

Add only necessary options, potentially including:

- NPC dialogue enabled.
- Character animation intensity where useful.
- Replay playback preferences.
- Probability simulation defaults.

Preserve existing audio, graphics, motion, and gameplay preferences.

---

# 8. PERSISTENCE

Preserve V3.1 active sessions and educational progress.

Introduce versioned storage for:

- Completed-hand replay metadata.
- NPC public-session memory.
- Relevant V4 settings.
- Optional Probability Lab preferences.

Do not persist enormous Monte Carlo result datasets unnecessarily.

Bound completed-hand history.

Validate data loaded from storage.

Ensure corrupted or partially migrated records do not destroy valid progress.

Do not unnecessarily increase storage usage by duplicating entire game states for every recorded event.

---

# 9. TESTING REQUIREMENTS

Expand existing tests without removing V1–V3.1 regression coverage.

## 9.1 NPC tests

Verify:

- Valid memory creation.
- Public-only observation data.
- Memory truncation.
- Persistence.
- Consistent behavior with injected randomness.
- Distinct presentation profiles.
- Legal NPC decisions.
- No hidden-information leaks.
- Correct animation triggering.
- Safe handling of rapid consecutive events.

## 9.2 Replay tests

Verify:

- Event ordering.
- Snapshot reconstruction.
- Direct seeking.
- Step forward/backward.
- Playback-speed changes.
- Pause/resume.
- Cancellation.
- Showdown visibility.
- Hidden-card protection.
- Correct pot and stack representations.
- Historical compatibility.
- Immutable active session.
- No duplicate NPC actions.
- Safe restoration after refresh.

## 9.3 Probability tests

Verify:

- Correct deck size.
- Card uniqueness.
- Valid scenario construction.
- Exact combination counts.
- Correct conditional probabilities.
- Hand-category classification.
- Normalization of outcome distributions.
- Correct treatment of dependent draws.
- Ace-low straight behavior.
- Flush and straight edge cases.
- Monte Carlo reproducibility.
- Estimation behavior within statistical expectations.
- Simulation cancellation.
- Worker cleanup.
- Expensive-case computational limits.

Test the mathematical algorithms against independent fixtures or separately derived reference calculations.

## 9.4 Regression tests

Retain and rerun:

- V1 educational tests.
- V2 poker-engine tests.
- NPC policy tests.
- Chip-conservation tests.
- Existing 5,000-hand seeded stress suite.
- V3 animation/presentation tests.
- V3.1 action-control tests.
- Persistence tests.

Do not weaken an existing test to conceal a regression.

## 9.5 Browser acceptance

Test:

1. Existing Learn pages.
2. New Probability Lab.
3. Custom card selection.
4. Exact results.
5. Simulation execution and cancellation.
6. Entering immersive Play.
7. Existing action controls.
8. NPC gestures.
9. NPC dialogue toggle, if implemented.
10. Completing a hand.
11. Entering replay.
12. Stepping through events.
13. Timeline scrubbing.
14. Playback speed.
15. Replay exit without live-session mutation.
16. Continuing the live session.
17. Session restoration.
18. Mobile controls.
19. Reduced-motion behavior.
20. Renderer fallback.

Review desktop, tablet, and mobile layouts.

Carry forward unresolved V3.1 browser checks where relevant.

If browser automation fails, document the actual blocker and do not fabricate browser passes.

---

# 10. PERFORMANCE

V4 must not substantially degrade existing gameplay performance.

Avoid:

- Excessive NPC animation updates.
- Frequent full-scene rerenders.
- Large replay snapshots duplicated in storage.
- Expensive probability work on the main thread.
- Unbounded event histories.
- Unbounded NPC memory.
- Memory leaks from replay controllers.
- Excessive sound or dialogue events.

Maintain existing graphics quality presets.

Profile performance where tools are available.

Keep animation complexity proportional to visual benefit.

Provide meaningful cleanup for timers, workers, subscriptions, and GPU resources.

---

# 11. IMPLEMENTATION SEQUENCE

Proceed through the following phases within this implementation run.

Do not stop after a separate discovery phase.

## V4-01: Integration Foundation

Briefly inspect existing code.

Identify reusable history, NPC, card, and rendering APIs.

Establish baseline tests.

Implement only the necessary shared types and compatibility changes.

## V4-02: Replay Data and Controller

Implement:

- Completed-hand replay records.
- Event projection.
- Snapshot derivation.
- Seeking and timeline controls.
- Read-only state separation.
- Persistence compatibility.
- Unit tests.

## V4-03: Cinematic Replay UI

Integrate replay with the existing 3D table.

Implement animation synchronization, compact controls, event descriptions, and transitions between live and replay modes.

Verify that returning to the live game does not mutate its state.

## V4-04: Probability Engine

Implement exact combinatorial calculations, scenario validation, seeded simulation, complexity limits, and mathematical tests.

## V4-05: Probability Lab UI

Build card selection, explanations, result visualizations, and responsive simulation controls.

## V4-06: Living NPCs

Implement richer animation states, expression variations, bounded public-session memory, and carefully scoped policy extensions.

Add optional dialogue only when the core behavior is stable.

## V4-07: Quality Assurance

Run all tests.

Run TypeScript and lint checks.

Run the production build.

Run game stress tests.

Complete available browser acceptance.

Inspect screenshots.

Fix discovered issues.

Document actual results.

---

# 12. SCOPE RESTRICTIONS

Do not:

- Rebuild the 3D room.
- Replace the existing character models wholesale.
- Rewrite the poker rules engine.
- Create another game-state authority.
- Add new casino game variants.
- Add online multiplayer.
- Introduce purchasable virtual chips.
- Integrate real-money services.
- Introduce an external LLM dependency.
- Train a large neural network.
- Build an unnecessary backend.
- Add cloud infrastructure.
- Deploy the application.
- Replace working V3.1 controls.
- Add complex features unrelated to the three V4 pillars.

Preserve the existing visual identity.

---

# 13. DOCUMENTATION

Update:

- README.md
- STATUS.md
- ARCHITECTURE.md
- TESTING.md

Add:

- V4-SPECIFICATION.md
- V4-REPLAY-ARCHITECTURE.md
- V4-NPC-SYSTEM.md
- V4-PROBABILITY-LAB.md
- V4-QA-REPORT.md

Explain:

- Replay architecture.
- Replay-data versioning.
- Historical compatibility.
- Public/private information boundaries.
- NPC memory rules.
- Probability algorithms and assumptions.
- Computational limits.
- Simulation methodology.
- Test coverage.
- Performance measurements.
- Known limitations.

Documentation must match the actual implementation.

---

# 14. DEFINITION OF DONE

V4 is complete only when:

1. All existing V1–V3.1 functionality is preserved.
2. NPC animations show meaningful, consistent behavioral variation.
3. NPC public-session memory functions correctly.
4. Memory cannot access hidden information.
5. Completed hands can be replayed.
6. Replay controls work.
7. Replay events and visual state remain synchronized.
8. Hidden cards remain protected.
9. Replay cannot mutate an active session.
10. Existing saved data remains compatible.
11. Probability Lab supports custom valid card scenarios.
12. Exact probabilities are mathematically correct.
13. Monte Carlo simulation works where appropriate.
14. Exact and estimated results are distinguished.
15. Explanations reflect actual scenario data.
16. Computationally expensive tasks remain responsive.
17. Desktop and mobile controls are functional.
18. TypeScript, lint, tests, and production build pass.
19. Existing game stress tests pass.
20. Browser verification is performed where available.
21. All new features are documented.
22. No financial or real-money integrations are introduced.

No fake features, hardcoded result screens, or nonfunctional placeholders.

---

# 15. FINAL DELIVERY

Provide:

1. Implementation summary.
2. Major architectural decisions.
3. Files created and modified.
4. NPC behavior implementation.
5. Replay implementation.
6. Probability algorithms.
7. Automated test results.
8. Existing regression results.
9. Browser QA results.
10. Performance findings.
11. Known limitations.
12. Local launch instructions.
13. Recommended V4.1 refinements.

If feasible, package the finished repository into a source ZIP excluding dependencies, caches, and build outputs.

Do not deploy.

## EXECUTION INSTRUCTION

Begin implementing PokerLab V4 immediately.

Perform only the repository inspection necessary for safe integration.

Do not create a separate discovery phase.

Do not require confirmation between ordinary implementation stages.

Prioritize correctness, reuse, compatibility, and coherent user experience.

**Deliver a complete PokerLab V4 with Living NPCs, Cinematic Hand Replay, and Probability Lab.**