import { PongGame, WIDTH, HEIGHT, DIFFICULTIES, WIN_SCORE } from './engine.js';
import { ArcadeAudio } from './audio.js';

const $ = (id) => document.getElementById(id);
const elements = {
  canvas: $('game-canvas'),
  arena: $('arena'),
  overlay: $('game-overlay'),
  overlayKicker: $('overlay-kicker'),
  overlayTitle: $('overlay-title'),
  overlayDescription: $('overlay-description'),
  overlayShortcut: $('overlay-shortcut'),
  primaryAction: $('primary-action'),
  primaryLabel: $('primary-action-label'),
  pause: $('pause-button'),
  pauseLabel: $('pause-label'),
  restart: $('restart-button'),
  state: $('state-label'),
  stateLight: $('state-light'),
  leftTeam: $('left-team'),
  rightTeam: $('right-team'),
  leftScore: $('left-score'),
  rightScore: $('right-score'),
  rally: $('rally-value'),
  best: $('best-value'),
  speed: $('speed-value'),
  difficultyGroup: $('difficulty-group'),
  soundButton: $('sound-button'),
  motionButton: $('motion-button'),
  soundToggle: $('sound-toggle'),
  motionToggle: $('motion-toggle'),
  announcer: $('announcer'),
};
const ctx = elements.canvas.getContext('2d', { alpha: false });
if (!ctx) throw new Error('STRIKELINE needs a browser with Canvas 2D support.');

const STORAGE_KEY = 'strikeline:settings:v1';
const motionMedia = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const defaultPreferences = {
  mode: 'cpu',
  difficulty: 'pro',
  sound: true,
  effects: !motionMedia?.matches,
  bestRally: 0,
};

function readPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      mode: stored.mode === 'local' ? 'local' : 'cpu',
      difficulty: DIFFICULTIES[stored.difficulty] ? stored.difficulty : 'pro',
      sound: typeof stored.sound === 'boolean' ? stored.sound : true,
      effects: typeof stored.effects === 'boolean' ? stored.effects : !motionMedia?.matches,
      bestRally: Number.isSafeInteger(stored.bestRally) ? Math.max(0, stored.bestRally) : 0,
    };
  } catch {
    return { ...defaultPreferences };
  }
}

const preferences = readPreferences();
const savePreferences = () => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }
  catch { /* Private/incognito storage may be disabled. */ }
};
const game = new PongGame({ mode: preferences.mode, difficulty: preferences.difficulty });
const audio = new ArcadeAudio(preferences.sound);
const keysDown = new Set();
const touches = new Map(); // pointerId -> { side, y }
const motionOn = () => preferences.effects && !motionMedia?.matches;
let lastOverlayPhase = null;
let particles = [];
let ballTrail = [];
let shake = 0;
let canvasPixelWidth = 960;
let canvasPixelHeight = 540;
let lastFrame = 0;
let accumulator = 0;
let hudAccumulator = 0;

const pad = (value) => String(value).padStart(2, '0');
const announce = (message) => { elements.announcer.textContent = message; };

function resizeCanvas() {
  const rect = elements.canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (elements.canvas.width !== w || elements.canvas.height !== h) {
    elements.canvas.width = w;
    elements.canvas.height = h;
  }
  canvasPixelWidth = w;
  canvasPixelHeight = h;
}
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resizeCanvas).observe(elements.arena);
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function syncPreferences() {
  document.querySelectorAll('[data-mode]').forEach((button) => {
    const active = button.dataset.mode === game.mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-difficulty]').forEach((button) => {
    const active = button.dataset.difficulty === game.difficulty;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.disabled = game.mode === 'local';
  });
  elements.difficultyGroup.classList.toggle('disabled', game.mode === 'local');
  elements.leftTeam.textContent = game.mode === 'local' ? 'PLAYER 1' : 'YOU';
  elements.rightTeam.textContent = game.mode === 'local' ? 'PLAYER 2' : 'CPU';
  elements.soundButton.setAttribute('aria-pressed', String(preferences.sound));
  elements.motionButton.setAttribute('aria-pressed', String(preferences.effects));
  elements.soundToggle.classList.toggle('on', preferences.sound);
  elements.motionToggle.classList.toggle('on', preferences.effects);
}

