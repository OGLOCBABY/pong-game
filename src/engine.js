/**
 * STRIKELINE — deterministic Pong simulation.
 * No DOM, timers, network or browser APIs. All distances are logical pixels,
 * all rates are in seconds. Rendering is intentionally a separate concern.
 */

export const WIDTH = 960;
export const HEIGHT = 540;
export const WIN_SCORE = 7;
export const MAX_SCORE = 11;

export const DIFFICULTIES = Object.freeze({
  rookie: Object.freeze({ label: 'ROOKIE', speed: 310, reaction: 0.29, error: 82, prediction: 0.56 }),
  pro: Object.freeze({ label: 'PRO', speed: 425, reaction: 0.16, error: 39, prediction: 0.84 }),
  legend: Object.freeze({ label: 'LEGEND', speed: 550, reaction: 0.085, error: 12, prediction: 0.97 }),
});

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const PADDLE_INSET = 52;
const HUMAN_SPEED = 710;
const BALL_RADIUS = 9;
const BASE_SPEED = 395;
const MAX_SPEED = 930;
const MIN_Y = BALL_RADIUS;
const MAX_Y = HEIGHT - BALL_RADIUS;
const EPS = 1e-8;

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/** Bounce a projected vertical position through any number of wall reflections. */
export function reflectY(rawY, min = MIN_Y, max = MAX_Y) {
  const span = max - min;
  const period = span * 2;
  const v = ((rawY - min) % period + period) % period;
  return min + (v <= span ? v : period - v);
}

function makePaddle(x) {
  return { x, y: (HEIGHT - PADDLE_HEIGHT) / 2, w: PADDLE_WIDTH, h: PADDLE_HEIGHT, vy: 0 };
}

export class PongGame {
  constructor({ mode = 'cpu', difficulty = 'pro', seed = 0x0badd00d } = {}) {
    this.mode = mode === 'local' ? 'local' : 'cpu';
    this.difficulty = DIFFICULTIES[difficulty] ? difficulty : 'pro';
    this.seed = (seed >>> 0) || 1;
    this.input = { leftAxis: 0, rightAxis: 0, leftTarget: null, rightTarget: null };
    this.reset();
  }

  /** Small, deterministic PRNG; never necessary for security. */
  random() {
    let n = this.seed;
    n ^= n << 13;
    n ^= n >>> 17;
    n ^= n << 5;
    this.seed = n >>> 0;
    return this.seed / 4294967296;
  }

  reset() {
    this.phase = 'idle';
    this.previousPhase = null;
    this.winner = null;
    this.score = { left: 0, right: 0 };
    this.paddles = {
      left: makePaddle(PADDLE_INSET),
      right: makePaddle(WIDTH - PADDLE_INSET - PADDLE_WIDTH),
    };
    this.ball = { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0, r: BALL_RADIUS, lastHit: null };
    this.rally = 0;
    this.bestRally = 0;
    this.lastRally = 0;
    this.elapsed = 0;
    this.serveTimer = 0;
    this.serveDirection = this.random() > 0.5 ? 1 : -1;
    this.aiTimer = 0;
    this.aiTarget = HEIGHT / 2;
    this.input.leftAxis = this.input.rightAxis = 0;
    this.input.leftTarget = this.input.rightTarget = null;
  }

  start() {
    if (this.phase === 'paused') return this.togglePause();
    if (this.phase === 'gameover') this.reset();
    if (this.phase !== 'idle') return false;
    this.phase = 'ready';
    this.serveTimer = 0.78;
    return true;
  }

  togglePause() {
    if (this.phase === 'paused') {
      this.phase = this.previousPhase || 'playing';
      this.previousPhase = null;
      return true;
    }
    if (this.phase === 'ready' || this.phase === 'playing') {
      this.previousPhase = this.phase;
      this.phase = 'paused';
      return true;
    }
    return false;
  }

  setMode(mode) {
    if (mode !== 'cpu' && mode !== 'local') return false;
    if (this.mode === mode) return true;
    this.mode = mode;
    this.reset();
    return true;
  }

