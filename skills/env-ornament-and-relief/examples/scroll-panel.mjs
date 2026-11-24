// scroll-panel.mjs: a carved running-scroll (rinceau) panel as one closed solid, built with meshkit.
// Shows the ornament standard in code:
// - one continuous composition: an undulating stem with a scroll at every wave, each coiling to a rosette;
//   nothing is scattered, and every element grows out of the stem;
// - carved, not glued: the relief is a height field rising out of the panel's own ground inside a
//   moulded frame, so there is no flat plane with pieces stuck on it;
// - full sections: stem and scrolls are rounded (half-round falloff) and taper toward their tips,
//   so they read as carved stems, not flat ribbons;
// - sized by tier: the stem and scrolls are the medium tier; the rosette petals are the fine tier.
//
// Run: node scroll-panel.mjs [out.obj]
import { MeshWriter, closedSolidCheck } from '../../env-geometry-construction/scripts/meshkit/meshkit.mjs';
import { writeFileSync } from 'node:fs';

const W = 2.4, Hh = 0.6;                  // panel size (m)
const BASE = 0.04;                        // panel ground thickness behind the relief
const FRAME = 0.05, FRAME_H = 0.035;      // moulded frame width and height
const NU = 360, NV = 90;                  // grid resolution: ~6.7 mm cells, fine enough for the tiers below

// ---------- composition
const waves = 3, lambda = (W - 2 * FRAME) / waves, A = 0.09, cy = Hh / 2;
const stemY = (s) => cy + A * Math.sin((2 * Math.PI * (s - FRAME)) / lambda);
// Each scroll branches off the stem just after a trough (upper bay) or a crest (lower bay), leaves it at
// a small angle, and coils back into the bay it faces. Curvature ramps up along its length (an Euler
// spiral), so the scroll opens wide and closes into a tight eye where the rosette sits.
const scrolls = [];
const stemAngle = (s) => Math.atan((2 * Math.PI * A / lambda) * Math.cos((2 * Math.PI * (s - FRAME)) / lambda));
for (let k = 0; k < waves * 2; k++) {
  const upper = k % 2 === 0, side = upper ? 1 : -1;                 // +1 coils counter-clockwise (upper bay)
  const phase = upper ? 0.75 : 0.25;                                // trough feeds the upper bay, crest the lower
  const s0 = FRAME + lambda * (Math.floor(k / 2) + phase + 0.12);
  if (s0 > W - FRAME - 0.05) continue;
  const L = 0.6, n = 200, turn = 1.6 * 2 * Math.PI;                // length and total turning of the scroll
  const k0 = 1.7, k1 = (turn - k0 * L) * 3 / L;                     // κ(l) = k0 + k1·(l/L)², ∫κ = turn
  let x = s0, y = stemY(s0), h = stemAngle(s0) + side * 0.45;
  const pts = [[x, y, 1]];
  for (let i = 1; i <= n; i++) {
    const l = (i / n) * L, kap = k0 + k1 * (l / L) ** 2;
    h += side * kap * (L / n); x += Math.cos(h) * (L / n); y += Math.sin(h) * (L / n);
    pts.push([x, y, 1 - i / n]);
  }
  scrolls.push({ pts, eye: pts[pts.length - 1], root: pts[0], dir: stemAngle(s0) + side * 0.45 });
}

