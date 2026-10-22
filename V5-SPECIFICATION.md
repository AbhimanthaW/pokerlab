# PROJECT POKERLAB
## V5: THE NIGHT ROOM EXPANSION
### Complete Implementation Specification

---

# YOUR ROLE

Act as a Principal Software Engineer, Senior Three.js / React Three Fiber Engineer, Technical 3D Artist, Character Animation Engineer, Game Experience Designer, Audio Engineer, React/TypeScript Specialist, Performance Engineer, Accessibility Engineer, and independent technical reviewer.

Your task is to extend the EXISTING PokerLab V4 application into **PokerLab V5: The Night Room Expansion**.

V5 is focused on substantially improving the immersion, animation, interactivity, atmosphere, and customization of the existing 3D poker room.

**This is a complete implementation task, not a prototype, architecture study, or visual mockup.**

You are authorized to inspect and modify the repository, develop original 3D geometry and animations, add justified dependencies, create or integrate appropriately licensed audiovisual assets, execute tests, and perform available browser-based quality assurance.

Do not deploy, provision infrastructure, create external accounts, or integrate paid services.

Do not stop for a separate discovery phase. Inspect the relevant modules as part of implementation and proceed.

---

# 1. EXISTING APPLICATION

PokerLab has already undergone four major development versions and one polish release.

## V1: Education

- Texas Hold'em hand evaluation.
- Three training modes.
- Hand-ranking reference.
- Educational feedback.
- Saved progress.

## V2: Complete Game Simulation

- Full Texas Hold'em gameplay.
- One human and autonomous NPCs.
- Randomized dealing.
- Fictional chip stacks.
- Legal action validation.
- Blinds, raising, folding, and all-ins.
- Side pots.
- Last-player-standing sessions.
- Hand history.
- Local session persistence.

## V3: Immersive 3D

- A low-poly poker room.
- Stylized NPC characters.
- Physical 3D cards and fictional chips.
- First-person seated camera.
- Ambient lighting.
- Animation and audio.
- Immersive Play interface.
- Quality presets.

## V3.1: Polish

- Compact contextual action controls.
- Improved seated-camera composition.
- Improved NPC visibility.
- Reduced HUD clutter.
- Accessible table details.
- Responsive refinements.

## V4: The Living Table

- Personality-specific NPC animation and facial cues.
- Bounded public-session memory.
- Optional contextual dialogue.
- Read-only cinematic hand replay.
- Exact probability calculations.
- Worker-based probability simulation.
- Probability Lab.

The V4 QA report recorded 227 passing tests, successful TypeScript/lint/build checks, and seeded game stress coverage.

These are historical results. Independently establish the current repository baseline before changing code.

The latest V4 report also notes that automated browser acceptance was blocked by Chrome exiting before page creation.

Do not mistake this for an application test failure or claim that browser acceptance has already passed.

The existing visual direction is approved.

**V5 must extend this application, not rebuild it.**

---

# 2. V5 PRODUCT OBJECTIVE

V5 should make the player feel physically present at a stylized virtual card table.

The experience should become:

- More tactile.
- More expressive.
- More cinematic.
- More atmospheric.
- More customizable.
- More responsive to game events.

The user should see their virtual hands, watch the dealer physically perform dealing gestures, observe NPCs reacting naturally, and experience subtle environmental motion and sound.

The artistic direction remains:

- Stylized low-poly 3D.
- Slightly retro game aesthetics.
- Warm atmospheric lighting.
- Green felt.
- Dark wood.
- Expressive but simplified characters.
- Restrained gold UI accents.
- A moody late-night lounge atmosphere.

Do not make the application photorealistic.

Do not introduce free-roaming exploration.

Do not introduce other casino games.

The product remains an offline, fictional-chip-only educational card-game simulation, without real currency, purchases, redeemable rewards, deposits, withdrawals, or external gambling services.

---

# 3. REQUIRED V5 PILLARS

Implement all six:

1. First-Person Player Hands.
2. Advanced Dealer Animation.
3. Enhanced NPC Interactions and Expressions.
4. Room and Table Customization.
5. Cinematic Camera and Presentation.
6. Environmental Atmosphere and Audio.

All six must integrate into the existing scene and event architecture.

Do not introduce parallel game-state authorities.

---

# 4. FIRST-PERSON PLAYER HANDS

