// The Marlow Heist — entry point. Owns the canvas, the frame loop and the
// screens (menu, run, held, caught, escaped). When the page opens with
// ?shot=start|play|alarm|escape it stages that screenshot scene from the
// real rules and draws one frozen frame instead of starting the loop, so a
// screenshot is always the same deterministic picture.

import { ARENA } from './config.js';
import { newKeys } from './input.js';
import { paintNight } from './render.js';
import { setScene } from './shots.js';
import { openNight, advance } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');

function sizeCanvas() {
  const scale = Math.min(window.innerWidth / ARENA.width, window.innerHeight / ARENA.height);
  canvas.width = ARENA.width;
  canvas.height = ARENA.height;
  canvas.style.width = `${Math.floor(ARENA.width * scale)}px`;
  canvas.style.height = `${Math.floor(ARENA.height * scale)}px`;
}

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? 1) || 1;

const keys = newKeys();
keys.listen();

let world = openNight(seed);
let scene = 'menu';

if (shotName) {
  // Screenshot mode: stage the scene, draw one frame, stop.
  const staged = setScene(shotName, world);
  scene = staged.screen;
  sizeCanvas();
  paintNight(ctx, world, scene, world.clock);
  statusLine.textContent = `The Marlow Heist, ${shotName} scene.`;
} else {
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (keys.tapped('Enter') && scene === 'menu') scene = 'run';
    if (keys.tapped('KeyR') && (scene === 'caught' || scene === 'escaped')) {
      world = openNight(seed);
      scene = 'run';
    }
    if (keys.tapped('KeyP') && (scene === 'run' || scene === 'held')) {
      scene = scene === 'run' ? 'held' : 'run';
    }

    if (scene === 'run') {
      advance(world, keys.heading(), dt);
      if (world.fate === 'caught') scene = 'caught';
      else if (world.fate === 'escaped') scene = 'escaped';
    }
    keys.clearStrikes();

    paintNight(ctx, world, scene, world.clock);
    statusLine.textContent = scene === 'run'
      ? `Siren ${Math.round(world.heat)} percent. Haul ${world.haul}.`
      : `The Marlow Heist — ${scene}.`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
