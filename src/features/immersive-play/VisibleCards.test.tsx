import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { parseCards } from "../../domain/cards";
import { CommunityCards, PrivateCards } from "./VisibleCards";
it("clearly separates flop, turn and river without showing undealt cards", () => {
  const board = parseCards("As Td 7c 2h Ks");
  const r = render(<CommunityCards board={board.slice(0, 3)} />);
  expect(within(screen.getByRole("group", { name: "Flop" })).getAllByRole("img")).toHaveLength(3);
  expect(within(screen.getByRole("group", { name: "Turn" })).queryByRole("img")).toBeNull();
  expect(within(screen.getByRole("group", { name: "River" })).queryByRole("img")).toBeNull();
  r.rerender(<CommunityCards board={board.slice(0, 4)} />);
  expect(within(screen.getByRole("group", { name: "Turn" })).getByRole("img", { name: "2 of hearts" })).toBeVisible();
  expect(within(screen.getByRole("group", { name: "River" })).queryByRole("img")).toBeNull();
  r.rerender(<CommunityCards board={board} />);
  expect(within(screen.getByRole("region", { name: "Community cards" })).getAllByRole("img")).toHaveLength(5);
});
it("retains existing board DOM cards when an action clones the snapshot", () => {
  const board = parseCards("As Td 7c"); const r = render(<CommunityCards board={board} />);
  const ace = screen.getByRole("img", { name: "A of spades" });
  r.rerender(<CommunityCards board={board.map((card) => ({ ...card }))} />);
  expect(screen.getByRole("img", { name: "A of spades" })).toBe(ace);
});
it("shows a readable private hand and keeps a folded hand explicitly labelled", () => {
  render(<PrivateCards cards={parseCards("Ac 2d")} folded />);
  expect(screen.getByText("Folded hand")).toBeVisible(); expect(screen.getAllByRole("img")).toHaveLength(2);
});
