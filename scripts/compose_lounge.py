"""Original deterministic 144-second instrumental for PokerLab. Python stdlib only.
No samples or pre-existing melody. Re-run from repository root to regenerate WAV.
"""
import array
import math
import random
import wave
from pathlib import Path

RATE = 22050
BEAT = 0.75
DURATION = 146
rng = random.Random(73109)
mix = array.array('f', [0.0]) * (RATE * DURATION)

def note(start, midi, length, gain, instrument='piano'):
    frequency = 440 * 2 ** ((midi - 69) / 12)
    first = int(start * RATE)
    for j in range(min(int(length * RATE), len(mix) - first)):
        t = j / RATE
        if instrument == 'bass':
            envelope = min(1, t / .012) * math.exp(-t * 4)
            value = math.sin(2 * math.pi * frequency * t) + .25 * math.sin(4 * math.pi * frequency * t)
        else:
            envelope = min(1, t / .006) * math.exp(-t * 2.7)
            value = sum(math.sin(2 * math.pi * frequency * k * t) * a for k, a in [(1, 1), (2, .25), (3, .1)])
        mix[first + j] += value * envelope * gain

# Dm9, G13, Cmaj9, Am9, Fmaj9, Bm7b5, E7, Am9; original voicings.
chords = [(50, [60, 64, 65, 69]), (43, [59, 64, 65, 69]),
          (48, [59, 62, 64, 67]), (45, [55, 59, 60, 64]),
          (41, [57, 60, 64, 67]), (47, [57, 62, 65, 69]),
          (40, [56, 62, 64, 67]), (45, [55, 59, 60, 64])]
melody = [0, 2, 1, 3, 2, 1, 0, 2, 3, 1, 2, 0]
for bar in range(48):
    root, voicing = chords[bar % 8]
    time = bar * 4 * BEAT
    for beat in range(4):
        note(time + beat * BEAT, root - 12 + [0, 7, 12, 7][beat], .72, .13, 'bass')
    for hit in [0, 1.65, 3.1]:
        for k, pitch in enumerate(voicing):
            note(time + hit * BEAT + k * .012, pitch, 1.2, .042)
    for k in range(4):
        if (bar + k) % 5 == 0:
            continue
        pitch = voicing[melody[(bar + k) % len(melody)]] + 12
        note(time + (k + (.12 if k % 2 else 0)) * BEAT, pitch, .7 + rng.random() * .3, .043)
    for beat in range(8):
        start = int((time + beat * BEAT / 2) * RATE)
        for j in range(int(.065 * RATE)):
            mix[start + j] += rng.uniform(-1, 1) * .012 * math.exp(-j / (RATE * .016))

peak = max(abs(x) for x in mix) or 1
pcm = array.array('h')
for i, value in enumerate(mix):
    fade = min(1, i / (RATE * 2), (len(mix) - i) / (RATE * 3))
    pcm.append(round(value / peak * .72 * fade * 32767))
destination = Path('public/audio/midnight-study.wav')
destination.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(destination), 'wb') as output:
    output.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
    output.writeframes(pcm.tobytes())
print(f'{destination}: {DURATION}s, original synthesized instrumental, peak -2.85 dBFS')
