# Practical and emissive lights

## Practicals (lanterns, lamps, windows, candles)

- **Each source is a real light at the fixture,** with inverse-square falloff and a range that fades it smoothly to zero. Set colour by type: candle about 1900 K, incandescent about 2700 K, sodium orange.
- **Shadows** where the source is near geometry the viewer sees: a wall lantern's bracket shadow, a lamp's shade.
- **Many small sources:**
  - point lights for the ones near the viewer;
  - for the rest, bake their direct light (and a soft bounce) into vertex colours, per-instance attributes or a probe grid at load. Lights from a static set don't need live evaluation.
- **The bulb or flame is visible** as an emissive disc or mesh with real brightness, and bloom gives it glare. A sub-pixel bulb keeps a minimum footprint with its brightness scaled down to conserve energy, so it neither vanishes nor flickers.
- **Window glow from interiors:** interior-mapped rooms or real modelled rooms, with a room-light term. Never a flat bright plane.

## Emissive surfaces and objects

- **Glowing water, crystals, holograms, screens and lava light their surroundings.**
  - Add a light, or an area or probe approximation, at the emitter, so nearby surfaces receive its colour.
  - Its reflection on a glossy floor follows the emitter's real shape, from a reflection render or an area-light term. A single proxy point light is not a reflection.
- **Brightness hierarchy:** within one scene, emissive values follow the real brightness of the sources (sun > lamps > glowing signs > screens). Bloom then reads correctly.

## Holograms

- A projected light figure: additive, emissive, and lighting the ground and surroundings with its colour.
- Subtle scan structure and flicker that read as a projection: refresh lines, gentle intensity variation, noise in the projection beam.
- Avoid effects that look like rendering bugs: moiré, dark-to-light shading seams, harsh strobing.
- At architectural scale, the beam and the dust in it scatter light (`env-sky-atmosphere-clouds` → media).

## Characters

- **Key:** from above and to the side, often the sun.
- **Fill:** soft, from the sky or a bounce.
- **Rim:** from behind, separating the figure from the background.
- **Under-lighting** reads as horror. Use it only when the scene's real source is below.
- **The figure receives the scene's shadows:** a figure at a shadow's edge shows the edge across it.
- **To lift a figure the reference shows brighter,** use a real light source in the scene with falloff and a reason: a bounce card, a window. Never a self-lit material.