// ---------- height field (union of rounded members: max of their heights)
const tube = (d, r) => (d < r ? Math.sqrt(1 - (d / r) * (d / r)) * r : 0); // half-round section of radius r
function segDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
  return [Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]), t];
}
function height(s, t) {
  if (s < 0 || s > W || t < 0 || t > Hh) return 0;
  const edge = Math.min(s, W - s, t, Hh - t);
  if (edge < FRAME) { // frame: an ovolo-like moulding rising from the outer edge, dropping to the field
    const u = edge / FRAME; return FRAME_H * Math.sin(Math.PI * Math.min(1, u * 1.1));
  }
  let h = 0;
  const slope = (2 * Math.PI * A / lambda) * Math.cos((2 * Math.PI * (s - FRAME)) / lambda);
  const dStem = Math.abs(t - stemY(s)) / Math.sqrt(1 + slope * slope);
  h = Math.max(h, tube(dStem, 0.018));
  for (const sc of scrolls) {
    for (let i = 0; i + 1 < sc.pts.length; i++) {
      const a = sc.pts[i], b = sc.pts[i + 1], [d, f] = segDist([s, t], a, b);
      const taper = a[2] + (b[2] - a[2]) * f; // 1 at the stem, 0 at the eye
      h = Math.max(h, tube(d, 0.006 + 0.013 * taper));
    }
    const de = Math.hypot(s - sc.eye[0], t - sc.eye[1]); // rosette in the eye: eight cupped petals around a boss
    if (de < 0.03) {
      const ang = Math.atan2(t - sc.eye[1], s - sc.eye[0]), petal = Math.pow(0.5 + 0.5 * Math.cos(8 * ang), 0.6);
      h = Math.max(h, 0.017 * Math.sqrt(1 - de / 0.03) * petal, tube(de, 0.008) * 1.4);
    }
    // sheath leaf over the junction: a pointed lobe wrapping the branch where it leaves the stem
    const lx = s - sc.root[0], ly = t - sc.root[1], u = lx * Math.cos(sc.dir) + ly * Math.sin(sc.dir), v = -lx * Math.sin(sc.dir) + ly * Math.cos(sc.dir);
    if (u > -0.04 && u < 0.1) {
      const halfW = 0.034 * Math.sin(Math.PI * (u + 0.04) / 0.14), dv = Math.abs(v);
      if (dv < halfW) { const rib = 1 - 0.35 * Math.exp(-(dv * dv) / 2e-5); h = Math.max(h, 0.024 * Math.sqrt(1 - dv / halfW) * rib); }
    }
  }
  return h;
}

// ---------- closed solid: displaced front grid, flat back, four sides
const w = new MeshWriter().use('stone');
const P = (i, j) => { const s = (W * i) / NU, t = (Hh * j) / NV; return [s, t, BASE + height(s, t)]; };
const tris = [];
for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
  const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
  tris.push({ p: [a, b, c] }, { p: [a, c, d] });                                   // front, faces +z
  const A0 = [a[0], a[1], 0], B0 = [b[0], b[1], 0], C0 = [c[0], c[1], 0], D0 = [d[0], d[1], 0];
  tris.push({ p: [A0, C0, B0] }, { p: [A0, D0, C0] });                             // back, faces -z
}
const side = (pts) => { for (let k = 0; k + 1 < pts.length; k++) { const a = pts[k], b = pts[k + 1]; tris.push({ p: [a, [a[0], a[1], 0], [b[0], b[1], 0]] }, { p: [a, [b[0], b[1], 0], b] }); } };
side([...Array(NU + 1)].map((_, i) => P(i, 0)));             // bottom (sides face right of travel)
side([...Array(NV + 1)].map((_, j) => P(NU, NV - j)).reverse()); // right
side([...Array(NU + 1)].map((_, i) => P(i, NV)).reverse());  // top
side([...Array(NV + 1)].map((_, j) => P(0, j)).reverse());   // left
w.patch(tris, { crease: 50 });

const g = w.build().stone, c = closedSolidCheck(g);
console.log(`${g.index.length / 3} triangles`, c);
if (!c.watertight || c.volume <= 0) { console.error('panel is not a closed outward solid'); process.exit(1); }
if (process.argv[2]) {
  let s = 'o scroll_panel\n';
  for (let i = 0; i < g.position.length; i += 3) s += `v ${g.position[i]} ${g.position[i + 1]} ${g.position[i + 2]}\n`;
  for (let i = 0; i < g.index.length; i += 3) s += `f ${g.index[i] + 1} ${g.index[i + 1] + 1} ${g.index[i + 2] + 1}\n`;
  writeFileSync(process.argv[2], s); console.log('wrote', process.argv[2]);
}
if (process.argv[3]) { // optional height-field preview as a greyscale PGM, for checking the composition
  const sx = 960, sy = 240; let s = `P2\n${sx} ${sy}\n255\n`;
  for (let j = sy - 1; j >= 0; j--) { const row = []; for (let i = 0; i < sx; i++) row.push(Math.round(Math.min(1, height((W * i) / sx, (Hh * j) / sy) / 0.03) * 255)); s += row.join(' ') + '\n'; }
  writeFileSync(process.argv[3], s); console.log('wrote', process.argv[3]);
}
