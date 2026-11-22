// Keyboard input for the heist: WASD or arrows to move, Shift to sneak,
// Enter to start, R to restart, P to pause. The loop reads the live state
// every frame; a key's "pressed" edge fires exactly once, through the set
// the loop clears at the end of each frame.

const MOVE_KEYS = {
  ArrowUp: { dx: 0, dy: -1 },
  KeyW: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
  KeyS: { dx: 0, dy: 1 },
  ArrowLeft: { dx: -1, dy: 0 },
  KeyA: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  KeyD: { dx: 1, dy: 0 },
};

export function createInput() {
  const held = new Set();
  const pressed = new Set();
  return {
    held,
    pressed,
    attach() {
      window.addEventListener('keydown', (event) => {
        if (event.code in MOVE_KEYS || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
          event.preventDefault();
        }
        if (!event.repeat) pressed.add(event.code);
        held.add(event.code);
      });
      window.addEventListener('keyup', (event) => {
        held.delete(event.code);
      });
      window.addEventListener('blur', () => {
        held.clear();
      });
    },
    // Movement vector for this frame, from whatever keys are held.
    vector() {
      let dx = 0;
      let dy = 0;
      for (const code of held) {
        const step = MOVE_KEYS[code];
        if (step) {
          dx += step.dx;
          dy += step.dy;
        }
      }
      return {
        dx,
        dy,
        sneak: held.has('ShiftLeft') || held.has('ShiftRight'),
      };
    },
    wasPressed(code) {
      return pressed.has(code);
    },
    endFrame() {
      pressed.clear();
    },
  };
}
