# Projection and tiling

The snippets are TSL for `WebGPURenderer`, checked against three.js r187. The method carries over to GLSL on WebGL2.

## Triplanar with a whiteout normal blend

```js
import { texture, positionWorld, normalWorld, abs, pow, vec3, float, normalize, Fn, transformNormalToView } from 'three/tsl';

const triWeights = Fn(([n]) => { const w = pow(abs(n), vec3(6)); return w.div(w.x.add(w.y).add(w.z)); });
const tri = (map, p, w) => texture(map, p.zy).mul(w.x).add(texture(map, p.xz).mul(w.y)).add(texture(map, p.xy).mul(w.z));
const triNormal = (map, p, w, n, strength = 1) => { // whiteout blend, in world space
  const tx = texture(map, p.zy).xyz.mul(2).sub(1), ty = texture(map, p.xz).xyz.mul(2).sub(1), tz = texture(map, p.xy).xyz.mul(2).sub(1);
  const s = float(strength);
  const nx = vec3(tx.xy.mul(s).add(n.zy), abs(tx.z).mul(n.x));
  const ny = vec3(ty.xy.mul(s).add(n.xz), abs(ty.z).mul(n.y));
  const nz = vec3(tz.xy.mul(s).add(n.xy), abs(tz.z).mul(n.z));
  return normalize(nx.zyx.mul(w.x).add(ny.xzy.mul(w.y)).add(nz.xyz.mul(w.z)));
};
// usage: p = positionWorld.mul(tilesPerMetre); w = triWeights(normalWorld)
// material.colorNode = tri(T.basecolor, p, w).rgb
// material.roughnessNode = tri(T.roughness, p, w).r
// material.normalNode = transformNormalToView(triNormal(T.normal, p, w, normalWorld))
```

- Use a sharpness exponent of 4–8: higher means less blending smear on blocky forms.
- For double-sided materials, flip the normal by `faceDirection` before computing the weights.
- Height maps used for displacement must use the **same** projection, scale and offset as the shading maps, so geometric cracks line up with texture cracks.

## Hiding repetition

| Technique | When |
|---|---|
| Several scales: the same scan at about 1×, 0.27× and 0.07× frequency, blended by distance or by a low-frequency mask | Terrain, cliffs, large walls |
| Per-element variation: each slab, board or tile offsets and rotates its UVs by a hash of its cell, with a small tone shift | Paving, floors, cladding, roof tiles |
| Macro variation: low-frequency noise modulating tint and roughness | Any large surface |
| Detail by mask: wear in cavities, grime under ledges, moss on up-facing surfaces, run-off stains below sills | Masonry and stone |
| Stochastic or hex tiling | Large ground textures with no natural elements |

Check from high above with a wide FOV. If you can count repeats, it isn't done.

## Arc-length UVs

Sweeps, lofts and lathes take their U from the accumulated length along the path or profile, not from the parameter. Otherwise texture and procedural detail stretch where segments are longer. Meshkit's sweep and extrude reveals use the running length.

## Texel density

Set tiles per metre from the material's real feature size: a brick course of about 75 mm, slabs of 0.4–0.9 m, the grain of wood planks. Keep the density consistent across neighbouring surfaces. A change in density between a wall and its trim reads as a different material.

## Specular antialiasing

Under the pixel footprint, normal variation becomes roughness. Raise roughness by the screen-space variance of the normal (for example, from `fwidth` of the world normal) for dense specular patterns: gold relief, polished floors, fine mouldings. Without it, they shimmer in motion.
