/* Runs after `next build` (npm postbuild).
 *
 * The client router prefetches each page's segments as one dot-joined file,
 * e.g. /lots/__next.!KGVuKQ.lots.__PAGE__.txt. Next 16.4's static export builds
 * that name from a path.relative() result, which has backslashes on Windows,
 * and only swaps "/" for "." So a Windows build writes
 * out/lots/__next.!KGVuKQ/lots/__PAGE__.txt instead, and every prefetch 404s.
 * Navigation still works (it falls back to the full lots.txt payload), but each
 * prefetch is wasted and logs a console error.
 *
 * This moves every file under an out/.../__next.* directory to the dot-joined
 * name the client asks for. A Linux build has no such directories, so here it
 * does nothing.
 *
 * ponytail: workaround for node_modules/next/dist/export/index.js
 * collectSegmentPaths. Delete this script and the postbuild entry once a Next
 * release normalizes the separator (a Windows build then leaves no __next.*
 * directories, and test_security.py checks for exactly that).
 */
import fs from "node:fs";
import path from "node:path";

let moved = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "_next") continue;
    if (entry.name.startsWith("__next.")) flatten(dir, entry.name);
    else walk(path.join(dir, entry.name));
  }
}

function flatten(parent, name) {
  const root = path.join(parent, name);
  for (const rel of fs.readdirSync(root, { recursive: true })) {
    const src = path.join(root, rel);
    if (!fs.statSync(src).isFile()) continue;
    fs.renameSync(src, path.join(parent, `${name}.${rel.split(/[\\/]/).join(".")}`));
    moved++;
  }
  fs.rmSync(root, { recursive: true });
}

walk("out");
console.log(`flatten-segments: ${moved} segment file(s) renamed`);
