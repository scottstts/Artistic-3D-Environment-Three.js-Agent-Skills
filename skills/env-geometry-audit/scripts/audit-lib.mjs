// audit-lib.mjs: whole-scene geometry audits. Plain ES module, no dependencies; runs in Node or
// in a browser debug hook.
//
// Input: meshes = [{ name, position: Float32Array|number[], index?: Uint32Array|number[],
//                    matrix?: number[16] (column-major, as three.js), group?: 'solid'|'plant'|'ground'|..., ground?: bool,
//                    part?: per-vertex part ids (meshkit writes them) }]
// Components are the connected pieces of each mesh; with a part attribute, each part is its own
// component even where parts touch exactly.
// meshesFromThree(root) builds that list from a three.js scene, expanding InstancedMesh instances.
//
// Audits (each returns { hits: [...], summary }):
//   coplanar(meshes, opts)    overlapping coplanar or near-coplanar triangle pairs (z-fighting candidates)
//   support(meshes, opts)     components with no chain of contact to the ground (floating parts)
//   clearance(meshes, opts)   interpenetration deeper than the allowed seat, between components or groups
//   shells(meshes, opts)      open edges, non-manifold edges, inconsistent winding, inside-out solids
//   runAll(meshes, opts)      all of the above
// Every hit carries mesh names and a world position, so you can trace it to the generator that made it
// and look at it from a view that exposes it.

// ---------------------------------------------------------------- basics
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const tp = (m, x, y, z) => (m ? [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]] : [x, y, z]);

export function meshesFromThree(root, { filter = () => true } = {}) {
  const out = [];
  root.updateMatrixWorld?.(true);
  root.traverse((o) => {
    if (!o.isMesh || !o.visible || !filter(o)) return;
    const g = o.geometry, pos = g.attributes.position.array, idx = g.index ? g.index.array : null, mw = o.matrixWorld.elements;
    const base = { name: o.name || o.uuid, position: pos, index: idx, part: g.attributes.part ? g.attributes.part.array : null, group: o.userData?.auditGroup || 'solid', ground: !!o.userData?.ground };
    if (o.isInstancedMesh) {
      const im = o.instanceMatrix.array;
      for (let k = 0; k < o.count; k++) {
        const li = im.slice(k * 16, k * 16 + 16), m = mulMat(mw, li);
        out.push({ ...base, name: `${base.name}#${k}`, matrix: m });
      }
    } else out.push({ ...base, matrix: [...mw] });
  });
  return out;
}
function mulMat(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return o;
}

// world-space triangle soup with component labels (connected by shared welded vertices)
function prepare(meshes) {
  const tris = []; // { a, b, c, n (unit), area, mesh, comp }
  const comps = []; // { id, mesh, name, group, ground, tris: [], verts: [], min, max }
  meshes.forEach((m, mi) => {
    const P = m.position, I = m.index || [...Array(P.length / 3).keys()], M = m.matrix;
    const nv = P.length / 3, W = new Array(nv);
    for (let i = 0; i < nv; i++) W[i] = tp(M, P[i * 3], P[i * 3 + 1], P[i * 3 + 2]);
    const key = (p, i) => (m.part ? m.part[i] + '#' : '') + Math.round(p[0] * 1e4) + ',' + Math.round(p[1] * 1e4) + ',' + Math.round(p[2] * 1e4);
    const wid = new Map(), weld = W.map((p, i) => { const k = key(p, i); if (!wid.has(k)) wid.set(k, wid.size); return wid.get(k); });
    const parent = [...Array(wid.size).keys()], find = (x) => { while (parent[x] !== x) x = parent[x] = parent[parent[x]]; return x; };
    for (let t = 0; t < I.length; t += 3) { const a = find(weld[I[t]]), b = find(weld[I[t + 1]]), c = find(weld[I[t + 2]]); parent[a] = b; parent[find(c)] = b; }
    const compOf = new Map();
    for (let t = 0; t < I.length; t += 3) {
      const a = W[I[t]], b = W[I[t + 1]], c = W[I[t + 2]], nRaw = cross(sub(b, a), sub(c, a)), A2 = len(nRaw);
      if (A2 < 1e-12) continue;
      const root = find(weld[I[t]]);
      if (!compOf.has(root)) { const id = comps.length; compOf.set(root, id); comps.push({ id, mesh: mi, name: m.name, group: m.group || 'solid', ground: !!m.ground, tris: [], wverts: new Set() }); }
      const comp = compOf.get(root), tri = { a, b, c, n: [nRaw[0] / A2, nRaw[1] / A2, nRaw[2] / A2], area: A2 / 2, mesh: mi, comp, w: [weld[I[t]], weld[I[t + 1]], weld[I[t + 2]]] };
      tris.push(tri); comps[comp].tris.push(tri);
    }
  });
  for (const c of comps) {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity], vs = [];
    for (const t of c.tris) for (const p of [t.a, t.b, t.c]) { for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); } vs.push(p); }
    c.min = min; c.max = max; c.verts = vs;
  }
  return { tris, comps };
}

