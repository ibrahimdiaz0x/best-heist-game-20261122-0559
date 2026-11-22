// The Marlow Heist — a tiny static file server for local play-testing.
//
// Serves game/ at the root: / opens game/index.html, /src/*.js serve the
// modules, and an unknown path falls back to the game page so a staged
// scene link still opens the game. Standard library only; run it with
// `node serve.ts --port 8080` (the screenshot driver uses port 8902).

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GAME_DIR = join(dirname(fileURLToPath(import.meta.url)), 'game');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function portFromArgs() {
  const i = process.argv.indexOf('--port');
  const p = i >= 0 ? Number(process.argv[i + 1]) : 8080;
  return Number.isFinite(p) && p > 0 ? p : 8080;
}

// A browser automation quirk can deliver the whole target URL
// percent-encoded as the path (/%2F%3Fscene%3Dplay). Unwrap it with a
// redirect, so the page lands on a clean URL whose query string the
// game can actually read.
const server = createServer(async (req, res) => {
  const raw = req.url ?? '/';
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  if (decoded !== raw && decoded.startsWith('/') && decoded.includes('?')) {
    res.writeHead(302, { Location: decoded });
    res.end();
    return;
  }
  const path = decoded.split('?')[0] || '/';
  const file = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
  const full = join(GAME_DIR, normalize(file));
  if (!full.startsWith(GAME_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }
  try {
    const data = await readFile(full);
    res.writeHead(200, { 'Content-Type': TYPES[extname(full)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    // Unknown path: serve the game page itself.
    try {
      const data = await readFile(join(GAME_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': TYPES['.html'] });
      res.end(data);
    } catch {
      res.writeHead(500);
      res.end();
    }
  }
});

const PORT = portFromArgs();
server.listen(PORT, '127.0.0.1', () => {
  console.log('Marlow Heist serving game/ on port ' + PORT);
});