## Objective

Make the first-person seated viewpoint feel physically grounded.

Currently, the camera represents the player's position, but there is little or no visible representation of the player's own body.

Introduce stylized low-poly hands and forearms visible near the bottom of the scene.

## 4.1 Geometry

Create recognizable, well-proportioned low-poly player hands.

Requirements:

- Two hands.
- Forearms where appropriate.
- Coherent wrist and finger geometry.
- Original stylized materials.
- Natural resting positions.
- Clothing sleeves.
- Appearance compatible with existing low-poly NPCs.

Avoid primitive cylinders with spheres attached as the final result.

The hands do not require individually simulated finger physics.

A lightweight procedural or skeletal hierarchy is preferred.

They must not appear detached or float unnaturally above the table.

## 4.2 Positioning

Hands should appear near the player's seat.

Default pose:

- Resting comfortably near the table rail.
- Positioned below the primary card-reading area.
- Not blocking community cards.
- Not covering the betting HUD.
- Not clipping through table geometry.

Use camera-relative positioning where appropriate, but preserve believable world-space interactions with the table.

Support different aspect ratios and camera presets.

## 4.3 Player animation states

Implement:

IDLE
CHECK_CARDS
CHECK
CALL
BET
RAISE
FOLD
ALL_IN
SHOWDOWN
HAND_COMPLETE

Suggested behaviors:

**Idle:** Small natural movements and slight wrist adjustments.

**Check cards:** One hand gently lifts or adjusts the private cards, allowing a brief inspection.

**Check:** A restrained table-tap gesture.

**Call/Bet/Raise:** A hand moves toward the virtual chip area.

**Fold:** A hand pushes the private cards away.

**All-in:** A more pronounced forward movement.

**Showdown:** A card-reveal gesture.

These are presentation animations only.

They must reflect actual authoritative game events.

Do not allow animations to change chip accounting, card ownership, or legal-action processing.

## 4.4 Interactive card inspection

Add a simple optional card-inspection interaction.

Possible controls:

- A keyboard shortcut.
- A small accessible on-screen button.
- A touch control on mobile.

The inspection temporarily brings the player's own cards into a more readable view.

It must not reveal opponent cards.

If the existing camera already provides adequate visibility, the interaction should enhance inspection rather than duplicate the entire card UI.

## 4.5 Customization

Allow a small set of cosmetic player appearances:

- Several sleeve colors/styles.
- A few neutral stylized hand material presets.
- Optional hand visibility toggle.

Do not associate appearance options with gameplay advantages.

Persist choices locally.

## 4.6 Accessibility

First-person hands must be optional.

Reduced-motion mode should eliminate unnecessary hand animations.

Never make an essential game action depend on accurately clicking a 3D hand.

All existing accessible HTML game controls remain authoritative.

---

# 5. ADVANCED DEALER SYSTEM

## Objective

Transform the dealer from a mostly decorative figure into an animated part of the table.

The dealer should visibly perform the actions associated with a hand.

## 5.1 Preserve the existing model

Reuse and refine the existing stylized dealer.

Do not replace the dealer with an unrelated model.

Enhance its arm, hand, head, and upper-body animation where necessary.

## 5.2 Dealer animation states

Implement:

IDLE
PREPARING_DECK
SHUFFLING
DEALING_PRIVATE
BURNING_CARD
DEALING_FLOP
DEALING_TURN
DEALING_RIVER
COLLECTING_CARDS
SHOWDOWN_PRESENTATION
AWARDING_POT
SESSION_COMPLETE

Keep transitions smooth and interruptible.

## 5.3 Physical dealing

The dealer should animate a gesture toward the deck and table when cards are distributed.

Cards should travel from a coherent dealing location to valid destinations.

Required:

- Correct private-card distribution presentation.
- Flop presentation.
- Turn presentation.
- River presentation.
- Visual burning of cards where appropriate.
- Clearing cards after a completed hand.

The authoritative game engine determines actual card identities, order, and hidden information.

The dealer animation must NEVER select or shuffle the actual logical deck.

The visible shuffle is cosmetic.

## 5.4 Card and hand synchronization

Coordinate the dealer's hand gesture with the corresponding card movement.

Avoid:

- Dealer reaching after the card has already arrived.
- Multiple identical gestures firing simultaneously.
- Hands clipping through the table.
- Cards appearing from unrelated positions.
- Duplicate dealing during session restoration.

Use the existing presentation event system where possible.

## 5.5 Pot presentation

At the end of a hand, the dealer should visually acknowledge the outcome.

Possible actions:

- Gesture toward the central pot.
- Indicate the winning player.
- Move hands toward the table.
- Return to a neutral seated or standing pose.

Do not let the dealer determine pot winners.

The engine remains authoritative.

---

# 6. ENHANCED NPC INTERACTIONS

## Objective

Improve the existing V4 Living NPC system without rewriting its decision policy.

V4 already introduced personality-specific gestures, facial cues, public-session memory, and optional dialogue.

V5 should make those features feel more cohesive and physically convincing.

## 6.1 Better idle behavior

Improve idle animation variety.

Examples:

- Looking around the table.
- Small head rotations.
- Subtle shoulder adjustments.
- Changing resting-hand positions.
- Looking toward the dealer.
- Returning to a neutral posture.

Not every character should move at the same moment.

Use bounded, controlled randomness.

Avoid repetitive synchronized animation loops.

## 6.2 Eye and head direction

Implement lightweight gaze behavior.

NPCs may look toward:

- The dealer during a deal.
- The current acting player.
- Community cards.
- Their own card area.
- The winner after a completed hand.

Gaze behavior must depend only on publicly appropriate events.

Avoid over-rotating heads or producing unnatural snapping.

## 6.3 Facial expressions

Extend existing low-poly facial cues.

Support:

- Neutral.
- Focused.
- Mild amusement.
- Surprise.
- Disappointment.
- Relaxed.
- Celebratory, but restrained.

Use lightweight procedural transforms or a small number of expression variants.

Do not add a heavyweight facial-animation system unless necessary.

IMPORTANT: Cosmetic expressions must not act as reliable tells for hidden private cards or unrevealed outcomes.

Do not animate a character differently solely because its unseen hand is strong or weak.

Use personality, public actions, and publicly determined outcomes.

## 6.4 Character-specific gestures

Use the existing personality profiles.

Cautious characters should feel reserved.

Aggressive characters may gesture more assertively.

Casual characters may appear more relaxed.

Analytical characters may move deliberately.

These are presentation tendencies.

Do not turn them into rigid or repetitive stereotypes.

## 6.5 Contextual character interactions

Add occasional public-event-based interactions:

- Looking toward another NPC taking an action.
- Responding to a completed hand.
- Acknowledging the dealer.
- Reacting to a session elimination.
- A small gesture after a notable public event.

Keep interactions subtle.

Prevent the entire table from reacting simultaneously to minor events.

## 6.6 Dialogue improvements

Reuse V4's existing text dialogue system.

Improve:

- Context sensitivity.
- Variety.
- Timing.
- Visual presentation.
- Personality consistency.
- Repetition avoidance.

Dialogue should remain brief and optional.

Include a preference to disable it.

Do not use external LLMs.

Do not make dialogue reveal hidden cards or private state.

Do not introduce an expensive voice-generation pipeline.

If simple vocal acknowledgements are supported, use original or appropriately licensed sounds.

Subtitles must remain available.

---

# 7. ROOM AND TABLE CUSTOMIZATION

## Objective

Allow users to personalize the appearance of the existing cardroom.

All customization is cosmetic, free, and locally available.

Do not introduce purchases, unlock systems, currencies, or progression-based rewards.

## 7.1 Environment presets

Implement at least three distinct visual presets.

### A. The Night Room

The existing default.

- Warm amber lighting.
- Dark interior.
- Green felt.
- Rich wooden furniture.
- Original atmosphere.

### B. Golden Hour Lounge

- Warmer, brighter illumination.
- Softer shadows.
- A welcoming late-afternoon atmosphere.
- The same fundamental room geometry.

### C. Rainy Midnight

- Cooler environmental light.
- Subtle rain visible through an appropriate background element.
- Warm interior lights contrasting with cooler exterior colors.
- Gentle atmospheric ambience.

These are variants of ONE existing room.

Do not build three completely separate environments.

## 7.2 Table customization

Support:

- Multiple felt colors.
- Selected rail/material finishes.
- A few card-back designs.
- Several fictional-chip visual styles.

Use coherent palettes.