// uniform grid over triangles for proximity and ray queries
function buildGrid(tris, cell) {
  const g = new Map(), k = (i, j, l) => i + ',' + j + ',' + l;
  tris.forEach((t, ti) => {
    const lo = [0, 1, 2].map((d) => Math.floor(Math.min(t.a[d], t.b[d], t.c[d]) / cell)), hi = [0, 1, 2].map((d) => Math.floor(Math.max(t.a[d], t.b[d], t.c[d]) / cell));
    for (let i = lo[0]; i <= hi[0]; i++) for (let j = lo[1]; j <= hi[1]; j++) for (let l = lo[2]; l <= hi[2]; l++) { const kk = k(i, j, l); if (!g.has(kk)) g.set(kk, []); g.get(kk).push(ti); }
  });
  return {
    near(p, r) { const s = new Set(); const lo = p.map((v) => Math.floor((v - r) / cell)), hi = p.map((v) => Math.floor((v + r) / cell)); for (let i = lo[0]; i <= hi[0]; i++) for (let j = lo[1]; j <= hi[1]; j++) for (let l = lo[2]; l <= hi[2]; l++) for (const t of g.get(k(i, j, l)) || []) s.add(t); return s; },
  };
}

function closestOnTri(p, a, b, c) { // Ericson, Real-Time Collision Detection 5.1.5
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp); if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) { const v = d1 / (d1 - d3); return [a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v]; }
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp); if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) { const w = d2 / (d2 - d6); return [a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w]; }
  const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / (d4 - d3 + (d5 - d6)); return [b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w]; }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
}
const distToTri = (p, t) => len(sub(p, closestOnTri(p, t.a, t.b, t.c)));

// ---------------------------------------------------------------- coplanar
function overlapArea2D(A, B) { // convex clip of triangle A by triangle B (both CCW), area of the result
  const orient = (t) => ((t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) - (t[1][1] - t[0][1]) * (t[2][0] - t[0][0]) < 0 ? [t[0], t[2], t[1]] : t);
  let poly = orient(A); const clip = orient(B);
  for (let e = 0; e < 3 && poly.length; e++) {
    const p1 = clip[e], p2 = clip[(e + 1) % 3], ex = p2[0] - p1[0], ey = p2[1] - p1[1], out = [];
    const side = (q) => ex * (q[1] - p1[1]) - ey * (q[0] - p1[0]);
    for (let i = 0; i < poly.length; i++) {
      const s = poly[i], t = poly[(i + 1) % poly.length], ds = side(s), dt = side(t);
      if (dt >= 0) { if (ds < 0) { const u = ds / (ds - dt); out.push([s[0] + u * (t[0] - s[0]), s[1] + u * (t[1] - s[1])]); } out.push(t); }
      else if (ds >= 0) { const u = ds / (ds - dt); out.push([s[0] + u * (t[0] - s[0]), s[1] + u * (t[1] - s[1])]); }
    }
    poly = out;
  }
  let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; }
  return Math.abs(a) / 2;
}

