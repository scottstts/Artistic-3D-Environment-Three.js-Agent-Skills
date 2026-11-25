#!/usr/bin/env node
// audit.mjs: command-line front end for audit-lib.mjs.
//
//   node audit.mjs scene.json [--ground-y 0] [--seat 0.01] [--tol 0.006] [--top 20]
//   node audit.mjs --self-test
//
// scene.json: { "meshes": [{ "name", "position": [...], "index": [...], "normal": [...]?, "matrix": [16]?, "group"?, "ground"?, "faceted"? }],
//               "frames"?: [ { "meshes": [...] }, ... ] }   optional animation frames, each audited for clearance
// Export it from the scene's builders in Node, or from a debug hook with meshesFromThree(scene).
// Prints a JSON report: the top hits of each audit, with mesh names and world positions.
import { readFileSync } from 'node:fs';
import { runAll, clearance } from './audit-lib.mjs';

const args = process.argv.slice(2);
if (!args.length || args[0] === '--help') { console.log('usage: node audit.mjs scene.json [--ground-y Y] [--seat S] [--tol T] [--top N] | --self-test'); process.exit(0); }
if (args[0] === '--self-test') { await import('./selftest.mjs'); process.exit(0); }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : d; };
const scene = JSON.parse(readFileSync(args[0], 'utf8')), top = opt('--top', 20), gy = opt('--ground-y', NaN);
const report = runAll(scene.meshes, {
  coplanar: { tolDist: opt('--tol', 0.006) },
  support: Number.isNaN(gy) ? {} : { groundHeight: () => gy },
  clearance: { seat: opt('--seat', 0.01) },
});
if (scene.frames) report.animation = scene.frames.map((f, i) => ({ frame: i, ...clearance(f.meshes, { seat: opt('--seat', 0.01) }).summary }));
for (const k of ['coplanar', 'support', 'clearance', 'shells', 'faceting']) report[k].hits = report[k].hits.slice(0, top);
console.log(JSON.stringify(report, null, 2));
