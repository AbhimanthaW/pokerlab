# V4 replay architecture

## Authority and records

The rules engine remains the sole authority. Its only replay change is optional `HandRecord.replay` metadata created during settlement: `{version:1, sessionId, participants:[id,name,personality], humanCards}`. The human has already seen these cards. Other private hands, burns, remaining deck and random seeds are never added. Existing `actions`, board, tabled `revealed` hands, refunds, awards and stacks supply the rest. Records remain bounded to 100 hands under the existing schema-2 Play save.

No migration of the active game is necessary. Old records without metadata use original public actions and tabled cards; earlier human cards are unavailable. Their original personality details are unavailable, so neutral presentation defaults are used and the replay is labeled limited. Corrupt/unsupported optional metadata is ignored through runtime validation and a field allowlist; valid V2 state is retained. Newly finished old active hands receive V4 metadata automatically.

## Timeline and absolute projection

`domain/replay/timeline.ts` accepts a completed `HandRecord`, never a live controller. It reuses the existing ordered `PublicAction` objects for action events. Derived presentation-only markers cover hand start/positions, blinds, deal, flop/turn/river, showdown, recorded refunds, individual pot awards and final stacks. There is no parallel action validator, deck or winner calculation. Existing sequence order, rather than invented wall-clock timing, determines playback order.

`replaySnapshot(record,index)` derives an independent scene projection from initial stacks and events through that position. Direct and reverse seeks do not need previous animations. Contributions debit stacks and add to the pot; recorded refunds and awards credit stacks. Every projection checks nonnegative stacks/pot and conservation; the final projection also checks final stacks against history. Earlier-street contributions move to the central representative stack. Each award's description explains pot eligibility and the recorded winners. Human cards appear at deal only when metadata is available; opponent cards appear only at the showdown marker if in `revealed`. Board cards appear at their reveal marker. Folded unrevealed opponents stay concealed throughout.

The compact timeline is a read-only presentation schema referencing existing history; it is reconstructed in memory, not persisted as duplicated game snapshots. Timeline descriptions cannot expose later cards/results before their event. Only a filtered `SceneSnapshot` reaches Three.js. Saved unknown metadata fields are not spread into scene props.

## Controller and 3D reuse

`features/replay/useReplay.ts` owns cursor, playing state, speed and event timestamps. One cancellable timeout advances at a nominal 1.1 seconds/event divided by 0.5×/1×/2× speed. These are presentation durations, not measured original action times. Changing speed does not restart the current visual event. Seeking/restart pause playback; scrubbing and reduced motion converge directly to the chosen snapshot. Page inactivity cancels the pending timeout. Exiting/unmounting clears it.

`ReplayViewer` reuses the same lazy `PokerScene` room/table/characters/cards/chips. Only one live or replay scene is mounted. Sequential playback supplies presentation effects for deal, board, action, showdown and recorded awards; arbitrary seeking does not replay skipped events. No replay effect becomes a game command. Renderer initialization/context failure falls back to readable 2D replay details and retains the timeline.

ImmersivePlay's existing `usePlay` controller is paused whenever replay is open, cancelling pending NPC work. Live action controls are not present in replay. Exiting restores the exact existing session; old live visual effects are suppressed for that restored revision. A refresh exits replay and restores the live save without replay autoplay. Returning to Learn follows the existing navigation path. The 2D live table's completed-hand data remains usable; cinematic replay entry is available from the immersive history overlay even when the live renderer uses its 2D fallback.

## Validation

Tests cover event ordering, every-snapshot conservation, side pots/refunds, direct/reverse seeking, folded-card privacy, delayed showdown, malformed metadata, legacy records, old schema-2 restore, field allowlists, controller timing/speed/cleanup, active-session immutability, NPC pause/resume and safe refresh. The additional 600-hand seeded suite reconstructs all 12,914 replay positions across varied opponent counts. Browser rendering/visual acceptance remains pending; see V4-QA-REPORT.md.