function showOverlay() {
  const phase = game.phase;
  if (phase === lastOverlayPhase) return;
  lastOverlayPhase = phase;
  elements.overlay.hidden = phase !== 'idle' && phase !== 'paused' && phase !== 'gameover';
  elements.arena.classList.toggle('showing-overlay', !elements.overlay.hidden);
  elements.pause.disabled = phase !== 'ready' && phase !== 'playing' && phase !== 'paused';
  elements.pauseLabel.textContent = phase === 'paused' ? 'RESUME' : 'PAUSE';

  const status = {
    idle: 'STANDBY', ready: 'SERVING', playing: 'IN PLAY',
    paused: 'PAUSED', gameover: 'FINAL SCORE',
  };
  elements.state.textContent = status[phase];
  elements.state.parentElement.dataset.phase = phase;
  if (phase === 'idle') {
    elements.overlayKicker.textContent = 'WELCOME TO THE ARENA';
    elements.overlayTitle.innerHTML = 'READY TO<br><em>RALLY?</em>';
    elements.overlayDescription.innerHTML = 'First to 7. Win by 2. No second chances.<br>Just kidding — there’s always a rematch.';
    elements.primaryLabel.textContent = 'START MATCH';
    elements.overlayShortcut.textContent = 'OR PRESS ENTER TO START';
  } else if (phase === 'paused') {
    elements.overlayKicker.textContent = 'TIME OUT';
    elements.overlayTitle.innerHTML = 'TAKE A<br><em>BREATHER.</em>';
    elements.overlayDescription.textContent = 'The clock is stopped. The rivalry is not.';
    elements.primaryLabel.textContent = 'RESUME MATCH';
    elements.overlayShortcut.textContent = 'OR PRESS SPACE TO RESUME';
  } else if (phase === 'gameover') {
    const youWon = game.winner === 'left';
    const playerName = game.mode === 'local'
      ? (youWon ? 'PLAYER 1' : 'PLAYER 2')
      : (youWon ? 'YOU' : 'THE CPU');
    elements.overlayKicker.textContent = 'MATCH COMPLETE / FINAL SCORE';
    elements.overlayTitle.innerHTML = youWon ? 'WHAT A<br><em>FINISH.</em>' : 'GAME.<br><em>SET. PONG.</em>';
    elements.overlayDescription.textContent = playerName + ' WON ' + game.score.left + ' — ' + game.score.right + '. Every legend starts with one more game.';
    elements.primaryLabel.textContent = 'PLAY AGAIN';
    elements.overlayShortcut.textContent = 'OR PRESS ENTER FOR A REMATCH';
  }
}

function syncHUD() {
  elements.leftScore.textContent = pad(game.score.left);
  elements.rightScore.textContent = pad(game.score.right);
  elements.rally.textContent = pad(game.rally);
  elements.best.textContent = pad(Math.max(game.bestRally, preferences.bestRally));
  elements.speed.innerHTML = String(Math.round(Math.hypot(game.ball.vx, game.ball.vy))).padStart(3, '0') + ' <small>PX/S</small>';
  if (game.bestRally > preferences.bestRally) {
    preferences.bestRally = game.bestRally;
    savePreferences();
  }
  showOverlay();
}

function startOrResume() {
  audio.unlock();
  const changed = game.start();
  if (changed) {
    audio.play('click');
    if (game.phase === 'ready') announce('Match started. First to ' + WIN_SCORE + ', win by two.');
    else announce('Match resumed.');
    syncHUD();
    elements.canvas.focus({ preventScroll: true });
  }
}

function resetGame() {
  game.reset();
  keysDown.clear();
  touches.clear();
  particles = [];
  ballTrail = [];
  shake = 0;
  accumulator = 0;
  applyInputs();
  syncHUD();
  announce('Match reset. Press start to play.');
}

function togglePause() {
  if (game.togglePause()) {
    if (game.phase === 'paused') {
      audio.play('click');
      announce('Game paused.');
    } else {
      audio.unlock();
      audio.play('click');
      announce('Game resumed.');
      elements.canvas.focus({ preventScroll: true });
    }
    syncHUD();
  }
}

function toggleSound() {
  preferences.sound = !preferences.sound;
  audio.setEnabled(preferences.sound);
  savePreferences();
  syncPreferences();
  if (preferences.sound) audio.play('click');
  announce('Sound ' + (preferences.sound ? 'on' : 'off') + '.');
}

elements.primaryAction.addEventListener('click', startOrResume);
elements.pause.addEventListener('click', togglePause);
elements.restart.addEventListener('click', () => { audio.play('click'); resetGame(); });
elements.soundButton.addEventListener('click', toggleSound);
elements.motionButton.addEventListener('click', () => {
  preferences.effects = !preferences.effects;
  if (!motionOn()) {
    particles = [];
    ballTrail = [];
    shake = 0;
  }
  savePreferences();
  syncPreferences();
  announce('Game effects ' + (motionOn() ? 'enabled' : 'disabled') + '.');
});

