// meshkit.mjs: a dependency-free procedural mesh writer for architectural and hard-surface
// construction. It produces indexed geometry per material slot with correct winding and creased
// normals. Output converts to three.js BufferGeometry with toThree().
//
// Core ideas
// - Author parts in local frames through a matrix stack (push/pop/translate/rotate/scale). Mirroring
//   (negative scale) flips winding automatically, so mirrored halves stay outward-facing.
// - Every primitive emits a "patch" of triangles. A patch without explicit normals gets creased
//   normals: smooth across edges flatter than `crease` degrees, hard across sharper ones. So
//   curved surfaces shade smooth and real corners stay crisp.
// - Solids are closed. extrude() and wall() build front, back, reveals and edges from one outline
//   with holes, so openings cut through every layer and nothing is single-sided.
//
// API (all lengths in metres, angles in radians unless named *Deg)
//   const w = new MeshWriter();
//   w.use('stone')                         select material slot
//   w.push(); w.translate(x,y,z); w.rotateY(a); w.scale(sx,sy,sz); ... w.pop();
//   w.patch(tris, { crease = 30 })         tris: [{ p: [a,b,c], uv?: [ua,ub,uc] }] in local space
//   w.lathe(profile, { segments, arc, phase, capStart, capEnd, creaseDeg })
//        profile: [[r, y], ...] bottom → top. Revolved about local +y. Points with r = 0 close at the axis.
//   w.sweep(profile, path, { closedPath, closedProfile, up, creaseDeg })
//        profile: [[x, y], ...] in the section plane (x = side, y = up). path: [[x,y,z], ...].
//        Interior joints are exact mitres; open ends are capped when closedProfile.
//   w.loft(rings, { closed, capStart, capEnd, creaseDeg })   rings: arrays of equal-length 3D loops
//   w.grid(fn, nu, nv, { closeU, closeV, creaseDeg })        fn(u, v) -> [x,y,z], u,v in [0,1]
//   w.extrude(outline, holes, depth, { surface, maxEdge, capEdges = true, creaseDeg })
//        outline/holes: 2D loops [[s, t], ...]. surface(s, t, d) -> [x,y,z] maps the slab (default: plane
//        with x = s, y = t, z = d). Front face at d = 0 faces +d; back face at d = -depth.
//   w.wall(...)                             alias of extrude for readability
//   w.build() -> { [slot]: { position: Float32Array, normal, uv, index: Uint32Array } }
//   toThree(THREE, built) -> { [slot]: THREE.BufferGeometry }
//
// Loop helpers: rectLoop, archLoop (round / segmental / pointed), circleLoop, notchOutline (openings that
// reach the base, such as doors and floor-level arcades: a hole may never touch the outline).
// Surfaces: planeSurface(), cylinderSurface(radius) (s = arc length on the drum, d = radial offset).

// ---------------------------------------------------------------- vector and matrix helpers
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const v3 = { sub, add, mul, dot, cross, len, norm };

// column-major 4x4, same layout as three.js Matrix4.elements
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function m4mul(a, b) {
  const o = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}
const m4point = (m, p) => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
function m3det(m) {
  return m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2]);
}
function m4normal(m, n) { // cofactor of the 3x3 part, sign-corrected: correct for non-uniform scale and mirroring
  const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
  const C = [e * i - f * h, f * g - d * i, d * h - e * g, c * h - b * i, a * i - c * g, b * g - a * h, b * f - c * e, c * d - a * f, a * e - b * d];
  const s = Math.sign(m3det(m)) || 1;
  return norm([s * (C[0] * n[0] + C[3] * n[1] + C[6] * n[2]), s * (C[1] * n[0] + C[4] * n[1] + C[7] * n[2]), s * (C[2] * n[0] + C[5] * n[1] + C[8] * n[2])]);
}

