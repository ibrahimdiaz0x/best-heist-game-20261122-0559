// Keyboard input for the heist: WASD or arrows to move, Shift to creep,
// Enter to start, R to run it again, P to hold still. The frame loop reads
// the live state every frame; a key's "struck" edge fires exactly once,
// through the set the loop clears at the end of each frame.

const STEPS = {
  ArrowUp: { dx: 0, dy: -1 },
  KeyW: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  KeyS: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  KeyA: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  KeyD: { dx: 1, dy: 0 },
};

export function newKeys() {
  const held = new Set();
  const struck = new Set();

  function listen() {
    window.addEventListener('keydown', (event) => {
      if (event.code in STEPS || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
        event.preventDefault();
      }
      if (!event.repeat) struck.add(event.code);
      held.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      held.delete(event.code);
    });
    window.addEventListener('blur', () => {
      held.clear();
    });
  }

  // Movement heading for this frame, from whatever keys are held.
  function heading() {
    let dx = 0;
    let dy = 0;
    for (const code of held) {
      const step = STEPS[code];
      if (step) {
        dx += step.dx;
        dy += step.dy;
      }
    }
    return {
      dx,
      dy,
      creep: held.has('ShiftLeft') || held.has('ShiftRight'),
    };
  }

  function tapped(code) {
    return struck.has(code);
  }

  function clearStrikes() {
    struck.clear();
  }

  return { held, struck, listen, heading, tapped, clearStrikes };
}
