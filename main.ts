// The Marlow Heist — hand-in program (Node 22, standard library only).
// The game itself is plain static files under game/ (index.html plus its ES
// modules, no library, no network request), and this program hands it in: it
// copies game/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with the vendored make.fun
// library, the summary the judge reads. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const handInDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function stageFolder(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(handInDir, { recursive: true });
stageFolder(join(repoRoot, 'game'), join(handInDir, 'game'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  stageFolder(join(repoRoot, 'screenshots'), join(handInDir, 'screenshots'));
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files, in all, or a path under game/ over 1000 bytes).
writeFileSync(
  join(handInDir, 'dossier.json'),
  buildDossier(handInDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