// ---------------------------------------------------------------- 2D polygon utilities
const area2 = (loop) => { let s = 0; for (let i = 0; i < loop.length; i++) { const a = loop[i], b = loop[(i + 1) % loop.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const ccw = (loop) => (area2(loop) < 0 ? [...loop].reverse() : loop);
const cw = (loop) => (area2(loop) > 0 ? [...loop].reverse() : loop);
export const polygonArea = (loop) => Math.abs(area2(loop));

function resampleLoop(loop, maxEdge) { // split edges longer than maxEdge so curved hosts stay smooth
  if (!(maxEdge > 0)) return loop;
  const out = [];
  for (let i = 0; i < loop.length; i++) {
    const a = loop[i], b = loop[(i + 1) % loop.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(L / maxEdge));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

function pointInTri(p, a, b, c) {
  const d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
  const d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1]);
  const d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1]);
  const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}
const segCross = (p1, p2, q1, q2) => {
  const o = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  return o(p1, p2, q1) * o(p1, p2, q2) < 0 && o(q1, q2, p1) * o(q1, q2, p2) < 0;
};

// Bridge holes into the outer loop, then ear-clip. Returns triangles as index triples into `pts`.
export function triangulate(outline, holes = []) {
  // a hole must lie strictly inside the outline. An opening that reaches an edge (a door down to the
  // floor) is a notch in the outline itself: see notchOutline().
  for (const h of holes) for (const p of h) for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2));
    if (Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]) < 1e-7) throw new Error('triangulate: a hole touches the outline; make that opening a notch in the outline (notchOutline)');
  }
  let ring = ccw(outline).map((p) => ({ p }));
  const hs = holes.map((h) => cw(h).map((p) => ({ p }))).sort((A, B) => Math.max(...B.map((v) => v.p[0])) - Math.max(...A.map((v) => v.p[0])));
  for (const h of hs) { // bridge from the hole's rightmost vertex to a visible ring vertex
    let hi = 0; for (let i = 1; i < h.length; i++) if (h[i].p[0] > h[hi].p[0]) hi = i;
    const hp = h[hi].p;
    let best = -1, bestD = Infinity;
    const allEdges = [];
    for (let i = 0; i < ring.length; i++) allEdges.push([ring[i].p, ring[(i + 1) % ring.length].p]);
    for (const H of hs) for (let i = 0; i < H.length; i++) allEdges.push([H[i].p, H[(i + 1) % H.length].p]);
    for (let i = 0; i < ring.length; i++) {
      const rp = ring[i].p, d = Math.hypot(rp[0] - hp[0], rp[1] - hp[1]);
      if (d >= bestD) continue;
      let blocked = false;
      for (const [e0, e1] of allEdges) {
        if (e0 === rp || e1 === rp || e0 === hp || e1 === hp) continue;
        if (segCross(hp, rp, e0, e1)) { blocked = true; break; }
      }
      if (!blocked) { best = i; bestD = d; }
    }
    if (best < 0) throw new Error('triangulate: no visible bridge for a hole (holes overlap or touch the outline?)');
    const hole = [...h.slice(hi), ...h.slice(0, hi + 1)].map((v) => ({ p: v.p }));
    ring = [...ring.slice(0, best + 1), ...hole, { p: ring[best].p }, ...ring.slice(best + 1)];
  }
  const P = ring.map((v) => v.p);
  const idx = P.map((_, i) => i), tris = [];
  const isConvex = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 1e-14;
  let guard = 0;
  while (idx.length > 3 && guard++ < 100000) {
    let clipped = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
      const a = P[i0], b = P[i1], c = P[i2];
      if (!isConvex(a, b, c)) continue;
      let inside = false;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        const q = P[j];
        if ((q[0] === a[0] && q[1] === a[1]) || (q[0] === b[0] && q[1] === b[1]) || (q[0] === c[0] && q[1] === c[1])) continue;
        if (pointInTri(q, a, b, c)) { inside = true; break; }
      }
      if (inside) continue;
      tris.push([i0, i1, i2]); idx.splice(k, 1); clipped = true; break;
    }
    if (!clipped) { // degenerate leftovers (collinear runs): drop a collinear vertex and continue
      let dropped = false;
      for (let k = 0; k < idx.length; k++) {
        const a = P[idx[(k + idx.length - 1) % idx.length]], b = P[idx[k]], c = P[idx[(k + 1) % idx.length]];
        if (Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) < 1e-12) { idx.splice(k, 1); dropped = true; break; }
      }
      if (!dropped) throw new Error('triangulate: failed (self-intersecting outline?)');
    }
  }
  if (idx.length === 3) tris.push([idx[0], idx[1], idx[2]]);
  return { points: P, tris };
}

