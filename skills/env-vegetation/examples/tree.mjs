// tree.mjs: a broadleaf tree with real botanical structure, built with meshkit, with detail tiers that
// reduce the same structure instead of swapping to a proxy.
// Shows the vegetation standard in code:
// - root flare and surface roots entering the ground, a tapering trunk, recursive branches and twigs;
// - each child starts inside its parent (sunk along the parent's axis), so wood is continuous;
// - branch radius follows a pipe model (children's cross-sections roughly sum to the parent's);
// - phototropism bends branches up and gravity droops thin ones, so nothing is straight sticks;
// - leaves are alpha-tested cards with a petiole, attached at twig nodes. No solid core, no leaf ball;
// - tiers drop the finest branch level and redistribute leaf area onto the remaining nodes, so the
//   silhouette, density and colour hold while the structure gets cheaper.
//
// Run: node tree.mjs [seed] [tier]   prints structure stats and attachment checks for tiers 0..2
import { MeshWriter } from '../../env-geometry-construction/scripts/meshkit/meshkit.mjs';

const rng = (seed) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const perp = (d) => norm(Math.abs(d[1]) < 0.9 ? cross(d, [0, 1, 0]) : cross(d, [1, 0, 0]));
const rot = (v, k, a) => add(add(mul(v, Math.cos(a)), mul(cross(k, v), Math.sin(a))), mul(k, (k[0] * v[0] + k[1] * v[1] + k[2] * v[2]) * (1 - Math.cos(a))));

export const BROADLEAF = { height: 9, trunkRadius: 0.22, flare: 0.9, levels: 3, children: [7, 5, 4], lenRatio: [0.55, 0.5, 0.45], spread: [0.95, 0.8, 0.7], tropism: 0.06, droop: 0.05, leafSize: 0.09, leavesPerTwig: 10, roots: 6 };

export function growTree(P = BROADLEAF, seed = 1) {
  const R = rng(seed), branches = [];
  const grow = (start, dir, length, r0, level, parent) => {
    const n = Math.max(4, Math.round(length / 0.25)), pts = [start], radii = [r0];
    let d = dir, p = start;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      d = norm(add(d, add([0, P.tropism * (1 - level * 0.25), 0], [0, -P.droop * level * t, 0]))); // bend: up, then droop
      d = norm(add(d, mul([R() - 0.5, R() - 0.5, R() - 0.5], 0.08)));                           // natural irregularity
      p = add(p, mul(d, length / n)); pts.push(p);
      radii.push(r0 * Math.pow(1 - t * 0.85, 1.1) + 0.003);
    }
    const b = { id: branches.length, level, maxLevel: P.levels, pts, radii, parent, children: [] }; branches.push(b);
    if (level < P.levels) {
      const k = P.children[level], golden = 2.39996;
      for (let c = 0; c < k; c++) {
        const t = 0.3 + 0.65 * ((c + 0.5) / k) + (R() - 0.5) * 0.05, i = Math.min(n - 1, Math.floor(t * n));
        const az = c * golden + R() * 0.4, ax = perp(d);
        const cdir = norm(rot(rot(norm(sub(pts[i + 1], pts[i])), ax, P.spread[level] * (0.7 + 0.5 * R())), norm(sub(pts[i + 1], pts[i])), az));
        const pr = radii[i], cr = Math.max(0.004, pr * Math.sqrt(1 / k) * (0.9 + 0.2 * R())); // pipe model
        const sunk = add(pts[i], mul(cdir, -pr * 0.6));                                      // start inside the parent
        b.children.push(grow(sunk, cdir, length * P.lenRatio[level] * (0.8 + 0.4 * R()) * (1.15 - t * 0.5), cr, level + 1, b));
      }
    }
    return b;
  };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const trunk = grow([0, -0.4, 0], norm([0.03, 1, 0.02]), P.height * 0.55, P.trunkRadius, 0, null);
  // surface roots: start inside the flare, run outward and dive into the ground
  const roots = [];
  for (let k = 0; k < P.roots; k++) {
    const a = (k / P.roots) * Math.PI * 2 + R() * 0.4, d = [Math.cos(a), -0.12, Math.sin(a)], pts = [], radii = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([d[0] * (0.05 + t * 1.4), 0.12 - t * 0.5 - t * t * 0.2, d[2] * (0.05 + t * 1.4)]); radii.push(P.trunkRadius * 0.45 * (1 - t * 0.8)); }
    roots.push({ level: 0, pts, radii, root: true });
  }
  return { branches, roots, trunk, P };
}

