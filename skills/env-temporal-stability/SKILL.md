---
name: env-temporal-stability
description: "Making a 3D scene correct in motion, not just in stills — antialiasing strategy, noisy/stochastic effects, temporal accumulation and amortised passes, LOD and update rates, camera-dependent terms, screen-edge guard bands, procedural wrap seams, and animation plausibility. Load when something looks right in a still but wrong when the camera or objects move: grain, shimmer, crawling silhouettes, trails, ghosting, popping, stepped updates, artifacts that follow the camera, blur while moving, or animated parts interpenetrating."
---

# Temporal stability

## Owns

Everything that must hold frame to frame:

- antialiasing;
- noise and accumulation;
- update rates;
- detail-tier transitions;
- camera-dependent terms;
- edge handling;
- how animation is checked.

## Standard

**Judge in motion, close up.** A still taken after N identical frames hides every temporal failure: accumulated noise looks clean, and smears look sharp. Every check of anything stochastic, animated or camera-dependent includes a moving capture.

**Always a defect:**

- noise or grain in motion;
- shimmer, crawling silhouettes, aliasing on thin bright features;
- trails, ghosting, smearing of fine detail while moving;
- popping: detail tiers, culling, effects switching as their source enters or leaves the screen;
- stepped updates: shadows, reflections or simulations at a visibly lower rate than the frame;
- artifacts that follow the camera: a disc or pole under it, a band ahead of it, a boundary sliding with the view;
- seams that flicker where procedural motion wraps;
- motion that is physically wrong: orbiting foliage, petals sliding on the ground, interpenetration during an animation.

**Default methods:**

- **Antialiasing:** MSAA on the scene pass for geometric edges, specular antialiasing in materials, mip-mapped and anisotropic textures. TAA, if used at all, is a light final pass, never the only AA. A soft image in motion is a defect.
- **Stochastic effects** (ray-marched clouds and fog, SSR, AO): enough samples or a spatial denoise to be stable per frame. Use temporal accumulation only where it is reprojected correctly and is invisible in motion, and always with a full-quality path for stills and offline renders.
- **Amortised passes** (1 pixel in N per frame, rotating cube faces, every-Nth-frame updates) are allowed only if:
  - untraced pixels fill from a matching source (the current low-resolution trace, not a stale or mismatched one);
  - disocclusions fill from a direction-correct source;
  - reprojection doesn't blur when the camera moves;
  - the result is invisible in motion.

  Otherwise update fully.
- **Moving content updates every frame:** shadows of moving casters, reflections of moving content, simulations seen live.
- **Detail tiers:** chosen by projected size, with hysteresis or blending, and matched in colour, coverage and normals (`env-vegetation` → LOD, `env-world-completion`). Never distance culling in view.
- **Guard bands:** screen-space lookups that can leave the frame (refraction, SSR, AO, blur) render a band wider than the view (about 15–20%) and crop. Out-of-frame samples fall back gracefully toward the pixel's own position, never to one edge row.
- **No camera-dependent shading hacks.** Every term that depends on camera position must be physical: view-dependent Fresnel and specular. Darkening or clearing by distance from the camera creates an artifact that follows it.

## Procedure

1. **Inventory the temporal surfaces of the scene:**
   - stochastic passes;
   - accumulated or amortised passes;
   - per-frame and per-N-frame updates;
   - tier switches;
   - screen-space lookups;
   - camera-dependent terms;
   - procedural loops and wraps;
   - animations.
2. **For each, write down how it stays stable in motion, and its full-quality path.**
3. **Capture motion:**
   - a slow pan;
   - a fast turn;
   - a dolly in and out;
   - a fly past fine bright detail;
   - a look straight down;
   - a turn toward and away from bright sources.

   Step through these frames at real frame rate. Look for each defect above.
4. **For each artifact:**
   - reproduce it in a capture and describe it back exactly;
   - inventory every term that could cause it;
   - bisect by toggling terms off, measuring the region in each frame;
   - fix the mechanism, not the symptom ([references/temporal-failures.md](references/temporal-failures.md)).
5. **Animations:**
   - audit interpenetration numerically over the whole range (`env-geometry-audit` → clearance per frame);
   - check the motion is physically plausible ([references/motion.md](references/motion.md));
   - make loops seamless.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| Grainy only while moving | Few samples plus temporal accumulation that resets in motion; film grain on top | Static versus moving capture | Stable per-frame quality: samples, a spatial denoise, a bilateral upsample |
| Soft, smeared detail while moving | TAA without MSAA; history blending | Edge sharpness in motion | MSAA, then TAA light or off |
| Slanted stripes after turning, fading slowly | Disoccluded pixels filled from the previous direction's data | A fast turn | Fill disocclusions from a direction-correct source |
| Blur that never settles | Bilinear reprojection softening each frame; eased camera velocity that never reaches zero | Velocity logs; still the camera completely | Snap negligible velocity to zero; use sharper reprojection |
| A trail at the frame edge | A screen-space lookup outside the frame with a fallback that changes as the camera moves | Pan slowly and watch the edges | Guard band, and a fallback toward the pixel's own position |
| A bare disc or a "pole" under the camera | Clearing or darkening by horizontal distance from the camera | Look down from several heights | Clear only what the camera is inside. Remove distance-from-camera shading. |
| Flicker at a procedural loop seam | One lookup (shadow, foam, texture) not wrapping like the others | Step frames across the wrap | Every lookup wraps identically |
| Shadows or reflections in steps | Updates every N frames, or rotating cube faces | Frame-by-frame | Update every frame for moving content |
| Silhouettes jump while moving | Hard swaps between geometry tiers by distance blocks | Fly slowly | Blend tiers; tiers that reduce the same structure |

## Verification

- A motion capture set covering all of step 3, stepped through frame by frame: no defect from the list.
- A temporal inventory, with a stability plan and a full-quality path for each item.
- For animations: the per-frame clearance audit is clean, and motion is checked against physics.

## References

- [references/temporal-failures.md](references/temporal-failures.md): mechanisms behind temporal artifacts, and how to bisect them.
- [references/motion.md](references/motion.md): secondary motion and animation plausibility.
