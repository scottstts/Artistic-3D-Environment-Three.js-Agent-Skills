// node selftest.mjs: builds a small synthetic scene with one known instance of each defect class
// (plus correctly built parts that must NOT be reported) and checks every audit finds exactly what it should.
import { MeshWriter, rectLoop } from '../../env-geometry-construction/scripts/meshkit/meshkit.mjs';
import { coplanar, support, clearance, shells, faceting } from './audit-lib.mjs';

const box = (name, x, y, z, sx, sy, sz, { group = 'solid', ground = false, flip = false, open = false } = {}) => {
  const w = new MeshWriter().use('s');
  w.push().translate(x, y, z + sz / 2);
  w.extrude(rectLoop(0, 0, sx, sy), [], sz, {});
  w.pop();
  const g = w.build().s;
  let index = [...g.index];
  if (flip) for (let i = 0; i < index.length; i += 3) [index[i + 1], index[i + 2]] = [index[i + 2], index[i + 1]];
  if (open) index = index.slice(0, index.length - 6); // remove one quad → hole in the shell
  return { name, position: g.position, index, group, ground };
};

const meshes = [
  box('ground', -10, -1, 0, 20, 1, 20, { ground: true, group: 'ground' }),   // top face at y = 0
  box('wall', 0, 0, 0, 4, 3, 0.4),                                          // stands on the ground
  box('plinth-seated', 1, 2.996, 0.1, 1, 0.5, 0.3),                         // sunk 4 mm into the wall top: fine
  box('cap-coplanar', 0.5, 2.5, 0.0, 1, 0.5, 0.4),                          // its front face shares the wall's front plane while overlapping it
  box('floating-finial', 8, 4, 0, 0.3, 0.6, 0.3),                           // 4 m in the air, touching nothing
  box('beam-through', -1, 1, 0, 6, 0.3, 0.3),                               // passes straight through the wall
  box('inside-out', 6, 0, -3, 1, 1, 1, { flip: true }),
  box('open-shell', -6, 0, -3, 1, 1, 1, { open: true }),
  box('leaf-in-wall', 2, 1.5, 0.1, 0.08, 0.02, 0.08, { group: 'plant' }),   // a leaf buried in the wall
];

let failed = 0;
const check = (name, cond, info = '') => { console.log(`${cond ? 'ok  ' : 'FAIL'} ${name} ${info}`); if (!cond) failed++; };

const cp = coplanar(meshes, { sameFacingOnly: true });
const cpNames = new Set(cp.hits.flatMap((h) => h.meshes));
check('coplanar finds the cap sharing the wall plane', cpNames.has('cap-coplanar') && cpNames.has('wall'), JSON.stringify(cp.summary));
check('coplanar ignores the seated plinth', !cpNames.has('plinth-seated'));

const sp = support(meshes, {});
const floating = sp.hits.map((h) => h.mesh);
check('support finds the floating finial', floating.includes('floating-finial'), JSON.stringify(floating));
check('support accepts parts seated on supported parts', !floating.includes('plinth-seated') && !floating.includes('wall'));

const cl = clearance(meshes, { seat: 0.01 });
const pairs = cl.hits.map((h) => h.meshes.sort().join('+'));
check('clearance finds the beam through the wall', pairs.includes(['beam-through', 'wall'].sort().join('+')), JSON.stringify(cl.hits.map((h) => [h.meshes, h.depth])));
check('clearance ignores the 4 mm seat', !pairs.some((p) => p.includes('plinth-seated')));
const pl = clearance(meshes, { seat: 0.005, between: ['plant', 'solid'] });
check('clearance (plants vs solids) finds the buried leaf', pl.hits.some((h) => h.meshes[0] === 'leaf-in-wall'));

const sh = shells(meshes, {});
const shNames = Object.fromEntries(sh.hits.map((h) => [h.mesh, h.issues.join('; ')]));
check('shells finds the inside-out solid', /inside-out/.test(shNames['inside-out'] || ''), shNames['inside-out']);
check('shells finds the open shell', /open edges/.test(shNames['open-shell'] || ''), shNames['open-shell']);
check('shells passes the well-built wall', !shNames.wall);

// faceting: a few-sided cylinder built with face-angle creasing shades flat (reported); the same shape
// from meshkit's lathe is smooth (clean); a box's 90° corners are real (clean); a faceted gem is skipped
{
  const ring = (y) => [...Array(8)].map((_, k) => [0.2 * Math.cos((k / 8) * Math.PI * 2), y, 0.2 * Math.sin((k / 8) * Math.PI * 2)]);
  const bad = new MeshWriter().use('s'); bad.quads([ring(0), ring(1)], { closeU: true, crease: 30 });
  const good = new MeshWriter().use('s'); good.lathe([[0.2, 0], [0.2, 1]], { segments: 8, capStart: false, capEnd: false });
  const gem = new MeshWriter().use('s'); gem.lathe([[0, 0], [0.2, 0.15], [0, 0.3]], { segments: 8, faceted: true });
  const m = (name, w, extra = {}) => { const g = w.build().s; return { name, position: g.position, index: g.index, normal: g.normal, part: g.part, ...extra }; };
  const boxG = box('box', 0, 0, 0, 1, 1, 1);
  const bw = new MeshWriter().use('s'); bw.extrude(rectLoop(0, 0, 1, 1), [], 1, {});
  const fc = faceting([m('flat-cylinder', bad), m('smooth-lathe', good), m('gem', gem, { faceted: true }), m('box', bw), { name: 'flat-material', position: boxG.position, index: boxG.index, flatShading: true }]);
  const names = fc.hits.map((h) => h.mesh);
  check('faceting finds the flat-shaded cylinder', names.includes('flat-cylinder'), JSON.stringify(fc.hits.map((h) => [h.mesh, h.facetEdges])));
  check('faceting passes the smooth lathe, the box corners and the faceted gem', !names.includes('smooth-lathe') && !names.includes('box') && !names.includes('gem'));
  check('faceting reports flatShading materials', names.includes('flat-material'));
}

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1); }
console.log('all audit checks passed');
