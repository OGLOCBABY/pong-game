import test from 'node:test';
import assert from 'node:assert/strict';
import { PongGame, HEIGHT, MAX_SCORE, DIFFICULTIES } from '../src/engine.js';

/**
 * Finite-state and numerical property sweep. Deterministically completes
 * 72 simulated matches across every difficulty, solo, and local two-player.
 * Inputs deliberately have imperfect reaction: this verifies a real game
 * finishes without assistance or direct score manipulation.
 */
test('72 full simulated matches satisfy invariants and terminate', () => {
  const stats = { games: 0, completed: 0, points: 0, paddleHits: 0, wallHits: 0 };
  const difficulties = Object.keys(DIFFICULTIES);
  for (let seed = 1; seed <= 72; seed++) {
    const mode = seed % 4 === 0 ? 'local' : 'cpu';
    const difficulty = difficulties[(seed - 1) % difficulties.length];
    const game = new PongGame({ seed, mode, difficulty });
    assert(game.start(), 'match must start');
    let scores = 0;
    for (let frame = 0; frame < 24000; frame++) {
      const controls = {
        leftTarget: HEIGHT / 2 + Math.sin((frame + seed * 83) / 91) * 230,
      };
      if (mode === 'local') {
        controls.rightTarget = HEIGHT / 2 + Math.cos((frame + seed * 137) / 77) * 235;
      }
      game.setInput(controls);
      const events = game.step(1 / 120);
      for (const event of events) {
        if (event.type === 'score') scores++;
        if (event.type === 'paddle') stats.paddleHits++;
        if (event.type === 'wall') stats.wallHits++;
      }

      const ball = game.ball;
      assert(
        [ball.x, ball.y, ball.vx, ball.vy].every(Number.isFinite),
        'ball must remain finite in match ' + seed,
      );
      assert(
        ball.y >= ball.r - 0.001 && ball.y <= HEIGHT - ball.r + 0.001,
        'ball stays in the court in match ' + seed,
      );
      for (const side of ['left', 'right']) {
        const paddle = game.paddles[side];
        assert(
          paddle.y >= -0.001 && paddle.y + paddle.h <= HEIGHT + 0.001,
          'paddle stays within the court in match ' + seed,
        );
      }
      assert(game.score.left <= MAX_SCORE && game.score.right <= MAX_SCORE);
      if (game.phase === 'gameover') break;
    }
    assert.equal(game.phase, 'gameover', 'match must finish: ' + seed);
    assert.equal(game.score.left + game.score.right, scores);
    assert(game.score.left >= 7 || game.score.right >= 7, 'winning threshold');
    assert(Math.abs(game.score.left - game.score.right) >= 2 || Math.max(game.score.left, game.score.right) === MAX_SCORE);
    stats.games++;
    stats.completed++;
    stats.points += scores;
  }
  assert.equal(stats.completed, 72);
  assert(stats.paddleHits > 50 && stats.wallHits > 50);
  console.log('PROPERTY MATCH SWEEP:', JSON.stringify(stats));
});
