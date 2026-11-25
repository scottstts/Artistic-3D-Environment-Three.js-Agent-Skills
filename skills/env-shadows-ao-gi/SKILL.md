---
name: env-shadows-ao-gi
description: "Shadows, ambient occlusion, indirect light (GI) and reflections for a 3D environment — complete casting/receiving, stable cascaded or long-range sun shadows, bias that doesn't peter-pan, AO applied to indirect light only, occluded indirect light via baked irradiance probes, and real continuously-updated reflections. Load when shadows clip, pop, shift with camera distance, show acne or peter-panning, are missing on small relief or buildings, move at a stepped rate, or look like proxies; when AO shows halos, grain or a dark \"barcode\" near the horizon; when recesses glow, objects look pasted on, or reflections are wrong, stepped or missing."
---

# Shadows, AO, indirect light and reflections

## Owns

Everything that occludes or redistributes light after the direct lights are set (`env-lighting`):

- sun and practical-light shadows;
- contact shadows;
- ambient occlusion;
- indirect light;
- reflections.

## Standard

**Shadows:**

- **Every mass casts and receives:** buildings, terrain, vegetation, characters, props. No no-cast exemptions to fake a reference.
- **Stable:**
  - no clipping, popping or shifting with camera distance or movement;
  - coverage out to wherever shadows can be seen, using cascades (`CSMShadowNode`) or a long-range map that takes over exactly where the near map ends;
  - texel-snapped cascades so they don't swim.
- **Bias sized to the shadow camera's depth range:** bias is a fraction of that range, so fit the range tightly to the casters. A range of hundreds of metres turns a tiny bias into decimetres of peter-panning.
  - No acne, no peter-panning, no light leaking at contacts.
  - Small relief must still cast: the texel size plus the bias offset has to be smaller than the relief that should read. Use a tighter cascade or a local shadow map near detailed areas.
- **Static casters may be baked:** render once, `autoUpdate = false`. Moving casters (vegetation in wind, characters, vehicles) update every frame. Proxy or static shadows for moving things are banned.
- **Shadow softness from the light's real size:** the sun subtends about 0.5°, so penumbrae grow with distance from the occluder. Practical lights by their size.

**Ambient occlusion:**

- **Applied to indirect light only** (sky fill, environment, probes), never to direct sun or lamp light. In three.js TSL: `builtinAOContext` on the scene pass.
- **Denoised, without halos or grain.** Use full resolution, or half resolution with a bilateral upsample that is clean in motion.
- **Kept off sky, water and emissive surfaces,** and faded on far terrain where depth precision creates false occlusion: the vertical "barcode" near the horizon. Use a reversed depth buffer.
  - Build the mask and the distance fade into the AO setup when AO is first added. Don't wait for the stripes to appear. In any scene with open water, run the water skill's horizon check (`env-water`, `measure.py --stripes`) right after AO goes in.
  - AO is only one of three causes of the horizon barcode on water. See `env-water` → horizon-safe by construction.
- **Thickness and radius set to the scene's scale.** AO that spans metres darkens open ground. AO that is too short misses corners.

**Indirect light:**

- **Occluded.** Unoccluded uniform fill (hemisphere or environment alone) makes recesses glow like open walls and objects look pasted on.
- **Default for static architecture:** a baked irradiance-probe grid over the areas the viewer can reach: three.js r187 `LightProbeGrid` (L2 spherical harmonics, GPU-baked, multiple bounces), or an equivalent custom bake (small cube captures projected to spherical harmonics in 3D textures). Combine it with AO for contact detail. It is view-independent and costs almost nothing per frame.
- **Screen-space GI is view-dependent:** bounce light appears and disappears as surfaces leave the screen. Use it only if that never shows, and test it in motion.
- **Coloured bounce matters:** sunlit paving warms the soffits, and red walls tint their neighbours.

**Reflections:**

- **Real:**
  - planar mirror renders for floors and water (clipped correctly);
  - probes (cube or local) for glossy objects;
  - screen-space reflections only with correct fallbacks.
- **Updated continuously.** All cube faces every frame when they reflect moving content. Never stepped.
- **Contain what is really there.** Which layers a reflection includes is part of the picture. An artifact hidden by a low-resolution reflection is still a defect: verify at full resolution.

