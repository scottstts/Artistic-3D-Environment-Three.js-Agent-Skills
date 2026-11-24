# Volumetric clouds

## Density

```
coverage(x, z)                       weather field: where clouds are and of what type
profile(h, type)                     vertical shape: rounded base and top for cumulus, a flat base
base = remap(lowFreqNoise(p), 1 − coverage·profile, 1, 0, 1)
density = remap(base, highFreqErosion(p)·edgeFactor, 1, 0, 1) · densityScale
```

- **Low-frequency noise:** a Perlin–Worley 3D texture for billow masses. Erode only near the edges, with higher-frequency Worley, curl-distorted for wisps.
- **Noise resolution must exceed the feature size.** A 96³ volume stretched over a kilometre gives blobs, not cauliflower detail.
- **Domain-warp** the low-frequency noise (curl noise or a second noise) to break up roundness. Turbulent warping and feathered edges are what separate cumulus from cotton.

## Lighting

- **Sun march:** 4–8 samples toward the sun, with growing steps, plus one long sample for distant self-shadowing. Beer's law gives transmittance.
- **Phase:** dual-lobe Henyey–Greenstein, mixing a strong forward lobe (g ≈ 0.8) with a weaker back lobe. This gives the silver lining toward the sun.
- **Powder effect:** darkening in thin, dense regions facing the sun (an approximation of in-scatter build-up).
- **Multiple scattering:** add octaves with lower extinction, phase and contribution. This lightens deep cloud interiors so they aren't black.
- **Ambient:** the sky's radiance from above, ground bounce from below, scaled by height in the cloud.
- **Colour:** sunlit tops near white (or warm at a low sun), and shaded hollows cooled by the sky.

## Marching

- **Bound the step length** by the smallest feature you need (`scripts/march-plan.mjs`). Skip empty space with a coarse step, and refine when density is found (with hysteresis so it doesn't ping-pong).
- **A per-pixel start offset** (interleaved gradient or blue noise) removes banding. Average it over frames only when stable, or use enough samples.
- **When a ray runs out of steps inside the cloud,** fade it to opaque. A snap gives a hard band.
- **Far clouds:** march to a distance, then continue with a baked panorama or a lower-resolution layer that matches in brightness and colour at the handover.

## Types

| Type | Altitude | Form |
|---|---|---|
| Cumulus | Base 0.5–2 km, tops 1–3 km (towering to 10 km) | Flat base, cauliflower billows, crisp lit tops |
| Stratocumulus | 0.5–2 km | Rolls or patches, soft, low contrast |
| Altocumulus | 2–6 km | Small rounded rolls in fields |
| Cirrus | 6–12 km | Thin wispy streaks along the wind, high-frequency, translucent |
| Cloud sea (from above) | Below the viewer | Billowed surface; the billows form it, it is not sliced flat |
| Sea fog banks | 0–200 m | Rise from the water, little overhang, soft tops |
| Storm deck | 1–10 km | Dark bases with mammatus, light shafts where the deck breaks |

## Cost

- Half-resolution marching with a depth-aware upsample is fine if it is clean in motion.
- Amortised marching (1 pixel in N per frame) needs:
  - a fill for untraced pixels from the current trace;
  - correct reprojection;
  - a direction-correct fallback for disocclusions;
  - a full-quality path for stills.

  Each of these is a known artifact if missing: grids, stripes, blur.
- If a cloud layer is too costly, redesign it: a thinner field, a baked panorama for far clouds, fewer octaves where they don't show. Don't swap in sprites.
