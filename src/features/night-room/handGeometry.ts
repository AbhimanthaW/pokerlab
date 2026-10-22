import { BoxGeometry, ExtrudeGeometry, Shape, type BufferGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
/** Original polygon palm, articulated-looking phalanges, thumb and connected wrist. */
export function createHandGeometry(): BufferGeometry {
  const outline = new Shape(); outline.moveTo(-.055, .195);
  for (const [x, z] of [[.055,.195],[.065,.12],[.085,-.025],[.065,-.085],[-.065,-.085],[-.085,-.01],[-.115,.025],[-.11,.08],[-.065,.12],[-.055,.195]]) outline.lineTo(x,z);
  const palm = new ExtrudeGeometry(outline, { depth: .045, bevelEnabled: true, bevelSize: .007, bevelThickness: .006, bevelSegments: 1, steps: 1, curveSegments: 1 });
  palm.rotateX(Math.PI / 2); palm.translate(0,.026,0);
  const pieces: BufferGeometry[] = [palm];
  const lengths = [.13,.15,.14,.105];
  for (let f = 0; f < 4; f++) {
    const length = lengths[f];
    for (let j = 0; j < 3; j++) {
      const part = new BoxGeometry(.029 - j * .002, .036 - j * .003, length / 3 + .004);
      part.rotateX(.06 + j * .07); part.translate((f - 1.5) * .038, .002 - j * .003, -.07 - length / 3 * (j + .5)); pieces.push(part);
    }
  }
  const thumbShape = new Shape(); thumbShape.moveTo(-.06,.07);
  for (const [x,z] of [[-.12,.07],[-.18,-.012],[-.165,-.05],[-.13,-.04],[-.09,.015],[-.06,.035],[-.06,.07]]) thumbShape.lineTo(x,z);
  const thumb = new ExtrudeGeometry(thumbShape,{depth:.04,bevelEnabled:true,bevelSize:.005,bevelThickness:.005,bevelSegments:1,steps:1,curveSegments:1});
  thumb.rotateX(Math.PI/2);thumb.translate(0,.023,0);pieces.push(thumb);
  const flat = pieces.map((p) => p.index ? p.toNonIndexed() : p);
  const result = mergeGeometries(flat)!; flat.forEach((p) => p.dispose()); pieces.filter((p) => p.index).forEach((p) => p.dispose()); result.computeBoundingBox(); return result;
}
