import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import PokerScene from "./PokerScene";
import App from "../../../app/App";
import { DEFAULT_LOOK } from "../presentation";
import { createSession, startHand } from "../../../domain/play/engine";
import { seededRandom } from "../../../domain/cards";
import { DEFAULT_CONFIG } from "../../../domain/play/types";
import { loadPlayData, savePlayData } from "../../../lib/playStorage";

const renderer = vi.hoisted(() => ({ fail: false }));
vi.mock("@react-three/fiber", () => ({
  // R3F mounts HTML canvas fallback children even when canvas is supported.
  // Scene objects are rendered by a separate reconciler, omitted by this stub.
  Canvas: function Canvas({ fallback }: { fallback: ReactNode }) {
    if (renderer.fail) throw new Error("Renderer initialization rejected");
    return <div data-testid="supported-canvas"><canvas>{fallback}</canvas></div>;
  },
  useThree: vi.fn(), useFrame: vi.fn(),
}));
vi.mock("@react-three/drei", () => ({ Html: () => null }));
beforeEach(() => {
  renderer.fail = false; localStorage.clear(); window.location.hash = "#play";
});
it("does not declare renderer failure merely because HTML canvas fallback content mounts", async () => {
  const onFailure = vi.fn();
  render(<PokerScene snapshot={null} events={[]} quality="low" motion={false}
    cinematic={false} active look={DEFAULT_LOOK} fourColor={false} onFailure={onFailure} />);
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByTestId("supported-canvas")).toBeInTheDocument();
  expect(onFailure).not.toHaveBeenCalled();
});
it("keeps the 3D shell selected while supported Canvas mounts its HTML fallback", async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByTestId("supported-canvas")).toBeInTheDocument());
  expect(document.querySelector(".immersive-play")).toHaveClass("display-3d");
  expect(screen.queryByText("2D table", { exact: true })).toBeNull();
});
it("still handles a genuine renderer initialization error without changing the saved session", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const initial = createSession(DEFAULT_CONFIG, seededRandom(1)); initial.dealer = 1;
    const session = startHand(initial, seededRandom(2));
    savePlayData({ session, pacing: "normal" }); renderer.fail = true;
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Call 10" })).toBeVisible());
    expect(document.querySelector(".immersive-play")).toHaveClass("display-2d");
    expect(loadPlayData().session).toEqual(session);
  } finally { consoleError.mockRestore(); }
});