Keep playing-card faces readable and suit colors recognizable.

Customization must not interfere with recognizing game state.

## 7.3 Player customization

Provide a few cosmetic first-person sleeve/hand presets.

Do not build a full character creator.

## 7.4 Customization interface

Add a compact Cardroom Customization panel accessible from the existing settings/pause interface.

The user should be able to:

- Preview a preset.
- Apply the preset.
- Restore defaults.
- Switch between available cosmetic options.

Changes should update the existing 3D scene without restarting the poker session.

Persist settings through the existing preferences system or a compatible versioned extension.

Do not alter game state or dealing randomness.

## 7.5 Lighting quality

Presets must remain functional at Low, Medium, High, and Auto graphics quality.

Use simplified effects at lower presets.

Do not depend on expensive dynamic lighting for basic appearance.

---

# 8. CINEMATIC CAMERA SYSTEM

## Objective

Enhance the current seated first-person camera with optional cinematic event presentation.

The game must remain comfortable and easy to follow.

## 8.1 Preserve default camera

The existing V3.1 camera framing is approved.

Do not replace it with a permanently moving camera.

The default scene should still show:

- Human private cards.
- Community cards.
- Dealer.
- Active NPCs.
- Pot.
- Essential game information.

## 8.2 Cinematic events

Add restrained camera movement for:

- Beginning a new hand.
- Dealer shuffling.
- Community-card reveals.
- Significant public player actions.
- Showdown.
- Pot award.
- Session completion.

Use smooth, bounded camera transitions.

Avoid extreme angles and aggressive motion.

## 8.3 Camera modes

Implement at least:

**Standard:** Seated camera with limited occasional focus changes.

**Cinematic:** More pronounced but still restrained event framing.

**Instant:** Minimal camera movement and fast visual transitions.

Make camera mode independent of the actual game engine.

An instant or skipped animation must never change the game result.

## 8.4 Camera priority

Human interaction always takes priority over optional cinematics.

If the player needs to act, ensure that controls and relevant cards remain visible.

Do not hide essential game information behind a cinematic transition.

The user should always be able to reset the camera.

## 8.5 Camera restoration

Correctly handle:

- Refresh during a hand.
- Returning from replay.
- Exiting fullscreen.
- Resizing the browser.
- Entering/exiting settings.
- Renderer fallback.
- Animation interruption.

The camera should converge to a valid seated position.

## 8.6 Reduced motion

When reduced motion is active:

- Disable cinematic camera movements.
- Minimize procedural character gestures.
- Shorten or remove nonessential transitions.
- Preserve a stable, readable table view.

---

# 9. ENVIRONMENTAL ATMOSPHERE

## Objective

Make the room feel subtly alive without building a walking simulator.

## 9.1 Ambient visual elements

Introduce appropriately optimized environmental motion.

Possible effects:

- Gentle lighting variation.
- Rain effects in Rainy Midnight.
- Small background material animations.
- Subtle environmental details.
- Limited decorative movement.

Prioritize visual coherence.

Do not create distracting particle storms.

## 9.2 Lighting

Improve the perceived quality of the room through:

- Warm key lighting.
- Subtle ambient fill.
- Readable character faces.
- Adequate illumination of cards.
- Soft table shadows.
- Coherent contrast between room presets.

Preserve the current low-poly aesthetic.

Avoid heavy bloom, extreme film grain, and excessive postprocessing.

## 9.3 Atmosphere and performance

Environmental animation should scale with quality settings.

Low quality must disable or simplify expensive effects.

Do not reduce card readability or interaction responsiveness.

---

# 10. AUDIO EXPANSION

## Objective

Improve the existing V3/V4 audio system rather than replacing it.

## 10.1 Existing audio

Preserve:

- Background music.
- Mute/unmute.
- Sound effects.
- Ambient audio.
- User volume preferences.
- Browser audio-unlock handling.

## 10.2 Enhanced sound effects

Add or improve sounds for:

- Shuffling.
- Card dealing.
- Card sliding.
- Card reveal.
- Table-tap gestures.
- Fictional-chip movement.
- Pot awards.
- Subtle character reactions.

Avoid overly repetitive effects.

Use restrained mixing levels.

## 10.3 Environment-specific ambience

Support different ambient character for room presets.

Examples:

- Quiet lounge ambience.
- Gentle rainy-night ambience.
- Soft daytime interior atmosphere.

