import { expect,test } from "@playwright/test";
import { createSession,startHand } from "../src/domain/play/engine";
import { DEFAULT_CONFIG } from "../src/domain/play/types";
import { seededRandom } from "../src/domain/cards";
for(const [width,height] of [[1920,1080],[1440,900],[1280,800],[768,1024],[390,844],[320,640]])test(`V5 customization, inspection and intact session ${width}x${height}`,async({page},info)=>{
 await page.setViewportSize({width,height});let session=createSession(DEFAULT_CONFIG,seededRandom(2));session.dealer=1;session=startHand(session,seededRandom(3));
 await page.addInitScript(({session})=>{if(!sessionStorage.getItem("v5-seeded")){localStorage.setItem("pokerlab.play.v2",JSON.stringify({version:2,session,pacing:"relaxed"}));sessionStorage.setItem("v5-seeded","1");}},{session});
 await page.goto("/#play");await expect(page.locator("canvas")).toBeVisible();
 await page.getByRole("button",{name:"Inspect your cards",exact:true}).click();await expect(page.getByRole("button",{name:"Inspect your cards",exact:true})).toHaveAttribute("aria-pressed","true");
 await page.getByRole("button",{name:"Pause and settings",exact:true}).click();await page.getByText("Cardroom customization",{exact:true}).click();
 for(const room of ["night","golden","rainy"]){await page.getByLabel("Room preset",{exact:true}).selectOption(room);await page.getByRole("button",{name:"Apply cardroom",exact:true}).click();await page.getByRole("button",{name:"Resume",exact:true}).click();await page.screenshot({path:info.outputPath(`v5-${room}-${width}.png`),animations:"disabled"});await page.getByRole("button",{name:"Pause and settings",exact:true}).click();await page.getByText("Cardroom customization",{exact:true}).click();}
 await page.getByLabel("Camera mode",{exact:true}).selectOption("instant");await page.getByLabel("Player hands",{exact:true}).uncheck();await page.getByRole("button",{name:"Apply cardroom",exact:true}).click();await page.getByRole("button",{name:"Resume",exact:true}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem("pokerlab.play.v2")!).session)).toEqual(session);
 await page.reload();await page.getByRole("button",{name:"Pause and settings",exact:true}).click();await page.getByText("Cardroom customization",{exact:true}).click();await expect(page.getByLabel("Player hands",{exact:true})).not.toBeChecked();await expect(page.getByLabel("Camera mode",{exact:true})).toHaveValue("instant");
});
