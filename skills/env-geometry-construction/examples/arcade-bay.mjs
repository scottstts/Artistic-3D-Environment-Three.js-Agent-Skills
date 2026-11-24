// arcade-bay.mjs: one bay of a carved arcade built the way a mason would build it, using meshkit.
// Shows the construction standard in code:
// - the opening is cut through the wall (front, back and reveals in one solid), not painted on;
// - the archivolt is a moulded profile swept along the true arch curve, concentric with the opening;
// - imposts sit flush with the opening's inner edge, so nothing juts into the void, and carry the archivolt;
// - every applied part rests exactly on its host on shared coordinates (coincident, opposite-facing
//   contact), so no face of one part lies in the plane of a host face: no coplanar overlap, no gaps;
// - the entablature is one solid whose plan breaks forward over the pilasters, giving the bay depth.
// The geometry audit (env-geometry-audit) reports zero same-facing coplanar pairs and no interpenetration.
//
// Run: node arcade-bay.mjs [out.obj]   prints a solid check per slot and optionally writes an OBJ.
import { MeshWriter, closedSolidCheck, rectLoop, archLoop, notchOutline } from '../scripts/meshkit/meshkit.mjs';
import { writeFileSync } from 'node:fs';
import { coplanar, clearance, shells, support } from '../../env-geometry-audit/scripts/audit-lib.mjs';

const BAY = 4.2, H = 6.0, T = 0.6;                   // bay width, wall height, wall thickness
const OPEN_W = 2.4, SPRING = 3.2, SILL = 0.0;        // opening width, springing height, sill height
const PIL_W = 0.5, PIL_IN = 0.1, PIL_D = 0.18;       // pilaster width, inset from the bay edge, projection
const ENT_H = 0.9, ENT_D = 0.2, BREAK_D = 0.34;      // entablature height, depth, depth over the pilasters

const w = new MeshWriter();
const ox = (BAY - OPEN_W) / 2, r = OPEN_W / 2, cx = BAY / 2, cy = SILL + SPRING;

// 1. the wall with its arched opening, as one closed solid (front at z = 0, back at z = -T). The arch
//    reaches the floor, so it is a notch in the outline, not a hole.
w.use('stone').extrude(notchOutline(BAY, H, [archLoop(ox, SILL, OPEN_W, SPRING, { kind: 'round', segments: 40 })]), [], T, { maxEdge: 0.4 });

// 2. archivolt: a stepped moulding (fascia, bead, cyma-like step) swept along the arch, resting on the face
const molding = [[0, 0], [0.22, 0], [0.22, 0.05], [0.16, 0.08], [0.12, 0.12], [0.02, 0.14], [0, 0.10]];
const arcPath = []; for (let i = 0; i <= 40; i++) { const a = Math.PI * (i / 40); arcPath.push([cx + r * Math.cos(a), cy + r * Math.sin(a), 0]); }
// profile x runs outward from the opening edge, y out of the wall: sweep along the arch with "up" = +z
w.sweep(molding, arcPath, { up: [0, 0, 1], creaseDeg: 35 });

// 3. imposts: blocks under the archivolt's feet, inner face flush with the opening edge, flaring outward only
for (const side of [-1, 1]) {
  const ix = side < 0 ? ox : ox + OPEN_W, x0 = side < 0 ? -0.25 : 0, x1 = side < 0 ? 0 : 0.25;
  w.push().translate(ix, cy - 0.18, 0);
  w.extrude([[x0, 0], [x1, 0], [x1, 0.18], [x0, 0.18]], [], 0.16, { surface: (s, t, d) => [s, t, d + 0.16] });
  w.pop();
}

// 4. pilasters, resting on the wall face and carrying the entablature
for (const px of [PIL_IN, BAY - PIL_IN - PIL_W]) {
  w.push().translate(px, 0, 0);
  w.extrude(rectLoop(0, 0, PIL_W, H - ENT_H), [], PIL_D, { surface: (s, t, d) => [s, t, d + PIL_D] });
  w.pop();
}

// 5. entablature: ONE solid. Its plan (x across the bay, z out of the wall) breaks forward over each
//    pilaster; extruded vertically from the top of the wall down by ENT_H.
const b0 = PIL_IN - 0.03, b1 = PIL_IN + PIL_W + 0.03, plan = [
  [0, 0], [BAY, 0], [BAY, ENT_D], [BAY - b0, ENT_D], [BAY - b0, BREAK_D], [BAY - b1, BREAK_D], [BAY - b1, ENT_D],
  [b1, ENT_D], [b1, BREAK_D], [b0, BREAK_D], [b0, ENT_D], [0, ENT_D],
];
w.extrude(plan, [], ENT_H, { surface: (s, t, d) => [s, H + d, t] });

const built = w.build();
for (const [slot, g] of Object.entries(built)) {
  console.log(slot, `${g.index.length / 3} triangles`, closedSolidCheck(g));
}
// every part is a closed solid on its own
if (!Object.values(built).every((g) => closedSolidCheck(g).watertight)) { console.error('a part is not closed'); process.exit(1); }

// run the scene audits on the result, as every build step should
const meshes = Object.entries(built).map(([name, g]) => ({ name, position: g.position, index: g.index, part: g.part }));
const report = {
  coplanarSameFacing: coplanar(meshes, { sameFacingOnly: true }).summary.pairs,
  interpenetrating: clearance(meshes, { seat: 0.01 }).summary.pairs,
  shellIssues: shells(meshes).summary.withIssues,
  unsupported: support(meshes, { groundHeight: () => 0 }).summary.unsupported,
};
console.log('audit', report);
if (Object.values(report).some((n) => n > 0)) { console.error('audit found defects'); process.exit(1); }

const out = process.argv[2];
if (out) { // minimal OBJ for inspection in any viewer
  let s = '', base = 1;
  for (const [slot, g] of Object.entries(built)) {
    s += `o ${slot}\n`;
    for (let i = 0; i < g.position.length; i += 3) s += `v ${g.position[i]} ${g.position[i + 1]} ${g.position[i + 2]}\n`;
    for (let i = 0; i < g.normal.length; i += 3) s += `vn ${g.normal[i]} ${g.normal[i + 1]} ${g.normal[i + 2]}\n`;
    for (let i = 0; i < g.index.length; i += 3) { const [a, b, c] = [g.index[i] + base, g.index[i + 1] + base, g.index[i + 2] + base]; s += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`; }
    base += g.position.length / 3;
  }
  writeFileSync(out, s); console.log('wrote', out);
}
