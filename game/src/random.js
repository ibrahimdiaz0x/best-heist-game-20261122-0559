// A small seeded random source (mulberry32) so a staged scene plays out
// the same way every time it runs, and so the game can shuffle small
// details per run without leaning on Math.random in the hot path.

export function seedRand(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function between(rng, low, high) {
  return low + rng() * (high - low);
}
