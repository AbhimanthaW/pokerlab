import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
  window.location.hash = "";
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});
describe("application interactions", () => {
  it("starts a hand with visible human cards and hidden opponents, then reveals the flop", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start hand" }));
    const table = screen.getByRole("region", {
      name: "Texas Hold'em practice table",
    });
    expect(
      within(table).getAllByRole("img", { name: "Hidden card" }),
    ).toHaveLength(4);
    await user.click(screen.getByRole("button", { name: "Reveal flop" }));
    expect(
      screen.getByText("What is your strongest current hand?"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: /High Card/ }));
    expect(screen.getByRole("status")).toHaveTextContent(
      /Nicely read|A chance to learn/,
    );
    expect(screen.getByRole("button", { name: /High Card/ })).toBeDisabled();
  });
  it("trainer prevents incomplete submission and records skips without counting them incorrect", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    await user.click(within(nav).getByRole("link", { name: "Hand Trainer" }));
    expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Skip exercise/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Exercise skipped");
    await user.click(within(nav).getByRole("link", { name: "Progress" }));
    expect(screen.getByText("0 exercises completed")).toBeVisible();
    expect(screen.getByText("never marked incorrect")).toBeVisible();
  });
  it("keeps a table hand when navigating to the reference and back", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start hand" }));
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    await user.click(within(nav).getByRole("link", { name: "Hand Rankings" }));
    expect(
      screen.getAllByRole("heading", { name: /Straight Flush/ }).length,
    ).toBeGreaterThan(0);
    await user.click(within(nav).getByRole("link", { name: "Practice Table" }));
    expect(screen.getByRole("button", { name: "Reveal flop" })).toBeVisible();
  });
  it("persists distinct exercise records after an application remount", async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await user.click(screen.getByRole("button", { name: "Start hand" }));
    await user.click(screen.getByRole("button", { name: "Reveal flop" }));
    await user.click(screen.getByRole("button", { name: /High Card/ }));
    expect(screen.getByText("1 exercises completed")).toBeVisible();
    first.unmount();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start hand" }));
    await user.click(screen.getByRole("button", { name: "Reveal flop" }));
    await user.click(screen.getByRole("button", { name: /High Card/ }));
    expect(screen.getByText("2 exercises completed")).toBeVisible();
  });
  it("applies opponent setting changes to the next hand without changing the active hand", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: "Start hand" }));
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    await user.click(within(nav).getByRole("link", { name: "Settings" }));
    await user.selectOptions(screen.getByLabelText("Number of opponents"), "5");
    await user.click(within(nav).getByRole("link", { name: "Practice Table" }));
    expect(screen.getAllByTestId("opponent-seat")).toHaveLength(2);
    expect(screen.getByText(/3 players · Texas/)).toBeVisible();
    for (const name of [
      "Reveal flop",
      "Reveal turn",
      "Reveal river",
      "Reveal showdown",
      "Review hand",
      "Next hand",
    ]) {
      await user.click(screen.getByRole("button", { name }));
    }
    expect(screen.getAllByTestId("opponent-seat")).toHaveLength(5);
    expect(screen.getByText(/6 players · Texas/)).toBeVisible();
  });
  it("supports keyboard card selection and requires exactly five selections", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    await user.click(within(nav).getByRole("link", { name: "Hand Trainer" }));
    await user.click(screen.getByRole("button", { name: "Best five" }));
    const cards = document.querySelectorAll<HTMLButtonElement>(
      ".trainer-panel > .card-row button",
    );
    expect(cards).toHaveLength(7);
    cards[0].focus();
    await user.keyboard("{Enter}");
    expect(cards[0]).toHaveAttribute("aria-pressed", "true");
    await user.keyboard(" ");
    expect(cards[0]).toHaveAttribute("aria-pressed", "false");
    for (let i = 0; i < 5; i++) await user.click(cards[i]);
    expect(screen.getByRole("button", { name: "Check answer" })).toBeEnabled();
    await user.click(cards[5]);
    expect(cards[5]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/5 of 5 cards selected/)).toBeVisible();
  });

  it("skip link focuses content without changing the active page", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    await user.click(within(nav).getByRole("link", { name: "Hand Trainer" }));
    await user.click(screen.getByRole("link", { name: "Skip to content" }));
    expect(window.location.hash).toBe("#trainer");
    expect(screen.getByRole("main")).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Hand recognition" }),
    ).toBeVisible();
  });

  it("keeps accessible navigation names when tablet labels are visually hidden", () => {
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    for (const label of [
      "Practice Table",
      "Hand Trainer",
      "Hand Rankings",
      "Progress",
      "Settings",
    ]) {
      const link = within(nav).getByRole("link", { name: label });
      expect(link).toHaveAttribute("aria-label", label);
      expect(link).toHaveAccessibleName(label);
    }
  });
});
