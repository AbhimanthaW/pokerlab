import type { ImmersivePreferences } from "../preferences";
import type { RoomPreset } from "../../night-room/preferences";
import type { SoundCue } from "../../night-room/soundCues";
export type Sound = "deal" | "reveal" | "chips" | "shuffle" | "ui" | "complete" | "slide" | "tap" | "award" | "reaction";
/** One owner per mounted Play shell. Never starts before an explicit gesture. */
export class AudioManager {
  private context: AudioContext | null = null;
  private music: HTMLAudioElement | null = null;
  private ambient: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private preferences: ImmersivePreferences;
  private room: RoomPreset = "night";
  private characterVolume = .2;
  private scope = "";
  private seen = new Set<string>();
  private pending = new Set<ReturnType<typeof setTimeout>>();
  private voices = new Set<{ stop: () => void }>();
  private variation = 0;
  private enabled = false;
  private inactive = false;
  private disposed = false;
  constructor(preferences: ImmersivePreferences, private report: (message: string) => void) {
    this.preferences = preferences;
  }
  async enable() {
    if (this.disposed) return false;
    try {
      this.context ??= new AudioContext();
      await this.context.resume();
      if (this.disposed) return false;
      this.enabled = true;
      if (!this.music) {
        this.music = new Audio(`${import.meta.env.BASE_URL}audio/midnight-study.wav`);
        this.music.loop = true;
        this.music.preload = "none";
        this.music.addEventListener("error", () => {
          if (!this.disposed) this.report("The music file could not be played. Effects remain available.");
        });
      }
      this.createAmbient();
      this.update(this.preferences);
      return true;
    } catch {
      this.report("Audio could not start. Use Enable audio to try again.");
      return false;
    }
  }
  update(preferences: ImmersivePreferences) {
    this.preferences = preferences;
    if(preferences.muted) { this.cancelPending(); for(const voice of this.voices)voice.stop(); }
    const silent = preferences.muted || !this.enabled || this.inactive || this.disposed;
    if (this.music) {
      this.music.volume = preferences.master * preferences.music * .55;
      if (silent) this.music.pause();
      else this.music.play().catch(() => {
        if (!this.disposed) this.report("Music playback was blocked. Enable audio to retry.");
      });
    }
    if (this.ambientGain && this.context)
      this.ambientGain.gain.setTargetAtTime(silent ? 0 : preferences.master * preferences.ambient * .055, this.context.currentTime, .15);
  }
  updateRoom(room: RoomPreset, characterVolume: number) {
    const changed = room !== this.room; this.room = room; this.characterVolume = Math.max(0,Math.min(1,characterVolume));
    if (changed && this.ambient) { this.ambient.stop(); this.ambient.disconnect(); this.ambientGain?.disconnect(); this.ambient=null; this.ambientGain=null; if(this.enabled && !this.disposed)this.createAmbient(); }
    this.update(this.preferences);
  }
  schedule(cues: readonly SoundCue[], scope: string) {
    if(this.scope!==scope) { this.cancelPending(); this.scope=scope; }
    for(const cue of cues) {
      if(this.seen.has(cue.id))continue; this.seen.add(cue.id);
      const delay=cue.at-performance.now();
      if(this.disposed || this.inactive || !this.enabled || this.preferences.muted || delay < -300 || delay > 5000)continue;
      const timer=setTimeout(()=>{this.pending.delete(timer);this.play(cue.sound,cue.pan);},Math.max(0,delay));this.pending.add(timer);
    }
    if(this.seen.size>512)this.seen=new Set(cues.map((c)=>c.id));
  }
  cancelEffects() { this.cancelPending(); for(const voice of this.voices)voice.stop(); }
  private cancelPending() { for(const timer of this.pending)clearTimeout(timer);this.pending.clear(); }
  setInactive(value: boolean) {
    this.inactive = value;
    if(value) { this.cancelPending(); for(const voice of this.voices)voice.stop(); }
    this.update(this.preferences);
    if (this.context) {
      const action = value ? this.context.suspend() : this.enabled ? this.context.resume() : Promise.resolve();
      action.catch(() => { /* Audio can be enabled again from the menu. */ });
    }
  }
  private createAmbient() {
    const context = this.context;
    if (!context || this.ambient) return;
    const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 19, low = 0;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const smoothing = this.room === "rainy" ? .72 : this.room === "golden" ? .985 : .97;
      low = low * smoothing + (seed / 4294967296 - .5) * (1 - smoothing);
      data[i] = low;
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = 0;
    source.buffer = buffer; source.loop = true;
    source.connect(gain); gain.connect(context.destination); source.start();
    this.ambient = source; this.ambientGain = gain;
  }
  play(sound: Sound, pan = 0) {
    const c = this.context, p = this.preferences;
    if (!c || !this.enabled || p.muted || this.inactive || this.disposed || c.state !== "running") return;
    const duration = sound === "complete" ? .7 : sound === "shuffle" ? .3 : sound === "award" ? .24 : sound === "reaction" ? .16 : .09;
    const gain = c.createGain();
    const level = p.master * (sound === "reaction" ? this.characterVolume : p.effects) * (sound === "complete" ? .08 : sound === "reaction" ? .018 : .055);
    if(!level) { gain.disconnect(); return; }
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(level, c.currentTime + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, c.currentTime + duration);
    const panner = typeof c.createStereoPanner === "function" ? c.createStereoPanner() : null;
    if(panner) { panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner);panner.connect(c.destination); } else gain.connect(c.destination);
    const clean = () => { gain.disconnect();panner?.disconnect(); };
    const track = (source: AudioScheduledSourceNode, cleanup: () => void) => {
      let stopped=false;
      const voice={stop:()=>{if(stopped)return;stopped=true;try{source.stop();}catch{/* Already ended. */}source.disconnect();cleanup();clean();this.voices.delete(voice);}};
      source.onended=voice.stop;this.voices.add(voice);if(this.voices.size>16)this.voices.values().next().value?.stop();
    };
    if (["deal", "shuffle", "reveal", "slide"].includes(sound)) {
      const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i * (1.71 + (this.variation % 5) * .017)) * Math.sin(i * .731);
      const noise = c.createBufferSource();
      const filter = c.createBiquadFilter(); filter.type = "highpass"; filter.frequency.value = sound === "slide" ? 1000 : 1900;
      noise.buffer = buffer; noise.connect(filter); filter.connect(gain);
      track(noise,()=>filter.disconnect()); noise.start(); this.variation++;
    } else {
      const oscillator = c.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(sound === "chips" || sound === "award" ? 1100 + this.variation++ % 4 * 45 : sound === "tap" ? 170 : sound === "reaction" ? 230 : sound === "complete" ? 523.25 : 440, c.currentTime);
      if (sound === "complete") oscillator.frequency.exponentialRampToValueAtTime(783.99, c.currentTime + .55);
      oscillator.connect(gain); track(oscillator,()=>{}); oscillator.start(); oscillator.stop(c.currentTime + duration);

    }
  }
  dispose() {
    this.disposed = true; this.enabled = false; this.cancelPending();
    for(const voice of this.voices)voice.stop();this.seen.clear();
    this.music?.pause();
    if (this.music) { this.music.removeAttribute("src"); this.music.load(); }
    this.music = null;
    this.ambient?.stop(); this.ambient?.disconnect(); this.ambientGain?.disconnect();
    this.ambient = null; this.ambientGain = null;
    void this.context?.close().catch(() => {}); this.context = null;
  }
}
