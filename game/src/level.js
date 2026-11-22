// The Marlow Heist — gallery floor plan.
//
// This module holds only data: the room the thief crosses, written from the
// bounty spec. Nothing here touches the DOM, so the same plan drives the
// browser game and the headless practice run. All coordinates are canvas
// pixels on a 1280 by 800 board; the top 56 pixels are the HUD strip and the
// gallery floor runs from y = 64 down to y = 784.

export const ARENA_W = 1280;
export const ARENA_H = 800;
export const HUD_H = 56;

// A blocker is a solid rectangle the thief, the guards and every line of
// sight must respect. kind is 'wall' for architecture and 'vitrine' for a
// glass display case (same collision, different paint).
function rect(x, y, w, h, kind) {
  return { x, y, w, h, kind };
}

// Outer shell of the gallery. The bottom wall leaves a doorway at the
// centre (x 580..700) where the exit sits.
export const OUTER_WALLS = [
  rect(16, 64, 1248, 16, 'wall'), // top
  rect(16, 768, 564, 16, 'wall'), // bottom, left of the exit door
  rect(700, 768, 564, 16, 'wall'), // bottom, right of the exit door
  rect(16, 64, 16, 720, 'wall'), // left
  rect(1248, 64, 16, 720, 'wall'), // right
];

// The vault: a small locked room at the top centre holding the Star
// Sapphire. Its only way in is the doorway gap (x 600..680) in its bottom
// wall, so the thief must cross the open floor to reach it.
export const VAULT_WALLS = [
  rect(520, 96, 240, 16, 'wall'), // vault top
  rect(520, 96, 16, 144, 'wall'), // vault left
  rect(744, 96, 16, 144, 'wall'), // vault right
  rect(520, 224, 80, 16, 'wall'), // vault bottom, left of the door
  rect(680, 224, 80, 16, 'wall'), // vault bottom, right of the door
];

// Freestanding wall stubs in the main hall. They break sight lines and
// give the thief cover to slip behind while a cone sweeps past.
export const HALL_STUBS = [
  rect(420, 300, 16, 120, 'wall'), // centre-left upright
  rect(844, 380, 16, 120, 'wall'), // centre-right upright
  rect(560, 470, 160, 16, 'wall'), // low crossbar below the hall centre
];

// Glass display cases. They block movement and sight exactly like walls,
// but read as furniture: a thief can hide behind one, never walk through.
export const VITRINES = [
  rect(180, 180, 120, 56, 'vitrine'), // west wing, north case
  rect(980, 180, 120, 56, 'vitrine'), // east wing, north case
  rect(180, 560, 120, 56, 'vitrine'), // west wing, south case
  rect(980, 560, 120, 56, 'vitrine'), // east wing, south case
  rect(470, 600, 96, 48, 'vitrine'), // hall floor, south-west case
  rect(714, 600, 96, 48, 'vitrine'), // hall floor, south-east case
];

// The red carpet of the main hall. Pure decoration: it marks the grand
// room the thief crosses, but walking on it is no different from the
// wooden floor around it.
export const CARPET = { x: 380, y: 300, w: 520, h: 400 };

// Every solid rectangle in the gallery, in one list, for collision and
// for the line-of-sight tests.
export function allBlockers() {
  return [...OUTER_WALLS, ...VAULT_WALLS, ...HALL_STUBS, ...VITRINES];
}

// The five pieces, from the richest to the smallest. The Star Sapphire
// sits alone in the vault at the top centre; the other four wait in the
// open wings, each just off a patrol lane so the thief can lift one
// without standing on a guard's exact footsteps.
export const LOOT_PIECES = [
  { name: 'Star Sapphire', value: 500, x: 640, y: 158, gem: 'sapphire' },
  { name: 'Jade Idol', value: 300, x: 205, y: 320, gem: 'jade' },
  { name: 'Gold Mask', value: 300, x: 1075, y: 320, gem: 'gold' },
  { name: 'Ruby Brooch', value: 200, x: 205, y: 680, gem: 'ruby' },
  { name: 'Pearl Strand', value: 200, x: 1075, y: 680, gem: 'pearl' },
];

// The three guards. Each walks a rectangular beat and turns back at the
// end of it (a ping-pong patrol), facing the way he walks. viewDist is
// how far he can spot the thief, halfAngle is half the width of his
// vision cone.
export const GUARDS = [
  {
    name: 'Rook',
    waypoints: [[240, 300], [240, 540], [330, 540], [330, 300]],
    speed: 58,
    viewDist: 235,
    halfAngle: 0.56,
  },
  {
    name: 'Bishop',
    waypoints: [[1040, 300], [1040, 540], [950, 540], [950, 300]],
    speed: 58,
    viewDist: 235,
    halfAngle: 0.56,
  },
  {
    name: 'Knight',
    waypoints: [[470, 340], [810, 340], [810, 560], [470, 560]],
    speed: 66,
    viewDist: 250,
    halfAngle: 0.56,
  },
];

// The two wall cameras. Each sweeps its cone back and forth around a base
// heading like a slow pendulum; phase staggers the east camera half a
// swing behind the west one so the two never sweep in step.
export const CAMERAS = [
  {
    name: 'Cam West',
    x: 64,
    y: 96,
    baseAngle: 0.96,
    sweep: 0.85,
    period: 7,
    phase: 0,
    viewDist: 320,
    halfAngle: 0.44,
  },
  {
    name: 'Cam East',
    x: 1216,
    y: 96,
    baseAngle: Math.PI - 0.96,
    sweep: 0.85,
    period: 7,
    phase: Math.PI,
    viewDist: 320,
    halfAngle: 0.44,
  },
];

// The way out: the doorway in the bottom wall, dead centre, wide enough
// for its painted label to sit inside it. It stays locked until every
// piece is pocketed, then it is the only way home.
export const EXIT_DOOR = { x: 580, y: 762, w: 120, h: 38 };

// Where the thief slips in: just inside the exit door, at the bottom
// centre of the hall.
export const THIEF_START = { x: 640, y: 730 };

// One object holding the whole gallery, handed to the engine, the
// painter and the practice driver alike.
export function buildGallery() {
  return {
    width: ARENA_W,
    height: ARENA_H,
    hudHeight: HUD_H,
    carpet: CARPET,
    blockers: allBlockers(),
    loot: LOOT_PIECES.map((p) => ({ ...p })),
    guards: GUARDS.map((g) => ({ ...g, waypoints: g.waypoints.map((w) => [...w]) })),
    cameras: CAMERAS.map((c) => ({ ...c })),
    exit: { ...EXIT_DOOR },
    start: { ...THIEF_START },
  };
}
