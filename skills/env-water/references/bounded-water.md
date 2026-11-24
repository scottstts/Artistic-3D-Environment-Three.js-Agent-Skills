# Pools, rivers and fountains

## Waves at the body's scale

- **Small pools:** a capillary-gravity spectrum (ω² = g·k + (σ/ρ)·k³), with wavelengths of centimetres to decimetres, or a height-field simulation driven by drops, inflow and moving objects.
- **Rivers:** a flow direction with advected detail (flow maps), standing waves behind obstacles, and foam lines along shear zones.
- **Fountains:**
  - jets as real ballistic streams of drops, motion-blurred to the frame time and width-clamped to about one pixel at distance with energy conserved;
  - a splash ring;
  - ripples spreading from the impact.

## Optics

- **Refraction to the real bed,** with Snell's law per pixel from the surface normal. The bed is the real geometry of the scene.
- **Absorption by path length** through the water (Beer–Lambert, real coefficients). Shallow areas are clear; deep ones are coloured.
- **Caustics on the bed:**
  - from the surface curvature (refracted ray density), or by tracing the sun through the surface into a caustic map;
  - blurred by the sun's angular radius (half its 0.53° diameter), not its full diameter;
  - masked by the sun's shadow on the bed, so caustics appear only where sunlight reaches.
- **Reflection** of the real surroundings: a small planar mirror render updated every frame while the pool is in view, or a local probe for tiny bodies.

## Guard band and fallbacks

Refraction lookups near the screen edge fall outside the rendered image. Then:

- render the opaque buffer with a guard band (about 15–20% wider than the view) and crop the final image;
- for samples still outside, fall back smoothly toward the pixel's own position. Never use one edge row for every out-of-range sample: it smears into vertical stripes.

## Emissive and luminous water

Glowing water, or a lit reef under the water, lights its surroundings. Add it as a light source (probe or area approximation) affecting nearby rocks and walls. The glow seen through the surface comes from the light transmitted through real absorption. It is not painted into the water's colour.
