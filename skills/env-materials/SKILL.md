---
name: env-materials
description: "Authoring materials for a 3D environment — scanned PBR texture sets (base colour, normal, roughness minimum) on every surface, projection without tiling or stretching, physical value ranges, metals, whites, glass/crystal/translucent media, and maps derived for supplied models. Load whenever materials are created or a surface looks plastic, flat, painted, washed-out, tiled, stretched, like \"yellow paint\" instead of gold, or glass looks fake."
---

# Materials

## Owns

What every surface is made of, and how its maps are projected, combined and kept within physical ranges. That includes transparent and refractive media. Water shading is owned by `env-water`. Light is owned by `env-lighting`.

## Standard

**Default: a real scanned PBR set on every material.**

- **Base colour, normal and roughness at minimum.** Add AO, height and metalness when the set has them and they help.
- **Cover every material type:** stone, metal and gilding, floors, soil, bark, foliage, terrain, snow, plaster, wood, fabric.
- **Procedural shading may modulate and combine scans:** triplanar projection, masks, wear, tints, multi-scale blending. It never replaces them.
- A material with only a colour, or a procedural colour standing in for a scan, falls short of the standard.

**Always:**

- **Verify each map reaches the shader.** Check it in a per-map debug view, and confirm its colour space: sRGB for base colour, linear for the data maps.
- **Measure before thresholding.** Run [scripts/scan-stats.py](scripts/scan-stats.py) on every map you mask, threshold or normalise. Normalise against its measured mean, not an assumed one.
- **Never collapse a scan into a two-colour ramp or a flat tint.** Tint it multiplicatively, and keep its structure.
- **No visible tiling or stretching at any distance:**
  - triplanar or slope-aware projection on terrain and rock;
  - several scales blended by distance;
  - per-element variation: each slab offset and rotated, each board shifted;
  - arc-length UVs on swept and lofted forms.
- **Albedo stays within physical ranges** ([references/albedo-table.md](references/albedo-table.md)). A deliberate stylized lift is a stated choice, never an accident of the colour space.
- **Whites and pale stone keep fine variation.** A single flat value reads as blown out, even when it isn't clipped.
- **Metals read as metal.** Metalness 1, base colour as the metal's reflectance, roughness from the scan, and a varied environment to reflect. Smooth, wide gold bands reflecting one blurred room read as yellow paint. Chunky, faceted forms with near-black next to hot highlights read as gold.
- **Transparent and translucent media are physical:**
  - refraction with the right index of refraction;
  - Fresnel reflection;
  - absorption by thickness (Beer–Lambert), so thick glass darkens and tints, and thin edges stay clear;
  - dispersion where the material has it.

  Additive "hologram" light standing in for glass is banned. A tint that is light per unit length compounds over metres of material: check the colour at the real thickness ([references/transparent-media.md](references/transparent-media.md)).
- **Real geometry for sparkle,** not painted noise: dew, glitter, gems, specular glints.
- **Antialiasing for dense specular detail.** Use mipmapped and anisotropically filtered textures, and specular antialiasing: raise roughness by the variance of the normal over the pixel footprint. Dense patterns shimmer without it.

**What the reference decides:** which materials, their colour and wear, and how stylized they are. Style lives in tint, roughness and grade, never in dropping the scan.

## Procedure

1. **List every material** in the scene and choose a scanned set for each. Preview candidates, and choose by structure and scale, not by name.
2. **Name and prune the files:** `textures/<material>-<map>.jpg`. Delete the maps you don't sample.
3. **Measure every map** with `scan-stats.py`: means, percentiles, seam score, normal-map sanity. Check the normal map's green convention visually (bumps lit from the correct side). Note any albedo outside the physical range.
4. **Choose the projection per surface:**
   - UVs on authored geometry;
   - triplanar on terrain, rock and blobby forms;
   - arc-length UVs on sweeps.

   Set texel density from the real size of the material: brick courses, slab size, grain.
5. **Build the material** with scans as the base layer, then:
   - tint;
   - wear and dirt masks driven by geometry (cavity, up-facing, height, edges);
   - multi-scale blending;
   - per-element variation.
6. **Supplied models with missing maps:** derive roughness, metalness and relief in the shader ([references/derived-maps.md](references/derived-maps.md)). Leave the file unchanged.
7. **Check each material:**
   - a per-map debug view;
   - a close-up and a grazing view, for stretching;
   - a high view, for tiling;
   - a lit sphere or swatch beside the reference region;
   - in motion, for shimmer.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| Surfaces look plastic or painted | Only base colour, or constant roughness; the normal map isn't reaching the shader | Per-map debug view | Use the full scanned set. Check the colour space of each map. |
| Stone looks fake even though it uses a texture | The scan was collapsed into a ramp, or tinted to a flat colour | Albedo view: the structure is gone | Tint multiplicatively, and keep the variation |
| A mask does nothing, or does everything | A threshold or normalisation set from an assumed range, several times off the real one | `scan-stats.py` | Normalise against the measured mean and percentiles |
| Visible repetition from height | One scale, the same orientation everywhere | A high view | Multi-scale blending, per-element rotation and offset, macro variation |
| Stretching on cliffs | Planar UVs on steep faces | A grazing view | Triplanar or slope-aware projection |
| Gold reads as yellow paint | Smooth forms, a uniform environment, too much diffuse | Look at the reflection | Metalness 1, faceted forms, a varied environment, a lower diffuse contribution |
| Whites look blown out but aren't clipped | No variation within the surface | Local contrast in an 8 px window against the reference | Restore scan variation, and adjust the value |
| Thick crystal reads navy or black | A body tint compounding over metres of glass | Path length × absorption | Water-white or a very weak tint for thick bodies |
| Glass "see-through" at the screen edges | Refraction samples outside the frame fall back to the wrong source | Look near the frame edge | Guard band (render the scene wider than the view), and use matching fallbacks (`env-temporal-stability`) |

## Verification

- A per-map debug view for each material: every map present and in the right colour space.
- The `scan-stats.py` report for every thresholded or normalised map.
- Close, grazing and high views: no stretching, no tiling.
- Region crops against the reference: value, saturation and fine variation.
- A motion capture of dense specular detail: no shimmer.

## References

- [references/albedo-table.md](references/albedo-table.md): physical albedo and roughness ranges, plus metal reflectance.
- [references/projection-and-tiling.md](references/projection-and-tiling.md): triplanar, multi-scale, per-element variation, with TSL snippets.
- [references/transparent-media.md](references/transparent-media.md): glass, crystal, gems, ice, thin media.
- [references/derived-maps.md](references/derived-maps.md): building the missing maps of supplied models in the shader.

## Tools

- **[scripts/scan-stats.py](scripts/scan-stats.py):** measures each map: means, percentiles, seam score, normal-map sanity, physical-range warnings. Needs Pillow and NumPy. Run `--self-test` to check it.
