---
name: env-image-and-grade
description: "The final image of a 3D scene — exposure, tone mapping, colour grading, saturation, bloom/glare, lens and sensor traits, antialiasing of the final frame — applied on top of correct light. Load when setting up post-processing, and when the image looks washed out, grey, flat, over-graded, \"less realistic after grading\", over-saturated, clipped, colour-cast, too bloomy, or when tempted to add lens flares, sunbursts or screen-space stand-ins."
---

# Image and grade

## Owns

Everything between scene radiance and display pixels:

- exposure;
- tone mapping;
- grade;
- bloom and glare;
- lens and sensor traits.

It never fixes problems owned by lighting, materials or atmosphere.

## Standard

**A grade never stands in for light.** Contrast, the warm/cool split and depth come from the lighting first (`env-lighting`). The grade is applied last:

- measured against the reference *(reference decides)*;
- it must not flatten texture within surfaces;
- it must not shift colour in ways the light doesn't explain.

If a grade is doing heavy lifting, a layer below it is wrong.

**Exposure and tone mapping:**

- **Exposure** set so the reference's key values land: a sunlit mid-albedo surface where the reference has it, without clipping whites the reference keeps.
- **Tone mapper chosen deliberately** ([references/tone-mapping-and-exposure.md](references/tone-mapping-and-exposure.md)):
  - AgX for wide range and graceful highlights that keep their hue;
  - ACES Filmic for punchier contrast with some hue shift;
  - Neutral for faithful colour at modest range.

  Use exactly one tone-mapping step in the chain.
- **Contrast before tone mapping,** in scene-referred values, or in the lighting. An S-curve on the tone-mapped image steepens the mid-tones and flattens the shadows and highlights, where the texture lives. The frame gets punchier, and every surface flatter.

**Colour:**

- **Saturation stays within the displayable range:** a gamut-limited saturation boost scaled per pixel so no channel clips. A naive boost clips channels and shifts hue.
- **Saturation by what the pixel is:** sky, water and foliage can carry strong colour, and grey stone and white walls stay near neutral. Don't amplify blue in stone shadows.
- **Sunlit white reads as white,** slightly warm at a low sun. No cast on whites.
- **Colour comes from the light:**
  - sky-blue shade and warm sun come from `env-lighting`;
  - a grade may push them toward the reference;
  - tinting by brightness alone (teal shadows, orange highlights everywhere) paints the wrong colour on objects whose light doesn't justify it.

**Bloom is veiling glare.**

- A wide, low-energy spread from very bright sources, above a high threshold, in a scene-relative brightness hierarchy: the sun, then lamps, then emissives.
- Its strength *(reference decides)*.
- It never washes the whole frame, never flickers or pops as a source leaves the screen, and never depends on depth in a way that changes when a source passes in front of something.

**Lens and sensor**, for photographic targets, and subtly:

- lateral chromatic aberration toward the edges;
- shadow-weighted sensor noise, stable and not crawling;
- vignette;
- optional soft halation.

No fake lens effects (sunbursts, diffraction spikes, lens flares) unless the reference has them. Depth of field only if the reference shows it, and then computed on the right depth: glow sprites must carry their own depth.

**No screen-space stand-ins for world things:** no drawn specks for particles, no glow sprites for light sources, no overlay haze. Those belong in the world (`env-sky-atmosphere-clouds`).

**Antialiasing:**

- MSAA on the scene pass for geometric edges.
- Temporal AA only as a light final pass, if at all. Never as the only AA: it smears in motion (`env-temporal-stability`).
- Specular antialiasing in materials (`env-materials`).

**Always a defect:**

- A washed-out, over-exposed or lifted-black image the reference doesn't have.
- A colour cast on whites.
- Clipped saturated colours.
- Bloom that pops, flickers or veils the image.
- More than one tone mapping in the chain.

## Procedure

