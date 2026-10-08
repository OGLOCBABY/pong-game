import test from 'node:test';
import assert from 'node:assert/strict';
import { ArcadeAudio } from '../src/audio.js';

test('muted audio never creates or wakes an AudioContext', () => {
  const originalWindow = globalThis.window;
  let created = 0;
  let resumed = 0;
  class FakeContext {
    constructor() { created++; this.state = 'suspended'; }
    resume() { resumed++; this.state = 'running'; return Promise.resolve(); }
  }
  globalThis.window = { AudioContext: FakeContext };
  try {
    const audio = new ArcadeAudio(false);
    audio.unlock();
    audio.play('paddle');
    assert.equal(created, 0);
    audio.context = new FakeContext();
    audio.unlock();
    assert.equal(resumed, 0, 'mute must not wake an existing suspended context');
    audio.setEnabled(true);
    assert.equal(resumed, 1, 'explicit unmute may resume audio');
    audio.setEnabled(false);
    audio.unlock();
    assert.equal(resumed, 1);
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('synthesized paddle and score tones are generated without network assets', () => {
  const originalWindow = globalThis.window;
  let starts = 0;
  let stops = 0;
  let gains = 0;
  const param = () => ({
    setValueAtTime(n) { assert(Number.isFinite(n) && n >= 0); },
    exponentialRampToValueAtTime(n) { assert(Number.isFinite(n) && n > 0); },
  });
  class FakeContext {
    constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
    resume() { return Promise.resolve(); }
    createOscillator() {
      return {
        frequency: param(),
        connect() {},
        start() { starts++; },
        stop() { stops++; },
      };
    }
    createGain() {
      gains++;
      return { gain: param(), connect() {} };
    }
  }
  globalThis.window = { AudioContext: FakeContext };
  try {
    const audio = new ArcadeAudio();
    audio.unlock();
    audio.play('paddle');
    audio.play('score');
    assert.equal(starts, 4);
    assert.equal(stops, 4);
    assert.equal(gains, 4);
    audio.setEnabled(false);
    audio.play('win');
    assert.equal(starts, 4, 'mute must suppress note creation');
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
