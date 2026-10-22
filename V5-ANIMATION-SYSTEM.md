# V5 animation system

The domain directory is byte-identical to V4. No animation selects cards, changes money/chips, advances a street, issues NPC decisions or waits before validating actions. All coordination consumes the existing public `SceneSnapshot` and stable `VisualEvent` identities.

## Shared coordinator

`night-room/choreography.ts` derives at most 48 dealer cues from at most 64 recent public events. It reuses event timestamps and coalesces simultaneous pot gestures. Cues have identity, start, duration and state. A reverse indexed lookup selects the current cue; interrupted/expired cues converge to idle without engine callbacks. Public BOARD events now carry old/new board counts so a forced runout burns/reveals only missing streets, rather than replaying an existing flop. The scene consumes the matched presentation snapshot/event batch, avoiding the previous one-render timing gap between new cards and their deal event.

First-person states: IDLE, CHECK_CARDS, CHECK, CALL, BET, RAISE, FOLD, ALL_IN, SHOWDOWN and HAND_COMPLETE. Only human actions or publicly resolved hand events trigger these gestures. Other players' bets never drive human hands. The original human controls remain authoritative.

Dealer states: IDLE, PREPARING_DECK, SHUFFLING, DEALING_PRIVATE, BURNING_CARD, DEALING_FLOP, DEALING_TURN, DEALING_RIVER, COLLECTING_CARDS, SHOWDOWN_PRESENTATION, AWARDING_POT and SESSION_COMPLETE. The existing dealer model now uses procedural two-segment arms and the shared hand mesh. Its seat moves modestly toward the rail to put its hands near the existing deck. It retains the original face/clothes/character style. Cosmetic shuffle packets never read or alter the logical deck. Anonymous burn cards have a card-back texture only; the renderer never receives real burn identities.

## Hands and card travel

`handGeometry.ts` builds one original 816-vertex / 272-triangle merged mesh: beveled polygon palm/wrist, four jointed-looking fingers and an integrated thumb. It uses no spheres/cylinder hands, finger physics, skeletal dependency or external asset. A provider shares/disposes the geometry across the player/dealer. Player hands add sleeves/cuffs and neutral skin/sleeve palettes; mirrored wrists rest beside the human cards with forearms extending toward the seat. First-person visibility is optional.

Private-card presentation follows clockwise order after the button, two rounds, skipping undealt seats. Cards fly from the existing deck location with per-card timestamps; flop/turn/river use the same schedule as dealer burn/release gestures. Face orientation and placement retain separate owners, so immutable action snapshots do not re-flip cards. Face textures stay stable across back-design changes; a single shared back texture serves concealed/reverse faces. Card inspection interpolates placement and tilt, showing only the user's existing cards. The I shortcut or compact footer control toggles a 3.5-second inspection; Escape cancels it. Input fields and modified shortcuts are excluded.

Human interaction has priority. If the human becomes actor while private cards are waiting for a cosmetic deal, those cards converge immediately to a readable face-up location. No animation can delay a legal decision. On actual fold/settlement, card/chip/hand gestures follow public events. Cards collect after the recorded pot presentation; the accessible Table details/history retains the recorded board, and the human can still inspect their own non-folded hand. Resetting/returning from replay establishes a silent visual baseline.

## NPC presentation and camera

V4 personalities/policy/memory remain. V5 adds public-actor/dealer/winner gaze, bounded pupil offsets, phase-varied blinking, restrained public-win expressions and milestone dialogue variation/rotating public speakers. Faces never use unseen strength or future outcomes. Gestures are smoothed; minor actions do not produce a whole-table celebration.

Standard keeps the approved seated rig and small event emphasis. Cinematic increases that bounded emphasis. Instant disables nonessential motion. Cinematic offsets return to the base rig, remain small (at most about 3.5% zoom), and are suppressed at human turns. Reset cancels current-revision emphasis and returns to the default look. Existing orbit bounds, aspect-ratio framing and graphics settings remain. Reduced motion uses direct stable poses, no camera emphasis and no moving rain. The original camera-emphasis setting can still disable automatic framing.

## Audio, replay and lifecycle

`SoundCue` uses stable public event IDs and the same dealer/card timestamps. The existing AudioManager now owns scheduled cues, a bounded seen-ID set and at most 16 active effect voices. Pause, mute, scope changes and disposal cancel pending work; inactive events do not replay when audio is unlocked later. Source/filter/panner/gain cleanup is explicit. Room ambience replaces the old source once, retaining music and independent saved volume values. Stereo panning follows public seat position; unsupported StereoPanner falls back to ordinary output. Character acknowledgements have a separate saved level and are synthetic non-speech sounds.

Replay still uses the same scene and no live dispatcher. It supplies public board ranges and action amounts. Presentation delays scale with playback speed; deal/award events receive enough nominal timeline time for their choreography. Pausing/seeking cancels replay sound, and live effects remain silent on return. Refresh never replays a past deal; the public snapshot is a baseline with no queued events.

One R3F frame loop remains. Per-frame changes use refs/Three transforms, no React state, new geometry or new materials. Only the rainy window uses a small instanced environmental animation. Hidden/paused rendering stops; reduced motion uses demand rendering. Browser visual timing, collision review and sustained resource measurements remain pending; tests and source inspection do not substitute for these checks.