export function coplanar(meshes, { tolDist = 0.006, tolAngleDeg = 2, minArea = 1e-4, sameFacingOnly = false, isBuried = null, prepared = null } = {}) {
  const { tris } = prepared || prepare(meshes);
  const cosT = Math.cos((tolAngleDeg * Math.PI) / 180), nq = 0.05;
  const buckets = new Map();
  const bkey = (t, di) => { const n = t.n[0] < 0 || (t.n[0] === 0 && (t.n[1] < 0 || (t.n[1] === 0 && t.n[2] < 0))) ? t.n.map((v) => -v) : t.n; const d = dot(n, t.a); return [Math.round(n[0] / nq), Math.round(n[1] / nq), Math.round(n[2] / nq), Math.round(d / tolDist) + di].join(','); };
  tris.forEach((t, i) => { if (isBuried && isBuried(t)) return; const k = bkey(t, 0); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(i); });
  const hits = [], seen = new Set();
  for (const [k, list] of buckets) {
    const parts = k.split(','), cand = [...list], inList = new Set(list);
    for (const dd of [-1, 1]) { const k2 = [...parts.slice(0, 3), +parts[3] + dd].join(','); if (buckets.has(k2)) cand.push(...buckets.get(k2)); }
    for (const i of list) for (const j of cand) {
      if (j <= i && inList.has(j)) continue;
      const A = tris[i], B = tris[j]; if (i === j) continue;
      const pk = i < j ? i + ':' + j : j + ':' + i; if (seen.has(pk)) continue; seen.add(pk);
      const c = dot(A.n, B.n); if (Math.abs(c) < cosT) continue;
      if (sameFacingOnly && c < 0) continue;
      if (Math.abs(dot(A.n, sub(B.a, A.a))) > tolDist || Math.abs(dot(A.n, sub(B.b, A.a))) > tolDist || Math.abs(dot(A.n, sub(B.c, A.a))) > tolDist) continue;
      // shared-edge neighbours in the same component never overlap; skip quickly by bbox
      const ax = Math.abs(A.n[0]) > Math.abs(A.n[1]) ? (Math.abs(A.n[0]) > Math.abs(A.n[2]) ? 0 : 2) : (Math.abs(A.n[1]) > Math.abs(A.n[2]) ? 1 : 2);
      const pr = (p) => (ax === 0 ? [p[1], p[2]] : ax === 1 ? [p[0], p[2]] : [p[0], p[1]]);
      const area = overlapArea2D([pr(A.a), pr(A.b), pr(A.c)], [pr(B.a), pr(B.b), pr(B.c)]) / Math.abs(A.n[ax]);
      if (area < minArea) continue;
      const cen = [(A.a[0] + A.b[0] + A.c[0]) / 3, (A.a[1] + A.b[1] + A.c[1]) / 3, (A.a[2] + A.b[2] + A.c[2]) / 3];
      hits.push({ meshes: [meshes[A.mesh].name, meshes[B.mesh].name], at: cen.map((v) => +v.toFixed(3)), area: +area.toFixed(5), facing: c > 0 ? 'same' : 'opposite', gap: +Math.abs(dot(A.n, sub(B.a, A.a))).toFixed(4) });
    }
  }
  hits.sort((a, b) => b.area - a.area);
  const total = hits.reduce((s, h) => s + h.area, 0);
  return { hits, summary: { pairs: hits.length, overlapArea: +total.toFixed(4), sameFacing: hits.filter((h) => h.facing === 'same').length } };
}

// broadphase: unordered pairs of components whose boxes overlap (padded), by sweep-and-prune on x
function overlapPairs(comps, pad, fn) {
  const order = [...comps].sort((a, b) => a.min[0] - b.min[0]);
  for (let i = 0; i < order.length; i++) {
    const A = order[i];
    for (let j = i + 1; j < order.length && order[j].min[0] <= A.max[0] + pad; j++) {
      const B = order[j];
      if (A.min[1] - pad <= B.max[1] && B.min[1] - pad <= A.max[1] && A.min[2] - pad <= B.max[2] && B.min[2] - pad <= A.max[2]) fn(A, B);
    }
  }
}

