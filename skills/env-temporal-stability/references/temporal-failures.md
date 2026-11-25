# Temporal failures: mechanisms and bisection

## Bisecting an artifact

1. **Reproduce it.** Match the user's viewpoint and motion. Zoom into their screenshot or recording at the marks, and describe what you see back to them before touching code. If you're unsure what they mean, ask: fixing the wrong artifact wastes a pass.
2. **Freeze time and step frames:** advance the scene clock by fixed steps, render one frame per step, and diff consecutive frames in the region.
3. **Inventory the candidates:** every pass and term touching that region. Include post passes, AO, reflections, accumulation, tier switching, camera-dependent terms and wraps.
4. **Toggle one at a time** and measure the region in each frame (mean, variance, a column profile). The term whose removal kills the artifact is the lead. Confirm the mechanism before fixing.
5. **Treat the artifact as present until its cause is explained.** A few clean stills prove nothing.

## Mechanisms

| Artifact | Mechanism |
|---|---|
| Dark grid in a ray-marched layer | Amortised tracing: unconverged pixels or a stale fallback show through in a regular pattern |
| Moiré or barcode near the horizon | One of three: depth quantization in AO; depth-based water terms (screen-space refraction, absorption or foam by depth difference) quantizing at distance; single-texel environment lookups stretched at grazing angles. See `env-water` → horizon-safe by construction. |
| Stair-stepped horizon that slides with the camera | Coarse geometry or steps at a distance, resampled differently each frame |
| Jagged-to-smooth change while panning | A temporal resolve converging after motion stops, or a tier switching |
| Popping effects (bloom, god rays) as a source leaves the screen | A screen-space effect whose source is off-screen |
| Shadows shifting with camera distance | Cascade splits moving, or the shadow frustum fitted to the view without texel snapping |
| A band that follows view direction | A view-dependent term (fog by view angle, haze by screen position, an AO sampling pattern) applied where it shouldn't be |
| Flickering edges along banks or walls | Near-coplanar surfaces (z-fighting) or a depth-based effect at a discontinuity |

## Full-quality path

Every amortised, reduced or accumulated pass has a switch that renders it fully every frame: full resolution, all pixels traced, no reused history. That gives correct stills and offline renders. The full-quality output is the same picture with more detail, never a different picture.
