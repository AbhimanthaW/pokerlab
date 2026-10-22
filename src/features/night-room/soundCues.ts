import type { SceneSnapshot, VisualEvent } from "../immersive-play/presentation";
import { seatAnchor } from "../immersive-play/presentation";
import type { Sound } from "../immersive-play/audio/AudioManager";
import { dealerCues, privateFlight } from "./choreography";
export interface SoundCue { id: string; at: number; sound: Sound; pan: number }
export function soundCues(snapshot: SceneSnapshot | null, events: readonly VisualEvent[], rate = 1, instant = false): SoundCue[] {
  const cues: SoundCue[] = [];
  const pan = (id?: string) => { const seat = snapshot?.seats.find((p) => p.id === id); return seat && snapshot ? Math.max(-.7,Math.min(.7,seatAnchor(seat.index,snapshot.seats.length-1)[0]/6)) : 0; };
  for (const e of events.slice(-64)) {
    const add = (suffix: string, sound: Sound, delay = 0, p = pan(e.playerId)) => cues.push({ id:`${e.id}:${suffix}`,sound,at:e.at+delay*1000/rate,pan:p });
    if (e.kind === "DEAL") { add("shuffle","shuffle",.14); if(snapshot) for(const seat of snapshot.seats) for(let i=0;i<seat.cards.length;i++) { const trip=privateFlight(snapshot,events,seat.index,i,rate); if(trip)add(`deal-${seat.index}-${i}`,"deal",trip.delay*rate,pan(seat.id)); } }
    else if(e.kind==="BOARD") { /* Coordinated below with the actual burn/reveal stages. */ }
    else if(e.kind==="ACTION") add("action",e.action==="CHECK"?"tap":e.action==="FOLD"?"slide":e.amount?"chips":"ui");
    else if(e.kind==="SHOWDOWN") add("showdown","reveal",events.some((q)=>q.kind==="BOARD"&&q.at===e.at)?1.6:0);
  }
  for(const c of dealerCues(snapshot,events,rate)) if(c.pose==="BURNING_CARD")cues.push({id:`${c.id}:sound`,at:c.at,sound:"slide",pan:0});else if(["DEALING_FLOP","DEALING_TURN","DEALING_RIVER"].includes(c.pose))cues.push({id:`${c.id}:sound`,at:c.at,sound:"reveal",pan:0});else if(c.pose==="AWARDING_POT") { cues.push({id:`${c.id}:sound`,at:c.at,sound:"award",pan:pan(c.target)}); if(c.target!=="you")cues.push({id:`${c.id}:reaction`,at:c.at+250/rate,sound:"reaction",pan:pan(c.target)}); } else if(c.pose==="SESSION_COMPLETE") cues.push({id:`${c.id}:sound`,at:c.at,sound:"complete",pan:0});
  const result = [...new Map(cues.map((c)=>[c.id,c])).values()].slice(-96);
  if(!instant)return result;
  const fast=result.filter((c)=>!["deal","shuffle","reaction"].includes(c.sound)).map((c)=>({...c,at:events.find((e)=>c.id.startsWith(`${e.id}:`))?.at ?? c.at}));
  return [...new Map(fast.map((c)=>[`${c.sound}:${c.at}`,c])).values()];
}
