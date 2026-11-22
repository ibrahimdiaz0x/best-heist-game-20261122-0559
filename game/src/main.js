// The Marlow Heist — entry point. Owns the canvas, the frame loop and the
// screens (title, play, paused, busted, won). When the page opens with
// ?shot=start|play|alarm|escape it stages that screenshot scene from the
// real rules and draws one frozen frame instead of starting the loop, so a
// screenshot is always the same deterministic picture.

import { FIELD } from './config.js';
import { createInput } from './input.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, step } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? 1) || 1;

const input = createInput();
input.attach();

let world = createWorld(seed);
let screen = 'title';

if (shotName) {
  // Screenshot mode: stage the scene, draw one frame, stop.
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  fitCanvas();
  draw(ctx, world, screen, world.time);
  statusLine.textContent = `The Marlow Heist, ${shotName} scene.`;
} else {
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (input.wasPressed('Enter') && screen === 'title') screen = 'play';
    if (input.wasPressed('KeyR') && (screen === 'over' || screen === 'won')) {
      world = createWorld(seed);
      screen = 'play';
    }
    if (input.wasPressed('KeyP') && (screen === 'play' || screen === 'paused')) {
      screen = screen === 'play' ? 'paused' : 'play';
    }

    if (screen === 'play') {
      step(world, input.vector(), dt);
      if (world.status === 'busted') screen = 'over';
      else if (world.status === 'won') screen = 'won';
    }
    input.endFrame();

    draw(ctx, world, screen, world.time);
    statusLine.textContent = screen === 'play'
      ? `Alarm ${Math.round(world.alarm)} percent. Score ${world.score}.`
      : `The Marlow Heist — ${screen}.`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
