# Indirect light with an irradiance-probe grid

## Why

Unoccluded fill (hemisphere or environment alone) lights every point as if it stood under the open sky. Recesses glow like open walls, and objects look pasted on. A probe grid captures, at each probe, the light actually arriving there: occluded sky, coloured bounce from sunlit surfaces, and light from practical lamps. Materials then read irradiance by position and normal. It is view-independent, and almost free per frame once baked.

## three.js r187: `LightProbeGrid`

```js
import { LightProbeGrid } from 'three/addons/lighting/LightProbeGrid.js';

// volume centred on the grid's position; one probe per cell, at the cell centres
const grid = new LightProbeGrid(60, 20, 60, 24, 8, 24);  // width, height, depth, probes along x, y, z
grid.position.set(0, 10, 0);
scene.add(grid);                                          // a Light: every lit node material picks it up

await renderer.init();
grid.bake(renderer, scene, { cubemapSize: 16, near: 0.05, far: 200, bounces: 2 });
```

- L2 spherical harmonics, baked on the GPU (cube capture, projection, packing into a 3D atlas).
- `bounces` adds indirect passes over the whole grid. Two or three bounces settle most architecture.
- Bake at load, after the scene is built and before the first visible frame. Re-bake only if lights or geometry change.
- A grid replaces the uniform fill inside its volume. Keep the environment for reflections, and for areas outside the grid.

## Placement

- **Cell size** resolves the spaces that differ in light: a probe inside every room and alcove, under every deck. Too coarse, and light leaks through thin walls (the light from outside a wall bleeds in). Make walls thicker than the probe spacing, or add probes on both sides.
- **Leaks:** where a probe falls inside solid geometry it sees black or the inside of a mesh. Move such probes out, or give the grid enough resolution that sampling offset along the normal reads the room the surface faces.
- **Scale:** several grids for a large world. A fine one over the reachable core, coarse ones beyond.

## Check

- An alcove or loggia beside an open wall of the same material: the alcove is darker and coloured by what surrounds it.
- Under decks and overhangs: dark, with a warm bounce where sunlit ground reflects up.
- Near a practical light: the warm bounce reaches the surfaces around it.
- No light leaking at wall bases, and no blotches where probes sit inside walls.
