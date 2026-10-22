import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import App from "../../app/App";
import { seededRandom } from "../../domain/cards";
import { applyAction, createSession, getLegalActions, startHand } from "../../domain/play/engine";
import { DEFAULT_CONFIG } from "../../domain/play/types";
import { loadPlayData, savePlayData } from "../../lib/playStorage";
import type { PokerSceneProps } from "../immersive-play/scene/PokerScene";
const observed = vi.hoisted(() => ({ events: 0 }));
vi.mock("../immersive-play/scene/PokerScene", () => ({ default: function FakeScene({ events, snapshot }: PokerSceneProps) {
  useEffect(() => { observed.events = events.length; }, [events]);
  return <div data-testid="replay-scene" data-revision={snapshot?.revision} />;
} }));
beforeEach(() => { localStorage.clear(); window.location.hash = "#play"; vi.spyOn(window, "scrollTo").mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
function hand() { let s = startHand(createSession(DEFAULT_CONFIG, seededRandom(9)), seededRandom(11)); while (s.status === "hand_in_progress") s = applyAction(s, { playerId: s.actor!, type: getLegalActions(s, s.actor!).check ? "CHECK" : "CALL" }); return s; }
it("can replay last hand, seek back/forward and exit to the identical persisted live session", async () => {
  const s = hand(); savePlayData({ session: s, pacing: "relaxed" }); const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole("button", { name: "Replay last hand" }));
  expect(screen.getByText("REPLAY MODE · READ ONLY")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Next hand →" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Next event" }));
  await user.click(screen.getByRole("button", { name: "Next event" }));
  await user.click(screen.getByRole("button", { name: "Previous event" }));
  await user.selectOptions(screen.getByLabelText("Replay speed"), "2");
  expect(loadPlayData().session).toEqual(s);
  await user.click(screen.getByRole("button", { name: "Return to live Play" }));
  expect(screen.getByRole("button", { name: "Next hand →" })).toBeVisible(); expect(loadPlayData().session).toEqual(s);
  await waitFor(() => expect(observed.events).toBe(0));
});
it("pauses live NPC scheduling while replaying a history entry and safely restores after refresh", async () => {
  vi.useFakeTimers(); const s = startHand(hand(), seededRandom(23)); expect(s.actor).not.toBe("you");
  savePlayData({ session: s, pacing: "normal" });
  const r = render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Hand history" }));
  fireEvent.click(screen.getByText(/Hand 1 · Showdown/));
  fireEvent.click(screen.getByRole("button", { name: "Replay hand 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Play replay" }));
  await act(async () => { vi.advanceTimersByTime(5500); });
  expect(loadPlayData().session).toEqual(s);
  r.unmount(); render(<App />); // refresh restores live Play, never auto-plays an old replay
  expect(screen.queryByTestId("replay-mode")).toBeNull(); expect(loadPlayData().session).toEqual(s);
  await act(async () => { vi.advanceTimersByTime(550); });
  expect(loadPlayData().session?.revision).toBe(s.revision + 1);
});