  setDifficulty(difficulty) {
    if (!DIFFICULTIES[difficulty]) return false;
    this.difficulty = difficulty;
    this.aiTimer = 0;
    return true;
  }

  /** Partial control inputs. A target is the paddle's desired CENTER y. */
  setInput(partial = {}) {
    for (const side of ['left', 'right']) {
      const axis = side + 'Axis';
      const target = side + 'Target';
      if (Object.hasOwn(partial, axis) && Number.isFinite(partial[axis])) {
        this.input[axis] = clamp(partial[axis], -1, 1);
      }
      if (Object.hasOwn(partial, target)) {
        const value = partial[target];
        if (value === null || Number.isFinite(value)) {
          this.input[target] = value === null ? null : clamp(value, 0, HEIGHT);
        }
      }
    }
  }

  moveHuman(side, dt) {
    const paddle = this.paddles[side];
    const target = this.input[side + 'Target'];
    const axis = this.input[side + 'Axis'];
    const dy = target === null
      ? axis * HUMAN_SPEED * dt
      : clamp(target - (paddle.y + paddle.h / 2), -HUMAN_SPEED * dt, HUMAN_SPEED * dt);
    const oldY = paddle.y;
    paddle.y = clamp(oldY + dy, 0, HEIGHT - paddle.h);
    paddle.vy = (paddle.y - oldY) / dt;
  }

  moveAI(dt) {
    const paddle = this.paddles.right;
    const setting = DIFFICULTIES[this.difficulty];
    this.aiTimer -= dt;

    if (this.aiTimer <= 0) {
      this.aiTimer = setting.reaction;
      if (this.ball.vx > 1 && this.phase === 'playing') {
        const remainingX = Math.max(0, paddle.x - this.ball.r - this.ball.x);
        const flightTime = remainingX / this.ball.vx;
        const impactY = reflectY(this.ball.y + this.ball.vy * flightTime);
        const perceivedY = this.ball.y + (impactY - this.ball.y) * setting.prediction;
        this.aiTarget = clamp(perceivedY + (this.random() * 2 - 1) * setting.error, 50, HEIGHT - 50);
      } else {
        this.aiTarget = HEIGHT / 2 + Math.sin(this.elapsed * 0.82) * 22;
      }
    }

    const oldY = paddle.y;
    // Small dead zone avoids nervous twitching when the ball travels away.
    const error = this.aiTarget - (paddle.y + paddle.h / 2);
    const movement = Math.abs(error) > 5 ? clamp(error, -setting.speed * dt, setting.speed * dt) : 0;
    paddle.y = clamp(oldY + movement, 0, HEIGHT - paddle.h);
    paddle.vy = (paddle.y - oldY) / dt;
  }

  launch() {
    const theta = (this.random() * 2 - 1) * 0.52;
    this.ball.x = WIDTH / 2;
    this.ball.y = HEIGHT / 2 + (this.random() * 2 - 1) * 52;
    this.ball.vx = this.serveDirection * BASE_SPEED * Math.cos(theta);
    this.ball.vy = BASE_SPEED * Math.sin(theta);
    this.ball.lastHit = null;
  }

  bounce(side) {
    const paddle = this.paddles[side];
    const offset = clamp((this.ball.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2), -1, 1);
    const spin = clamp(paddle.vy / HUMAN_SPEED, -1, 1) * 0.18;
    const drift = this.random() > 0.5 ? 0.026 : -0.026;
    const angle = clamp(offset * 0.99 + spin + drift, -1.12, 1.12);
    const speed = Math.min(MAX_SPEED, Math.hypot(this.ball.vx, this.ball.vy) * 1.055 + 9);
    const direction = side === 'left' ? 1 : -1;

    this.ball.vx = direction * speed * Math.cos(angle);
    this.ball.vy = speed * Math.sin(angle);
    this.ball.lastHit = side;
    this.rally++;
    this.bestRally = Math.max(this.bestRally, this.rally);
    return { type: 'paddle', side, x: this.ball.x, y: this.ball.y, speed, rally: this.rally };
  }

