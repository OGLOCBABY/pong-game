import test from 'node:test';
import assert from 'node:assert/strict';
import { PongGame, reflectY } from '../src/engine.js';

// A deterministic, strong human stand-in predicts rebounds and aims slightly
// off-center to create difficult angles. Test the CPU's natural mistakes.
// Deliberately no direct score manipulation or test-only game state hooks.
function expertSession(difficulty, steps = 40000) {
  const game = new PongGame({ difficulty, seed: 128 });
  game.start();
  let frames = 0;
  for (; frames < steps; frames++) {
    const ball = game.ball;
    const impact = ball.vx < 0
      ? reflectY(ball.y + ball.vy * Math.max(0, (ball.x - 76) / -ball.vx))
      : 270;
    game.setInput({ leftTarget: Math.max(50, Math.min(490, impact - 35)) });
    game.step(1 / 120);
    if (game.phase === 'gameover') break;
  }
  return { phase: game.phase, score: game.score, winner: game.winner, bestRally: game.bestRally, frames };
}

test('skilled rally player can eventually beat Pro without artificial scores', () => {
  const match = expertSession('pro');
  assert.equal(match.phase, 'gameover');
  assert.equal(match.winner, 'left');
  assert.equal(match.score.left, 7);
  assert(match.bestRally >= 10);
  console.log('PRO BALANCE:', JSON.stringify(match));
});

test('Legend remains stronger than Pro, but rally pressure makes hits fallible', () => {
  const pro = expertSession('pro', 20000);
  const legendEarly = expertSession('legend', 20000);
  const legendLong = expertSession('legend', 80000);
  assert(pro.score.left > legendEarly.score.left, 'Compare CPU skill on the same simulated time horizon');
  assert(legendLong.score.left >= 1, 'Even the highest difficulty must not have perfect tracking');
  assert(legendLong.bestRally > pro.bestRally, 'Legend should sustain longer rallies');
  console.log('LEGEND BALANCE:', JSON.stringify({ early: legendEarly, long: legendLong }));
});
