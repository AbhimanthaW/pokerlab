import { playReducer } from "./usePlay";
import { StrictMode } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import Play from "./Play";
import { seededRandom } from "../../domain/cards";
import { createSession, startHand } from "../../domain/play/engine";
import { DEFAULT_CONFIG } from "../../domain/play/types";
import {
  PLAY_STORAGE_KEY,
  loadPlayData,
  savePlayData,
} from "../../lib/playStorage";

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => vi.useRealTimers());
function fixture(dealer = 1) {
  const s = createSession(DEFAULT_CONFIG, seededRandom(2));
  s.dealer = dealer;
  return startHand(s, seededRandom(3));
}
it("starts a default four-player session and persists it", async () => {
  const user = userEvent.setup();
  render(<Play onLearn={() => {}} />);
  await user.click(screen.getByRole("button", { name: "Start session" }));
  expect(screen.getAllByTestId("play-opponent")).toHaveLength(3);
  expect(loadPlayData().session?.config).toEqual(DEFAULT_CONFIG);
});
it("renders legal actions, rejects incomplete amounts, and resumes exactly after remount", async () => {
  const s = fixture();
  savePlayData({ session: s, pacing: "relaxed" });
  const user = userEvent.setup();
  const r = render(<Play onLearn={() => {}} />);
  expect(screen.getByRole("button", { name: "Call 10" })).toBeVisible();
  expect(screen.queryByRole("button", { name: /^Check$/ })).toBeNull();
  const input = screen.getByLabelText("Total commitment", { exact: true });
  await user.clear(input);
  await user.type(input, "19");
  expect(screen.getByRole("button", { name: /^Raise to/ })).toBeDisabled();
  r.unmount();
  render(<Play onLearn={() => {}} />);
  expect(loadPlayData().session).toEqual(s);
  expect(screen.getAllByRole("img", { name: "Hidden card" })).toHaveLength(6);
});
it("strict-mode remount and pacing cancellation execute at most one NPC action per revision", async () => {
  vi.useFakeTimers();
  const s = fixture(0);
  expect(s.actor).toBe("npc-3");
  savePlayData({ session: s, pacing: "normal" });
  const r = render(
    <StrictMode>
      <Play onLearn={() => {}} />
    </StrictMode>,
  );
  await act(async () => {
    vi.advanceTimersByTime(550);
  });
  const next = loadPlayData().session!;
  expect(next.revision).toBe(s.revision + 1);
  expect(next.actions.length).toBe(s.actions.length + 1);
  r.unmount();
  await act(async () => {
    vi.advanceTimersByTime(2000);
  });
  expect(loadPlayData().session).toEqual(next);
  const again = render(
    <StrictMode>
      <Play onLearn={() => {}} />
    </StrictMode>,
  );
  if (next.actor !== "you" && next.status === "hand_in_progress") {
    await act(async () => {
      vi.advanceTimersByTime(550);
    });
    expect(loadPlayData().session!.revision).toBe(next.revision + 1);
  }
  again.unmount();
});
it("retains an invalid save until the user explicitly discards it", async () => {
  localStorage.setItem(PLAY_STORAGE_KEY, "broken");
  const user = userEvent.setup();
  render(<Play onLearn={() => {}} />);
  expect(screen.getByRole("alert")).toHaveTextContent("could not be restored");
  expect(localStorage.getItem(PLAY_STORAGE_KEY)).toBe("broken");
  await user.click(
    screen.getByRole("button", { name: "Discard invalid Play save" }),
  );
  expect(screen.getByRole("button", { name: "Start session" })).toBeVisible();
  expect(loadPlayData().invalid).toBeUndefined();
});
it("a double-click cannot submit the same human action twice", async () => {
  const s = fixture();
  savePlayData({ session: s, pacing: "relaxed" });
  const user = userEvent.setup();
  render(<Play onLearn={() => {}} />);
  const controls = screen.getByRole("region", {
    name: "Your available actions",
  });
  await user.dblClick(
    within(controls).getByRole("button", { name: "Call 10" }),
  );
  expect(loadPlayData().session!.revision).toBe(s.revision + 1);
});

it("ignores an obsolete session command even when its revision matches a new session", () => {
  const old = fixture(),
    current = fixture();
  const state = { session: current, pacing: "normal" as const };
  expect(old.revision).toBe(current.revision);
  expect(
    playReducer(state, {
      type: "ACT",
      action: { type: "CALL", playerId: "you" },
      revision: old.revision,
      sessionId: old.id,
      now: Date.now(),
    }),
  ).toBe(state);
  expect(playReducer(state, { type: "START", session: old })).toBe(state);
});
it("retains the last valid session and shows a diagnostic on an invalid command", () => {
  const current = fixture();
  const state = { session: current, pacing: "normal" as const };
  const next = playReducer(state, {
    type: "ACT",
    action: { type: "CHECK", playerId: "you" },
    revision: current.revision,
    sessionId: current.id,
    now: Date.now(),
  });
  expect(next.session).toBe(current);
  expect(next.error).toContain("Cannot check");
});
