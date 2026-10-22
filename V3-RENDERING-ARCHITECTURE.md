# V3 rendering architecture

## Integration boundary

The complete domain directory is byte-identical to the audited V2 baseline. ImmersivePlay owns one usePlay controller; ControlledPlay renders its retained 2D UI using that same instance. The legacy default Play wrapper still owns its own controller when used independently by V2 tests. The only controller extension is a presentation pause input that cancels pending NPC timers. It does not change poker rules.

projectScene builds a purpose-specific public snapshot using getPlayView. The scene receives visible cards or null backs, public positions/stacks/actions, actor, pot and awards. It receives no deck, burns, concealed cards, decision policy or command dispatcher. Human controls call the existing validated action API. Animations cannot call domain transitions.

## Scene hierarchy and coordinates

PokerScene lazily mounts Canvas; SceneRoot composes PokerRoom, TableContents, CameraDirector and RendererLifecycle. TableContents includes PokerTable3D, NPCCharacter3D, Card3D, ChipStack3D and temporary AwardFlight objects. HTML seat labels are projected with Drei Html; essential controls stay outside the canvas.

Right-handed coordinates: +Y is up, +Z points toward the human, X runs across the table, felt is near Y=0, floor Y=-1.35. Table radii are 3.65 by 2.3 world units. Human anchor is [0,0,2.9]. seatAnchor maps engine seat indices to distinct clockwise anchors while leaving a visual gap for the non-playing dealer. Card/contribution positions derive from these anchors; participant count determines occupied seats. Dealer and blind labels derive solely from engine positions.

The portrait table group compresses X to fit; an accessible street-grouped community strip and private-hand/stack dock supplement the 3D faces. Portrait framing also applies to tall tablet aspect ratios. This framing requires visual acceptance on the target devices.

## Camera

CAMERA_RIG centralizes seated perspective presets. Desktop height/distance/FOV: 1.6/4.85/53; portrait: 2/6.7/59. Drag/touch modifies bounded look, wheel changes bounded distance, menu buttons provide keyboard alternatives. Limits: yaw +/-0.2, pitch +/-0.12, zoom 0.9–1.12. No free movement, orbit controls or pointer lock. Optional restrained actor/showdown emphasis is disabled with reduced motion. Exact framing and comfort remain visually unverified.

## Presentation lifecycle

usePresentation initializes an already-restored snapshot as a silent baseline. Subsequent revisions generate DEAL/ACTION/BOARD/SHOWDOWN/AWARD/COMPLETE events with session/revision IDs. Duplicate and stale revisions are ignored. New hands cancel old events. Queues retain at most 64 recent events. Restoration does not replay historic awards or sounds. The scene always targets the latest authoritative snapshot; no animation acknowledgement gates poker transitions.

Cards use stable serialized face identities, cache textures across immutable snapshots, and separate placement/fixed orientation/reveal groups. Cards interpolate from the deck only on a new deal, flip only legitimately newly revealed faces, and move face-down to the muck when folded. Representative committed stacks move from a seat; central stacks exclude current-street commitments to avoid counting the same pot visually twice. Awards travel from center to winner anchors. Numerical totals are exact; mesh counts are bounded representations, not the accounting system.

Character gestures cover idle, thinking, acting, folding, checking, calling, raising, all-in, showdown, hand complete and elimination. Head/body/hands use controlled per-seat phases and static reduced-motion poses. These are procedural gestures, not skeletal motion capture.

## Lifecycle and failure handling

Canvas fallback children are inert HTML: their mounting is not a WebGL capability signal. SceneBoundary catches initialization/render errors; renderer lifecycle listens for context loss. Both select the retained 2D interface without replacing the controller. Manual display changes and retries likewise preserve session identity/revision. Learn navigation unmounts scene and audio; V2 save restores the same active hand on return. GPU resources are managed by R3F disposal, with explicit CanvasTexture cleanup and event-listener removal.

Canvas is lazy-loaded. Quality presets bound DPR to 1/1.4/1.8; low disables shadows. Auto is a conservative viewport/CPU-core heuristic, not measured adaptive FPS control. Only one light casts shadows; no physics, postprocessing, remote environments or runtime asset fetches are used. Chips use instanced meshes capped at 28 tokens per stack. Normal animation uses a continuous loop while active; reduced motion uses demand; hidden/paused scenes use never. Real memory/FPS profiling is pending.

## Audio

One AudioManager belongs to the shell. No AudioContext or media element is created before explicit enable. One local looping music element handles the original WAV; Web Audio produces effects/quiet ambient noise. Master/music/effects/ambient gains and mute are separate from game data. Hiding the page or pausing suspends audio. Cleanup pauses and unloads media, stops/disconnects ambient nodes, closes the context, and prevents pending enable promises from resurrecting audio after unmount.
