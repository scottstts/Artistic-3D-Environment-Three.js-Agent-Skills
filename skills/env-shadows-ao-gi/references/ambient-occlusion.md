# Ambient occlusion

## Setup (three.js r187, TSL)

```js
import { pass, mrt, normalView, positionView, screenUV, builtinAOContext, smoothstep, mix, float } from 'three/tsl';
import { ao } from 'three/addons/tsl/display/GTAONode.js';

const prePass = pass(scene, camera);                 // depth + view normals
prePass.setMRT(mrt({ output: normalView }));
prePass.transparent = false;
const aoPass = ao(prePass.getTextureNode('depth'), prePass.getTextureNode(), camera);
aoPass.radius.value = 2.0;                           // metres: scale to the scene
aoPass.thickness.value = 1.5;
aoPass.samples.value = 16;

const scenePass = pass(scene, camera, { samples: 4 });
const farFade = smoothstep(250.0, 500.0, positionView.z.negate());          // no AO on far terrain
scenePass.contextNode = builtinAOContext(mix(aoPass.getTextureNode().sample(screenUV).r, float(1), farFade));
```

- `builtinAOContext` applies AO to the indirect and ambient lighting only, not to direct lights.
- Keep sky, water and emissive meshes out of the pre-pass, or mask them: AO must never multiply them.
- Use a reversed depth buffer (`new WebGPURenderer({ reversedDepthBuffer: true })`) for precision at distance.

## Artifacts

| Artifact | Cause | Fix |
|---|---|---|
| Vertical dark "barcode" stripes below the horizon | Half-resolution AO on far, quantized depth | Mask water and sky, fade AO with distance, full resolution or a better upsample, reversed depth |
| Halos around objects against the sky or far background | Large radius across depth discontinuities | Thickness heuristic, depth-aware blur and upsample |
| Grain in motion | Few samples, relying on temporal accumulation | More samples, a spatial denoise, or full resolution |
| Open ground darkened | Radius too large for the scene's scale | Scale the radius to the scene's real features |
| No darkening in tight corners | Radius too small, or AO on direct light hidden by strong sun | Radius for corners. AO belongs on indirect light, where corners live. |

## AO is not GI

AO darkens small-scale contacts. Large-scale occlusion (an interior, a loggia, under a deck) needs occluded indirect light: probes (`irradiance-probes.md`). AO cranked up to fake it darkens everything evenly.