document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  if (game.mode === button.dataset.mode) return;
  game.setMode(button.dataset.mode);
  preferences.mode = game.mode;
  keysDown.clear();
  touches.clear();
  ballTrail = [];
  savePreferences();
  syncPreferences();
  syncHUD();
  announce(game.mode === 'local' ? 'Two-player mode. Player one uses W and S, player two uses arrow keys.' : 'Single-player mode against the computer.');
}));
document.querySelectorAll('[data-difficulty]').forEach((button) => button.addEventListener('click', () => {
  if (game.setDifficulty(button.dataset.difficulty)) {
    preferences.difficulty = game.difficulty;
    savePreferences();
    syncPreferences();
    announce('Computer difficulty: ' + DIFFICULTIES[game.difficulty].label);
  }
}));

const activeKey = (k) => keysDown.has(k);
function applyInputs() {
  const leftUp = activeKey('w') || (game.mode === 'cpu' && activeKey('arrowup'));
  const leftDown = activeKey('s') || (game.mode === 'cpu' && activeKey('arrowdown'));
  const rightUp = game.mode === 'local' && activeKey('arrowup');
  const rightDown = game.mode === 'local' && activeKey('arrowdown');
  let leftAxis = Number(leftDown) - Number(leftUp);
  const rightAxis = Number(rightDown) - Number(rightUp);

  // Optional browser-standard controller: left stick or D-pad, without interfering with keyboard.
  try {
    const controller = navigator.getGamepads?.()?.find(Boolean);
    if (controller) {
      const vertical = controller.axes?.[1] || 0;
      const dpad = Number(Boolean(controller.buttons?.[13]?.pressed)) - Number(Boolean(controller.buttons?.[12]?.pressed));
      if (Math.abs(vertical) > 0.22 || dpad) leftAxis = dpad || Math.sign(vertical);
    }
  } catch { /* Gamepad access may be restricted by the browser. */ }

  game.setInput({ leftAxis, rightAxis });
}

const gameplayKeys = new Set(['w', 's', 'arrowup', 'arrowdown', ' ', 'p', 'r', 'm', 'enter']);
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (!gameplayKeys.has(key)) return;
  const target = event.target;
  const editing = target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName));
  if (editing) return;

  // Do not swallow native Enter/Space activation of focused buttons or links.
  const interactive = target instanceof HTMLElement && Boolean(target.closest('button, a'));
  if (interactive && (key === ' ' || key === 'enter')) return;
  event.preventDefault();

  if (key === 'w' || key === 's' || key.startsWith('arrow')) keysDown.add(key);
  if (event.repeat) return;
  if (key === ' ' || key === 'p') togglePause();
  if (key === 'r') resetGame();
  if (key === 'm') toggleSound();
  if (key === 'enter' && (game.phase === 'idle' || game.phase === 'paused' || game.phase === 'gameover')) startOrResume();
});
window.addEventListener('keyup', (event) => keysDown.delete(event.key.toLowerCase()));

function updatePointer(event) {
  const rect = elements.canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
  const previous = touches.get(event.pointerId);
  const side = previous?.side || (game.mode === 'local' && x >= WIDTH / 2 ? 'right' : 'left');
  touches.set(event.pointerId, { side, y: Math.max(0, Math.min(HEIGHT, y)) });
  updateTouchTargets();
}

function updateTouchTargets() {
  let leftTarget = null;
  let rightTarget = null;
  for (const touch of touches.values()) {
    if (touch.side === 'left') leftTarget = touch.y;
    else rightTarget = touch.y;
  }
  game.setInput({ leftTarget, rightTarget });
}

elements.canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  audio.unlock();
  try { elements.canvas.setPointerCapture(event.pointerId); } catch { /* optional */ }
  updatePointer(event);
});
elements.canvas.addEventListener('pointermove', (event) => {
  // Desktop pointer position tracks even without holding a button in solo mode.
  if (touches.has(event.pointerId)) updatePointer(event);
  else if (event.pointerType === 'mouse' && game.mode === 'cpu') {
    const rect = elements.canvas.getBoundingClientRect();
    game.setInput({ leftTarget: Math.max(0, Math.min(HEIGHT, ((event.clientY - rect.top) / rect.height) * HEIGHT)) });
  }
});
function releasePointer(event) {
  if (touches.has(event.pointerId)) {
    touches.delete(event.pointerId);
    updateTouchTargets();
  }
}
elements.canvas.addEventListener('pointerup', releasePointer);
elements.canvas.addEventListener('pointercancel', releasePointer);
elements.canvas.addEventListener('lostpointercapture', releasePointer);
elements.canvas.addEventListener('pointerleave', (event) => {
  if (event.pointerType === 'mouse' && !touches.size) game.setInput({ leftTarget: null });
});
function suspend() {
  keysDown.clear();
  touches.clear();
  game.setInput({ leftTarget: null, rightTarget: null, leftAxis: 0, rightAxis: 0 });
  if (game.phase === 'playing' || game.phase === 'ready') {
    game.togglePause();
    syncHUD();
    announce('Game automatically paused.');
  }
}
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });

const stars = Array.from({ length: 54 }, (_, i) => ({
  x: (i * 271.371 + 43.11) % WIDTH,
  y: (i * 173.163 + 76.77) % HEIGHT,
  radius: i % 9 === 0 ? 1.15 : 0.65,
  flicker: i * 0.91,
}));

function sprinkle(x, y, color, count = 12, force = 1) {
  if (!motionOn()) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (75 + Math.random() * 240) * force;
    const life = 0.28 + Math.random() * 0.34;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, maxLife: life, color, size: 1.5 + Math.random() * 2.8 });
  }
  if (particles.length > 160) particles = particles.slice(-160);
}

function handleEvent(event) {
  if (event.type === 'paddle') {
    audio.play('paddle');
    sprinkle(event.x, event.y, event.side === 'left' ? '#66f1e6' : '#ff8a74', 12, 1.0);
    shake = motionOn() ? 2.8 : 0;
  }
  if (event.type === 'wall') {
    audio.play('wall');
    sprinkle(event.x, event.y, '#9f9eff', 6, 0.6);
  }
  if (event.type === 'serve') audio.play('serve');
  if (event.type === 'score') {
    audio.play('score');
    sprinkle(event.side === 'left' ? WIDTH - 50 : 50, HEIGHT / 2, event.side === 'left' ? '#66f1e6' : '#ff8a74', 28, 1.3);
    shake = motionOn() ? 8 : 0;
    const sideName = game.mode === 'cpu' ? (event.side === 'left' ? 'You' : 'Computer') : (event.side === 'left' ? 'Player one' : 'Player two');
    announce(sideName + ' scored. ' + event.score.left + ' to ' + event.score.right + '.');
  }
  if (event.type === 'win') {
    audio.play('win');
    announce('Match ended. ' + (event.side === 'left' ? elements.leftTeam.textContent : elements.rightTeam.textContent) + ' wins. Final score ' + event.score.left + ' to ' + event.score.right + '.');
  }
  if (event.type === 'score' || event.type === 'win') ballTrail = [];
  syncHUD();
}

function tickEffects(dt) {
  shake = Math.max(0, shake - dt * 30);
  for (const p of particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.max(0, 1 - dt * 3);
    p.vy *= Math.max(0, 1 - dt * 3);
  }
  particles = particles.filter((p) => p.life > 0);
}

function line(x1, y1, x2, y2, stroke, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.stroke();
}