// Split triangle edges longer than maxEdge (red-green refinement). Boundary edges are pre-resampled,
// so they are never split, and the reveals built from the same loops stay watertight with the faces.
function refine(points, tris, maxEdge) {
  if (!(maxEdge > 0)) return { points, tris };
  const P = points.map((p) => [...p]);
  let T = tris.map((t) => [...t]);
  for (let pass = 0; pass < 24; pass++) {
    const mids = new Map(), key = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
    const long = (a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]) > maxEdge * 1.0001;
    for (const [a, b, c] of T) for (const [x, y] of [[a, b], [b, c], [c, a]]) if (long(x, y) && !mids.has(key(x, y))) { mids.set(key(x, y), P.length); P.push([(P[x][0] + P[y][0]) / 2, (P[x][1] + P[y][1]) / 2]); }
    if (!mids.size) break;
    const NT = [];
    for (const [a, b, c] of T) {
      const ab = mids.get(key(a, b)), bc = mids.get(key(b, c)), ca = mids.get(key(c, a));
      const n = (ab !== undefined) + (bc !== undefined) + (ca !== undefined);
      if (n === 0) NT.push([a, b, c]);
      else if (n === 3) NT.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
      else if (n === 1) {
        if (ab !== undefined) NT.push([a, ab, c], [ab, b, c]);
        else if (bc !== undefined) NT.push([b, bc, a], [bc, c, a]);
        else NT.push([c, ca, b], [ca, a, b]);
      } else if (ca === undefined) NT.push([a, ab, c], [ab, bc, c], [ab, b, bc]); // two split edges
      else if (ab === undefined) NT.push([b, bc, a], [bc, ca, a], [bc, c, ca]);
      else NT.push([c, ca, b], [ca, ab, b], [ca, a, ab]);
    }
    T = NT;
  }
  return { points: P, tris: T };
}

// ---------------------------------------------------------------- loops and surfaces
export const rectLoop = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export function archLoop(x, y, w, hSpring, { kind = 'round', rise, segments = 24 } = {}) {
  // opening from sill y to springing y + hSpring, then an arch. kind: round | segmental | pointed
  const cx = x + w / 2, r = w / 2, pts = [[x + w, y], [x + w, y + hSpring]];
  if (kind === 'round') {
    for (let i = 1; i < segments; i++) { const a = (Math.PI * i) / segments; pts.push([cx + r * Math.cos(a), y + hSpring + r * Math.sin(a)]); }
  } else if (kind === 'segmental') {
    const f = rise ?? w / 4, R = (r * r + f * f) / (2 * f), cy = y + hSpring + f - R, a0 = Math.asin(r / R);
    for (let i = 1; i < segments; i++) { const a = Math.PI / 2 - a0 + (2 * a0 * i) / segments; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); }
  } else if (kind === 'pointed') { // equilateral-type pointed arch: two arcs centred on the opposite springing points
    const R = rise ? (r * r + rise * rise) / (2 * r) + r / 2 : w, half = Math.floor(segments / 2);
    const cR = [x + w - R, y + hSpring], cL = [x + R, y + hSpring];
    const apexA = Math.acos((cx - cR[0]) / R);
    for (let i = 1; i <= half; i++) { const a = (apexA * i) / half; pts.push([cR[0] + R * Math.cos(a), cR[1] + R * Math.sin(a)]); }
    for (let i = half - 1; i >= 1; i--) { const a = Math.PI - (apexA * i) / half; pts.push([cL[0] + R * Math.cos(a), cL[1] + R * Math.sin(a)]); }
  }
  pts.push([x, y + hSpring], [x, y]);
  return pts;
}
// Rectangle 0..W × 0..H with openings that start at its base (doors, arcade arches down to the floor).
// openings: loops from archLoop()/rectLoop() whose lowest edge sits on y = 0, sorted left to right.
export function notchOutline(W, H, openings) {
  const out = [[0, 0]];
  for (const o of [...openings].sort((A, B) => Math.min(...A.map((p) => p[0])) - Math.min(...B.map((p) => p[0])))) {
    const loop = area2(o) > 0 ? [...o].reverse() : o; // clockwise: left sill → up → over → right sill
    let k = 0; for (let i = 1; i < loop.length; i++) if (loop[i][1] < 1e-9 && (loop[k][1] > 1e-9 || loop[i][0] < loop[k][0])) k = i;
    const seq = [...loop.slice(k), ...loop.slice(0, k)];
    out.push(...seq.filter((p, i) => i === 0 || i === seq.length - 1 || p[1] > 1e-9));
  }
  out.push([W, 0], [W, H], [0, H]);
  return out.filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 1e-9);
}
export const circleLoop =(cx, cy, r, segments = 32) => [...Array(segments)].map((_, i) => [cx + r * Math.cos((2 * Math.PI * i) / segments), cy + r * Math.sin((2 * Math.PI * i) / segments)]);
export const planeSurface = () => (s, t, d) => [s, t, d];
export const cylinderSurface = (R) => (s, t, d) => { const a = s / R; return [Math.sin(a) * (R + d), t, Math.cos(a) * (R + d)]; };

