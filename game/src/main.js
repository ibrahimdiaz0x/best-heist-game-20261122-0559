// The Marlow Heist — the browser bootstrap.
//
// This module wires the engine to the screen: keyboard input, the
// requestAnimationFrame loop, and the staged scenes the screenshots are
// taken from. A scene is picked with ?scene= in the page URL:
//
//   ?scene=start   the title screen over the gallery (the default)
//   ?scene=play    mid-heist, two pieces already pocketed
//   ?scene=alarm   the thief caught in a guard's cone, siren climbing
//   ?scene=escape  the finished run: CLEAN GETAWAY
//
// Every staged scene is built by actually playing the engine — the
// practice driver walks the thief for real — never by painting a fake
// frame, so each screenshot is a render of the game's own code.

import { buildGallery } from './level.js';
import {
  createRun,
  beginRun,
  stepRun,
  STEP,
  guardPoseAt,
} from './engine.js';
import { createDriver, driveStep } from './autopilot.js';
import { drawScene } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const gallery = buildGallery();

// --- Keyboard ---

const keys = new Set();
const KEYMAP = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

window.addEventListener('keydown', (ev) => {
  if (ev.code === 'Enter' && state.phase === 'title') beginRun(state);
  if (ev.code === 'KeyR' && (state.phase === 'won' || state.phase === 'caught')) {
    state = createRun(gallery);
    beginRun(state);
  }
  if (KEYMAP[ev.code]) {
    keys.add(KEYMAP[ev.code]);
    ev.preventDefault();
  }
  if (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') keys.add('sneak');
});

window.addEventListener('keyup', (ev) => {
  if (KEYMAP[ev.code]) keys.delete(KEYMAP[ev.code]);
  if (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') keys.delete('sneak');
});

function readInput() {
  let x = 0;
  let y = 0;
  if (keys.has('left')) x -= 1;
  if (keys.has('right')) x += 1;
  if (keys.has('up')) y -= 1;
  if (keys.has('down')) y += 1;
  return { x, y, sneak: keys.has('sneak') };
}

// --- Staged scenes: real runs, fast-forwarded ---

// Mid-heist: let the driver lift two pieces, then freeze the frame with
// the thief crossing the hall, cones sweeping and the siren still quiet.
function stagePlay() {
  const run = createRun(gallery);
  beginRun(run);
  const driver = createDriver(gallery);
  let guard = 0;
  while (
    run.phase === 'playing' &&
    run.loot.filter((piece) => piece.taken).length < 2 &&
    guard < 15000
  ) {
    stepRun(run, driveStep(driver, run), STEP);
    guard++;
  }
  return run;
}

// The alarm scene: hold the thief in the west guard's cone until the
// siren is hot. The thief is re-placed ahead of the guard every tick, so
// the cone never loses him while the meter climbs.
function stageAlarm() {
  const run = createRun(gallery);
  beginRun(run);
  const guard = gallery.guards[0];
  let guard2 = 0;
  while (run.phase === 'playing' && run.alarm < 70 && guard2 < 600) {
    const pose = guardPoseAt(guard, run.time);
    run.thief.x = Math.max(40, Math.min(1240, pose.x + Math.cos(pose.angle) * 120));
    run.thief.y = Math.max(90, Math.min(750, pose.y + Math.sin(pose.angle) * 120));
    stepRun(run, { x: 0, y: 0, sneak: false }, STEP);
    guard2++;
  }
  return run;
}

// The getaway: let the driver run the whole heist to the exit door.
function stageEscape() {
  const run = createRun(gallery);
  beginRun(run);
  const driver = createDriver(gallery);
  let guard = 0;
  while (run.phase === 'playing' && guard < 30000) {
    stepRun(run, driveStep(driver, run), STEP);
    guard++;
  }
  return run;
}

// --- Scene selection and the live loop ---

const scene = new URLSearchParams(window.location.search).get('scene') || 'start';
let state = createRun(gallery);
let staged = false;
if (scene === 'play') {
  state = stagePlay();
  staged = true;
} else if (scene === 'alarm') {
  state = stageAlarm();
  staged = true;
} else if (scene === 'escape') {
  state = stageEscape();
  staged = true;
}

// A staged scene is a frozen frame: draw it once and leave it alone, so
// the screenshot catches exactly the moment that was built. The live
// game runs the loop below instead.
if (staged) {
  drawScene(ctx, state);
} else {
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= STEP * 1000) {
      stepRun(state, readInput(), STEP);
      acc -= STEP * 1000;
    }
    drawScene(ctx, state);
    requestAnimationFrame(frame);
  }
  drawScene(ctx, state);
  requestAnimationFrame(frame);
}

// Left visible for debugging from the console.
window.__marlow = { state, gallery };