  awardPoint(scorer) {
    this.lastRally = this.rally;
    this.rally = 0;
    this.score[scorer]++;
    const enemy = scorer === 'left' ? 'right' : 'left';
    const result = [
      { type: 'score', side: scorer, score: { ...this.score }, lastRally: this.lastRally },
    ];
    if (
      (this.score[scorer] >= WIN_SCORE && this.score[scorer] - this.score[enemy] >= 2) ||
      this.score[scorer] >= MAX_SCORE
    ) {
      this.phase = 'gameover';
      this.winner = scorer;
      this.ball.vx = this.ball.vy = 0;
      result.push({ type: 'win', side: scorer, score: { ...this.score }, bestRally: this.bestRally });
    } else {
      this.phase = 'ready';
      this.serveTimer = 0.9;
      this.serveDirection = scorer === 'left' ? 1 : -1;
      this.ball.x = WIDTH / 2;
      this.ball.y = HEIGHT / 2;
      this.ball.vx = this.ball.vy = 0;
      this.ball.lastHit = null;
    }
    return result;
  }

  /** Run one short, fixed (ideally 1/120s) physics step; return sound/HUD events. */
  step(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return [];
    dt = Math.min(dt, 0.1);

    if (this.phase === 'idle' || this.phase === 'paused' || this.phase === 'gameover') return [];
    this.elapsed += dt;
    this.moveHuman('left', dt);
    if (this.mode === 'local') this.moveHuman('right', dt);
    else this.moveAI(dt);

    if (this.phase === 'ready') {
      this.serveTimer -= dt;
      if (this.serveTimer <= 0) {
        this.launch();
        this.phase = 'playing';
        return [{ type: 'serve', direction: this.serveDirection }];
      }
      return [];
    }

    const ball = this.ball;
    const events = [];
    let timeLeft = dt;

    // Earliest-impact sweep prevents paddles or thin walls being skipped.
    for (let iterations = 0; iterations < 8 && timeLeft > EPS; iterations++) {
      let time = timeLeft;
      let hit = null;

      const candidate = (t, kind) => {
        if (t >= -EPS && t <= time + EPS) {
          time = Math.max(0, t);
          hit = kind;
        }
      };

      if (ball.vy < -EPS) candidate((MIN_Y - ball.y) / ball.vy, 'top');
      if (ball.vy > EPS) candidate((MAX_Y - ball.y) / ball.vy, 'bottom');

      if (ball.vx < -EPS) {
        const paddle = this.paddles.left;
        const edge = paddle.x + paddle.w + ball.r;
        if (ball.x >= edge - EPS) {
          const t = (edge - ball.x) / ball.vx;
          const y = ball.y + ball.vy * t;
          if (t >= -EPS && y >= paddle.y - ball.r && y <= paddle.y + paddle.h + ball.r) {
            candidate(t, 'left');
          }
        }
        candidate((-ball.r - ball.x) / ball.vx, 'goal-right');
      } else if (ball.vx > EPS) {
        const paddle = this.paddles.right;
        const edge = paddle.x - ball.r;
        if (ball.x <= edge + EPS) {
          const t = (edge - ball.x) / ball.vx;
          const y = ball.y + ball.vy * t;
          if (t >= -EPS && y >= paddle.y - ball.r && y <= paddle.y + paddle.h + ball.r) {
            candidate(t, 'right');
          }
        }
        candidate((WIDTH + ball.r - ball.x) / ball.vx, 'goal-left');
      }

      ball.x += ball.vx * time;
      ball.y += ball.vy * time;
      timeLeft -= time;

      if (hit === null) break;
      if (hit === 'top' || hit === 'bottom') {
        ball.y = hit === 'top' ? MIN_Y : MAX_Y;
        ball.vy *= -1;
        events.push({ type: 'wall', side: hit, x: ball.x, y: ball.y });
      } else if (hit === 'left' || hit === 'right') {
        const paddle = this.paddles[hit];
        ball.x = hit === 'left' ? paddle.x + paddle.w + ball.r : paddle.x - ball.r;
        events.push(this.bounce(hit));
      } else {
        return [...events, ...this.awardPoint(hit === 'goal-left' ? 'left' : 'right')];
      }
    }
    return events;
  }
}
