// The Marlow Heist — every number the night runs on, in one place.
//
// One thief crosses a top-down gallery after dark. The values below are the
// whole deal: how fast feet move, how far a watchman can see, how quickly
// the siren meter climbs while the thief is lit, where the walls stand, and
// what is worth stealing. Nothing in this file moves or draws; it only
// states the facts so the rules file and the painter can stay honest.

export const ARENA = { width: 1280, height: 800 };

// The burglar. Creeping is slow, but a creeping thief is harder to spot
// (a watchman's reach shrinks) and the siren climbs half as fast.
export const BURGLAR = {
  radius: 14,
  stroll: 175,
  creep: 92,
  creepSight: 0.62,
  creepAlarm: 0.5,
};

// A watchman walks his route, looks down a cone, and gives chase when the
// thief is close inside that cone. Catching the thief shoves them away and
// feeds the siren.
export const WATCHMAN = {
  radius: 15,
  patrol: 78,
  pursuit: 205,
  sight: 235,
  halfCone: 0.61,
  chaseWithin: 80,
  memory: 3,
  grabAlarm: 25,
};

// A lens is bolted to the wall and sweeps its cone back and forth. It never
// walks, but its cone reaches further than any watchman's.
export const LENS = {
  sight: 265,
  halfCone: 0.52,
  sweep: 0.9,
  sweepTime: 4.5,
  alarmRate: 18,
};

// The siren meter. A watchman's gaze fills it fast, a lens a little slower;
// unseen, it drains away, slower still once most of the swag is gone.
// At the ceiling the gallery locks down and the night is over.
export const SIREN = {
  watchmanRate: 26,
  coolDown: 6,
  coolDownLate: 3,
  ceiling: 100,
};

// Solid rectangles. Barriers block movement and sight both; vitrines block
// movement only, so a watchman can still see over one.
export const BARRIERS = [
  // Outer shell.
  { x: 0, y: 0, w: 1280, h: 24 },
  { x: 0, y: 776, w: 1280, h: 24 },
  { x: 0, y: 0, w: 24, h: 800 },
  { x: 1256, y: 0, w: 24, h: 800 },
  // The vault, top centre, with a gap in its south wall (x 600-664).
  { x: 520, y: 60, w: 240, h: 16 },
  { x: 520, y: 60, w: 16, h: 176 },
  { x: 744, y: 60, w: 16, h: 176 },
  { x: 520, y: 220, w: 80, h: 16 },
  { x: 664, y: 220, w: 96, h: 16 },
  // Wing dividers, each leaving a doorway gap.
  { x: 400, y: 280, w: 16, h: 120 },
  { x: 400, y: 480, w: 16, h: 80 },
  { x: 864, y: 280, w: 16, h: 120 },
  { x: 864, y: 480, w: 16, h: 80 },
];

export const VITRINES = [
  { x: 300, y: 300, w: 90, h: 50 },
  { x: 890, y: 300, w: 90, h: 50 },
  { x: 300, y: 620, w: 90, h: 50 },
  { x: 890, y: 620, w: 90, h: 50 },
  { x: 595, y: 380, w: 90, h: 50 },
];

// The swag. The sapphire is the job itself: the door stays shut until it
// is in the bag.
export const SWAG = [
  { id: 'sapphire', kind: 'gem', label: 'Star Sapphire', x: 640, y: 140, worth: 500, key: true },
  { id: 'duchess', kind: 'painting', label: 'Portrait of the Duchess', x: 200, y: 340, worth: 200, key: false },
  { id: 'idol', kind: 'idol', label: 'Golden Idol', x: 1080, y: 340, worth: 250, key: false },
  { id: 'pearls', kind: 'pearls', label: 'Pearl Necklace', x: 345, y: 700, worth: 150, key: false },
  { id: 'mask', kind: 'mask', label: 'Jade Mask', x: 935, y: 700, worth: 150, key: false },
];

export const PATROLS = [
  { route: [{ x: 300, y: 470 }, { x: 980, y: 470 }] },
  { route: [{ x: 200, y: 300 }, { x: 200, y: 650 }] },
  { route: [{ x: 1080, y: 300 }, { x: 1080, y: 650 }] },
];

export const EYES = [
  // Under the vault door, sweeping the hall below it.
  { x: 640, y: 244, rest: Math.PI / 2 },
  // Top-right corner, sweeping down and to the left.
  { x: 980, y: 40, rest: Math.PI * 0.75 },
];

export const DOOR = { x: 600, y: 740, w: 80, h: 36 };
export const START = { x: 640, y: 716 };

export const POINTS = { bonusPerSecond: 2, bonusWindow: 600 };

// Palette: a gallery at night — dark wood, brass, deep red carpet, cold stone.
export const PAINT = {
  boards: '#241a12',
  plank: '#2b1f15',
  runner: '#5a1f24',
  brass: '#8a6d2f',
  stone: '#3a3f4a',
  stoneTop: '#565d6e',
  glass: '#7fb3c8',
  plinth: '#4a3220',
  bar: '#10131a',
  ink: '#e8dcc0',
  amber: '#e8b13c',
  red: '#e5484d',
  watchCone: 'rgba(232, 177, 60, 0.20)',
  watchConeEdge: 'rgba(232, 177, 60, 0.55)',
  lensCone: 'rgba(229, 72, 77, 0.16)',
  lensConeEdge: 'rgba(229, 72, 77, 0.5)',
  coat: '#1c2733',
  cloak: '#31465e',
  uniform: '#2c3e5e',
  cap: '#1a2436',
  glint: '#ffd75e',
  open: '#3ddc84',
  shut: '#8a8f98',
};