// Detail tiers reduce the SAME structure: keep a deterministic subset of the finest twigs, use fewer
// ring segments and path points, and grow the remaining leaves so total leaf area is conserved.
// Leaves stay on the twigs that carry them, so the crown envelope and density hold across tiers.
export const TIERS = [{ keep: 1, seg: 10, step: 1 }, { keep: 0.55, seg: 7, step: 2 }, { keep: 0.3, seg: 5, step: 3 }];
const kept = (b, keep) => b.level < b.maxLevel || ((b.id * 2654435761) >>> 0) / 4294967296 < keep;

export function leavesFor(tree, tier = 0, seed = 7) {
  const R = rng(seed), P = tree.P, T = TIERS[tier];
  const twigs = tree.branches.filter((b) => b.level === P.levels), mine = twigs.filter((b) => kept(b, T.keep));
  const area = twigs.length * P.leavesPerTwig * P.leafSize * P.leafSize, perTip = P.leavesPerTwig;
  const size = Math.sqrt(area / (mine.length * perTip)), out = [];
  for (const b of mine) for (let k = 0; k < perTip; k++) {
    const t = 0.35 + 0.65 * (k / perTip), i = Math.min(b.pts.length - 2, Math.floor(t * (b.pts.length - 1)));
    const node = b.pts[i], axis = norm([b.pts[i + 1][0] - node[0], b.pts[i + 1][1] - node[1], b.pts[i + 1][2] - node[2]]);
    const out1 = norm(rot(perp(axis), axis, k * 2.39996 + R() * 0.5));                     // phyllotaxis around the twig
    const facing = norm(add(out1, [0, 0.6, 0]));                                             // leaves turn toward the light
    out.push({ base: add(node, mul(out1, b.radii[i] * 0.9)), dir: norm(add(out1, mul(axis, 0.6))), normal: facing, size: size * (0.8 + 0.4 * R()), twig: b, at: i });
  }
  // build-time solid test: drop leaves whose blade would pass through any branch (a leaf never grows
  // through wood). Branches are tested as tapered capsules along their polylines.
  const segs = [];
  for (const br of tree.branches) if (kept(br, T.keep)) for (let i = 0; i + 1 < br.pts.length; i++) segs.push([br.pts[i], br.pts[i + 1], Math.max(br.radii[i], br.radii[i + 1])]);
  const inWood = (p) => segs.some(([a, b, r]) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]], L2 = ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1;
    const t = Math.max(0, Math.min(1, (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / L2));
    return Math.hypot(ap[0] - ab[0] * t, ap[1] - ab[1] * t, ap[2] - ab[2] * t) < r;
  });
  return out.filter((L) => {
    const side = norm(cross(L.normal, L.dir)), probes = [];
    for (const f of [0.25, 0.6, 1.0, 1.6]) for (const o of [-0.5, 0, 0.5]) probes.push(add(add(L.base, mul(L.dir, L.size * f)), mul(side, L.size * o)));
    return !probes.some(inWood);
  });
}

