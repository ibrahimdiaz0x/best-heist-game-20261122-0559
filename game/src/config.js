// The Marlow Heist — numbers and floor plan for one night in the gallery.
// A single thief crosses a top-down hall, dodges amber guard cones and red
// camera sweeps, lifts the Star Sapphire out of the vault, pockets whatever
// else fits, and leaves through the south door before the alarm meter fills.
// Nothing here is behaviour: the numbers live here so the rules module can
// stay pure logic and the painter can stay pure drawing.

export const FIELD = { width: 1280, height: 800 };

// The thief on foot. Sneaking is slow, but it halves the rate the alarm
// climbs and shrinks the distance from which a guard can spot you.
export const THIEF = {
  radius: 14,
  walkSpeed: 175,
  sneakSpeed: 92,
  sneakSightShrink: 0.62,
  sneakAlarmFactor: 0.5,
};

// A guard walks between waypoints, looks down a cone, and gives chase when
// the thief comes too close inside that cone.
export const GUARD = {
  radius: 15,
  patrolSpeed: 78,
  chaseSpeed: 205,
  sightRange: 235,
  sightHalfAngle: 0.61, // about 35 degrees to each side
  chaseTriggerRange: 80,
  chaseMemorySeconds: 3,
  touchAlarm: 25,
};

// A camera is bolted to a wall and sweeps its cone side to side. It never
// walks, but its cone reaches further than any guard's.
export const CAMERA = {
  sightRange: 265,
  sightHalfAngle: 0.52, // about 30 degrees to each side
  sweepHalfAngle: 0.9,
  sweepSeconds: 4.5,
  alarmPerSecond: 18,
};

// The alarm meter. A guard's gaze fills it fast, a camera's a little
// slower; out of sight it drains away. At 100 the gallery locks down.
export const ALARM = {
  guardPerSecond: 26,
  decayPerSecond: 6,
  decayLatePerSecond: 3,
  max: 100,
};

// Solid rectangles. Walls block both movement and sight; display cases block
// movement only, so a guard can still see over one.
export const WALLS = [
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

export const CASES = [
  { x: 300, y: 300, w: 90, h: 50 },
  { x: 890, y: 300, w: 90, h: 50 },
  { x: 300, y: 620, w: 90, h: 50 },
  { x: 890, y: 620, w: 90, h: 50 },
  { x: 595, y: 380, w: 90, h: 50 },
];

// The loot. The sapphire is the job itself: the exit stays locked until it
// is in the bag.
export const LOOT = [
  { id: 'sapphire', kind: 'gem', name: 'Star Sapphire', x: 640, y: 140, value: 500, required: true },
  { id: 'duchess', kind: 'painting', name: 'Portrait of the Duchess', x: 200, y: 340, value: 200, required: false },
  { id: 'idol', kind: 'idol', name: 'Golden Idol', x: 1080, y: 340, value: 250, required: false },
  { id: 'pearls', kind: 'pearls', name: 'Pearl Necklace', x: 345, y: 700, value: 150, required: false },
  { id: 'mask', kind: 'mask', name: 'Jade Mask', x: 935, y: 700, value: 150, required: false },
];

export const GUARDS = [
  { waypoints: [{ x: 300, y: 470 }, { x: 980, y: 470 }] },
  { waypoints: [{ x: 200, y: 300 }, { x: 200, y: 650 }] },
  { waypoints: [{ x: 1080, y: 300 }, { x: 1080, y: 650 }] },
];

export const CAMERAS = [
  // Under the vault door, sweeping the hall below it.
  { x: 640, y: 244, baseAngle: Math.PI / 2 },
  // Top-right corner, sweeping down and to the left.
  { x: 980, y: 40, baseAngle: Math.PI * 0.75 },
];

export const EXIT = { x: 600, y: 740, w: 80, h: 36 };
export const THIEF_START = { x: 640, y: 716 };

export const SCORE = { timeBonusPerSecond: 2, timeBonusCapSeconds: 600 };

// Palette: a gallery at night — dark wood, brass, deep red carpet, cold stone.
export const PALETTE = {
  floor: '#241a12',
  floorTile: '#2b1f15',
  carpet: '#5a1f24',
  carpetEdge: '#8a6d2f',
  wall: '#3a3f4a',
  wallTop: '#565d6e',
  caseGlass: '#7fb3c8',
  caseBase: '#4a3220',
  hudBar: '#10131a',
  hudText: '#e8dcc0',
  alarmLow: '#e8b13c',
  alarmHigh: '#e5484d',
  guardCone: 'rgba(232, 177, 60, 0.20)',
  guardConeEdge: 'rgba(232, 177, 60, 0.55)',
  cameraCone: 'rgba(229, 72, 77, 0.16)',
  cameraConeEdge: 'rgba(229, 72, 77, 0.5)',
  thief: '#1c2733',
  thiefCloak: '#31465e',
  guard: '#2c3e5e',
  guardCap: '#1a2436',
  lootGlow: '#ffd75e',
  exitOpen: '#3ddc84',
  exitLocked: '#8a8f98',
};
