---
name: env-world-completion
description: "Inventing and building the world beyond the reference frame, out to the horizon, at world scale (sea, ranges, cloud fields, farmland, distant city) so the scene is a complete place, not a prop set. Load when the scene sits on a bare plane or in a sky void, when buildings float, when looking away from the hero view shows emptiness, when distant layers end, pop in or are culled, or when distant mountains/towns look fake or cut-out."
---

# World completion

## Owns

Everything outside the reference frame and beyond the main build: the distance layers out to the horizon, the ground under everything, and how far layers read from far away.

## Standard

**You are building a complete, coherent world** that happens to look like the reference from one viewpoint.

**Always a defect:**

- Void, a bare ground plane, or a floating base anywhere the viewer can look, including straight down and from high above.
- A layer whose end can be seen: the edge of a cloud layer, the rim of the terrain, a sky band under the cloud deck, the edge of a field.
- Distant layers that pop in, or appear bit by bit as the camera moves. Anything culled while in view.
- Blob stand-ins for distant things: lumpy shapes for trees, boxes for towns, flat cards for mountains. Show the real thing at a reduced level of detail, or nothing.
- Detail deliberately cut beyond an imagined camera limit. The viewer roams freely, so detail is reduced only by runtime LOD that never shows.
- Content that doesn't belong to the place, such as a generic mountain ring around a coastal town.

**Default method:**

- **Distance layers, each built as the real thing at the detail its distance needs:**
  - **near:** full build;
  - **mid:** the same generators at reduced structure;
  - **far:** real forms with silhouette-scale detail;
  - **horizon:** landform, sea, cloud field.
- **The ground runs under and past every far layer,** so no sky shows below ranges or islands.
- **Layers extend past the visible horizon:** cloud layers out to hundreds of kilometres, terrain past the ranges, the sea to the horizon.
- **The invented world fits the place** the reference implies: coast, mountains, plain, city, sky realm. In a sky realm the "ground" may be a cloud sea, mist depth, or a far landscape far below. It is never nothing.
- **Cost by redesign.** Pick the far-layer methods that read as real for little cost: displaced terrain with a baked normal and shadow map, instanced real geometry at distance tiers, a cloud field instead of a cloud sea. Never use blobs.

**What the reference decides:** what kind of world lies beyond, guided by its palette, light and theme.

## Procedure

1. **Decide what lies beyond each edge of the frame and behind the camera,** in one line each, plausible for the place. Note what would be visible from high above.
2. **Plan the distance layers** with rough extents: near to about 100 m, mid to 1–2 km, far to 10–30 km, horizon beyond that. Assign each content type its method per layer (see [references/distance-layers.md](references/distance-layers.md)).
3. **Build ground first:** terrain or sea out to the horizon, continuous under everything. Seat every structure on it. Use foundations, terraces or retaining walls wherever the ground and a structure don't meet.
4. **Build the far landforms.** Ranges are massifs with saddles, ridges and gullies, not spikes or cones. Shade them by the rules in [references/far-landscape.md](references/far-landscape.md): backlit or front-lit, with values that step back by distance.
5. **Populate with real content** at each layer's level of detail: towns as real buildings at low detail, woods as real trees at their distance tier, fields with crops or furrows, ships at the right scale.
6. **Extend the sky and cloud layers past the horizon.** Check that no edge or band shows from any height.
7. **Run the whole-world views:**
   - from very high above;
   - straight down;
   - toward and away from the sun;
   - along the horizon in all directions;
   - fast flying toward far layers, to catch popping.

## Failure modes

| Symptom | Mechanism | Fix |
|---|---|---|
| The scene floats in a sky void | Only the reference's contents were built | Plan and build every distance layer |
| An orange band under the clouds near the horizon | The cloud layer ends before the horizon | Extend the layer far past the visible horizon, fading its density |
| Sky shows below the distant ranges | The ground plane stops at the mountain rim | Run the ground under and past the ranges |
| Distant mountains look like paper cut-outs, the same value as the sky | Their haze isn't the sky colour, or there's no step in value with distance | See [references/far-landscape.md](references/far-landscape.md) |
| Hills appear piece by piece as the camera moves | Culling at camera distance, or streamed generation | Keep far layers always present. Use LOD, not culling. |
| Lumpy blob "woods" on hills | Proxies for trees | Real trees at distance tiers, or bare ground |
| Low-detail houses become visible up close | Detail cut on the assumption the viewer can't get there | Generate full detail everywhere. Only runtime LOD reduces it. |

## Verification

- A high overhead view, and a straight-down view at several heights: continuous ground, no void.
- A 360° sweep at the horizon from the hero position and from two other places: every direction has world-scale content and no visible layer end.
- A fast fly toward the far layers: no popping, no pieces appearing.
- Distant-range crops against the reference: value relative to the sky, steps between layers, crest rims.

## References

- [references/distance-layers.md](references/distance-layers.md): method per content type per distance layer.
- [references/far-landscape.md](references/far-landscape.md): how distant landforms read in each kind of light.
