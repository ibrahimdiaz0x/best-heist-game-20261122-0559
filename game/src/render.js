// The Marlow Heist — the painter.
//
// One job: draw the current run on the canvas. It reads the run state
// and the gallery plan and nothing else, so the same picture appears in
// the browser and in every screenshot. Colours are the gallery at night:
// dark wood, a red carpet, gold-trimmed glass, amber guard cones and red
// camera cones, with the loot glowing against it all.

import { guardPoseAt, cameraAngleAt, ALARM_HOT_AT } from './engine.js';

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

const PALETTE = {
  floor: '#241a12',
  floorLine: '#2e2115',
  carpet: '#571d24',
  carpetEdge: '#8a6a2f',
  vaultFloor: '#1d2b26',
  wall: '#3a3f4a',
  wallTop: '#565d6d',
  vitrine: '#4a4f58',
  vitrineGlass: '#6a7686',
  vitrineGold: '#a8873c',
  guardCone: 'rgba(255, 190, 80, 0.20)',
  guardConeEdge: 'rgba(255, 190, 80, 0.55)',
  cameraCone: 'rgba(255, 70, 70, 0.15)',
  cameraConeEdge: 'rgba(255, 70, 70, 0.5)',
  seenCone: 'rgba(255, 60, 60, 0.34)',
  seenConeEdge: 'rgba(255, 60, 60, 0.8)',
  thief: '#1c2733',
  thiefTrim: '#d8b45a',
  hud: '#0f1218',
  hudLine: '#8a6a2f',
  gold: '#d8b45a',
  cream: '#f2e8d5',
  muted: '#9a8f7a',
  green: '#3fce7c',
  red: '#ff5252',
};

const GEM_COLOURS = {
  sapphire: '#6db7ff',
  jade: '#58d68d',
  gold: '#ffd34d',
  ruby: '#ff5a5a',
  pearl: '#e8f4ff',
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx, gallery) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Wooden boards: faint horizontal seams across the floor.
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let y = 96; y < CANVAS_H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(CANVAS_W - 32, y);
    ctx.stroke();
  }
  // The vault's floor is green marble, so the sapphire's room reads as
  // a different place from the hall.
  ctx.fillStyle = PALETTE.vaultFloor;
  ctx.fillRect(536, 112, 208, 112);
  // The red carpet of the main hall, edged in gold.
  const c = gallery.carpet;
  ctx.fillStyle = PALETTE.carpet;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = PALETTE.carpetEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
}

function drawBlockers(ctx, gallery) {
  for (const b of gallery.blockers) {
    if (b.kind === 'vitrine') {
      ctx.fillStyle = PALETTE.vitrine;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = PALETTE.vitrineGlass;
      ctx.fillRect(b.x + 5, b.y + 5, b.w - 10, b.h - 10);
      ctx.strokeStyle = PALETTE.vitrineGold;
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x + 8, b.y + b.h - 8);
      ctx.lineTo(b.x + b.w - 8, b.y + 8);
      ctx.stroke();
    } else {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = PALETTE.wallTop;
      if (b.w >= b.h) ctx.fillRect(b.x, b.y, b.w, 3);
      else ctx.fillRect(b.x, b.y, 3, b.h);
    }
  }
}

