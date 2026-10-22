import { assertSession } from "../domain/play/invariants";
import type { Pacing, Session } from "../domain/play/types";
export const PLAY_STORAGE_KEY = "pokerlab.play.v2";
export interface PlayData {
  session: Session | null;
  pacing: Pacing;
  warning?: string;
  invalid?: boolean;
}
export function loadPlayData(storage?: Storage): PlayData {
  try {
    const raw = (storage ?? window.localStorage).getItem(PLAY_STORAGE_KEY);
    if (!raw) return { session: null, pacing: "normal" };
    if (raw.length > 4_000_000)
      throw new Error("Saved session exceeds its size limit.");
    const data: unknown = JSON.parse(raw);
    if (
      !data ||
      typeof data !== "object" ||
      !("version" in data) ||
      data.version !== 2 ||
      !("session" in data) ||
      !("pacing" in data) ||
      !["instant", "normal", "relaxed"].includes(String(data.pacing))
    )
      throw new Error("Unsupported Play save format.");
    if (data.session !== null) assertSession(data.session);
    return { session: data.session, pacing: data.pacing as Pacing };
  } catch (error) {
    return {
      session: null,
      pacing: "normal",
      invalid: true,
      warning: `The saved Play session could not be restored. ${error instanceof Error ? error.message : "Unreadable storage."} Your Learn progress is separate. Discard this save to begin again.`,
    };
  }
}
export function savePlayData(
  data: Pick<PlayData, "session" | "pacing">,
  storage?: Storage,
): string | undefined {
  try {
    if (data.session) assertSession(data.session);
    if (!["instant", "normal", "relaxed"].includes(data.pacing))
      throw new Error("Invalid pacing");
    (storage ?? window.localStorage).setItem(
      PLAY_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        session: data.session,
        pacing: data.pacing,
      }),
    );
  } catch (error) {
    return `Play session could not be saved: ${error instanceof Error ? error.message : "Storage is unavailable"}. Keep this tab open to retain the current session.`;
  }
}
