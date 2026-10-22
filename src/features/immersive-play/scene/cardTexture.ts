import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Card } from "../../../domain/types";

function makeTexture(card: Card | null, fourColor: boolean) {
  const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 384;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Card texture canvas unavailable");
  c.fillStyle = card ? "#fff8e5" : "#173640"; c.fillRect(0, 0, 256, 384);
  c.strokeStyle = "#c6ad76"; c.lineWidth = 4; c.strokeRect(12, 12, 232, 360);
  if (card) {
    const red = card.suit === "hearts" || card.suit === "diamonds";
    c.fillStyle = fourColor && card.suit === "clubs" ? "#18734a" :
      fourColor && card.suit === "diamonds" ? "#205eb3" : red ? "#ad2b31" : "#172331";
    const rank = ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Record<number, string>)[card.rank] ?? String(card.rank);
    const suit = { spades: "♠", clubs: "♣", hearts: "♥", diamonds: "♦" }[card.suit];
    c.font = "bold 69px Georgia"; c.fillText(rank, 24, 82);
    c.font = "60px Georgia"; c.fillText(suit, 26, 142);
    c.textAlign = "center"; c.font = "120px Georgia"; c.fillText(suit, 132, 263);
    c.save(); c.translate(256, 384); c.rotate(Math.PI); c.textAlign = "left";
    c.font = "bold 46px Georgia"; c.fillText(rank, 22, 57); c.restore();
  } else {
    c.strokeStyle = "#c6ad7670"; c.lineWidth = 2;
    for (let i = -384; i < 640; i += 24) {
      c.beginPath(); c.moveTo(i, 20); c.lineTo(i + 340, 364); c.stroke();
      c.beginPath(); c.moveTo(i, 364); c.lineTo(i + 340, 20); c.stroke();
    }
    c.fillStyle = "#173640"; c.beginPath(); c.ellipse(128, 192, 55, 71, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#e0c790"; c.font = "78px Georgia"; c.textAlign = "center"; c.fillText("♠", 128, 219);
  }
  const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 4;
  return texture;
}

/** Serialized card values stay stable when the engine clones its immutable state. */
export function useCardTexture(card: Card | null, folded: boolean, fourColor: boolean) {
  const id = folded ? null : card?.id ?? null;
  const rank = folded ? null : card?.rank ?? null;
  const suit = folded ? null : card?.suit ?? null;
  const texture = useMemo(() => makeTexture(id !== null && rank !== null && suit !== null ? { id, rank, suit } : null, fourColor), [id, rank, suit, fourColor]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