Avoid loud or distracting environmental loops.

## 10.4 Spatial audio

Introduce simple spatial positioning where justified.

Examples:

- Dealer sounds originate near the dealer.
- Card sounds originate near the table.
- NPC ambient cues originate near the corresponding character.

Do not overengineer the audio pipeline.

Stereo positioning or simple panning is acceptable.

## 10.5 Music

Retain existing suitable music.

Optionally add a small selection of original or properly licensed instrumental pieces where assets are available.

Do not fabricate licensed assets or extract soundtracks from commercial games.

All required audio must be bundled locally.

Review the size of existing audio assets and use reasonable web-compatible compression when appropriate.

Do not sacrifice audio compatibility for a marginal size reduction.

## 10.6 Settings

Provide independent controls for:

- Master volume.
- Music.
- Effects.
- Ambience.
- Character audio where applicable.

Preserve existing values during migration.

No duplicate playback after remounts.

No sound should continue after disposal unless deliberately managed by a persistent shared audio controller.

---

# 11. ANIMATION ARCHITECTURE

The existing presentation/event architecture must remain authoritative for visual scheduling.

Game logic and animation must remain separate.

Use a coherent animation coordinator supporting:

- Player hand states.
- Dealer states.
- NPC states.
- Card movement.
- Chip movement.
- Camera changes.
- Associated sound effects.

Each visual event should have:

- A stable event identity where appropriate.
- A defined animation state.
- A cancellation or convergence behavior.
- Reduced-motion handling.
- Cleanup behavior.

Avoid chaining game-engine transitions directly to animation completion.

Avoid duplicate effects when replaying, restoring, or remounting a scene.

Replay mode should reuse existing presentation components where possible, without dispatching live actions.

Ensure animations work in:

- Live Play.
- Hand Replay.
- Session restoration.
- Fast/Instant mode.

A replayed gesture must not issue a new game command.

---

# 12. UI/UX INTEGRATION

Preserve V3.1's minimal immersive Play HUD.

Do not restore:

- The old oversized action panel.
- Permanent card placeholders.
- Unnecessary tutorial text.
- Large dashboard-style overlays.

Required interface additions:

- Cardroom Customization.
- Camera Mode.
- Player Hands On/Off.
- Character Dialogue On/Off.
- Appropriate audio controls.

These should primarily live in the existing settings interface.

The 3D scene remains the dominant visual element.

All essential actions remain keyboard accessible through HTML controls.

Do not force players to interact exclusively with small 3D objects.

Support desktop, tablet, and mobile layouts.

---

# 13. PERFORMANCE REQUIREMENTS

V5 introduces more animations and environmental detail, so performance must be treated seriously.

## Targets

Aim for:

- 60 FPS on capable desktops.
- Approximately 45–60 FPS on mid-range laptops.
- At least 30 FPS on supported mobile devices.

These are targets, not claims to report without measurement.

## Requirements

Use:

- Shared geometry.
- Reusable materials.
- Lightweight character animation.
- Bounded animation event queues.
- Efficient frame updates.
- Limited shadow-casting lights.
- Appropriate device-pixel-ratio limits.
- Lazy loading where useful.
- Proper texture and geometry disposal.
- Existing graphics quality settings.

Avoid:

- Creating meshes every frame.
- Triggering React state updates every animation frame.
- Unbounded dialogue or animation history.
- Excessive scene draw calls.
- Unnecessary physics engines.
- Full skeletal animation frameworks unless justified.
- Multiple independent render loops.

Inspect the actual V4 performance architecture.

Do not introduce a new renderer.

The game must remain playable when decorative effects are disabled.

---

# 14. PERSISTENCE AND COMPATIBILITY

Preserve:

- Existing V1 education progress.
- V2 game sessions.
- V3 graphics preferences.
- V4 replay records.
- V4 NPC public-session memory.
- V4 Probability Lab preferences.

Add versioned cosmetic settings as necessary.

Do not reset active sessions when cosmetic preferences change.

Handle missing or corrupted optional customization data gracefully.

Avoid unnecessary schema changes to the authoritative game engine.

---

# 15. TESTING

Retain all existing tests.

Add meaningful new automated coverage.

## Player hands

Test:

- Correct state transitions.
- Cosmetic-only behavior.
- Reduced-motion behavior.
- Hidden/visible settings.
- Cleanup.
- Interrupted gestures.
- No alteration of game state.

## Dealer

Test:

- Correct event ordering.
- No duplicated dealing effects.
- Private cards remain hidden.
- Valid recovery after refresh.
- Animation cancellation.
- Replay behavior.
- No engine mutation.

## NPCs

Test:

- Personality animation profiles.
- Public-event-based expressions.
- Gaze targets.
- Bounded variation.
- Dialogue controls.
- No hidden-information leaks.
- No changes to legal-action validation.

## Customization

Test:

- Preset selection.
- Persistence.
- Reset.
- Missing preferences.
- Invalid persisted values.
- Changes during active sessions.
- No effect on cards or game outcomes.

## Camera

Test:

- Camera modes.
- Position bounds.
- Reset.
- Reduced motion.
- Fullscreen resizing.
- Interruption.
- Return from replay.

## Audio

Test:

- Playback unlocking.
- Volume preferences.
- Mute.
- Effect triggering.
- Cleanup.
- No duplicate playback.
- Interruption.
- Room ambience switching.

## Regression

Rerun the existing tests for:

- Hand evaluation.
- Poker rules.
- Pot resolution.
- Chip conservation.
- NPC decisions.
- Session persistence.
- Replay.
- Probability Lab.
- Existing interface behavior.

Retain the existing game stress suites.

Do not weaken tests to make the new version pass.

---

# 16. BROWSER AND VISUAL QA

Perform actual browser inspection where tools permit.

Inspect:

- 1920×1080.
- 1440×900.
- 1280×800.
- 768×1024.
- 390×844.
- 320×640.

Verify:

1. Player hands look natural and do not obstruct cards.
2. Dealer animations align with card movement.
3. NPC expressions remain consistent with public events.
4. Characters do not clip through the table.
5. Camera modes work.
6. Cardroom customization updates correctly.
7. Lighting presets remain readable.
8. Audio controls work.
9. Reduced-motion mode works.
10. Live game state remains correct.
11. Replay works with new animations.
12. Settings persist after refresh.
13. Mobile controls remain accessible.
14. 2D fallback continues functioning.
15. Long sessions do not cause accumulating render or audio resources.

The previous V4 browser automation was blocked by Chrome exiting before page creation.

Make a reasonable supported attempt to verify V5 in a browser.

If the same environment restriction persists, document it and continue with other verification.

Do not spend the majority of the implementation trying repeatedly to bypass environment permissions.

Do not claim successful browser inspection without actually performing it.

---

# 17. VISUAL ACCEPTANCE GATE

The V5 implementation must look like a coherent extension of the current approved 3D room.

Reject visually unfinished results such as:

- Disconnected floating player hands.
- Unrecognizable abstract hand geometry.
- Dealer arms moving independently of card events.
- NPCs repeatedly snapping between poses.
- Aggressive or nauseating camera movements.
- Rain effects obscuring the game.
- Lighting presets making cards unreadable.
- Cosmetics breaking the existing design identity.
- Overlays covering the table.
- Character gestures visibly clipping through furniture.

If the visual standard is not met, improve the relevant implementation rather than claiming completion because a scene rendered successfully.

Prioritize quality over the quantity of animations.

---

# 18. IMPLEMENTATION SEQUENCE

Proceed directly with implementation.

## V5-01: Baseline and Shared Animation Integration

Inspect the existing repository.

Run available baseline checks.

Identify reusable character rigs, presentation events, camera utilities, and audio systems.

Make only the architectural changes necessary to support V5.

## V5-02: First-Person Hands

Build and integrate:

- Hand geometry.
- Forearms/sleeves.
- Idle pose.
- Action gestures.
- Card inspection.
- Visibility setting.
- Reduced-motion behavior.

## V5-03: Advanced Dealer

Implement:

- Dealer rig improvements.
- Shuffle/deal gestures.
- Flop/turn/river presentation.
- Card collection.
- Showdown/pot gestures.
- Synchronization and tests.

## V5-04: NPC Interaction Upgrade

Implement:

- Improved idle animation.
- Gaze behavior.
- Facial expressions.
- Contextual public-event reactions.
- Dialogue refinements.
- Personality-specific visual variation.

## V5-05: Customization

Implement:

