// Software projection of the actual V5 geometry; not a browser/WebGL acceptance capture.
import { mkdir,writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { Scene,Color,OrthographicCamera,Mesh,MeshLambertMaterial,BoxGeometry,Group,AmbientLight,DirectionalLight } from "three";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { createHandGeometry } from "../src/features/night-room/handGeometry.ts";
const dom=new JSDOM();globalThis.document=dom.window.document;
const scene=new Scene();scene.background=new Color("#14242d");scene.add(new AmbientLight("#ffe6c4",1.4));const light=new DirectionalLight("#ffffff",2.1);light.position.set(-2,4,2);scene.add(light);
const hand=createHandGeometry(),skin=new MeshLambertMaterial({color:"#b98968",flatShading:true}),fabric=new MeshLambertMaterial({color:"#295d60"});
for(const side of [-1,1]){const g=new Group();g.position.set(side*.27,0,0);g.scale.x=side;g.add(new Mesh(hand,skin));const sleeve=new Mesh(new BoxGeometry(.145,.12,.52),fabric);sleeve.position.set(0,-.015,.43);g.add(sleeve);scene.add(g);}
const camera=new OrthographicCamera(-.75,.75,.48,-.48,.01,10);camera.position.set(.12,1.4,.95);camera.lookAt(0,0,.13);
const renderer=new SVGRenderer();renderer.setSize(1000,640);renderer.setQuality("high");renderer.render(scene,camera);
await mkdir("/tmp/pokerlab-v5-visual",{recursive:true});await writeFile("/tmp/pokerlab-v5-visual/hands.svg",renderer.domElement.outerHTML);
