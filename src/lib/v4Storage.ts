import { validatePublicMemory, type PublicMemory } from "../domain/play/publicMemory";
export const V4_SETTINGS_KEY = "pokerlab.v4.settings", V4_MEMORY_KEY = "pokerlab.v4.public-memory";
export interface V4Settings { dialogue: boolean; replaySpeed: number }
export function loadV4Settings(storage?: Storage): V4Settings {
  try { const s = JSON.parse((storage ?? window.localStorage).getItem(V4_SETTINGS_KEY) ?? "null"); if (s?.version === 1 && typeof s.dialogue === "boolean" && [.5, 1, 2].includes(s.replaySpeed)) return { dialogue: s.dialogue, replaySpeed: s.replaySpeed }; } catch { /* Optional preferences never invalidate a game save. */ }
  return { dialogue: true, replaySpeed: 1 };
}
export function saveV4Settings(s: V4Settings, storage?: Storage): string | undefined {
  try { if (typeof s.dialogue !== "boolean" || ![.5, 1, 2].includes(s.replaySpeed)) throw new Error("Invalid V4 preferences"); (storage ?? window.localStorage).setItem(V4_SETTINGS_KEY, JSON.stringify({ version: 1, ...s })); } catch { return "V4 preferences could not be saved."; }
}
export function savePublicMemory(m: PublicMemory | null, storage?: Storage): string | undefined {
  try { if (!m) (storage ?? window.localStorage).removeItem(V4_MEMORY_KEY); else { validatePublicMemory(m); (storage ?? window.localStorage).setItem(V4_MEMORY_KEY, JSON.stringify(m)); } } catch { return "Public session memory could not be saved; the active game is retained."; }
}
export function loadPublicMemory(sessionId: string, storage?: Storage): PublicMemory | undefined {
  try {
    const raw = (storage ?? window.localStorage).getItem(V4_MEMORY_KEY) ?? "null";
    if (raw.length > 250000) return;
    const m = JSON.parse(raw); validatePublicMemory(m);
    if (m.sessionId !== sessionId) return;
    // Copy through the allowlist, ignoring unexpected fields in stored objects.
    const actions = (list: PublicMemory["current"]) => list.map(({ sequence, street, playerId, type, added, total }) => ({ sequence, street, playerId, type, added, total }));
    return { version: 1, sessionId: m.sessionId, hand: m.hand, current: actions(m.current), completed: m.completed.map((h) => ({ number: h.number, participants: [...h.participants], actions: actions(h.actions), revealed: Object.fromEntries(Object.entries(h.revealed).map(([id, cards]) => [id, cards.map(({ id, rank, suit }) => ({ id, rank, suit }))])) })) };
  } catch { return; }
}