function drawLoot(ctx, state) {
  for (const piece of state.loot) {
    const colour = GEM_COLOURS[piece.gem] || PALETTE.gold;
    if (piece.taken) {
      // A lifted piece leaves only its empty velvet cushion behind.
      ctx.strokeStyle = 'rgba(216, 180, 90, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(piece.x, piece.y, 9, 0, Math.PI * 2);
      ctx.stroke();
      continue;
    }
    const glow = ctx.createRadialGradient(piece.x, piece.y, 2, piece.x, piece.y, 34);
    glow.addColorStop(0, colour);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // The gem itself: a small diamond, bright at its centre.
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(piece.x, piece.y - 11);
    ctx.lineTo(piece.x + 8, piece.y);
    ctx.lineTo(piece.x, piece.y + 11);
    ctx.lineTo(piece.x - 8, piece.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.moveTo(piece.x, piece.y - 5);
    ctx.lineTo(piece.x + 3, piece.y);
    ctx.lineTo(piece.x, piece.y + 5);
    ctx.lineTo(piece.x - 3, piece.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawExit(ctx, state) {
  const door = state.gallery.exit;
  const open = state.loot.every((piece) => piece.taken);
  ctx.fillStyle = open ? 'rgba(63, 206, 124, 0.30)' : 'rgba(120, 120, 120, 0.25)';
  ctx.fillRect(door.x - 6, door.y - 4, door.w + 12, door.h + 4);
  ctx.fillStyle = open ? PALETTE.green : '#8a8a8a';
  ctx.fillRect(door.x, door.y, door.w, door.h);
  ctx.fillStyle = '#0f1218';
  ctx.font = '700 13px Georgia, "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT — GO' : 'EXIT • LOCKED', door.x + door.w / 2, door.y + door.h / 2 + 1);
}

// --- Guards, cameras and the thief ---

function drawCone(ctx, ox, oy, angle, halfAngle, dist, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, dist, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuards(ctx, state) {
  state.gallery.guards.forEach((guard, i) => {
    const pose = guardPoseAt(guard, state.time);
    const spotting = state.seen && state.seen.by === 'guard' && state.seen.who === i;
    drawCone(
      ctx,
      pose.x,
      pose.y,
      pose.angle,
      guard.halfAngle,
      guard.viewDist,
      spotting ? PALETTE.seenCone : PALETTE.guardCone,
      spotting ? PALETTE.seenConeEdge : PALETTE.guardConeEdge,
    );
  });
  state.gallery.guards.forEach((guard) => {
    const pose = guardPoseAt(guard, state.time);
    // The guard himself: a dark uniformed figure with a gold ring, and
    // a short tick showing which way he faces.
    ctx.fillStyle = '#232830';
    ctx.strokeStyle = PALETTE.thiefTrim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pose.x, pose.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#e8e2d2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pose.x, pose.y);
    ctx.lineTo(pose.x + Math.cos(pose.angle) * 19, pose.y + Math.sin(pose.angle) * 19);
    ctx.stroke();
  });
}

function drawCameras(ctx, state) {
  state.gallery.cameras.forEach((camera, i) => {
    const angle = cameraAngleAt(camera, state.time);
    const spotting = state.seen && state.seen.by === 'camera' && state.seen.who === i;
    drawCone(
      ctx,
      camera.x,
      camera.y,
      angle,
      camera.halfAngle,
      camera.viewDist,
      spotting ? PALETTE.seenCone : PALETTE.cameraCone,
      spotting ? PALETTE.seenConeEdge : PALETTE.cameraConeEdge,
    );
  });
  for (const camera of state.gallery.cameras) {
    // A small wall-mounted camera: a dark housing with a red lens eye.
    ctx.fillStyle = '#1a1d24';
    ctx.strokeStyle = '#565d6d';
    ctx.lineWidth = 1.5;
    rr(ctx, camera.x - 9, camera.y - 7, 18, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff4040';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawThief(ctx, state) {
  const t = state.thief;
  const r = state.alarmMode ? 12 : 13;
  // A soft shadow of gold light around the thief, so he reads against
  // the dark floor even inside a cone.
  const glow = ctx.createRadialGradient(t.x, t.y, 2, t.x, t.y, 30);
  glow.addColorStop(0, 'rgba(216, 180, 90, 0.28)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(t.x, t.y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#26344a';
  ctx.strokeStyle = PALETTE.thiefTrim;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // The facing tick: which way the thief is looking.
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(state.facing) * (r + 6), t.y + Math.sin(state.facing) * (r + 6));
  ctx.stroke();
}

// --- The HUD strip ---

function drawHud(ctx, state) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, CANVAS_W, 56);
  ctx.fillStyle = PALETTE.hudLine;
  ctx.fillRect(0, 55, CANVAS_W, 2);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = '700 20px Georgia, "Times New Roman", serif';
  const taken = state.loot.filter((piece) => piece.taken).length;
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText('SWAG ' + taken + '/5', 24, 29);
  ctx.fillText('HAUL ' + state.haul, 230, 29);
  const seconds = Math.floor(state.elapsed);
  const clock = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  ctx.fillText('TIME ' + clock, 470, 29);
  // The siren: a bar that fills as the alarm climbs, green to amber to
  // red, with a warning mark while the thief is hot.
  ctx.fillText('SIREN', 640, 29);
  const barX = 722;
  const barW = 200;
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, 18, barW, 20);
  const fillW = Math.round((barW * state.alarm) / 100);
  ctx.fillStyle = state.alarm >= 70 ? PALETTE.red : state.alarm >= 30 ? '#ffb84d' : PALETTE.green;
  if (fillW > 0) ctx.fillRect(barX + 1, 19, Math.max(0, fillW - 2), 18);
  if (state.alarmMode) {
    ctx.fillStyle = PALETTE.red;
    ctx.font = '700 22px Georgia, "Times New Roman", serif';
    ctx.fillText('!', barX + barW + 12, 29);
  }
  // The job, right-aligned: what the thief still owes the night.
  ctx.textAlign = 'right';
  ctx.font = '700 16px Georgia, "Times New Roman", serif';
  const done = state.loot.every((piece) => piece.taken);
  ctx.fillStyle = done ? PALETTE.green : PALETTE.gold;
  ctx.fillText(done ? 'SAPPHIRE SECURED — REACH THE EXIT' : 'STEAL THE STAR SAPPHIRE', 1256, 29);
}

// --- Screens and banners ---

function dim(ctx, alpha) {
  ctx.fillStyle = 'rgba(6, 6, 10, ' + alpha + ')';
  ctx.fillRect(0, 56, CANVAS_W, CANVAS_H - 56);
}

function drawTitle(ctx) {
  dim(ctx, 0.72);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '700 62px Georgia, "Times New Roman", serif';
  ctx.fillText('THE MARLOW HEIST', CANVAS_W / 2, 300);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '20px Georgia, "Times New Roman", serif';
  ctx.fillText('A top-down gallery heist — lift all five pieces and slip out the door.', CANVAS_W / 2, 352);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '17px Georgia, "Times New Roman", serif';
  ctx.fillText('Move  WASD or arrow keys      Sneak  Shift      Start  Enter', CANVAS_W / 2, 412);
  ctx.fillText('Five pieces. Three guards. Two cameras. One door out.', CANVAS_W / 2, 444);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '700 22px Georgia, "Times New Roman", serif';
  ctx.fillText('Press Enter to begin', CANVAS_W / 2, 512);
}

function drawCaught(ctx, state) {
  dim(ctx, 0.66);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.red;
  ctx.font = '700 68px Georgia, "Times New Roman", serif';
  ctx.fillText('CAUGHT!', CANVAS_W / 2, 330);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '20px Georgia, "Times New Roman", serif';
  ctx.fillText(
    state.caughtBy === 'guard'
      ? 'A guard laid hands on the thief.'
      : 'The siren hit 100 — the gallery is locked down.',
    CANVAS_W / 2,
    386,
  );
  ctx.fillText('Press R to run it again', CANVAS_W / 2, 470);
}

function drawWon(ctx, state) {
  dim(ctx, 0.66);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.green;
  ctx.font = '700 64px Georgia, "Times New Roman", serif';
  ctx.fillText('CLEAN GETAWAY', CANVAS_W / 2, 300);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '20px Georgia, "Times New Roman", serif';
  ctx.fillText(
    'Clean getaway — 5 of 5 pieces, time bonus ' + state.timeBonus + '.',
    CANVAS_W / 2,
    360,
  );
  ctx.fillText('Final haul: ' + state.finalScore, CANVAS_W / 2, 398);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = '700 22px Georgia, "Times New Roman", serif';
  ctx.fillText('Press R to run it again', CANVAS_W / 2, 480);
}

// The whole frame, in order: floor, exit, walls and cases, loot, cones,
// people, the HUD, then whatever screen the run is on.
export function drawScene(ctx, state) {
  const gallery = state.gallery;
  drawFloor(ctx, gallery);
  drawExit(ctx, state);
  drawBlockers(ctx, gallery);
  drawLoot(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawThief(ctx, state);
  drawHud(ctx, state);
  if (state.phase === 'playing' && state.seen) {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.red;
    ctx.font = '700 30px Georgia, "Times New Roman", serif';
    ctx.fillText('SPOTTED!', CANVAS_W / 2, 108);
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 62, CANVAS_W - 12, CANVAS_H - 68);
  }
  if (state.phase === 'title') drawTitle(ctx);
  if (state.phase === 'caught') drawCaught(ctx, state);
  if (state.phase === 'won') drawWon(ctx, state);
}