// ---------------------------------------------------------------- support
export function support(meshes, { contactTol = 0.02, groundHeight = null, groundTol = 0.02, prepared = null } = {}) {
  const P = prepared || prepare(meshes), { comps } = P;
  const grid = buildGrid(P.tris, Math.max(contactTol * 20, 0.25));
  const grounded = new Array(comps.length).fill(false), adj = comps.map(() => new Set());
  for (const c of comps) {
    if (c.ground) { grounded[c.id] = true; continue; }
    if (groundHeight) for (const v of c.verts) if (v[1] <= groundHeight(v[0], v[2]) + groundTol) { grounded[c.id] = true; break; }
    const step = Math.max(1, Math.floor(c.verts.length / 4000)); // subsample very dense parts
    for (let i = 0; i < c.verts.length; i += step) {
      const v = c.verts[i];
      for (const ti of grid.near(v, contactTol)) { const t = P.tris[ti]; if (t.comp === c.id || adj[c.id].has(t.comp)) continue; if (distToTri(v, t) <= contactTol) { adj[c.id].add(t.comp); adj[t.comp].add(c.id); } }
    }
  }
  // parts that pass into or through a closed solid are in contact with it, even with no vertex near its surface
  const closed = comps.map((c) => isClosed(c));
  overlapPairs(comps, contactTol, (A, B) => {
    if (adj[A.id].has(B.id)) return;
    const inB = closed[B.id] && samplePoints(A, 0.05, 3000).some((v) => B.min.every((m, k) => v[k] >= m && v[k] <= B.max[k]) && pointInSolid(v, B));
    const inA = !inB && closed[A.id] && samplePoints(B, 0.05, 3000).some((v) => A.min.every((m, k) => v[k] >= m && v[k] <= A.max[k]) && pointInSolid(v, A));
    if (inB || inA) { adj[A.id].add(B.id); adj[B.id].add(A.id); }
  });
  const q = comps.filter((c) => grounded[c.id]).map((c) => c.id), reach = new Set(q);
  while (q.length) { const x = q.pop(); for (const y of adj[x]) if (!reach.has(y)) { reach.add(y); q.push(y); } }
  const hits = comps.filter((c) => !reach.has(c.id)).map((c) => ({ mesh: c.name, group: c.group, at: c.min.map((v, k) => +((v + c.max[k]) / 2).toFixed(3)), size: c.max.map((v, k) => +(v - c.min[k]).toFixed(3)), lowestY: +c.min[1].toFixed(3) }));
  return { hits, summary: { components: comps.length, unsupported: hits.length } };
}

// ---------------------------------------------------------------- clearance (interpenetration)
// Vertices plus points along every edge, so a part that passes straight through a solid (no vertex
// inside it) is still caught.
function samplePoints(c, step, cap) {
  if (c._samples && c._step === step) return c._samples;
  const pts = [...c.verts];
  for (const t of c.tris) for (const [a, b] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
    const L = len(sub(b, a)), n = Math.floor(L / step);
    for (let k = 1; k < n; k++) pts.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n, a[2] + ((b[2] - a[2]) * k) / n]);
  }
  const every = Math.max(1, Math.floor(pts.length / cap));
  c._samples = pts.filter((_, i) => i % every === 0); c._step = step;
  return c._samples;
}
// per-component acceleration, built lazily: a (y, z) grid for +x parity rays, and a 3D grid for
// nearest-surface queries
function yzGrid(c) {
  if (c._yz) return c._yz;
  const div = 48, sy = (c.max[1] - c.min[1]) / div || 1, sz = (c.max[2] - c.min[2]) / div || 1, g = new Map();
  for (const t of c.tris) {
    const y0 = Math.floor((Math.min(t.a[1], t.b[1], t.c[1]) - c.min[1]) / sy), y1 = Math.floor((Math.max(t.a[1], t.b[1], t.c[1]) - c.min[1]) / sy);
    const z0 = Math.floor((Math.min(t.a[2], t.b[2], t.c[2]) - c.min[2]) / sz), z1 = Math.floor((Math.max(t.a[2], t.b[2], t.c[2]) - c.min[2]) / sz);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) { const k = y * 4096 + z; if (!g.has(k)) g.set(k, []); g.get(k).push(t); }
  }
  c._yz = (p) => g.get(Math.floor((p[1] - c.min[1]) / sy) * 4096 + Math.floor((p[2] - c.min[2]) / sz)) || [];
  return c._yz;
}
function nearestDist(p, c) {
  if (!c._g3) { const ext = Math.max(...c.max.map((v, k) => v - c.min[k])); c._cell = Math.max(ext / 24, 1e-3); c._g3 = buildGrid(c.tris, c._cell); }
  for (let r = c._cell; ; r *= 2) {
    let best = Infinity; for (const ti of c._g3.near(p, r)) best = Math.min(best, distToTri(p, c.tris[ti]));
    if (best <= r || r > 1e6) return best;
  }
}
function pointInSolid(p, c) { // parity of crossings along +x, jittered to avoid edges
  const dir = [1, 1e-4, 2e-4]; let n = 0;
  for (const t of yzGrid(c)(p)) {
    if (Math.max(t.a[0], t.b[0], t.c[0]) < p[0]) continue;
    const e1 = sub(t.b, t.a), e2 = sub(t.c, t.a), h = cross(dir, e2), det = dot(e1, h); if (Math.abs(det) < 1e-14) continue;
    const s = sub(p, t.a), u = dot(s, h) / det; if (u < 0 || u > 1) continue;
    const qv = cross(s, e1), v = dot(dir, qv) / det; if (v < 0 || u + v > 1) continue;
    if (dot(e2, qv) / det > 0) n++;
  }
  return n % 2 === 1;
}
export function clearance(meshes, { seat = 0.01, between = null, prepared = null, maxPointsPerComp = 6000, sampleStep = 0.05 } = {}) {
  // between: optional [groupA, groupB] (e.g. ['plant', 'solid']); default: every pair of different components
  const P = prepared || prepare(meshes), { comps } = P, hits = [];
  const closed = comps.map((c) => isClosed(c));
  const test = (A, B) => { // A's points inside closed solid B
    if (!closed[B.id]) return;
    if (between && !(A.group === between[0] && B.group === between[1])) return;
    let depth = 0, worst = null, inside = 0;
    for (const v of samplePoints(A, sampleStep, maxPointsPerComp)) {
      if (!B.min.every((m, k) => v[k] >= m && v[k] <= B.max[k])) continue;
      if (!pointInSolid(v, B)) continue;
      inside++; const d = nearestDist(v, B);
      if (d > depth) { depth = d; worst = v; }
    }
    if (depth > seat) hits.push({ meshes: [A.name, B.name], ids: [A.id, B.id], groups: [A.group, B.group], depth: +depth.toFixed(4), insidePoints: inside, at: worst.map((x) => +x.toFixed(3)) });
  };
  overlapPairs(comps, 0, (A, B) => { test(A, B); test(B, A); });
  // both directions were tested; keep the deeper report per unordered pair
  const best = new Map();
  for (const h of hits) { const k = Math.min(...h.ids) + ':' + Math.max(...h.ids); if (!best.has(k) || best.get(k).depth < h.depth) best.set(k, h); }
  hits.length = 0; hits.push(...[...best.values()].map(({ ids, ...h }) => h));
  hits.sort((a, b) => b.depth - a.depth);
  return { hits, summary: { pairs: hits.length, worstDepth: hits[0]?.depth || 0 } };
}

