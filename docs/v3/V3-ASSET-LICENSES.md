# V3 asset inventory and licenses

All visual/audio assets newly authored for this project are original procedural works. No supplied screenshot, game model, commercial soundtrack, external texture or proprietary design asset is redistributed. Original generated asset definitions and the instrumental recording are offered under CC0-1.0; third-party software retains its own licenses. This declaration does not apply to user reference images or to the whole application source.

| Filename / generator | Purpose | Origin | License / attribution | Bundled |
| --- | --- | --- | --- | --- |
| scene/PokerRoom.tsx | Room, table, lamps, artwork, plants and architectural geometry | Original procedural geometry | CC0-1.0 original asset definitions; no attribution required | Yes, source |
| scene/NPCCharacter3D.tsx | Five character appearances, clothing, seated anatomy, dealer | Original procedural geometry | CC0-1.0 original asset definitions; no attribution required | Yes, source |
| scene/Card3D.tsx and scene/cardTexture.ts | Card faces, backs and thin card geometry | Original canvas/mesh generation | CC0-1.0 original artwork; no attribution required | Yes, source; generated locally |
| scene/ChipStack3D.tsx | Fictional chip tokens | Original procedural geometry | CC0-1.0 original asset definitions; no attribution required | Yes, source |
| public/audio/midnight-study.wav | 146-second background instrumental | Original deterministic composition/synthesis | CC0-1.0; no samples, no attribution required | Yes, local WAV |
| scripts/compose_lounge.py | Reproducible instrumental generator | Original authored score/generator | Original project source; generated recording CC0-1.0 | Yes |
| audio/AudioManager.ts | Effects and quiet ambience | Original Web Audio synthesis | CC0-1.0 original sound definitions; no attribution required | Yes, source |

Paths beginning scene/ or audio/ are relative to src/features/immersive-play/. Generic system fonts are used but no font binary is bundled.

Software: Three.js 0.186.1, React Three Fiber 9.8.2 and Drei 10.7.9 use MIT licenses; retain their package license notices when distributing built software. React and lucide retain their existing licenses. Dependencies are installed locally through the lockfile. No runtime CDN or remote asset service is required.

CC0 reference: https://creativecommons.org/publicdomain/zero/1.0/ . The local audio license notice is in public/audio/LICENSE.txt.
