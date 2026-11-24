# Detail sized to viewing distance

## Pixel footprint

At distance `d` (metres), with vertical FOV `φ` and image height `H_px`, one pixel covers about:

```
footprint ≈ 2 · d · tan(φ / 2) / H_px     metres per pixel
```

Example, for orientation only: `φ = 40°`, `H_px = 1600`, `d = 30 m` gives about 1.4 cm per pixel.

## What reads

| Feature size, compared with the footprint | Reads as |
|---|---|
| Under 1 px | Nothing, or aliasing and shimmer. Handle it in the material (roughness, normal) or drop it. |
| 1–3 px | Lines drawn on a surface. No form, and no shadow of its own. |
| 3–10 px | Texture-like relief. Reads only if it catches light and shadow. |
| More than 10 px, with depth | Form: it casts and receives shadow, and occludes. |

Relief also needs its **depth** to exceed what the shadow system resolves: the shadow texel size plus the bias offset. Otherwise it neither casts nor receives a shadow. See `env-shadows-ao-gi`.

## Tiers

Build detail in three tiers, each sized for a viewing distance:

1. **Masses:** big projections and recessions that read from the farthest common view. Entablature breaks, piers standing proud, stepped arch rings, projecting bays, cornices with real overhang. Typically tenths of a metre to metres of depth.
2. **Medium forms:** mouldings, panels, brackets, window surrounds, main ornament bodies. These read from the hero distance.
3. **Fine detail:** carving surface, beads, small leaves, joints. These read up close. At hero distance they become material.

Check every tier from the distance it is designed for. If tier 3 is all that changes between passes, the hero view won't change.

## Flatness

A large single plane catches one value of light, however it is lit. If the reference shows almost no flat field, the build mustn't have one either. Break planes with the mass tier first: piers, recessed panels, stepped faces, overlapping bodies. Measure flatness as local contrast in small windows, against the reference (`env-look-iteration`). Averaged colours can match while the image stays flat.

## Smoothness

- **Segment count by screen size:** a curved silhouette needs enough segments that a chord's sagitta stays under about half a pixel at the closest view. For radius `r` with `n` segments, sagitta = `r · (1 − cos(π / n))`.
- **Normals:** smooth across the revolution, and creased at real edges.
- **Seams:** smoothing must not stop at a UV or material seam on a continuous surface.
