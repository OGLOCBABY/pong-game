import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PongGame, WIDTH, HEIGHT, WIN_SCORE, MAX_SCORE,
  DIFFICULTIES, reflectY, clamp,
} from '../src/engine.js';

const DELTA = 1 / 120;

function toPlaying(game) {
  assert.equal(game.start(), true);
  let events = [];
  for (let i = 0; i < 120; i++) events = events.concat(game.step(DELTA));
  assert.equal(game.phase, 'playing');
  assert(events.some((item) => item.type === 'serve'));
  return events;
}

function scoreLeft(game) {
  game.phase = 'playing';
  game.ball.x = WIDTH - 5;
  game.ball.y = HEIGHT / 2;
  game.ball.vx = 850;
  game.ball.vy = 0;
  return game.step(0.05);
}

test('initial state and invalid options stay within contract', () => {
  const game = new PongGame({ mode: 'invalid', difficulty: 'invalid', seed: 0 });
  assert.equal(game.phase, 'idle');
  assert.equal(game.mode, 'cpu');
  assert.equal(game.difficulty, 'pro');
  assert.deepEqual(game.score, { left: 0, right: 0 });
  assert.equal(game.ball.x, WIDTH / 2);
  assert.equal(game.ball.y, HEIGHT / 2);
  assert.equal(game.step(DELTA).length, 0);
  assert.equal(game.step(NaN).length, 0);
  assert.equal(game.step(-1).length, 0);
  assert.equal(game.togglePause(), false);
  assert.equal(game.setMode('bad'), false);
  assert.equal(game.setDifficulty('bad'), false);
});

test('serve launches after countdown, stays within arena and is seeded deterministically', () => {
  const first = new PongGame({ seed: 12345 });
  const second = new PongGame({ seed: 12345 });
  toPlaying(first);
  toPlaying(second);
  assert.deepEqual(first.ball, second.ball);
  assert.equal(Math.hypot(first.ball.vx, first.ball.vy) > 300, true);
  assert(Math.abs(first.ball.vx) > 340);
  assert(first.ball.y >= HEIGHT / 2 - 52 && first.ball.y <= HEIGHT / 2 + 52);
});

test('arbitrary y can be reflected across any number of walls', () => {
  assert.equal(reflectY(9), 9);
  assert.equal(reflectY(HEIGHT - 9), HEIGHT - 9);
  assert.equal(reflectY(-91), 109);
  assert.equal(reflectY(HEIGHT + 91), HEIGHT - 109);
  assert.equal(reflectY(9 + 1044 * 3), 9);
  assert.equal(clamp(1.5, -1, 1), 1);
});

test('human keyboard axis and pointer target are rate-limited and clamped', () => {
  const game = new PongGame();
  game.start();
  game.setInput({ leftAxis: 99 });
  game.step(0.05);
  const movement = game.paddles.left.y - 220;
  assert(movement > 0 && movement <= 710 * .05 + 1e-6);
  game.setInput({ leftTarget: 9999 });
  for (let i = 0; i < 60; i++) game.step(DELTA);
  assert.equal(game.paddles.left.y, HEIGHT - game.paddles.left.h);
  game.setInput({ leftTarget: null, leftAxis: -99 });
  for (let i = 0; i < 120; i++) game.step(DELTA);
  assert.equal(game.paddles.left.y, 0);
});

test('thin top and bottom rails reflect ball rather than lose it', () => {
  const game = new PongGame();
  game.phase = 'playing';
  game.ball.x = 400;
  game.ball.y = 11;
  game.ball.vx = 100;
  game.ball.vy = -500;
  const events = game.step(0.04);
  assert(events.some((item) => item.type === 'wall' && item.side === 'top'));
  assert(game.ball.vy > 0);
  game.ball.y = HEIGHT - 11;
  game.ball.vy = 500;
  const bottom = game.step(0.04);
  assert(bottom.some((item) => item.type === 'wall' && item.side === 'bottom'));
  assert(game.ball.vy < 0);
});

test('paddle face sweep recognizes a strike and changes horizontal direction', () => {
  const game = new PongGame({ mode: 'local' });
  game.phase = 'playing';
  game.ball.x = 102;
  game.ball.y = 270;
  game.ball.vx = -800;
  game.ball.vy = 0;
  const events = game.step(0.05);
  assert(events.some((item) => item.type === 'paddle' && item.side === 'left'));
  assert(game.ball.vx > 0);
  assert.equal(game.rally, 1);
  assert.equal(game.bestRally, 1);
});

test('extremely fast ball cannot tunnel through a paddle', () => {
  const game = new PongGame({ mode: 'local' });
  game.phase = 'playing';
  game.ball.x = 450;
  game.ball.y = game.paddles.left.y + game.paddles.left.h / 2;
  game.ball.vx = -32000;
  game.ball.vy = 0;
  const events = game.step(0.05);
  assert(events.some((item) => item.type === 'paddle' && item.side === 'left'));
  assert(game.ball.vx > 0);
  assert(Math.hypot(game.ball.vx, game.ball.vy) <= 930 + 1e-6);
});

