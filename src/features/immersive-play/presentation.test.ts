import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { seededRandom } from "../../domain/cards";
import { applyAction, createSession, getLegalActions, startHand } from "../../domain/play/engine";
import { DEFAULT_CONFIG } from "../../domain/play/types";
import { boundLook, CAMERA_RIG, DEFAULT_LOOK, projectScene, qualityConfig, seatAnchor, synchronizePresentation } from "./presentation";

const game = () => { const s = createSession(DEFAULT_CONFIG, seededRandom(11), 0); s.dealer = 1; return startHand(s, seededRandom(2)); };
describe("public presentation and synchronization", () => {
  it("excludes deck, burns, hidden private cards and underlying session references", () => {
    const s = game(), p = projectScene(s), json = JSON.stringify(p);
    expect(p.seats[0].cards).toEqual(s.players[0].cards);
    expect(p.seats.slice(1).every((seat) => seat.cards.every((c) => c === null))).toBe(true);
    for (const card of [...s.deck, ...s.players.slice(1).flatMap((s) => s.cards)]) expect(json).not.toContain(`"${card.id}"`);
    expect(p).not.toHaveProperty("deck"); expect(p).not.toHaveProperty("burns");
    p.seats[0].stack++; expect(p.seats[0].stack).not.toBe(s.players[0].stack);
  });
  it("shows only legitimately tabled hands after showdown, never after fold settlement", () => {
    let s = game();
    while (s.status === "hand_in_progress") s = applyAction(s, { playerId: s.actor!, type: "FOLD" });
    expect(projectScene(s).seats.slice(1).every((seat) => seat.cards.every((c) => c === null))).toBe(true);
    s = game();
    while (s.status === "hand_in_progress") s = applyAction(s, { playerId: s.actor!, type: getLegalActions(s, s.actor!).check ? "CHECK" : "CALL" });
    expect(projectScene(s).seats.every((seat) => seat.cards.every(Boolean))).toBe(true);
  });
  it("restores a visual baseline without replaying effects and ignores duplicate or stale revisions", () => {
    const p = projectScene(game());
    const baseline = { snapshot: p, events: [] };
    expect(synchronizePresentation(baseline, p, 100)).toBe(baseline);
    expect(synchronizePresentation(baseline, { ...p, revision: p.revision - 1 }, 200)).toBe(baseline);
    expect(baseline.events).toEqual([]);
  });
  it("emits one effect per real action and cancels old-hand events on next deal", () => {
    let s = game(), state = { snapshot: projectScene(s), events: [] };
    s = applyAction(s, { playerId: s.actor!, type: "CALL" });
    const next = synchronizePresentation(state, projectScene(s), 100);
    expect(next.events.filter((e) => e.kind === "ACTION")).toHaveLength(1);
    expect(synchronizePresentation(next, projectScene(s), 200)).toBe(next);
    while (s.status === "hand_in_progress") s = applyAction(s, { playerId: s.actor!, type: "FOLD" });
    state = { snapshot: projectScene(s), events: [] };
    const dealt = synchronizePresentation(state, projectScene(startHand(s, seededRandom(3))), 200);
    expect(dealt.events.map((e) => e.kind)).toEqual(["DEAL"]);
    expect(synchronizePresentation(dealt, null, 300)).toEqual({ snapshot: null, events: [] });
  });
  it("caps rapid event queues and converges to the latest authoritative snapshot", () => {
    let s = game(); let state = { snapshot: projectScene(s), events: [] } as ReturnType<typeof synchronizePresentation>;
    for (let i = 0; i < 80; i++) {
      if (s.status !== "hand_in_progress") s = startHand(s, seededRandom(i));
      else s = applyAction(s, { playerId: s.actor!, type: getLegalActions(s, s.actor!).check ? "CHECK" : "CALL" });
      state = synchronizePresentation(state, projectScene(s), i);
      expect(state.events.length).toBeLessThanOrEqual(64);
      expect(state.snapshot).toEqual(projectScene(s));
    }
  });
});
describe("seating, camera and quality boundaries", () => {
  it.each([1, 2, 3, 4, 5])("positions exactly %i opponents with distinct clockwise anchors", (n) => {
    const anchors = Array.from({ length: n + 1 }, (_, i) => seatAnchor(i, n));
    expect(new Set(anchors.map((a) => a.join())).size).toBe(n + 1);
    const angles = anchors.slice(1).map(([x, , z]) => (Math.atan2(-x / 4.05, z / 2.9) + Math.PI * 2) % (Math.PI * 2));
    expect(angles).toEqual([...angles].sort((a, b) => a - b));
    expect(() => seatAnchor(n + 1, n)).toThrow();
  });
  it("clamps all camera input including malformed values and supports exact reset", () => {
    expect(boundLook({ yaw: 20, pitch: -10, zoom: 0 })).toEqual({ yaw: .2, pitch: -.12, zoom: .9 });
    expect(boundLook({ yaw: NaN, pitch: Infinity, zoom: -Infinity })).toEqual(DEFAULT_LOOK);
    expect(boundLook(DEFAULT_LOOK)).toEqual(DEFAULT_LOOK);
  });
  it("uses conservative automatic resolution and disables low-quality shadows", () => {
    expect(qualityConfig("auto", 390, 8).resolved).toBe("low");
    expect(qualityConfig("auto", 1440, 4).resolved).toBe("low");
    expect(qualityConfig("auto", 1440, 8).resolved).toBe("medium");
    expect(qualityConfig("low", 1440, 16)).toMatchObject({ dpr: 1, shadows: false, detail: false });
    expect(qualityConfig("high", 390, 4)).toMatchObject({ dpr: 1.8, shadows: true, detail: true });
  });
});

it.each([[1920, 1080], [1440, 900], [1280, 800]])("keeps all default opponent label anchors inside %ix%i with room for labels", (width, height) => {
  const rig = CAMERA_RIG.desktop, camera = new PerspectiveCamera(rig.fov, width / height, .1, 40);
  camera.position.set(0, rig.height, rig.distance); camera.lookAt(0, .05, CAMERA_RIG.lookAtZ); camera.updateMatrixWorld();
  for (let n = 1; n <= 5; n++) for (let i = 1; i <= n; i++) {
    const a = seatAnchor(i, n), screen = new Vector3(a[0] * .84, .78 + (i % 2) * .04, a[2] * .98).project(camera);
    const x = (screen.x + 1) * width / 2, y = (1 - screen.y) * height / 2;
    expect(x).toBeGreaterThan(60); expect(x).toBeLessThan(width - 60);
    expect(y).toBeGreaterThan(75); expect(y).toBeLessThan(height - 100);
  }
});