// ---------------------------------------------------------------- creased normals
function creasedNormals(tris, creaseDeg) {
  // tris: [{ p:[a,b,c], uv:[...] }] in world space. Returns per-corner normals.
  const cosC = Math.cos((creaseDeg * Math.PI) / 180);
  const q = (p) => Math.round(p[0] * 1e5) + ',' + Math.round(p[1] * 1e5) + ',' + Math.round(p[2] * 1e5);
  const fu = tris.map((t) => norm(cross(sub(t.p[1], t.p[0]), sub(t.p[2], t.p[0]))));
  // angle-weighted: each face contributes by the corner angle at the vertex, so the result does not
  // depend on how quads were split into triangles
  const cornerAngle = (t, k) => { const a = norm(sub(t.p[(k + 1) % 3], t.p[k])), b = norm(sub(t.p[(k + 2) % 3], t.p[k])); return Math.acos(Math.max(-1, Math.min(1, dot(a, b)))); };
  const incident = new Map();
  tris.forEach((t, i) => t.p.forEach((p, k) => { const key = q(p); if (!incident.has(key)) incident.set(key, []); incident.get(key).push([i, cornerAngle(t, k)]); }));
  return tris.map((t, i) => t.p.map((p) => {
    let n = [0, 0, 0];
    for (const [j, w] of incident.get(q(p))) if (dot(fu[i], fu[j]) >= cosC) n = add(n, mul(fu[j], w));
    return norm(len(n) > 0 ? n : fu[i]);
  }));
}

// ---------------------------------------------------------------- writer
class Slot { constructor() { this.pos = []; this.nrm = []; this.uv = []; this.part = []; this.idx = []; this.map = new Map(); } }

