# V5 art direction

The original low-poly Night Room, green felt, dark wood, warm lamps, seated perspective and muted gold interface remain the foundation. There is one room geometry with cosmetic palettes, not three separate environments. No photorealistic assets, bloom/postprocessing suite, free roaming or other casino games are introduced.

| Preset | Treatment |
| --- | --- |
| The Night Room | Original dark navy/amber room; green felt and walnut by default |
| Golden Hour Lounge | Warm brighter fill, honey key light, warmer walls, softer shadow radius and olive felt suggestion |
| Rainy Midnight | Cool background/walls/fill, warm interior lights, navy felt suggestion and a framed background rain window |

Felt options: green, olive, wine, navy. Finishes: walnut, ebony, oak, affecting the wood and padded rail. Card backs: original crosshatch/spade, open lattice/diamond, burgundy/star. Chip palettes: classic, ivory and slate; denominations/totals remain numerical and unchanged. Faces retain the existing readable cream/red/black or optional four-color suit system. First-person sleeves: teal, charcoal, cream; neutral hand materials: warm, light, deep. All choices are free/local, without unlocks or gameplay differences.

The player hands have a unified palm/wrist and integrated thumb, separate finger silhouettes, sleeve/cuff overlap and restrained gestures. One shared original mesh is reused for dealer hands. The existing dealer's face, attire and body are retained; its articulated arms reach around the deck rather than trying to span the whole table. Dealer release/burn/award gestures coordinate with cards/chips. Cosmetic shuffle packets are anonymous. NPC gaze/blinking/public-result expressions remain subtle and personality-dependent.

Rain stays inside a small framed background element, behind the dealer and gameplay. Low uses eight static streaks; Medium/Auto-medium uses 24 moving streaks; High uses 48. There are no full-screen particles, extra shadow-casting lights, or large animated HUD panels. Gameplay remains usable with hands/motion/dialogue/audio disabled.

Pause → Cardroom customization supports live preview, Apply, Cancel and Restore defaults. Preview pauses the game and renders cosmetic changes on demand behind the existing modal. The usual compact action bar and on-demand table details remain. Card inspection uses a compact footer icon and keyboard shortcut, not an extra permanent card overlay.

A software projection of the actual hand geometry was generated and inspected via `scripts/render-hand-study.mjs`. That inspection found an initially disconnected thumb segment and led to the integrated thumb mesh. The final silhouette is recognizable as a five-finger hand. This is asset-only verification: actual WebGL room composition, furniture/hand clipping, mobile readability, timing and lighting still need browser visual review. No in-scene visual acceptance or FPS target is claimed.
