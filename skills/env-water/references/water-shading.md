# Water shading

## Terms

```
L = F(θ)·L_reflected + (1 − F(θ))·L_transmitted + L_glitter + L_foam
```

- **Fresnel F(θ):** Schlick with F0 = 0.02 (IOR 1.33), evaluated per slope sample.
- **L_reflected:** the sky and the scene reflected about each slope sample's normal.
  - **Sky:** the built sky's environment map (`env-sky-atmosphere-clouds`), with its sun removed, since the sun is handled as glitter.
  - **Objects:** a planar mirror render of the scene above the water. Mirror the camera across the mean water plane and clip the scene at the waterline (a clipping group or clip plane), so nothing under the water shows in the reflection. Sample it with each slope sample's offset, at half resolution with mips, blurred by slope variance.
- **L_transmitted:** what is seen through the water.
  - **Deep water:** the scattered body colour. Single scattering under the sun and sky, coloured by the absorption spectrum (blue to green as particulates increase).
  - **Shallow water:** the refracted bed, absorbed by path length with real coefficients (seawater absorbs red most strongly, then green), plus caustics on the bed.
- **L_glitter:** the sun's irradiance reflected over the slope distribution. With slope variance σ² (resolved plus the roughness hand-off), glitter intensity is the probability that a facet's normal bisects the sun and view directions, times Fresnel, times the sun's real irradiance. That gives a correct glitter path: wide in rough seas, narrow when calm, broken into sparkles where the resolved slopes are sharp.
- **L_foam:** foam from the wave field (Jacobian) and contact, with its own rough, bright material. It sits slightly above the water.

## Integrating over the slope distribution

Inside one pixel there are many wave facets. Integrate the reflection and glitter over them:

- Take 4–16 samples of slope offsets drawn from the pixel's slope distribution (resolved variance from the cascades' footprint plus the roughness hand-off). Use a fixed stratified pattern, not per-frame noise.
- **Sky reads by sample footprint:** choose the environment-map mip so each sample covers its share of the solid angle. Single texels at grazing angles stretch into vertical stripes.
- **Sum with Fresnel per sample.**

This is what makes a sunset sea glow across its whole surface, not just in one column.

## Physical anchors

| Quantity | Value |
|---|---|
| F0 of water | 0.02 |
| Fresnel at 85° from the normal | about 0.6 |
| Seawater absorption (1/m), roughly R / G / B | 0.45 / 0.07 / 0.02 (clear ocean). Coastal water is higher and greener. |
| Cox–Munk mean-square slope | 0.003 + 0.00512·U (U in m/s) |

## Contact and edges

- **No bright line where objects meet the water.** Typical causes:
  - the refraction or reflection sampling the object's own pixels;
  - foam drawn on the wrong side;
  - a depth-difference term going wrong at the edge.

  Use depth-aware sampling, and keep the object out of its own refraction lookup.
- **Shoreline:** shallow-water colour fading into a wet-sand darkening band, and swash foam.
