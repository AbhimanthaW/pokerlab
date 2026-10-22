import { expect, it } from "vitest";
import { createSession,startHand,applyAction,getLegalActions } from "../../domain/play/engine";
import { DEFAULT_CONFIG } from "../../domain/play/types";
import { seededRandom } from "../../domain/cards";
import { projectScene,type VisualEvent } from "../immersive-play/presentation";
import { activeDealerCue,boardFlight,cameraEmphasis,dealerCues,gazeYaw,playerPose,privateFlight } from "./choreography";
import { soundCues } from "./soundCues";
const live=()=>projectScene(startHand(createSession({...DEFAULT_CONFIG,opponents:5},seededRandom(3)),seededRandom(4)));
const deal:VisualEvent={id:"deal-1",kind:"DEAL",at:1000};
it("schedules one coherent private deal with no effects on restoration",()=>{
 const s=live(),c=dealerCues(s,[deal]);expect(c.map((x)=>x.pose)).toEqual(["PREPARING_DECK","SHUFFLING","DEALING_PRIVATE"]);
 expect(activeDealerCue(c,1200,true).pose).toBe("SHUFFLING");expect(activeDealerCue(c,1600,true).pose).toBe("DEALING_PRIVATE");
 expect(activeDealerCue(c,1600,false).pose).toBe("IDLE");expect(dealerCues(s,[])).toEqual([]);
 expect(privateFlight(s,[],1,0)).toBeUndefined();
 const trips=s.seats.flatMap((p)=>[0,1].map((i)=>privateFlight(s,[deal],p.index,i)!));
 expect(trips.every((t)=>t.from.join() === ".65,.18,-1.65" || t.from.join() === "0.65,0.18,-1.65")).toBe(true);
 expect(trips.every((t)=>t.duration===.25)).toBe(true);
});
it("shows only needed burn/reveal stages during a partial-board forced runout",()=>{
 const s={...live(),board:[...live().seats[0].cards.filter((c)=>c!==null)]};
 // Only lengths are read by presentation scheduling; identities are never selected here.
 s.board=Array(5).fill(s.board[0]);
 const event:VisualEvent={id:"runout",kind:"BOARD",at:1000,fromBoard:3,boardCount:5};
 const cues=dealerCues(s,[event]);expect(cues.map((c)=>c.pose)).toEqual(["BURNING_CARD","DEALING_TURN","BURNING_CARD","DEALING_RIVER"]);
 expect(boardFlight(s,[event],3)?.delay).toBe(.2);expect(boardFlight(s,[event],4)?.delay).toBeCloseTo(.72);
});
it("coalesces simultaneous awards and caps scheduling under rapid events",()=>{
 const events=Array.from({length:150},(_,i):VisualEvent=>({id:`award-${i}`,kind:"AWARD",at:1000,playerId:i%2?"you":"npc-1"}));
 const c=dealerCues(live(),events);expect(c.filter((x)=>x.pose==="AWARDING_POT")).toHaveLength(1);expect(c.length).toBeLessThanOrEqual(48);
 expect(activeDealerCue(c,100000,true).pose).toBe("IDLE");
});
it.each(["CHECK","CALL","BET","RAISE","FOLD","ALL_IN"])("maps authoritative human %s to a bounded one-shot gesture",(action)=>{
 const e:VisualEvent={id:action,kind:"ACTION",action,playerId:"you",at:1000};
 expect(playerPose([e],1425,false,true)).toEqual({pose:action,amount:1});expect(playerPose([e],1900,false,true).pose).toBe("IDLE");
 expect(playerPose([e],1425,false,false).amount).toBe(0);
});
it("inspects only the local hand and ignores other players' action gestures",()=>{
 expect(playerPose([{id:"npc",kind:"ACTION",action:"RAISE",playerId:"npc-1",at:1000}],1400,false,true).pose).toBe("IDLE");
 expect(playerPose([],0,true,false).pose).toBe("CHECK_CARDS");
});
it("keeps gaze and cinematics bounded and gives human decisions priority",()=>{
 const s=live(), e:VisualEvent={id:"raise",kind:"ACTION",action:"RAISE",playerId:"npc-1",at:1000};
 for(let i=1;i<6;i++)expect(Math.abs(gazeYaw(s,i,false))).toBeLessThanOrEqual(.38);
 const standard=cameraEmphasis({...s,actor:"npc-1"},[e],1900,"standard",true),cinematic=cameraEmphasis({...s,actor:"npc-1"},[e],1900,"cinematic",true);
 expect(cinematic.zoom).toBeGreaterThanOrEqual(.965);expect(cinematic.zoom).toBeLessThan(standard.zoom);
 for(const [mode,motion] of [["instant",true],["cinematic",false]] as const)expect(cameraEmphasis(s,[e],1900,mode,motion)).toEqual({x:0,y:0,zoom:1});
 expect(cameraEmphasis({...s,actor:"you"},[e],1900,"cinematic",true)).toEqual({x:0,y:0,zoom:1});
});
it("never changes engine state, policy, deck or cards while deriving presentation and sounds",()=>{
 let game=startHand(createSession(DEFAULT_CONFIG,seededRandom(2)),seededRandom(3)); const before=structuredClone(game),s=projectScene(game);
 for(let t=1000;t<6000;t+=50){activeDealerCue(dealerCues(s,[deal]),t,true);cameraEmphasis(s,[deal],t,"cinematic",true);soundCues(s,[deal]);}
 expect(game).toEqual(before);
 while(game.status==="hand_in_progress")game=applyAction(game,{playerId:game.actor!,type:getLegalActions(game,game.actor!).check?"CHECK":"CALL"});
 expect(game.players.reduce((n,p)=>n+p.stack,0)).toBe(game.supply);
});
it("compresses instant audio cues without a burst of delayed duplicate card sounds",()=>{
 const s=live(),e:VisualEvent={id:"board-fast",kind:"BOARD",at:1000,fromBoard:0,boardCount:5};
 const cues=soundCues(s,[deal,e],1,true);expect(cues.every((c)=>c.at===1000)).toBe(true);expect(cues.some((c)=>c.sound==="shuffle"||c.sound==="deal")).toBe(false);expect(new Set(cues.map((c)=>`${c.sound}:${c.at}`)).size).toBe(cues.length);
});
it("scales replay choreography and card flights consistently with selected speed",()=>{
 const s=live(),normal=dealerCues(s,[deal],1),fast=dealerCues(s,[deal],2);
 expect(fast[1].at-1000).toBe((normal[1].at-1000)/2);expect(fast[1].duration).toBe(normal[1].duration/2);
 expect(privateFlight(s,[deal],1,1,2)?.duration).toBe(privateFlight(s,[deal],1,1,1)!.duration/2);
});
