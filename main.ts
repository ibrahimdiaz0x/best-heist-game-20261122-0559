// The Marlow Heist — the hand-in program.
//
// It copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with the kit's buildDossier,
// byte for byte what the scorer rebuilds from the same files. Outside
// the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Standard library only; Node 22 runs this TypeScript as it is, with no
// build step and nothing to install.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory this file lives in; the output
// directory is the grader's /output, or MAKEFUN_OUTPUT_DIR when set.
const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

// The caps the bounty scores the dossier under: the text budget, the
// screenshot count and size, and the game tree limits from the kit.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
};

function handIn() {
  // Start from a clean output directory so a stale file can never
  // survive into the dossier.
  rmSync(join(OUT, 'game'), { recursive: true, force: true });
  rmSync(join(OUT, 'screenshots'), { recursive: true, force: true });
  rmSync(join(OUT, 'dossier.json'), { force: true });
  mkdirSync(OUT, { recursive: true });
  if (!existsSync(join(ROOT, 'game'))) {
    throw new Error('game/ is missing from the repository');
  }
  cpSync(join(ROOT, 'game'), join(OUT, 'game'), { recursive: true });
  if (existsSync(join(ROOT, 'screenshots'))) {
    cpSync(join(ROOT, 'screenshots'), join(OUT, 'screenshots'), { recursive: true });
  }
  const dossier = buildDossier(OUT, DOSSIER_CAPS);
  writeFileSync(join(OUT, 'dossier.json'), dossier);
  console.log(
    'Marlow Heist handed in: game/ + screenshots/ + dossier.json (' +
      dossier.length +
      ' bytes) in ' +
      OUT,
  );
}

handIn();
