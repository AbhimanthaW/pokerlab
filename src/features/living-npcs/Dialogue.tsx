import { useEffect, useState } from "react";
import { dialogueVariant, type DialogueContext } from "./behavior";
/** Remounted only for a new hand or a terminal hand status, never for every action. */
export default function Dialogue({ context, active }: { context: DialogueContext; active: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { if (!active) return; const timer = window.setTimeout(() => setVisible(false), 5500); return () => window.clearTimeout(timer); }, [active]);
  return visible ? <div className="npc-dialogue" role="status"><strong>{context.name}</strong><span>{dialogueVariant(context)}</span></div> : null;
}
