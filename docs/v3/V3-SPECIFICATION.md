# PokerLab V3 implementation scope

V3 adds a local immersive presentation to the existing educational application and Texas Hold’em engine. The supplied screenshots informed the warm lighting, intimate table, dark room and stylized characters. Their roulette content and identifiable assets were not reproduced.

## Implemented

- Play removes global sidebar/topbar, fills the available viewport, locks outer document scrolling, and restores Learn on exit.
- A lazy Three.js / React Three Fiber / Drei scene models the room, oval felt table, rail, chairs, dealer, distinct seated NPCs, physical cards and representative instanced chip stacks.
- Perspective camera supports bounded drag/touch look, wheel zoom, keyboard-operable menu adjustments, reset and modest optional actor/showdown emphasis.
- A public projection and bounded revision-based visual event queue animate cards, contributions, awards, faces and gestures without changing game outcomes.
- Accessible HTML controls use the existing legal-action descriptor and existing action component. Compact HUD shows stacks, actor, pot/side pots and visible cards. Results, settings and history are temporary overlays.
- Pause/history/page hiding cancel NPC presentation work. One controller owns the session across 3D/2D switches. WebGL initialization/context errors retain the hand in the original 2D interface.
- Explicit Fullscreen API controls handle browser state and rejection. Viewport Play remains available independently.
- Audio starts locked/muted until enabled; a locally bundled original 146-second instrumental, procedural effects and ambience have independent persisted volume controls.
- Auto/Low/Medium/High change resolution, shadows and decorative detail. Reduced motion uses static poses and demand rendering; hidden/paused scenes stop their frame loop.
- V1 learning data and V2 full-session persistence retain their original keys and schemas. V3 preferences use a separate versioned key.

## Acceptance still open

V3 is not marked visually complete. Browser launch is denied by the execution environment before a page loads. Fresh rendered screenshots, physical camera/card readability, sound listening, FPS/GPU measurements, real fullscreen transitions, device coverage and a full UI session remain pending. Passing DOM tests with a mocked renderer does not validate WebGL appearance. See V3-QA-REPORT.md and TESTING.md.

No deployment, backend, financial service, purchasable/refillable/redeemable chips, prizes, roulette or other games were added.
