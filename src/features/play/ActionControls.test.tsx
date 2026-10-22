import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { createSession, startHand, getLegalActions, applyAction } from "../../domain/play/engine";
import { seededRandom } from "../../domain/cards";
import { DEFAULT_CONFIG } from "../../domain/play/types";
import ActionControls from "./ActionControls";
function game() { const s = createSession(DEFAULT_CONFIG, seededRandom(2)); s.dealer = 1; return startHand(s, seededRandom(3)); }
it("keeps wager inputs hidden until requested and cancellation never submits", async () => {
  const user = userEvent.setup(), onAction = vi.fn();
  render(<ActionControls compact legal={getLegalActions(game(), "you")} onAction={onAction} />);
  expect(screen.queryByLabelText("Total commitment", { exact: true })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Raise" }));
  expect(screen.getByLabelText("Total commitment", { exact: true })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.queryByLabelText("Total commitment", { exact: true })).toBeNull();
  expect(onAction).not.toHaveBeenCalled();
});
it("validates integer bounds and submits a raise-to command accepted by the real engine", async () => {
  const s = game(), legal = getLegalActions(s, "you"), onAction = vi.fn(), user = userEvent.setup();
  render(<ActionControls compact legal={legal} onAction={onAction} />);
  await user.click(screen.getByRole("button", { name: "Raise" }));
  const field = screen.getByLabelText("Total commitment", { exact: true });
  for (const invalid of ["", "19", "20.5", "1001", "-1"]) {
    await user.clear(field); if (invalid) await user.type(field, invalid);
    expect(screen.getByRole("button", { name: /^Confirm raise/ })).toBeDisabled();
  }
  await user.clear(field); await user.type(field, "35");
  await user.click(screen.getByRole("button", { name: /^Confirm raise/ }));
  expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "RAISE", playerId: "you", to: 35 });
  expect(applyAction(s, onAction.mock.calls[0][0]).currentBet).toBe(35);
});
it("preserves check, fold, bet, and valid short all-in actions", async () => {
  const user = userEvent.setup(), onAction = vi.fn(), base = getLegalActions(game(), "you");
  const r = render(<ActionControls compact legal={{ ...base, check: true, call: 0, amountToMatch: 0, bet: true, raise: false }} onAction={onAction} />);
  await user.click(screen.getByRole("button", { name: "Check" }));
  expect(onAction).toHaveBeenLastCalledWith({ type: "CHECK", playerId: "you" });
  await user.click(screen.getByRole("button", { name: "Bet" }));
  await user.click(screen.getByRole("button", { name: /^Confirm bet/ }));
  expect(onAction).toHaveBeenLastCalledWith({ type: "BET", playerId: "you", to: base.minTo });
  r.rerender(<ActionControls compact legal={{ ...base, raise: false, maxTo: 15, allInKind: "short-raise" }} onAction={onAction} />);
  expect(screen.queryByRole("button", { name: "Raise" })).toBeNull();
  await user.click(screen.getByRole("button", { name: /^All-in/ }));
  expect(onAction).toHaveBeenLastCalledWith({ type: "ALL_IN", playerId: "you" });
  await user.click(screen.getByRole("button", { name: "Fold" }));
  expect(onAction).toHaveBeenLastCalledWith({ type: "FOLD", playerId: "you" });
});