// ---------------------------------------------------------------- shells
function edgeStats(c) {
  const E = new Map();
  for (const t of c.tris) for (const [x, y] of [[t.w[0], t.w[1]], [t.w[1], t.w[2]], [t.w[2], t.w[0]]]) { const k = x + '>' + y; E.set(k, (E.get(k) || 0) + 1); }
  let open = 0, nonManifold = 0, flipped = 0; const openAt = [];
  for (const [k, n] of E) {
    const [x, y] = k.split('>'), r = E.get(y + '>' + x) || 0;
    if (n > 1) flipped++;
    if (r === 0 && n === 1) { open++; if (openAt.length < 5) openAt.push(k); }
    if (n + r > 2) nonManifold++;
  }
  let vol = 0; for (const t of c.tris) vol += dot(t.a, cross(t.b, t.c)) / 6;
  return { open, nonManifold, flipped, vol };
}
function isClosed(c) { const s = edgeStats(c); return s.open === 0 && s.flipped === 0; }
export function shells(meshes, { allowOpen = (c) => c.group === 'ground' || c.group === 'plant', prepared = null } = {}) {
  const P = prepared || prepare(meshes), hits = [];
  for (const c of P.comps) {
    const s = edgeStats(c), issues = [];
    if (s.open && !allowOpen(c)) issues.push(`${s.open} open edges`);
    if (s.flipped) issues.push(`${s.flipped} edges used twice in the same direction (inconsistent winding)`);
    if (s.nonManifold) issues.push(`${s.nonManifold} non-manifold edges`);
    if (s.open === 0 && s.flipped === 0 && s.vol < 0) issues.push('inside-out (negative volume)');
    if (issues.length) hits.push({ mesh: c.name, group: c.group, issues, at: c.min.map((v, k) => +((v + c.max[k]) / 2).toFixed(3)) });
  }
  return { hits, summary: { components: P.comps.length, withIssues: hits.length } };
}

export function runAll(meshes, opts = {}) {
  const prepared = prepare(meshes);
  return {
    coplanar: coplanar(meshes, { ...opts.coplanar, prepared }),
    support: support(meshes, { ...opts.support, prepared }),
    clearance: clearance(meshes, { ...opts.clearance, prepared }),
    shells: shells(meshes, { ...opts.shells, prepared }),
  };
}
