import type { ImmersivePreferences } from "../preferences";
export type Sound = "deal" | "reveal" | "chips" | "shuffle" | "ui" | "complete";
/** One owner per mounted Play shell. Never starts before an explicit gesture. */
export class AudioManager {
  private context: AudioContext | null = null;
  private music: HTMLAudioElement | null = null;
  private ambient: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private preferences: ImmersivePreferences;
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
  setInactive(value: boolean) {
    this.inactive = value;
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
      low = low * .97 + (seed / 4294967296 - .5) * .03;
      data[i] = low;
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = 0;
    source.buffer = buffer; source.loop = true;
    source.connect(gain); gain.connect(context.destination); source.start();
    this.ambient = source; this.ambientGain = gain;
  }
  play(sound: Sound) {
    const c = this.context, p = this.preferences;
    if (!c || !this.enabled || p.muted || this.inactive || this.disposed || c.state !== "running") return;
    const duration = sound === "complete" ? .7 : sound === "shuffle" ? .3 : .09;
    const gain = c.createGain();
    const level = p.master * p.effects * (sound === "complete" ? .08 : .055);
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(level, c.currentTime + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, c.currentTime + duration);
    gain.connect(c.destination);
    if (["deal", "shuffle", "reveal"].includes(sound)) {
      const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i * 1.71) * Math.sin(i * .731);
      const noise = c.createBufferSource();
      const filter = c.createBiquadFilter(); filter.type = "highpass"; filter.frequency.value = 1900;
      noise.buffer = buffer; noise.connect(filter); filter.connect(gain);
      noise.start(); noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
    } else {
      const oscillator = c.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(sound === "chips" ? 1100 : sound === "complete" ? 523.25 : 440, c.currentTime);
      if (sound === "complete") oscillator.frequency.exponentialRampToValueAtTime(783.99, c.currentTime + .55);
      oscillator.connect(gain); oscillator.start(); oscillator.stop(c.currentTime + duration);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
  }
  dispose() {
    this.disposed = true; this.enabled = false;
    this.music?.pause();
    if (this.music) { this.music.removeAttribute("src"); this.music.load(); }
    this.music = null;
    this.ambient?.stop(); this.ambient?.disconnect(); this.ambientGain?.disconnect();
    this.ambient = null; this.ambientGain = null;
    void this.context?.close().catch(() => {}); this.context = null;
  }
}
