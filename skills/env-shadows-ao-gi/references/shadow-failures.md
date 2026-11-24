# Shadows in depth

## Coverage

- **One directional map** is enough only for a compact scene the viewer can't leave. Fit its orthographic frustum tightly around the casters and receivers in view: wider means coarser texels and a larger bias in metres.
- **Cascades** (`CSMShadowNode`, three.js r187, `import { CSMShadowNode } from 'three/addons/csm/CSMShadowNode.js'`):

  ```js
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const csm = new CSMShadowNode(sun, { cascades: 4, maxFar: 600, mode: 'practical', lightMargin: 200 });
  csm.fade = true;                       // blend between cascades
  sun.shadow.shadowNode = csm;
  ```

  Fade between cascades. Set `maxFar` to where shadows stop mattering, then let terrain self-shadow beyond it from a baked map.
- **Long-range world-fixed map:** for big static worlds, a second map covering kilometres at a coarse resolution, taking over exactly where the near map ends, with a blend band.
- **Baked terrain shadow:** large static terrain (dunes, mountains) can bake sun visibility into a map at load. Then shadows exist at any distance.

## Bias and filtering

- **Depth bias** is in normalized depth: its size in metres scales with the shadow camera's near-to-far range. Keep the range tight.
- **Normal bias** offsets lookups along the surface normal, in world units. It fixes acne on grazing surfaces with less peter-panning than depth bias.
- **Tune both on the worst case:** a large flat surface at a grazing sun angle (acne), and a thin post standing on the ground (peter-panning).
- **Filtering:** PCF with a radius matching the sun's penumbra. A wide filter on a coarse map produces grain or stair-steps. Fix those with resolution, not with more blur.

## Update policy

| Caster | Policy |
|---|---|
| Static architecture and terrain | Render once (`renderer.shadowMap.autoUpdate = false`, then trigger one update after build) |
| Vegetation in wind, characters, vehicles, animated parts | Every frame |
| Mixed | Split static and dynamic into separate maps or layers, or update every frame (measure the cost first) |

## Agreement

Shadows come from the visible sun only (`env-lighting`). A fill light never casts. After any sun change, check with a stick-shadow view toward the sun.

## Separating shadow bugs from material bugs

Add a plain, matte, receiving test plane at the problem spot. If its shadow is right, the problem is in the material (a custom shader ignoring shadows, or emissive overriding them). If its shadow is wrong too, the problem is in the shadow system.