1. **Build the chain:** scene pass (MSAA) → AO on indirect (`env-shadows-ao-gi`) → bloom on HDR → scene-referred grade (contrast, exposure trims) → one tone map → display-referred grade (gamut-limited saturation, white balance, LUT) → lens traits → output. Keep pre-grade and pre-tonemap taps for debugging.
   - **In three.js r187,** `RenderPipeline` applies tone mapping and the output colour space *after* `outputNode` (`outputColorTransform = true`). Whatever you write in `outputNode` is therefore scene-referred, before tone mapping.
   - **To grade display-referred values,** set `pipeline.outputColorTransform = false`, then build `outputNode = gradeDisplay(renderOutput(sceneReferred, toneMapping, colorSpace))` yourself. Use exactly one tone map either way.
2. **Set exposure** from a reference anchor: a sunlit mid-grey surface, or the sky.
3. **Choose the tone mapper.** Compare them on the hero view against the reference's highlight rolloff and colour.
4. **Measure the ungraded image against the reference**, using [references/grading.md](references/grading.md) and `env-look-iteration` → `measure.py`:
   - luminance percentiles (5, 25, 50, 75, 95);
   - black level;
   - saturation by class;
   - local contrast.

   Fix differences at the light and material layers first.
5. **Grade only the remainder:**
   - contrast before tone mapping;
   - gamut-limited saturation scaled by what each pixel is;
   - white balance;
   - optionally, a 3D lookup table matched to the reference by measurement.
6. **Bloom:** threshold above the brightest surfaces that shouldn't glow. Set strength from the glow seen around the reference's brightest sources.
7. **Lens traits**, last and subtle.
8. **Check:**
   - per-layer captures (pre-grade, final) against the reference;
   - a fast turn toward and away from bright sources, for bloom pops;
   - clipping maps.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| The grade made it flatter and less real | A post-tonemap S-curve flattens shadows and highlights; colour by brightness; stacked saturation near the gamut edge | Local contrast within surfaces, before and after the grade | Put contrast in the light and before tone mapping. Use hue-selective, gamut-limited saturation. Remove tinting by brightness. |
| Grey, washed-out image | A veil: fog, haze, glare, lifted blacks, too much fill | The darkest 1% against the reference | Fix it at its source (`env-lighting`, `env-sky-atmosphere-clouds`). Don't crush it in the grade. |
| Sky blue capped and dull | The tone curve's shoulder compressing the sky, or the sky too bright before tone mapping | The sky's pre-tonemap value | Lower the sky's radiance, or change the curve. Measure on clean sky pixels only. |
| Cream cloud tops after a vibrance boost | Boosting the whole image amplifies warm highlights and blue shadows | Saturation by class | Scene-aware saturation: white stays white |
| One glowing sprite blooms, another doesn't | The DOF or bloom input uses the depth of what's behind the sprite (no depth write) | Put the sprite in front of different backgrounds | Give the sprite its own depth for that pass, or composite it after DOF |
| Sun bloom too wide | Sky glow and lens glow both wide, double-counted | The radial falloff profile against the reference | Narrow the sky aureole and lower the bloom radius, measured by radius |
| Everything soft | TAA without MSAA, or reduced resolution | Edge sharpness in motion | MSAA on the scene pass, TAA light or off. Never lower resolution to fake smoothness. |

## Verification

- Pre-grade and final captures beside the reference, with luminance percentiles, black level and saturation by class.
- Local contrast within key surfaces is not reduced by the grade.
- A clipping check: no clipped saturated colours, and whites as the reference has them.
- A bloom check while turning toward the sun or lamps: no pops.

## References

- [references/tone-mapping-and-exposure.md](references/tone-mapping-and-exposure.md): choosing a tone mapper, anchoring exposure.
- [references/grading.md](references/grading.md): what reads as graded and what reads as real, plus a gamut-limited saturation snippet.
- [references/lens-and-sensor.md](references/lens-and-sensor.md): photographic lens and sensor traits, and their limits.
