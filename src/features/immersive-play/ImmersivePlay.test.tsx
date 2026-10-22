import { StrictMode, useEffect } from "react";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "../../app/App";
import { seededRandom } from "../../domain/cards";
import { createSession, startHand } from "../../domain/play/engine";
import { DEFAULT_CONFIG } from "../../domain/play/types";
import { loadPlayData, savePlayData } from "../../lib/playStorage";
import { usePlay } from "../play/usePlay";
import { AudioManager } from "./audio/AudioManager";
import type { PokerSceneProps } from "./scene/PokerScene";
const renderer = vi.hoisted(() => ({ fail: false }));
vi.mock("./scene/PokerScene", () => ({ default: function FakeScene({ onFailure, motion, snapshot }: PokerSceneProps) {
  useEffect(() => { if (renderer.fail) onFailure("Renderer failed; using 2D."); }, [onFailure]);
  return <div data-testid="mock-scene" data-motion={String(motion)} data-revision={snapshot?.revision} />;
} }));
function fixture(dealer = 1) {
  const s = createSession(DEFAULT_CONFIG, seededRandom(9)); s.dealer = dealer;
  return startHand(s, seededRandom(11));
}
beforeEach(() => {
  localStorage.clear(); renderer.fail = false; window.location.hash = "#play";
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
it("enters Play without global navigation, restores Learn and preserves its active hand", async () => {
  const s = fixture(); savePlayData({ session: s, pacing: "normal" });
  const user = userEvent.setup(); render(<App />);
  await waitFor(() => expect(screen.getByTestId("mock-scene")).toBeInTheDocument());
  expect(screen.queryByRole("navigation", { name: "Main navigation" })).toBeNull();
  expect(document.querySelector(".sidebar")).toBeNull(); expect(document.body.style.overflow).toBe("hidden");
  await user.click(screen.getByRole("button", { name: "Pause and settings" }));
  await user.click(screen.getByRole("button", { name: "Return to Learn" }));
  expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  expect(loadPlayData().session).toEqual(s);
  expect(document.body.style.overflow).not.toBe("hidden");
});
it("switches 3D/2D repeatedly using one controller and the exact same saved turn", async () => {
  const s = fixture(); savePlayData({ session: s, pacing: "normal" });
  const user = userEvent.setup(); const r = render(<App />);
  for (let i = 0; i < 3; i++) {
    await user.click(screen.getByRole("button", { name: "Pause and settings" }));
    await user.selectOptions(screen.getByLabelText("Table display"), "2d");
    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(screen.getByRole("button", { name: "Call 10" })).toBeVisible();
    expect(loadPlayData().session).toEqual(s);
    await user.click(screen.getByRole("button", { name: "Try 3D" }));
    await waitFor(() => expect(screen.getAllByTestId("mock-scene")).toHaveLength(1));
    expect(loadPlayData().session).toEqual(s);
  }
  r.unmount(); expect(document.body.style.overflow).not.toBe("hidden");
});
it("falls back on renderer failure while keeping the current hand and all legal actions", async () => {
  const s = fixture(); savePlayData({ session: s, pacing: "normal" }); renderer.fail = true;
  render(<App />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Call 10" })).toBeVisible());
  expect(screen.getByText("Renderer failed; using 2D.")).toBeVisible();
  expect(loadPlayData().session).toEqual(s);
});
it("uses low graphics and audio preferences independently, traps focus and honors Escape", async () => {
  const user = userEvent.setup(); render(<App />);
  await user.click(screen.getByRole("button", { name: "Pause and settings" }));
  const dialog = screen.getByRole("dialog", { name: "At your pace" }); expect(dialog).toHaveFocus();
  await user.selectOptions(screen.getByLabelText("Graphics quality"), "low");
  expect(screen.getByLabelText("music volume")).toHaveValue("0.4");
  await user.keyboard("{Escape}"); expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Pause and settings" }));
  expect(screen.getByLabelText("Graphics quality")).toHaveValue("low");
});
it("cleans audio owners on StrictMode remount without starting audio automatically", async () => {
  const dispose = vi.spyOn(AudioManager.prototype, "dispose");
  const enable = vi.spyOn(AudioManager.prototype, "enable");
  const r = render(<StrictMode><App /></StrictMode>);
  await waitFor(() => expect(screen.getByTestId("mock-scene")).toBeInTheDocument());
  expect(enable).not.toHaveBeenCalled();
  const count = dispose.mock.calls.length; r.unmount(); expect(dispose.mock.calls.length).toBe(count + 1);
});
it("pause cancels pending NPC work, resumes once and keeps the same session", async () => {
  vi.useFakeTimers(); const s = fixture(0); savePlayData({ session: s, pacing: "normal" });
  const hook = renderHook(({ paused }) => usePlay(paused), { initialProps: { paused: true } });
  await act(async () => { vi.advanceTimersByTime(3000); }); expect(loadPlayData().session).toEqual(s);
  hook.rerender({ paused: false }); await act(async () => { vi.advanceTimersByTime(550); });
  expect(loadPlayData().session?.revision).toBe(s.revision + 1);
  hook.rerender({ paused: true }); const next = loadPlayData().session;
  await act(async () => { vi.advanceTimersByTime(3000); }); expect(loadPlayData().session).toEqual(next);
  hook.unmount();
});
it("keeps duplicate cards behind details and cancels/commits a raise without losing the session", async () => {
  const s = fixture(); savePlayData({ session: s, pacing: "relaxed" });
  const user = userEvent.setup(); render(<App />);
  await waitFor(() => expect(screen.getByTestId("mock-scene")).toBeInTheDocument());
  expect(screen.getByRole("region", { name: "Community cards" })).not.toBeVisible();
  expect(screen.queryByLabelText("Total commitment", { exact: true })).toBeNull();
  await user.click(screen.getByText("Table details", { exact: true }));
  expect(screen.getByRole("list", { name: "Opponent stacks" })).toHaveTextContent("Alex");
  await user.click(screen.getByText("Table details", { exact: true }));
  await user.click(screen.getByRole("button", { name: "Raise" }));
  expect(screen.getByLabelText("Total commitment", { exact: true })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("button", { name: "Raise" })).toHaveFocus();
  expect(loadPlayData().session).toEqual(s);
  await user.click(screen.getByRole("button", { name: "Raise" }));
  await user.click(screen.getByRole("button", { name: /^Confirm raise/ }));
  expect(loadPlayData().session?.revision).toBe(s.revision + 1);
  expect(loadPlayData().session?.actions.at(-1)?.type).toBe("RAISE");
});
