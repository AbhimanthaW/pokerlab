export type RoomPreset = "night" | "golden" | "rainy";
export type CameraMode = "standard" | "cinematic" | "instant";
export type CardBack = "classic" | "lattice" | "burgundy";
export interface RoomPreferences {
  room: RoomPreset; felt: "green" | "olive" | "wine" | "navy";
  rail: "walnut" | "ebony" | "oak"; cardBack: CardBack; chips: "classic" | "ivory" | "slate";
  hands: boolean; sleeve: "teal" | "charcoal" | "cream"; skin: "warm" | "light" | "deep";
  camera: CameraMode; characterAudio: number;
}
export const ROOM_KEY = "pokerlab.room.v5";
export const DEFAULT_ROOM: RoomPreferences = { room: "night", felt: "green", rail: "walnut", cardBack: "classic", chips: "classic", hands: true, sleeve: "teal", skin: "warm", camera: "standard", characterAudio: .2 };
export const ROOM_PALETTES = {
  night: { background: "#101a24", sky: "#d1d7d3", ground: "#3c2c26", key: "#ffe1b6", fill: 1.25, power: 2.2, wall: "#192b35", lamp: "#ffd39b" },
  golden: { background: "#36302c", sky: "#ffe3b6", ground: "#80624c", key: "#ffdda3", fill: 1.75, power: 2.35, wall: "#4b4941", lamp: "#ffe1b0" },
  rainy: { background: "#0b1626", sky: "#a7bbda", ground: "#283040", key: "#f9d8ac", fill: 1.05, power: 2.05, wall: "#182b44", lamp: "#ffc782" },
} as const;
export const FELTS = { green: "#28664f", olive: "#626747", wine: "#693b48", navy: "#294b62" };
export const RAILS = { walnut: "#63452f", ebony: "#292a2d", oak: "#92724a" };
export const SLEEVES = { teal: "#295d60", charcoal: "#303846", cream: "#c3b9a3" };
export const SKINS = { warm: "#b98968", light: "#dfba96", deep: "#795039" };
export function validateRoom(value: unknown): value is RoomPreferences {
  const p = value as RoomPreferences;
  return !!p && ["night", "golden", "rainy"].includes(p.room) && Object.hasOwn(FELTS, p.felt) && Object.hasOwn(RAILS, p.rail) && ["classic", "lattice", "burgundy"].includes(p.cardBack) && ["classic", "ivory", "slate"].includes(p.chips) && typeof p.hands === "boolean" && Object.hasOwn(SLEEVES, p.sleeve) && Object.hasOwn(SKINS, p.skin) && ["standard", "cinematic", "instant"].includes(p.camera) && typeof p.characterAudio === "number" && Number.isFinite(p.characterAudio) && p.characterAudio >= 0 && p.characterAudio <= 1;
}
function copy(p: RoomPreferences): RoomPreferences { return { room: p.room, felt: p.felt, rail: p.rail, cardBack: p.cardBack, chips: p.chips, hands: p.hands, sleeve: p.sleeve, skin: p.skin, camera: p.camera, characterAudio: p.characterAudio }; }
export function loadRoom(storage?: Storage): RoomPreferences {
  try { const raw = (storage ?? localStorage).getItem(ROOM_KEY); if (raw && raw.length < 3000) { const s = JSON.parse(raw); if (s.version === 1 && validateRoom(s.preferences)) return copy(s.preferences); } } catch { /* Optional cosmetics never invalidate a session. */ }
  return { ...DEFAULT_ROOM };
}
export function saveRoom(p: RoomPreferences, storage?: Storage): string | undefined {
  try { if (!validateRoom(p)) throw new Error("Invalid cosmetics"); (storage ?? localStorage).setItem(ROOM_KEY, JSON.stringify({ version: 1, preferences: copy(p) })); } catch { return "Cardroom preferences could not be saved. Your game is unchanged."; }
}
export function roomPreset(current: RoomPreferences, room: RoomPreset): RoomPreferences { return { ...current, room, felt: room === "night" ? "green" : room === "golden" ? "olive" : "navy" }; }