export class MeshWriter {
  constructor() { this.slots = new Map(); this.stack = [I4()]; this.current = 'default'; this.partId = 0; }
  // Each primitive call starts a new part. Parts never share vertices, so parts that touch exactly
  // (coincident contact) stay separate closed solids for checks and audits. Call part() to group
  // several patch() calls into one part.
  part() { this.partId++; return this; }
  use(name) { this.current = name; return this; }
  get m() { return this.stack[this.stack.length - 1]; }
  push() { this.stack.push([...this.m]); return this; }
  pop() { if (this.stack.length > 1) this.stack.pop(); return this; }
  apply(mat) { this.stack[this.stack.length - 1] = m4mul(this.m, mat); return this; }
  translate(x, y, z) { return this.apply([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); }
  scale(x, y = x, z = x) { return this.apply([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]); }
  rotateX(a) { const c = Math.cos(a), s = Math.sin(a); return this.apply([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
  rotateY(a) { const c = Math.cos(a), s = Math.sin(a); return this.apply([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
  rotateZ(a) { const c = Math.cos(a), s = Math.sin(a); return this.apply([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }

  // tris in local space; normals (optional) as per-corner local normals
  patch(tris, { crease = 30, normals = null } = {}) {
    const m = this.m, flip = m3det(m) < 0;
    let W = tris.map((t) => ({ p: t.p.map((p) => m4point(m, p)), uv: t.uv || [[0, 0], [0, 0], [0, 0]] }));
    let N = normals ? normals.map((ns) => ns.map((n) => m4normal(m, n))) : null;
    if (flip) { W = W.map((t) => ({ p: [t.p[0], t.p[2], t.p[1]], uv: [t.uv[0], t.uv[2], t.uv[1]] })); if (N) N = N.map((n) => [n[0], n[2], n[1]]); }
    W = W.filter((t, i) => { const ok = len(cross(sub(t.p[1], t.p[0]), sub(t.p[2], t.p[0]))) > 1e-12; if (!ok && N) N[i] = null; return ok; });
    if (N) N = N.filter(Boolean);
    const NN = N || creasedNormals(W, crease);
    if (!this.slots.has(this.current)) this.slots.set(this.current, new Slot());
    const S = this.slots.get(this.current);
    const qk = (p, n, uv) => this.partId + '#' + [p, n].map((v) => v.map((x) => Math.round(x * 1e5)).join(',')).join('|') + '|' + uv.map((x) => Math.round(x * 1e4)).join(',');
    W.forEach((t, i) => {
      const ids = t.p.map((p, k) => {
        const n = NN[i][k], uv = t.uv[k], key = qk(p, n, uv);
        let id = S.map.get(key);
        if (id === undefined) { id = S.pos.length / 3; S.map.set(key, id); S.pos.push(...p); S.nrm.push(...n); S.uv.push(uv[0], uv[1]); S.part.push(this.partId); }
        return id;
      });
      if (ids[0] !== ids[1] && ids[1] !== ids[2] && ids[0] !== ids[2]) S.idx.push(...ids);
    });
    return this;
  }

  // quad helper in local space: a,b,c,d counter-clockwise seen from the outside
  quads(rows, { closeU = false, closeV = false, crease = 30, uv = null } = {}) {
    const tris = [], nu = rows[0].length, nv = rows.length;
    const UV = (i, j) => (uv ? uv(i, j) : [i / (nu - 1), j / (nv - 1)]);
    for (let j = 0; j < nv - 1 + (closeV ? 1 : 0); j++) for (let i = 0; i < nu - 1 + (closeU ? 1 : 0); i++) {
      const j1 = (j + 1) % nv, i1 = (i + 1) % nu;
      const a = rows[j][i], b = rows[j][i1], c = rows[j1][i1], d = rows[j1][i];
      const ua = UV(i, j), ub = UV(i + 1, j), uc = UV(i + 1, j + 1), ud = UV(i, j + 1);
      tris.push({ p: [a, b, c], uv: [ua, ub, uc] }, { p: [a, c, d], uv: [ua, uc, ud] });
    }
    return this.patch(tris, { crease });
  }

  grid(fn, nu, nv, { closeU = false, closeV = false, creaseDeg = 30 } = {}) {
    this.part();
    const rows = [];
    for (let j = 0; j <= nv - (closeV ? 1 : 0); j++) { const r = []; for (let i = 0; i <= nu - (closeU ? 1 : 0); i++) r.push(fn(i / nu, j / nv)); rows.push(r); }
    return this.quads(rows, { closeU, closeV, crease: creaseDeg });
  }

  lathe(profile, { segments = 32, arc = Math.PI * 2, phase = 0, capStart = true, capEnd = true, creaseDeg = 40 } = {}) {
    this.part();
    const full = Math.abs(arc - Math.PI * 2) < 1e-9, cols = full ? segments : segments + 1;
    const ring = (r, y) => [...Array(cols)].map((_, i) => { const a = phase + (arc * i) / segments; return [r * Math.sin(a), y, r * Math.cos(a)]; });
    const rows = profile.map(([r, y]) => ring(r, y));
    // profile runs bottom → top; rows ordered by profile, columns by angle: winding outward
    const tris = [];
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < cols - (full ? 0 : 1); i++) {
      const i1 = (i + 1) % cols, a = rows[j][i], b = rows[j][i1], c = rows[j + 1][i1], d = rows[j + 1][i];
      const u0 = i / segments, u1 = (i + 1) / segments, v0 = j / (rows.length - 1), v1 = (j + 1) / (rows.length - 1);
      tris.push({ p: [a, b, c], uv: [[u0, v0], [u1, v0], [u1, v1]] }, { p: [a, c, d], uv: [[u0, v0], [u1, v1], [u0, v1]] });
    }
    this.patch(tris, { crease: creaseDeg });
    const cap = (k, up) => { // flat disc closing an end whose radius is not zero, facing ±y
      const [r, y] = profile[k]; if (r <= 1e-9 || !full) return;
      const tz = triangulate(ring(r, y).map((p) => [p[0], p[2]]));
      const P3 = tz.points.map(([x, z]) => [x, y, z]);
      this.patch(tz.tris.map(([a, b, c]) => {
        const p = [P3[a], P3[b], P3[c]], ny = cross(sub(p[1], p[0]), sub(p[2], p[0]))[1];
        return { p: (ny > 0) === up ? p : [p[0], p[2], p[1]] };
      }), { crease: 1 });
    };
    if (capStart) cap(0, false);
    if (capEnd) cap(profile.length - 1, true);
    return this;
  }

  // section frames by parallel transport; exact mitres at interior joints
  sweep(profile, path, { closedPath = false, closedProfile = true, up = [0, 1, 0], creaseDeg = 30, capEnds = true } = {}) {
    this.part();
    const n = path.length, segs = closedPath ? n : n - 1;
    const T = []; for (let i = 0; i < segs; i++) T.push(norm(sub(path[(i + 1) % n], path[i])));
    const N = [];
    let nn = sub(up, mul(T[0], dot(up, T[0]))); if (len(nn) < 1e-6) nn = Math.abs(T[0][0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
    N.push(norm(sub(nn, mul(T[0], dot(nn, T[0])))));
    for (let i = 1; i < segs; i++) { // rotate N[i-1] by the rotation taking T[i-1] to T[i]
      const ax = cross(T[i - 1], T[i]), s = len(ax), c = dot(T[i - 1], T[i]);
      let v = N[i - 1];
      if (s > 1e-9) { const k = mul(ax, 1 / s), ang = Math.atan2(s, c); v = add(add(mul(v, Math.cos(ang)), mul(cross(k, v), Math.sin(ang))), mul(k, dot(k, v) * (1 - Math.cos(ang)))); }
      N.push(norm(v));
    }
    const ringAt = (i) => { // section at path vertex i, mitred
      const prev = closedPath ? (i - 1 + segs) % segs : Math.max(0, i - 1);
      const segIn = i === 0 && !closedPath ? 0 : prev, segOut = !closedPath && i === n - 1 ? segs - 1 : i % segs;
      const t0 = T[segIn], nrm0 = N[segIn], side0 = cross(t0, nrm0);
      const bis = (i === 0 || i === n - 1) && !closedPath ? t0 : norm(add(T[segIn], T[segOut]));
      return profile.map(([x, y]) => {
        const q = add(path[i], add(mul(side0, x), mul(nrm0, y)));
        const off = dot(sub(q, path[i]), bis), dn = dot(t0, bis);
        return sub(q, mul(t0, off / dn));
      });
    };
    const rings = []; for (let i = 0; i < n; i++) rings.push(ringAt(i));
    if (closedPath) rings.push(rings[0]);
    const prof = closedProfile ? [...Array(profile.length + 1)].map((_, k) => k % profile.length) : profile.map((_, k) => k);
    const tris = [];
    // the profile is wound counter-clockwise in (side, up); quads oriented outward
    for (let j = 0; j < rings.length - 1; j++) for (let k = 0; k < prof.length - 1; k++) {
      const a = rings[j][prof[k]], b = rings[j][prof[k + 1]], c = rings[j + 1][prof[k + 1]], d = rings[j + 1][prof[k]];
      const v0 = j / (rings.length - 1), v1 = (j + 1) / (rings.length - 1), u0 = k / (prof.length - 1), u1 = (k + 1) / (prof.length - 1);
      tris.push({ p: [a, c, b], uv: [[u0, v0], [u1, v1], [u1, v0]] }, { p: [a, d, c], uv: [[u0, v0], [u0, v1], [u1, v1]] });
    }
    if (area2(profile) < 0) for (const t of tris) { [t.p[1], t.p[2]] = [t.p[2], t.p[1]]; [t.uv[1], t.uv[2]] = [t.uv[2], t.uv[1]]; }
    this.patch(tris, { crease: creaseDeg });
    if (closedProfile && !closedPath && capEnds) { // end caps facing back along / forward along the path
      const tz = triangulate(profile), idxOf = tz.points.map((p) => profile.findIndex((q) => q[0] === p[0] && q[1] === p[1]));
      const make = (ring, want) => tz.tris.map(([a, b, c]) => {
        const p = [ring[idxOf[a]], ring[idxOf[b]], ring[idxOf[c]]];
        return { p: dot(cross(sub(p[1], p[0]), sub(p[2], p[0])), want) > 0 ? p : [p[0], p[2], p[1]] };
      });
      this.patch(make(rings[0], mul(T[0], -1)), { crease: 1 });
      this.patch(make(rings[rings.length - 1], T[segs - 1]), { crease: 1 });
    }
    return this;
  }

  loft(rings, { closed = true, capStart = false, capEnd = false, creaseDeg = 30 } = {}) {
    this.part();
    // closed sections are re-ordered so each ring winds counter-clockwise about the loft axis
    // (Newell normal along first → second ring); then the sides face outward and the caps agree
    let rows = rings.map((r) => r);
    if (closed && rows.length > 1) {
      const r0 = rows[0]; let nx = 0, ny = 0, nz = 0;
      for (let i = 0; i < r0.length; i++) { const a = r0[i], b = r0[(i + 1) % r0.length]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
      const c0 = mul(r0.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / r0.length), c1 = mul(rows[1].reduce((s, p) => add(s, p), [0, 0, 0]), 1 / rows[1].length);
      if (dot([nx, ny, nz], sub(c1, c0)) < 0) rows = rows.map((r) => [...r].reverse());
    }
    this.quads(rows, { closeU: closed, crease: creaseDeg });
    // caps: fan from the centroid (lofted sections are near-planar and convex), each triangle oriented to
    // face away from the neighbouring ring, so caps agree with the sides whatever the ring order
    const centre = (ring) => mul(ring.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / ring.length);
    const capOf = (ring, neighbour) => {
      const c = centre(ring), out = sub(c, centre(neighbour));
      return ring.map((p, i) => { const q = ring[(i + 1) % ring.length], t = [c, p, q]; return { p: dot(cross(sub(t[1], t[0]), sub(t[2], t[0])), out) >= 0 ? t : [c, q, p] }; });
    };
    if (capStart) this.patch(capOf(rows[0], rows[1]), { crease: 1 });
    if (capEnd) this.patch(capOf(rows[rows.length - 1], rows[rows.length - 2]), { crease: 1 });
    return this;
  }

  // Closed slab from an outline with holes, mapped through a surface. Openings cut through.
  extrude(outline, holes = [], depth = 0.3, { surface = planeSurface(), maxEdge = 0, capEdges = true, creaseDeg = 30, uvScale = 1 } = {}) {
    this.part();
    const O = ccw(resampleLoop(outline, maxEdge)), Hs = holes.map((h) => cw(resampleLoop(h, maxEdge)));
    const tz = triangulate(O, Hs);
    const { points, tris } = refine(tz.points, tz.tris, maxEdge);
    const front = [], back = [];
    for (const [a, b, c] of tris) {
      const A = points[a], B = points[b], C = points[c];
      const uv = [A, B, C].map((p) => [p[0] * uvScale, p[1] * uvScale]);
      front.push({ p: [surface(A[0], A[1], 0), surface(B[0], B[1], 0), surface(C[0], C[1], 0)], uv });
      back.push({ p: [surface(A[0], A[1], -depth), surface(C[0], C[1], -depth), surface(B[0], B[1], -depth)], uv: [uv[0], uv[2], uv[1]] });
    }
    // orient by the surface's +d direction (robust for any mapping)
    const fix = (t, wantDir) => {
      const c = mul(add(add(t.p[0], t.p[1]), t.p[2]), 1 / 3), n = cross(sub(t.p[1], t.p[0]), sub(t.p[2], t.p[0]));
      if (dot(n, wantDir(c)) < 0) { [t.p[1], t.p[2]] = [t.p[2], t.p[1]]; [t.uv[1], t.uv[2]] = [t.uv[2], t.uv[1]]; }
      return t;
    };
    const dDir = (s, t) => sub(surface(s, t, 1e-3), surface(s, t, 0));
    tris.forEach(([a, b, c], i) => { const A = points[a], B = points[b], C = points[c], s = (A[0] + B[0] + C[0]) / 3, t = (A[1] + B[1] + C[1]) / 3; fix(front[i], () => dDir(s, t)); fix(back[i], () => mul(dDir(s, t), -1)); });
    this.patch(front, { crease: creaseDeg }).patch(back, { crease: creaseDeg });
    // reveals (holes) and edges (outline): quads between d = 0 and d = -depth, normal to the right of travel
    const band = (loop) => {
      const tr = [];
      let run = 0;
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i], b = loop[(i + 1) % loop.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const A0 = surface(a[0], a[1], 0), B0 = surface(b[0], b[1], 0), A1 = surface(a[0], a[1], -depth), B1 = surface(b[0], b[1], -depth);
        const u0 = run * uvScale, u1 = (run + L) * uvScale; run += L;
        const ms = (a[0] + b[0]) / 2, mt = (a[1] + b[1]) / 2, ds = b[0] - a[0], dt = b[1] - a[1];
        const right = sub(surface(ms + dt * 1e-3, mt - ds * 1e-3, -depth / 2), surface(ms, mt, -depth / 2));
        const q1 = { p: [A0, B0, B1], uv: [[u0, 0], [u1, 0], [u1, depth * uvScale]] }, q2 = { p: [A0, B1, A1], uv: [[u0, 0], [u1, depth * uvScale], [u0, depth * uvScale]] };
        tr.push(fix(q1, () => right), fix(q2, () => right));
      }
      return tr;
    };
    for (const h of Hs) this.patch(band(h), { crease: creaseDeg });
    if (capEdges) this.patch(band(O), { crease: creaseDeg });
    return this;
  }
  wall(...a) { return this.extrude(...a); }

  build() {
    const out = {};
    for (const [name, S] of this.slots) out[name] = { position: new Float32Array(S.pos), normal: new Float32Array(S.nrm), uv: new Float32Array(S.uv), part: new Uint32Array(S.part), index: new Uint32Array(S.idx) };
    return out;
  }
}

export function toThree(THREE, built) {
  const out = {};
  for (const [name, g] of Object.entries(built)) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(g.position, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(g.normal, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(g.uv, 2));
    if (g.part) geo.setAttribute('part', new THREE.BufferAttribute(new Float32Array(g.part), 1)); // read by the audits
    geo.setIndex(new THREE.BufferAttribute(g.index, 1));
    geo.computeBoundingSphere();
    out[name] = geo;
  }
  return out;
}

// ---------------------------------------------------------------- checks used by the self-test and by builders
// Weld by position, then require every directed edge to have exactly one opposite. Returns { watertight, volume, badEdges }.
// With a part attribute, every part is checked as its own solid.
export function closedSolidCheck(g) {
  const P = g.position, I = g.index, part = g.part || null;
  const q = (i) => (part ? part[i] + '#' : '') + Math.round(P[i * 3] * 1e4) + ',' + Math.round(P[i * 3 + 1] * 1e4) + ',' + Math.round(P[i * 3 + 2] * 1e4);
  const id = new Map(), W = []; for (let i = 0; i < P.length / 3; i++) { const k = q(i); if (!id.has(k)) id.set(k, id.size); W.push(id.get(k)); }
  const edges = new Map(); let vol = 0;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t], b = I[t + 1], c = I[t + 2], A = [P[a * 3], P[a * 3 + 1], P[a * 3 + 2]], B = [P[b * 3], P[b * 3 + 1], P[b * 3 + 2]], C = [P[c * 3], P[c * 3 + 1], P[c * 3 + 2]];
    vol += dot(A, cross(B, C)) / 6;
    for (const [x, y] of [[W[a], W[b]], [W[b], W[c]], [W[c], W[a]]]) { const k = x + '>' + y; edges.set(k, (edges.get(k) || 0) + 1); }
  }
  let bad = 0; for (const [k, n] of edges) { const [x, y] = k.split('>'); if (n !== 1 || edges.get(y + '>' + x) !== 1) bad++; }
  return { watertight: bad === 0, volume: vol, badEdges: bad };
}
