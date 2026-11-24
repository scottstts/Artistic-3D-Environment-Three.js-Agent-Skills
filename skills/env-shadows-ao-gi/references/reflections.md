# Reflections

| Surface | Method | Notes |
|---|---|---|
| Large flat floors (polished stone, wet ground) | A planar reflection render (`reflector` in TSL) | Mirror the camera across the plane, and clip below it. Blur by roughness, using mip-mapped sampling. Offset by the normal map's distortion. |
| Water | A planar mirror render integrated over wave slopes (`env-water`) | Clip the scene at the waterline |
| Glossy objects (metal, glass, cars) | Probes: a cube render at the object's location, or local box-projected probes | Update every frame if the surroundings move. All six faces each frame: never rotate face updates over frames. |
| General glossy surfaces | Environment map, plus probes | Occlude the environment's reflection indoors (via the probes or AO), or glass in shade reflects a bright sky |
| Screen-space reflections | Only where off-screen content never matters, with a fallback that matches | Reflections that disappear as content leaves the screen are a defect. Fallback to a probe. |

## What a reflection contains

Which layers a reflection includes is part of the picture. Excluding the far city from a floor's reflection is a choice about the look, not a quality setting. Decide it once. Never present a different picture as a "higher quality" reflection.

## Failures

| Symptom | Cause | Fix |
|---|---|---|
| Reflections update in visible steps | Cube faces rotated across frames, or updated every N frames | Update every face every frame while the reflected content moves |
| Bright dashed lines along wall bases on a polished floor | The reflection offset (from tilted slab normals) reading past the base, into geometry beyond | Clamp the offset, depth-test the reflection lookup, or remove the tilt from the offset |
| Floor reflects only one light spot from a large source | The source modelled as a point light. The reflection shows the light's specular term, not its shape. | Reflect the emitter's real geometry through the reflection render |
| A stray reflection appears at full resolution | A geometry error blurred out at reduced resolution | Check reflections at full resolution while building. Fix the scene. |
| Reflection shows things below the water or floor | No clip plane in the mirror pass | Clip the mirrored scene at the plane |
