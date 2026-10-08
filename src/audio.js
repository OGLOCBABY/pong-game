/** Tiny, original Web Audio arcade synth. No samples, downloads or tracking. */
export class ArcadeAudio {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.context = null;
  }

  unlock() {
    if (!this.enabled) return;
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      this.context = new AudioContextClass();
      this.context.resume().catch(() => {});
    } catch {
      this.context = null;
    }
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    if (this.enabled) this.unlock();
  }

  tone(frequency, duration, type = 'sine', volume = 0.08, endFrequency = frequency) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const ctx = this.context;
    const now = ctx.currentTime;
    try {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(30, frequency), now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), now + 0.007);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.01);
    } catch {
      // Some browsers prohibit sound. Gameplay must never depend on it.
    }
  }

  play(name) {
    if (!this.enabled) return;
    if (name === 'paddle') {
      this.tone(510, 0.075, 'square', 0.025, 330);
      this.tone(900, 0.055, 'sine', 0.025, 740);
    } else if (name === 'wall') {
      this.tone(260, 0.065, 'triangle', 0.045, 180);
    } else if (name === 'score') {
      this.tone(280, 0.15, 'sawtooth', 0.026, 120);
      this.tone(540, 0.20, 'sine', 0.036, 230);
    } else if (name === 'serve') {
      this.tone(460, 0.09, 'triangle', 0.047, 680);
    } else if (name === 'win') {
      this.tone(392, 0.20, 'triangle', 0.042, 784);
      this.tone(587, 0.28, 'sine', 0.042, 1174);
    } else if (name === 'click') {
      this.tone(580, 0.05, 'triangle', 0.028, 450);
    }
  }
}