function circle(x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function roundedRect(x, y, w, h, radius, color) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function paintArena(now) {
  ctx.setTransform(canvasPixelWidth / WIDTH, 0, 0, canvasPixelHeight / HEIGHT, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.save();

  if (motionOn() && shake > 0) ctx.translate(Math.sin(now * 0.13) * shake * 0.65, Math.cos(now * 0.10) * shake * 0.4);

  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, '#0a1424');
  background.addColorStop(.52, '#0b1627');
  background.addColorStop(1, '#131425');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Architectural field lines: unmistakably Pong, but not an LCD nostalgia pastiche.
  ctx.strokeStyle = 'rgba(125, 170, 199, 0.075)';
  ctx.lineWidth = 1;
  for (let x = 80; x <= WIDTH - 80; x += 80) line(x, 0, x, HEIGHT, 'rgba(142,179,216,.040)');
  for (let y = 54; y < HEIGHT; y += 54) line(0, y, WIDTH, y, 'rgba(142,179,216,.036)');
  ctx.strokeStyle = 'rgba(102,241,230,.07)';
  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT / 2, 120, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT / 2, 190, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(WIDTH / 2, HEIGHT / 2, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([6, 14]);
  line(WIDTH / 2, 20, WIDTH / 2, HEIGHT - 20, 'rgba(183,207,219,.28)', 2);
  ctx.setLineDash([]);
  line(0, 12, WIDTH, 12, 'rgba(102,241,230,.20)');
  line(0, HEIGHT - 12, WIDTH, HEIGHT - 12, 'rgba(255,138,116,.20)');
  line(26, 0, 26, HEIGHT, 'rgba(102,241,230,.085)');
  line(WIDTH - 26, 0, WIDTH - 26, HEIGHT, 'rgba(255,138,116,.085)');

  for (const star of stars) {
    const twinkle = motionOn() ? 0.65 + Math.sin(now * .0009 + star.flicker) * .35 : .65;
    circle(star.x, star.y, star.radius, 'rgba(165,198,228,' + (twinkle * .20).toFixed(3) + ')');
  }

  if (game.phase === 'ready') {
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px ' + '"SFMono-Regular", Consolas, monospace';
    ctx.letterSpacing = '3px';
    ctx.fillStyle = '#87b9c1';
    ctx.fillText('NEXT SERVE IN ' + Math.max(1, Math.ceil(game.serveTimer)), WIDTH / 2, HEIGHT / 2 - 50);
    ctx.letterSpacing = '0px';
  }

  if (motionOn()) {
    for (let i = 0; i < ballTrail.length; i++) {
      const ghost = ballTrail[i];
      const alpha = ((i + 1) / ballTrail.length) ** 2 * .32;
      circle(ghost.x, ghost.y, game.ball.r * (0.45 + i / ballTrail.length * .45), 'rgba(115,246,236,' + alpha.toFixed(3) + ')');
    }
  }

  const drawPaddle = (paddle, primary, highlight) => {
    ctx.save();
    if (motionOn()) {
      ctx.shadowColor = primary;
      ctx.shadowBlur = 25;
      if (Math.abs(paddle.vy) > 100) {
        roundedRect(paddle.x - 1, paddle.y - Math.sign(paddle.vy) * 8, paddle.w + 2, paddle.h, 6, primary === '#66f1e6' ? 'rgba(102,241,230,.10)' : 'rgba(255,138,116,.10)');
      }
    }
    roundedRect(paddle.x, paddle.y, paddle.w, paddle.h, 5, primary);
    ctx.shadowBlur = 0;
    roundedRect(paddle.x + 3, paddle.y + 7, 2, paddle.h - 14, 1, highlight);
    ctx.restore();
  };
  drawPaddle(game.paddles.left, '#66f1e6', '#eafffd');
  drawPaddle(game.paddles.right, '#ff8a74', '#ffdfd5');

  if (game.phase !== 'gameover' || game.ball.vx !== 0) {
    ctx.save();
    if (motionOn()) {
      ctx.shadowColor = '#b6fff6';
      ctx.shadowBlur = 33;
      circle(game.ball.x, game.ball.y, game.ball.r + 5, 'rgba(102,241,230,.15)');
    }
    circle(game.ball.x, game.ball.y, game.ball.r, '#f4ffff');
    circle(game.ball.x - 2.6, game.ball.y - 2.6, 2.8, '#ffffff');
    ctx.restore();
  }

  for (const p of particles) {
    const alpha = Math.min(1, p.life / p.maxLife);
    ctx.globalAlpha = alpha * alpha;
    roundedRect(p.x, p.y, p.size, p.size, .7, p.color);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function frame(now) {
  const frameDt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.08) : 0;
  lastFrame = now;
  if (game.phase === 'playing' || game.phase === 'ready') {
    applyInputs();
    accumulator += frameDt;
    let steps = 0;
    while (accumulator >= 1 / 120 && steps < 12) {
      for (const event of game.step(1 / 120)) handleEvent(event);
      accumulator -= 1 / 120;
      steps++;
      if (game.phase === 'gameover') { accumulator = 0; break; }
      if (game.phase === 'playing' && motionOn()) {
        ballTrail.push({ x: game.ball.x, y: game.ball.y });
        if (ballTrail.length > 22) ballTrail.shift();
      }
    }
    if (steps === 12) accumulator = 0; // Never spiral after a suspended tab.
  } else accumulator = 0;

  tickEffects(frameDt);
  paintArena(now);
  hudAccumulator += frameDt;
  if (hudAccumulator > 0.08) {
    syncHUD();
    hudAccumulator = 0;
  }
  requestAnimationFrame(frame);
}

syncPreferences();
syncHUD();
requestAnimationFrame(frame);

/** Read-only observability for automated browser validation; no mutation hooks. */
window.__STRIKELINE_DIAGNOSTICS__ = Object.freeze({
  snapshot: () => ({
    phase: game.phase,
    mode: game.mode,
    difficulty: game.difficulty,
    score: { ...game.score },
    paddles: { left: { ...game.paddles.left }, right: { ...game.paddles.right } },
    ball: { ...game.ball },
    rally: game.rally,
    bestRally: game.bestRally,
    elapsed: game.elapsed,
    sound: preferences.sound,
    effects: motionOn(),
  }),
});