- Three room presets.
- Felt/material options.
- Card backs.
- Fictional-chip visual styles.
- Player-hand cosmetics.
- Settings persistence.

## V5-06: Camera and Atmosphere

Implement:

- Standard/Cinematic/Instant modes.
- Camera-event integration.
- Ambient visual effects.
- Preset lighting.
- Rainy Midnight atmosphere.
- Performance scaling.

## V5-07: Audio

Integrate:

- Enhanced effects.
- Ambience variations.
- Optional spatial audio.
- User preferences.
- Safe playback lifecycle.

## V5-08: Verification and Polish

Run:

- TypeScript checks.
- Lint.
- Unit and integration tests.
- Production build.
- Game stress tests.
- Available browser QA.

Inspect visual results.

Fix observed defects.

Do not introduce unrelated features.

---

# 19. OUT OF SCOPE

Do not implement:

- Walkable environments.
- Online multiplayer.
- Additional game variants.
- Real-money systems.
- Purchasable virtual chips.
- Unlockable cosmetic economies.
- New NPC strategy engines.
- New poker solvers.
- A replacement game engine.
- Cloud infrastructure.
- Authentication.
- An external LLM dialogue system.
- A full character-creation suite.
- Entirely separate new room geometry for each theme.
- A new probability engine.

Do not rebuild the existing V4 systems unnecessarily.

The priority is immersion, not scope expansion.

---

# 20. DOCUMENTATION

Update:

README.md
ARCHITECTURE.md
STATUS.md
TESTING.md

Add:

V5-SPECIFICATION.md
V5-ANIMATION-SYSTEM.md
V5-ART-DIRECTION.md
V5-ASSET-LICENSES.md
V5-QA-REPORT.md

Documentation should explain:

- Player-hand system.
- Dealer animation architecture.
- NPC interaction improvements.
- Scene and camera event coordination.
- Customization presets.
- Audio integration.
- Compatibility.
- Performance.
- Testing.
- Known limitations.

Document all added audiovisual assets and their licenses.

Do not invent verification results.

---

# 21. DEFINITION OF DONE

PokerLab V5 is complete only when:

1. Existing V1–V4 functionality remains intact.
2. The current Texas Hold'em engine remains authoritative.
3. First-person player hands are rendered.
4. Player gestures correspond to real public actions.
5. Player hands can be disabled.
6. Dealer animations work throughout the hand lifecycle.
7. Card dealing remains logically correct.
8. NPCs exhibit richer natural behavior.
9. NPC expressions do not leak private cards.
10. Contextual interaction and dialogue work.
11. Three room presets are implemented.
12. Felt, card-back, and chip visual options work.
13. Cosmetic settings persist.
14. Cinematic camera modes work.
15. Reduced-motion behavior is respected.
16. Environmental atmosphere is functional.
17. Sound effects and ambience are integrated.
18. Audio preferences work.
19. No animation mutates actual game logic.
20. Replay remains functional.
21. Probability Lab remains functional.
22. Active session restoration remains functional.
23. Existing tests pass.
24. New tests pass.
25. Production build succeeds.
26. Available browser QA is completed and documented.
27. Visual quality meets the approved low-poly direction.
28. Documentation accurately describes the result.

No placeholder features.

No fake customization controls.

No incomplete demonstrations presented as finished systems.

---

# 22. FINAL DELIVERY

Provide:

1. Implementation summary.
2. Main architecture changes.
3. New 3D models and animation systems.
4. Dealer animation details.
5. NPC interaction improvements.
6. Customization options.
7. Camera and audio changes.
8. Test results.
9. Performance findings.
10. Browser verification status.
11. Known limitations.
12. Local launch instructions.
13. Recommended refinements for V5.1.

If feasible, package the source into a ZIP excluding node_modules, build outputs, caches, and unrelated generated files.

Do not deploy.

## FINAL EXECUTION INSTRUCTION

Begin implementation immediately.

Inspect existing source only as needed for safe integration.

Do not pause for a separate discovery report.

Implement the complete six-pillar V5 expansion.

Preserve the working poker engine, existing room, educational features, replay, probability systems, and saves.

Prioritize high-quality, coherent character animation and visual interaction over excessive decorative complexity.

**Deliver PokerLab V5 as a polished, immersive, fully playable extension of the existing 3D cardroom.**