import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { Group } from "three";
import { useCardMotion } from "./cardMotion";
import { useCardTexture } from "./cardTexture";
import { parseCards } from "../../../domain/cards";
import type { Card } from "../../../domain/types";
import type { Point } from "../presentation";

const loop = vi.hoisted(() => ({ frame: undefined as undefined | ((state: unknown, delta: number) => void) }));
vi.mock("@react-three/fiber", () => ({ useFrame: (frame: (state: unknown, delta: number) => void) => { loop.frame = frame; } }));
const position: Point = [0, .22, 1.7];
const step = () => act(() => { for (let i = 0; i < 160; i++) loop.frame?.({}, 1 / 60); });
function setup(faceKey: string | null, deal: boolean, motion = true) {
  const placement = { current: new Group() }, face = { current: new Group() };
  const hook = renderHook((options) => useCardMotion(placement, face, options), {
    initialProps: { faceKey, position, folded: false, deal, motion },
  });
  return { ...hook, placement: placement.current, face: face.current };
}
it("deals and flips a new physical card once, without replay on subsequent action renders", () => {
  const h = setup("Ac", true); expect(h.face.rotation.y).toBe(Math.PI); step();
  expect(h.face.rotation.y).toBeLessThan(.00001);
  h.rerender({ faceKey: "Ac", position: [...position], folded: false, deal: true, motion: true });
  expect(h.face.rotation.y).toBeLessThan(.00001);
  h.placement.position.toArray().forEach((n, i) => expect(n).toBeCloseTo(position[i], 8));
});
it("flips a concealed card only when it becomes publicly revealed", () => {
  const h = setup(null, false); expect(h.face.rotation.y).toBe(0);
  h.rerender({ faceKey: "Ks", position, folded: false, deal: false, motion: true });
  expect(h.face.rotation.y).toBe(Math.PI); step();
  h.rerender({ faceKey: "Ks", position: [...position], folded: false, deal: false, motion: true });
  expect(h.face.rotation.y).toBeLessThan(.00001);
});
it("does not replay restored cards or restart a reveal when motion settings change", () => {
  const h = setup("Ac", false); expect(h.face.rotation.y).toBe(0);
  h.rerender({ faceKey: "Ac", position, folded: false, deal: false, motion: false });
  h.rerender({ faceKey: "Ac", position, folded: false, deal: false, motion: true });
  expect(h.face.rotation.y).toBe(0);
});
it("reduced motion immediately converges to the authoritative card location", () => {
  const h = setup("Ac", true, false); expect(h.face.rotation.y).toBe(0);
  h.placement.position.toArray().forEach((n, i) => expect(n).toBeCloseTo(position[i], 8));
  h.rerender({ faceKey: null, position, folded: true, deal: false, motion: false }); step();
  expect(h.placement.position.toArray()).toEqual([-.55, .19, -1.65]);
});
beforeEach(() => {
  const context = Object.fromEntries(["fillRect", "strokeRect", "fillText", "save", "translate", "rotate", "restore", "beginPath", "moveTo", "lineTo", "stroke", "ellipse", "fill"].map((name) => [name, vi.fn()]));
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context as unknown as CanvasRenderingContext2D);
});
it("keeps the same texture across immutable copies of the same card", () => {
  const card = parseCards("Ac")[0];
  const h = renderHook(({ card, folded, fourColor }) => useCardTexture(card, folded, fourColor), {
    initialProps: { card: card as Card | null, folded: false, fourColor: false },
  });
  const original = h.result.current; const dispose = vi.spyOn(original, "dispose");
  h.rerender({ card: { ...card }, folded: false, fourColor: false });
  expect(h.result.current).toBe(original); expect(dispose).not.toHaveBeenCalled();
  h.rerender({ card: { ...card }, folded: true, fourColor: false });
  expect(h.result.current).not.toBe(original); expect(dispose).toHaveBeenCalledTimes(1);
});
it("delays coordinated flights, cancels on reduced motion and never restarts after interruption",()=>{
 const clock=vi.spyOn(performance,"now").mockReturnValue(1000);
 const placement={current:new Group()},face={current:new Group()};
 const flight={at:1000,delay:.5,duration:.25,from:[.65,.18,-1.65] as Point};
 const h=renderHook((options)=>useCardMotion(placement,face,options),{initialProps:{faceKey:"Ac",position,folded:false,deal:true,motion:true,flight}});
 act(()=>loop.frame?.({},1/60));expect(placement.current.visible).toBe(false);
 clock.mockReturnValue(1600);act(()=>loop.frame?.({},1/60));expect(placement.current.visible).toBe(true);expect(placement.current.position.z).toBeLessThan(position[2]);
 h.rerender({faceKey:"Ac",position,folded:false,deal:true,motion:false,flight});act(()=>loop.frame?.({},1/60));expect(placement.current.position.toArray()).toEqual(position);
 h.rerender({faceKey:"Ac",position,folded:false,deal:true,motion:true,flight});act(()=>loop.frame?.({},1/60));expect(placement.current.position.toArray()).toEqual(position);clock.mockRestore();
});
it("gives a newly active human immediate readable cards instead of waiting for dealer animation",()=>{
 const clock=vi.spyOn(performance,"now").mockReturnValue(1000),placement={current:new Group()},face={current:new Group()};
 const flight={at:1000,delay:1,duration:.25,from:[.65,.18,-1.65] as Point};
 const options={faceKey:"Ac",position,folded:false,deal:true,motion:true,flight,priority:false};
 const h=renderHook((props)=>useCardMotion(placement,face,props),{initialProps:options});act(()=>loop.frame?.({},1/60));expect(placement.current.visible).toBe(false);
 h.rerender({...options,priority:true});act(()=>loop.frame?.({},1/60));expect(placement.current.visible).toBe(true);expect(placement.current.position.toArray()).toEqual(position);expect(face.current.rotation.y).toBe(0);clock.mockRestore();
});
it("smoothly tilts an inspected card and snaps to the stable pose under reduced motion",()=>{
 const placement={current:new Group()},face={current:new Group()},surface={current:new Group()};
 const initial={faceKey:"Ac",position,folded:false,deal:false,motion:true,surface,tilt:.48,angle:0};const h=renderHook((options)=>useCardMotion(placement,face,options),{initialProps:initial});
 const old=surface.current.rotation.x;h.rerender({...initial,tilt:.95});act(()=>loop.frame?.({},1/60));expect(surface.current.rotation.x).toBeGreaterThan(old);expect(surface.current.rotation.x).toBeLessThan(-Math.PI/2+.95);
 h.rerender({...initial,tilt:.95,motion:false});act(()=>loop.frame?.({},1/60));expect(surface.current.rotation.x).toBe(-Math.PI/2+.95);
});