export function buildTree(tree, tier = 0) {
  const T = TIERS[tier], w = new MeshWriter();
  const tube = (b) => { // lofted rings along the branch, parallel-transported frames, capped at the tip
    const idx = b.pts.map((_, i) => i).filter((i) => i % T.step === 0 || i === b.pts.length - 1);
    const rings = []; let nrm = perp(norm([b.pts[1][0] - b.pts[0][0], b.pts[1][1] - b.pts[0][1], b.pts[1][2] - b.pts[0][2]]));
    const seg = Math.max(3, Math.round(T.seg - b.level * 1.5));
    for (const i of idx) {
      const a = b.pts[Math.max(0, i - 1)], c = b.pts[Math.min(b.pts.length - 1, i + 1)], t = norm([c[0] - a[0], c[1] - a[1], c[2] - a[2]]);
      nrm = norm(cross(cross(t, nrm), t)); const bin = cross(t, nrm);
      let r = b.radii[i]; if (b.level === 0 && !b.root) r *= 1 + tree.P.flare * Math.exp(-i * 1.2); // root flare
      rings.push([...Array(seg)].map((_, k) => { const ang = (k / seg) * Math.PI * 2; return add(b.pts[i], add(mul(nrm, Math.cos(ang) * r), mul(bin, Math.sin(ang) * r))); }));
    }
    w.loft(rings.map((r) => [...r].reverse()), { closed: true, capStart: true, capEnd: true, creaseDeg: 60 });
  };
  w.use('bark');
  for (const b of [...tree.branches.filter((b) => kept(b, T.keep)), ...tree.roots]) tube(b);
  w.use('leaf');
  const leaves = leavesFor(tree, tier);
  for (const L of leaves) { // petiole + blade card, double-sided in the material (alpha-tested)
    const side = norm(cross(L.normal, L.dir)), tip = add(L.base, mul(L.dir, L.size * 1.6)), mid = add(L.base, mul(L.dir, L.size * 0.25));
    const q = [add(mid, mul(side, -L.size * 0.5)), add(mid, mul(side, L.size * 0.5)), add(tip, mul(side, L.size * 0.5)), add(tip, mul(side, -L.size * 0.5))];
    w.part().patch([{ p: [L.base, q[1], q[0]], uv: [[0.5, 0], [1, 0.12], [0, 0.12]] }, { p: [q[0], q[1], q[2]], uv: [[0, 0.12], [1, 0.12], [1, 1]] }, { p: [q[0], q[2], q[3]], uv: [[0, 0.12], [1, 1], [0, 1]] }], { crease: 1 });
  }
  return { built: w.build(), leaves };
}

// ---------------------------------------------------------------- checks
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const seed = +(process.argv[2] || 1), tree = growTree(BROADLEAF, seed);
  let failed = 0; const check = (n, c, i = '') => { console.log(`${c ? 'ok  ' : 'FAIL'} ${n} ${i}`); if (!c) failed++; };
  const distToAxis = (p, b, i) => Math.min(...[Math.max(0, i - 1), i, Math.min(b.pts.length - 1, i + 1)].map((j) => Math.hypot(p[0] - b.pts[j][0], p[1] - b.pts[j][1], p[2] - b.pts[j][2])));
  // every child starts inside its parent
  const childStarts = tree.branches.filter((b) => b.parent).map((b) => Math.min(...b.parent.pts.map((q, i) => Math.hypot(b.pts[0][0] - q[0], b.pts[0][1] - q[1], b.pts[0][2] - q[2]) - b.parent.radii[i])));
  check('every branch starts inside its parent', Math.max(...childStarts) <= 0.05, `worst ${Math.max(...childStarts).toFixed(3)} m`);
  check('roots enter the ground', tree.roots.every((r) => r.pts[r.pts.length - 1][1] < -0.1));
  const areas = [];
  for (const tier of [0, 1, 2]) {
    const { built, leaves } = buildTree(tree, tier);
    const detached = leaves.filter((L) => distToAxis(L.base, L.twig, L.at) > L.twig.radii[L.at] * 1.2 + 0.01).length;
    const area = leaves.reduce((s, L) => s + L.size * L.size * 1.35, 0); areas.push(area);
    console.log(`tier ${tier}: ${built.bark.index.length / 3} bark tris, ${leaves.length} leaves, leaf area ${area.toFixed(2)} m²`);
    check(`tier ${tier}: every leaf attached at a twig node`, detached === 0, `${detached} detached`);
  }
  const env = [0, 1, 2].map((t) => { const L = leavesFor(tree, t), xs = L.map((l) => Math.hypot(l.base[0], l.base[2])), ys = L.map((l) => l.base[1]); return [Math.max(...xs), Math.max(...ys), Math.min(...ys)]; });
  check('crown envelope holds across tiers (within 12%)', env.every((e) => e.every((v, k) => Math.abs(v - env[0][k]) <= 0.12 * Math.abs(env[0][k]) + 0.2)), JSON.stringify(env.map((e) => e.map((v) => +v.toFixed(2)))));
  check('tiers conserve leaf area within 20%', areas.every((a) => Math.abs(a - areas[0]) / areas[0] < 0.2), areas.map((a) => a.toFixed(2)).join(' / '));
  if (failed) process.exit(1);
  console.log('tree checks passed');
}
