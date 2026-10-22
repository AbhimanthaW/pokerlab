import { render } from "@testing-library/react";
import { BufferGeometry } from "three";
import { expect,it,vi } from "vitest";
import { HandGeometryProvider } from "./HandModel";
it("shares one stable hand geometry owner across cosmetic rerenders and disposes it on exit",()=>{
 const dispose=vi.spyOn(BufferGeometry.prototype,"dispose");
 const r=render(<HandGeometryProvider><span>Night</span></HandGeometryProvider>);const initial=dispose.mock.calls.length;
 r.rerender(<HandGeometryProvider><span>Rainy</span></HandGeometryProvider>);expect(dispose.mock.calls.length).toBe(initial);
 r.unmount();expect(dispose.mock.calls.length).toBe(initial+1);dispose.mockRestore();
});