**Always a defect:**

- Shadows that clip, pop or shift with the camera.
- Acne. Peter-panning.
- Grain in shadows or AO.
- A shadow that disagrees with the sun.
- A barcode or banding from AO.
- Halos around objects.
- Glowing recesses.
- Reflections updated in steps.

## Procedure

1. **Shadow coverage:**
   - Fit the sun's shadow camera to the casters for the area the viewer sees.
   - For large worlds, use cascades (`CSMShadowNode(light, { cascades, maxFar, mode })`) or a near map plus a long-range world-fixed map.
   - Choose the map resolution from the smallest relief that must cast.
2. **Bias:** start from zero. Raise the normal bias until acne disappears on the worst surface (grazing sun on large planes), then check contacts for peter-panning. Fit the depth range to the casters, not to a huge default.
3. **Update policy:** bake static, update dynamic every frame. Measure the cost; it is often a few milliseconds.
4. **AO:**
   - a depth and normal pre-pass;
   - GTAO with radius and thickness at the scene's scale;
   - applied through `builtinAOContext` on the indirect term;
   - sky, water and emissives masked;
   - faded with distance.
5. **Indirect light:**
   - place a probe grid over the reachable space, with a cell size that resolves rooms and recesses;
   - bake at load with bounces;
   - check recesses and interiors against open surfaces.
6. **Reflections:** choose per surface:
   - planar for big flat floors and water;
   - probes for objects;
   - SSR only with guard bands and fallbacks.

   Update each as its content moves.
7. **Check:**
   - a test plane receiving shadows, to separate shadow-system bugs from material bugs;
   - a stick at grazing light;
   - a camera dolly in and out, for clipping and shifting;
   - a fly at the horizon, for the AO barcode;
   - interiors and recesses;
   - reflections at full resolution and in motion.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| Peter-panning (a gap between object and shadow) | Bias too large relative to the depth range | Measure the depth range of the shadow camera | Fit the range to the casters. Lower the bias. Sink trunks and posts slightly into the ground. |
| Shadows end abruptly at a distance | One map covering a short range | A dolly out | Cascades, or a long-range map taking over at the edge |
| Shadows shimmer when the camera moves | Cascades not texel-snapped | A slow pan | Snap the cascade origins to texels |
| No contact shadow under a building | It doesn't cast; it's outside the frustum; it's culled from the shadow pass | A plain test plane | Enable casting. Cover it with the shadow camera. |
| Small relief casts nothing | Texel plus bias bigger than the relief | Measure the texel size | A tighter cascade or local map; less bias with a better filter |
| Vertical dark barcode near the horizon | Half-resolution GTAO on far, quantized depth | Toggle AO; compare full and half resolution | Mask AO off sky and water, fade it with distance, reversed depth. Check the reflection too (`env-water`). |
| Recesses as bright as open walls | Indirect light unoccluded | Compare an alcove with an open wall | Probe grid plus AO on indirect |
| SSGI brightens everything, or flickers | Screen-space bounce, view-dependent, or wrongly integrated | Toggle it; move the camera | Remove it. Use a probe grid, or an architectural fix that brings real light in. |
| Tree shadows step at a low frame rate | The shadow map updates every N frames | Watch while panning | Update every frame for moving casters |
| A reflection shows something that isn't there at full resolution | A geometry or layer error hidden by blur | Raise the reflection resolution in a debug view | Fix the scene. Don't rely on blur. |

## Verification

- A shadow test set: a test plane, stick shadows at grazing light, a dolly in and out, a view toward the sun past casters.
- A capture of the AO term alone: no halos, no grain, no horizon barcode, and no AO on sky or water.
- Interiors and recesses against open surfaces: indirect light is occluded.
- Reflections at full resolution and in motion: the content is correct and updates continuously.

## References

- [references/shadow-failures.md](references/shadow-failures.md): coverage, bias, filtering, update policy, in depth.
- [references/ambient-occlusion.md](references/ambient-occlusion.md): GTAO setup and its artifacts.
- [references/irradiance-probes.md](references/irradiance-probes.md): `LightProbeGrid` usage and probe placement.
- [references/reflections.md](references/reflections.md): planar, probe and screen-space reflections, and their failures.
