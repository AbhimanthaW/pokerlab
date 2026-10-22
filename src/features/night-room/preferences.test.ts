import { beforeEach,expect,it } from "vitest";
import { DEFAULT_ROOM,loadRoom,ROOM_KEY,roomPreset,saveRoom } from "./preferences";
import { createHandGeometry } from "./handGeometry";
beforeEach(()=>localStorage.clear());
it("preserves defaults and roundtrips all three room presets independently of existing saves",()=>{
 localStorage.setItem("pokerlab.play.v2","retained");localStorage.setItem("pokerlab.immersive.v3","volume-retained");
 expect(loadRoom()).toEqual(DEFAULT_ROOM);
 for(const room of ["night","golden","rainy"] as const){const p=roomPreset({...DEFAULT_ROOM,hands:false,sleeve:"cream"},room);expect(saveRoom(p)).toBeUndefined();expect(loadRoom()).toEqual(p);}
 expect(localStorage.getItem("pokerlab.play.v2")).toBe("retained");expect(localStorage.getItem("pokerlab.immersive.v3")).toBe("volume-retained");
 saveRoom({...DEFAULT_ROOM});expect(loadRoom()).toEqual(DEFAULT_ROOM);
});
it.each([{room:"wrong"},{felt:"invisible"},{hands:"yes"},{camera:"orbit"},{characterAudio:2},{skin:"__proto__"}])("rejects corrupt optional cosmetic data %j without touching game saves",(patch)=>{
 localStorage.setItem(ROOM_KEY,JSON.stringify({version:1,preferences:{...DEFAULT_ROOM,...patch}}));expect(loadRoom()).toEqual(DEFAULT_ROOM);
});
it("handles unsupported schemas and blocked storage safely",()=>{
 localStorage.setItem(ROOM_KEY,'{"version":9}');expect(loadRoom()).toEqual(DEFAULT_ROOM);
 const blocked={getItem:()=>{throw Error("denied");},setItem:()=>{throw Error("denied");}} as unknown as Storage;
 expect(loadRoom(blocked)).toEqual(DEFAULT_ROOM);expect(saveRoom(DEFAULT_ROOM,blocked)).toContain("could not be saved");
});
it("builds a finite, connected-looking palm/wrist and five-finger silhouette as one shared geometry",()=>{
 const g=createHandGeometry();expect(g).toBeDefined();expect(g.getAttribute("position").count).toBeGreaterThan(300);
 expect(Array.from(g.getAttribute("position").array).every(Number.isFinite)).toBe(true);
 const box=g.boundingBox!;expect(box.min.z).toBeLessThan(-.2);expect(box.max.z).toBeGreaterThan(.18);expect(box.max.x-box.min.x).toBeGreaterThan(.2);expect(box.max.y-box.min.y).toBeLessThan(.1);g.dispose();
});
