import { useEffect } from "react";
import { act,fireEvent,render,screen,waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach,beforeEach,expect,it,vi } from "vitest";
import App from "../../app/App";
import ImmersivePlay from "../immersive-play/ImmersivePlay";
import type { PokerSceneProps } from "../immersive-play/scene/PokerScene";
import { createSession,startHand } from "../../domain/play/engine";
import { DEFAULT_CONFIG } from "../../domain/play/types";
import { seededRandom } from "../../domain/cards";
import { loadPlayData,savePlayData } from "../../lib/playStorage";
import { DEFAULT_ROOM,loadRoom,ROOM_KEY } from "./preferences";
const observed=vi.hoisted(()=>({props:null as PokerSceneProps|null}));
vi.mock("../immersive-play/scene/PokerScene",()=>({default:function FakeScene(props:PokerSceneProps){useEffect(()=>{observed.props=props;},[props]);return <div data-testid="v5-scene" data-room={props.room?.room} data-hands={String(props.room?.hands)} data-inspect={String(props.inspect)} />;}}));
function fixture(){const s=createSession(DEFAULT_CONFIG,seededRandom(2));s.dealer=1;return startHand(s,seededRandom(3));}
beforeEach(()=>{localStorage.clear();window.location.hash="#play";vi.spyOn(window,"scrollTo").mockImplementation(()=>{});observed.props=null;});
afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
it("previews, cancels and applies cosmetics without changing the active hand, then restores them",async()=>{
 const s=fixture();savePlayData({session:s,pacing:"relaxed"});const user=userEvent.setup();const r=render(<App/>);
 await waitFor(()=>expect(screen.getByTestId("v5-scene")).toHaveAttribute("data-room","night"));
 await user.click(screen.getByRole("button",{name:"Pause and settings"}));await user.click(screen.getByText("Cardroom customization"));
 await user.selectOptions(screen.getByLabelText("Room preset"),"rainy");expect(screen.getByTestId("v5-scene")).toHaveAttribute("data-room","rainy");expect(localStorage.getItem(ROOM_KEY)).toBeNull();
 await user.click(screen.getByRole("button",{name:"Cancel preview"}));expect(screen.getByTestId("v5-scene")).toHaveAttribute("data-room","night");
 await user.selectOptions(screen.getByLabelText("Room preset"),"golden");await user.selectOptions(screen.getByLabelText("Card back"),"lattice");await user.selectOptions(screen.getByLabelText("Chip style"),"ivory");await user.click(screen.getByLabelText("Player hands"));
 await user.click(screen.getByRole("button",{name:"Apply cardroom"}));expect(loadRoom()).toMatchObject({room:"golden",cardBack:"lattice",chips:"ivory",hands:false});expect(loadPlayData().session).toEqual(s);
 await user.click(screen.getByRole("button",{name:"Resume"}));r.unmount();render(<App/>);await waitFor(()=>expect(screen.getByTestId("v5-scene")).toHaveAttribute("data-room","golden"));expect(loadPlayData().session).toEqual(s);
});
it("inspects only the existing human cards with keyboard/touch and converges after the timed inspection",async()=>{
 const s=fixture();savePlayData({session:s,pacing:"normal"});const r=render(<App/>);
 await waitFor(()=>expect(screen.getByTestId("v5-scene")).toBeInTheDocument());vi.useFakeTimers();
 fireEvent.keyDown(window,{key:"i"});expect(screen.getByRole("button",{name:"Inspect your cards"})).toHaveAttribute("aria-pressed","true");
 expect(observed.props?.snapshot?.seats.slice(1).flatMap((p)=>p.cards).every((c)=>c===null)).toBe(true);
 await act(async()=>{vi.advanceTimersByTime(3500);});expect(screen.getByRole("button",{name:"Inspect your cards"})).toHaveAttribute("aria-pressed","false");expect(loadPlayData().session).toEqual(s);
 fireEvent.click(screen.getByRole("button",{name:"Inspect your cards"}));expect(screen.getByRole("button",{name:"Inspect your cards"})).toHaveAttribute("aria-pressed","true");r.unmount();expect(vi.getTimerCount()).toBe(0);
});
it("preserves reduced motion and resets preview defaults independently of V3 audio preferences",async()=>{
 const s=fixture();savePlayData({session:s,pacing:"relaxed"});const user=userEvent.setup();render(<ImmersivePlay reducedMotion fourColor={false} onLearn={()=>{}}/>);
 await waitFor(()=>expect(observed.props?.motion).toBe(false));
 await user.click(screen.getByRole("button",{name:"Pause and settings"}));await user.click(screen.getByText("Cardroom customization"));
 await user.selectOptions(screen.getByLabelText("Room preset"),"rainy");await user.click(screen.getByRole("button",{name:"Restore room defaults"}));await user.click(screen.getByRole("button",{name:"Apply cardroom"}));
 expect(loadRoom()).toEqual(DEFAULT_ROOM);expect(screen.getByLabelText("music volume")).toHaveValue("0.4");expect(loadPlayData().session).toEqual(s);
});