test('missing the left paddle awards a point to the right side', () => {
  const game = new PongGame({ mode: 'local' });
  game.phase = 'playing';
  game.paddles.left.y = 220;
  game.ball.x = 82;
  game.ball.y = 50;
  game.ball.vx = -900;
  game.ball.vy = 0;
  const events = [...game.step(0.1), ...game.step(0.1)];
  assert(events.some((item) => item.type === 'score' && item.side === 'right'));
  assert.deepEqual(game.score, { left: 0, right: 1 });
  assert.equal(game.phase, 'ready');
  assert.equal(game.ball.vx, 0);
});

test('score always goes to the opposite player; game ends at 7 by 2', () => {
  const game = new PongGame({ mode: 'local' });
  game.score.left = 6;
  game.score.right = 5;
  const beforeWin = scoreLeft(game);
  assert(beforeWin.some((item) => item.type === 'score'));
  assert.equal(game.score.left, 7);
  assert.equal(game.phase, 'ready');
  assert.equal(game.winner, null);
  assert.equal(game.serveDirection, 1);
  game.score.left = 7;
  game.score.right = 6;
  const win = scoreLeft(game);
  assert(win.some((item) => item.type === 'win' && item.side === 'left'));
  assert.equal(game.phase, 'gameover');
  assert.equal(game.winner, 'left');
  assert.equal(game.score.left, 8);
});

test('deuce cannot drag past hard cap of 11 points', () => {
  const game = new PongGame({ mode: 'local' });
  game.score.left = 10;
  game.score.right = 10;
  const events = scoreLeft(game);
  assert(events.some((event) => event.type === 'win'));
  assert.equal(game.score.left, MAX_SCORE);
  assert.equal(game.phase, 'gameover');
  assert.equal(game.start(), true);
  assert.deepEqual(game.score, { left: 0, right: 0 });
  assert.equal(game.phase, 'ready');
});

test('pause freezes score and coordinates and resume preserves state', () => {
  const game = new PongGame();
  toPlaying(game);
  assert.equal(game.togglePause(), true);
  const before = { ...game.ball };
  const score = { ...game.score };
  assert.deepEqual(game.step(0.1), []);
  assert.deepEqual(game.ball, before);
  assert.deepEqual(game.score, score);
  assert.equal(game.start(), true);
  assert.equal(game.phase, 'playing');
  game.step(DELTA);
  assert.notEqual(game.ball.x, before.x);
});

test('AI movement is bounded by difficulty; each level offers nonzero reaction lag', () => {
  for (const [difficulty, setting] of Object.entries(DIFFICULTIES)) {
    const game = new PongGame({ difficulty });
    game.phase = 'playing';
    game.ball.x = 240;
    game.ball.y = 490;
    game.ball.vx = 395;
    game.ball.vy = 80;
    const before = game.paddles.right.y;
    game.step(0.05);
    const distance = Math.abs(game.paddles.right.y - before);
    assert(distance <= setting.speed * 0.05 + 1e-6, difficulty);
    assert(setting.reaction > 0, difficulty);
    assert(setting.error > 0, difficulty);
    assert(setting.speed < 710, difficulty);
  }
});

test('two-player controls route arrow keys to the right paddle', () => {
  const game = new PongGame({ mode: 'local' });
  game.start();
  game.setInput({ rightAxis: 1, leftAxis: -1 });
  game.step(0.06);
  assert(game.paddles.left.y < 220);
  assert(game.paddles.right.y > 220);
  game.setMode('cpu');
  assert.equal(game.phase, 'idle');
  assert.equal(game.mode, 'cpu');
});

test('two seeded matches under the same input sequence stay identical', () => {
  const a = new PongGame({ seed: 88, difficulty: 'legend' });
  const b = new PongGame({ seed: 88, difficulty: 'legend' });
  a.start();
  b.start();
  for (let i = 0; i < 4000; i++) {
    const target = HEIGHT / 2 + Math.sin(i / 30) * 125;
    a.setInput({ leftTarget: target });
    b.setInput({ leftTarget: target });
    a.step(DELTA);
    b.step(DELTA);
    assert.deepEqual(a.ball, b.ball);
    assert.deepEqual(a.score, b.score);
    if (a.phase === 'gameover') break;
  }
});

test('autonomous rally player completes real engine rallies without freezing', () => {
  const game = new PongGame({ seed: 128, difficulty: 'rookie' });
  game.start();
  const tally = { paddle: 0, wall: 0, score: 0, serve: 0 };
  let steps = 0;
  for (; steps < 36000; steps++) {
    const ball = game.ball;
    const impact = ball.vx < 0
      ? reflectY(ball.y + ball.vy * Math.max(0, (ball.x - 76) / -ball.vx))
      : HEIGHT / 2;
    game.setInput({ leftTarget: impact });
    for (const event of game.step(DELTA)) {
      if (Object.hasOwn(tally, event.type)) tally[event.type]++;
    }
    if (game.phase === 'gameover') break;
  }
  assert(tally.serve >= 2, JSON.stringify(tally));
  assert(tally.score >= 1, JSON.stringify(tally));
  assert(tally.paddle >= 2, JSON.stringify(tally));
  assert(game.bestRally >= 1);
  console.log('AUTOPLAY', JSON.stringify({ steps, tally, score: game.score, bestRally: game.bestRally, phase: game.phase }));
});

test('the target score is a published stable rule', () => {
  assert.equal(WIN_SCORE, 7);
  assert.equal(MAX_SCORE, 11);
});
