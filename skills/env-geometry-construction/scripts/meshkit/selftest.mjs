// node selftest.mjs: checks that meshkit primitives produce closed, outward-wound solids with the
// expected volume, that mirroring keeps winding outward, and that curved surfaces get smooth normals.
import { MeshWriter, closedSolidCheck, rectLoop, archLoop, circleLoop, cylinderSurface, polygonArea, notchOutline } from './meshkit.mjs';

let failed = 0;
const check = (name, cond, info = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name} ${info}`); if (!cond) failed++; };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

{ // wall with a rectangular window and a round-arched door, on a plane
  const w = new MeshWriter().use('wall');
  const outline = rectLoop(0, 0, 8, 5), win = rectLoop(1, 1.2, 1.4, 1.6), door = archLoop(4.5, 0.3, 1.6, 2.2, { kind: 'round', segments: 24 });
  w.extrude(outline, [win, door], 0.4, { maxEdge: 0.5 });
  const g = w.build().wall, c = closedSolidCheck(g);
  const expect = (40 - polygonArea(win) - polygonArea(door)) * 0.4;
  check('plane wall with openings is watertight', c.watertight, `bad edges ${c.badEdges}`);
  check('plane wall volume', near(c.volume, expect, 1e-3), `${c.volume.toFixed(4)} vs ${expect.toFixed(4)}`);
}
{ // the same wall wrapped on a drum of radius 6, with a pointed opening
  const w = new MeshWriter().use('drum');
  w.extrude(rectLoop(0, 0, 6, 4), [archLoop(2, 0.5, 1.2, 1.8, { kind: 'pointed' })], 0.5, { surface: cylinderSurface(6), maxEdge: 0.25 });
  const c = closedSolidCheck(w.build().drum);
  check('drum wall watertight', c.watertight, `bad edges ${c.badEdges}`);
  check('drum wall has positive volume (outward winding)', c.volume > 0, c.volume.toFixed(3));
}
{ // lathe: a closed baluster-like solid; volume against the exact solid of revolution of its profile
  const prof = [[0.12, 0], [0.12, 0.05], [0.07, 0.12], [0.11, 0.35], [0.06, 0.6], [0.09, 0.66], [0.09, 0.72]];
  const seg = 96, w = new MeshWriter().use('lathe');
  w.lathe(prof, { segments: seg });
  const g = w.build().lathe, c = closedSolidCheck(g);
  let exact = 0; for (let i = 0; i < prof.length - 1; i++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1]; exact += (Math.PI * (y1 - y0) * (r0 * r0 + r0 * r1 + r1 * r1)) / 3; }
  const polyFactor = (seg / (2 * Math.PI)) * Math.sin((2 * Math.PI) / seg); // inscribed polygon area ratio
  check('lathe watertight', c.watertight, `bad edges ${c.badEdges}`);
  check('lathe volume', near(c.volume, exact * polyFactor, 2e-3), `${c.volume.toFixed(5)} vs ${(exact * polyFactor).toFixed(5)}`);
  // smoothness: on the side surface, a vertex normal's horizontal part must point radially (flat facets
  // would be off by up to 180/seg degrees)
  const P = g.position, n = g.normal; let maxDev = 0;
  for (let i = 0; i < P.length / 3; i++) {
    const hx = n[i * 3], hz = n[i * 3 + 2], hl = Math.hypot(hx, hz), r = Math.hypot(P[i * 3], P[i * 3 + 2]);
    if (hl < 0.2 || r < 1e-6) continue; // caps
    const d = (hx * P[i * 3] + hz * P[i * 3 + 2]) / (hl * r);
    maxDev = Math.max(maxDev, Math.acos(Math.min(1, d)) * 180 / Math.PI);
  }
  check('lathe normals smooth around the revolution', maxDev < (180 / seg) * 0.25, `max deviation ${maxDev.toFixed(3)} deg`);
}
{ // sweep: rectangular moulding profile around a closed square path, plus an open run with caps
  const prof = [[-0.1, 0], [0.1, 0], [0.1, 0.15], [-0.1, 0.15]];
  const w = new MeshWriter().use('ring');
  w.sweep(prof, [[0, 0, 0], [4, 0, 0], [4, 0, -3], [0, 0, -3]], { closedPath: true });
  const c = closedSolidCheck(w.build().ring);
  const expect = 0.2 * 0.15 * (2 * 4 + 2 * 3); // mitred square ring: centreline length × section
  check('closed mitred sweep watertight', c.watertight, `bad edges ${c.badEdges}`);
  check('closed mitred sweep volume', near(Math.abs(c.volume), expect, 1e-3), `${c.volume.toFixed(4)} vs ${expect.toFixed(4)}`);
  check('closed mitred sweep outward', c.volume > 0);
  const w2 = new MeshWriter().use('run');
  w2.sweep(prof, [[0, 0, 0], [2, 0.5, 0], [3, 0.5, 1.5]], {});
  const c2 = closedSolidCheck(w2.build().run);
  check('open capped sweep watertight', c2.watertight, `bad edges ${c2.badEdges}`);
  check('open capped sweep outward', c2.volume > 0, c2.volume.toFixed(4));
}
{ // a doorway reaching the floor is a notch; passing it as a hole must fail loudly
  const door = archLoop(1, 0, 1.2, 2, { kind: 'segmental', rise: 0.3 });
  const w = new MeshWriter().use('n');
  w.extrude(notchOutline(4, 4, [door]), [], 0.3, { maxEdge: 0.3 });
  const c = closedSolidCheck(w.build().n), expect = (16 - polygonArea(door)) * 0.3;
  check('notched doorway wall watertight', c.watertight, `bad edges ${c.badEdges}`);
  check('notched doorway wall volume', near(c.volume, expect, 1e-3), `${c.volume.toFixed(4)} vs ${expect.toFixed(4)}`);
  let threw = false; try { new MeshWriter().extrude(rectLoop(0, 0, 4, 4), [door], 0.3); } catch { threw = true; }
  check('hole touching the outline is rejected', threw);
}
{ // capped loft is closed and consistent for both ring orders (sides wound either way)
  for (const rev of [false, true]) {
    const rings = [0, 0.5, 1.2].map((y, j) => [...Array(12)].map((_, k) => { const a = (k / 12) * Math.PI * 2, r = 0.3 - j * 0.08; return [r * Math.cos(a), y, r * Math.sin(a)]; }));
    const w = new MeshWriter().use('l');
    w.loft(rev ? rings.map((r) => [...r].reverse()) : rings, { closed: true, capStart: true, capEnd: true });
    const c = closedSolidCheck(w.build().l);
    check(`capped loft consistent (${rev ? 'reversed' : 'forward'} rings)`, c.watertight, `bad edges ${c.badEdges}`);
  }
}
{ // mirroring keeps winding outward
  const w = new MeshWriter().use('m');
  w.push().scale(-1, 1, 1).extrude(rectLoop(0, 0, 2, 2), [circleLoop(1, 1, 0.4, 24)], 0.3, {}).pop();
  const c = closedSolidCheck(w.build().m);
  check('mirrored slab watertight', c.watertight);
  check('mirrored slab outward', c.volume > 0, c.volume.toFixed(4));
}
{ // creased normals: a box-section sweep keeps hard corners (normals not averaged across 90 degrees)
  const w = new MeshWriter().use('box');
  w.sweep([[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 1]], [[0, 0, 0], [0, 0, -2]], {});
  const g = w.build().box; let soft = 0;
  for (let i = 0; i < g.normal.length; i += 3) { const ax = [Math.abs(g.normal[i]), Math.abs(g.normal[i + 1]), Math.abs(g.normal[i + 2])]; if (Math.max(...ax) < 0.999) soft++; }
  check('hard corners stay hard', soft === 0, `${soft} averaged normals`);
}
{ // few-sided curved parts shade smooth by default; faceted: true keeps facets on purpose
  const radialDev = (g) => { // max angle between a side vertex's horizontal normal and its radial direction
    let m = 0; const P = g.position, n = g.normal;
    for (let i = 0; i < P.length / 3; i++) { const hx = n[i * 3], hz = n[i * 3 + 2], hl = Math.hypot(hx, hz), r = Math.hypot(P[i * 3], P[i * 3 + 2]); if (hl < 0.5 || r < 1e-6) continue; m = Math.max(m, Math.acos(Math.min(1, (hx * P[i * 3] + hz * P[i * 3 + 2]) / (hl * r))) * 180 / Math.PI); }
    return m;
  };
  const baluster = [[0.06, 0], [0.06, 0.04, 'sharp'], [0.035, 0.1], [0.055, 0.35], [0.03, 0.6], [0.05, 0.66, 'sharp'], [0.05, 0.7]];
  const w = new MeshWriter().use('a'); w.lathe(baluster, { segments: 8 });
  check('8-sided lathe shades smooth (default crease)', radialDev(w.build().a) < 0.5, `max ${radialDev(w.build().a).toFixed(2)} deg`);
  const f = new MeshWriter().use('a'); f.lathe([[1, 0], [1, 3]], { segments: 8, faceted: true, capStart: false, capEnd: false });
  check('faceted lathe keeps flat facets', radialDev(f.build().a) > 20, `max ${radialDev(f.build().a).toFixed(2)} deg`);
  const circle8 = [...Array(8)].map((_, k) => [0.05 * Math.cos((k / 8) * Math.PI * 2), 0.05 * Math.sin((k / 8) * Math.PI * 2)]);
  const s = new MeshWriter().use('t'); s.sweep(circle8, [[0, 0, 0], [0, 1, 0]], { up: [1, 0, 0], capEnds: false });
  check('8-sided round sweep shades smooth', radialDev(s.build().t) < 0.5, `max ${radialDev(s.build().t).toFixed(2)} deg`);
  const rings = [0, 1, 2].map((y) => [...Array(6)].map((_, k) => [0.1 * Math.cos((k / 6) * Math.PI * 2), y, 0.1 * Math.sin((k / 6) * Math.PI * 2)]));
  const l = new MeshWriter().use('l'); l.loft(rings, { closed: true });
  check('6-sided loft shades smooth', radialDev(l.build().l) < 0.5, `max ${radialDev(l.build().l).toFixed(2)} deg`);
  const rings4 = [0, 1].map((y) => [...Array(4)].map((_, k) => [0.1 * Math.cos((k / 4) * Math.PI * 2), y, 0.1 * Math.sin((k / 4) * Math.PI * 2)]));
  const sq = new MeshWriter().use('q'); sq.loft(rings4, { closed: true });
  check('4-sided loft (a square post) keeps hard corners', radialDev(sq.build().q) > 40, `max ${radialDev(sq.build().q).toFixed(2)} deg`);
  const tw = new MeshWriter().use('q'); tw.loft(rings4, { closed: true, round: true });
  check('round: true shades a 4-sided twig round', radialDev(tw.build().q) < 0.5, `max ${radialDev(tw.build().q).toFixed(2)} deg`);
}
if (failed) { console.error(`${failed} check(s) failed`); process.exit(1); }
console.log('all meshkit checks passed');
