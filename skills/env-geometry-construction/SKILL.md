---
name: env-geometry-construction
description: "Building 3D geometry the way the real thing is made — architecture, hard-surface objects, furniture, structures — with real construction (profiles, sweeps, lathes, lofts, openings cut through walls), resolved junctions, closed solids and detail sized to viewing distance; also placing supplied models. Load before modelling any structure, and when work looks like \"LEGO\" primitives, parts don't join, things float, stop short or poke through, surfaces show facets, walls are thin shells, or detail reads as lines drawn on flat surfaces."
---

# Geometry construction

## Owns

How forms are built: the construction methods, junctions, closed solids, smoothness, detail scale, and supplied-model placement. Ornament composition is owned by `env-ornament-and-relief`. Defect hunting is owned by `env-geometry-audit`.

## Standard

**Build it the way the real thing is made.** Read how the reference's object is constructed: carved from the mass, built from applied pieces, or flat. Build it that way *(reference decides)*. Where the reference is silent, build what a skilled maker would build.

**Default methods:**

- **Forms come from real construction:**
  - profiles swept along paths, with mitred corners;
  - lathes with smooth normals around the revolution;
  - lofts between sections;
  - extrusions of outlines with holes;
  - walls whose openings cut through the whole thickness, with reveals.
- **Every part is a closed solid with outward winding.** Use mesh-writer tooling that writes per material slot, through a transform stack, and keeps winding right when mirrored: [scripts/meshkit/](scripts/meshkit/meshkit.mjs) or equivalent.
- **Massing before detail.** Settle the depth of the big masses first. For example, an entablature that breaks forward over each column pair, or arches stepping inward ring by ring. Check them in plain white with contact shading only. Add detail in tiers: masses, then medium forms, then fine.
- **Detail sized to the distance it is seen from.** Work out the pixel footprint at the closest and the hero distance ([references/detail-scale.md](references/detail-scale.md)). Relief one or two pixels deep reads as lines drawn on a surface. Forms that read at distance project tenths of a metre to metres, not centimetres.
- **Repeated elements come from one definition.** One arcade, one radius. One storey, one height.
- **Smooth surfaces shade smooth.** Use creased normals: smooth below the crease angle, hard above it. Use enough segments that the silhouette holds at the closest view.
- **Trims follow their host.** A frame on a curved wall follows the curve. A chord cutting into the wall is a defect.

**Always a defect:**

- An assembly of boxes, cylinders and spheres standing in for a designed form ("playing LEGO").
- A single-sided shell visible from behind. A hollow underside. A missing bottom face. A see-through slit between stacked parts.
- A part not seated on its support, or larger than its support (overhanging a cap), or floating a few centimetres above it.
- A part stopping short of what it should reach: a post ending beside a volute, a roof short of the wall, a rail not meeting the post.
- Interpenetration that shows: a beam crossing a gate arch, a string course running across an opening, ornament half sunk in a wall, a throne cut into the wall behind it.
- One mesh sliced through another as a junction, where a real joint was needed: a building cut by the curved host it stands on, half a door cut by a wall.
- Visible faceting on a surface meant to be smooth.
- Detail added to raise density with no reason in the reference or the object's logic.

**Supplied models:**

- Use them as given: rigid placement only. Never deform or remesh them.
- Orient a model by the feature the reference shows.
- Ground it: real contact, support, and a contact shadow. Where it sits on built geometry, build the junction (a plinth, a base, a socket).
- Where its maps are missing, derive them in the shader (`env-materials`). Leave the file unchanged.
- If a model conflicts with the reference, ask before resolving it.
- A detached piece inside a supplied model (a loose strand, a floating part): reattach it rigidly at the point the anatomy or construction implies, after checking where it actually touches.

## Procedure

1. **List the parts of each element as a builder would:** what carries what, and what is carved, applied or assembled. Use [references/construction-patterns.md](references/construction-patterns.md) for architecture.
2. **Block the masses at true size,** from the landmark table (`env-camera-and-space`). Check them in white or clay.
3. **For each part, choose the construction:**
   - sweep, for mouldings, rails, ribs and frames;
   - lathe, for balusters, columns, domes and vases;
   - extrude with holes, for walls, slabs and openings;
   - loft, for hulls, organic transitions and tapered shafts;
   - parametric grid, for curved panels.
4. **Resolve every junction before moving on** ([references/junctions.md](references/junctions.md)).
   - Compute where a support actually ends. Use the real top of a moulding chain, not a hand-set height.
   - Each applied piece touches its host exactly, on shared coordinates, or is sunk a few millimetres where none of its side faces lands in a host face's plane ([references/junctions.md](references/junctions.md), rule 1). The coplanar audit proves it.
   - Mouldings and string courses stop at openings and blank faces.
   - Openings cut through every layer they pass: front, back and any wall behind.
5. **Build the detail in tiers,** sized from the pixel footprint. Check each tier from the hero view and up close.
6. **Check closure and winding** for each part: `closedSolidCheck()` in meshkit, or the shell audit. Render the clay view single-sided: a double-sided clay view hides flipped faces.
7. **Run the audit** (`env-geometry-audit`). Then orbit and inspect every junction class up close.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| Looks like stacked primitives | Parts are boxes and cylinders, not constructed forms | Name each part's construction: it can't be named | Rebuild with profiles, sweeps, lathes and openings |
| "Flat" despite lots of detail | Detail below the pixel footprint. Big surfaces are single planes. | Footprint at the hero distance against the relief depth | Rebuild the massing with real depth first, then detail in tiers |
| Teeth or flicker along an arch rim | A lining built from coarse chords, against stones that follow the true circle | Overlay the two curves | Build both from the same curve definition and segment count |
| A window frame cutting into a round tower | Straight chords on a curved host | Section through the frame | Sweep the frame along the host's curve |
| A wall visible only from behind | A wall missing where a passage meets it, or wound backward | Single-sided clay view, from both sides | Cut the matching opening through the wall. Fix the winding at the writer. |
| Pinnacles or finials show sky through them | No bottom face, a slit between shaft and spire, a cap smaller than the shaft | A close-up from below | Closed solids, seated on supports at least as large as their footprint |
| Corners doubled or overlapping | Each façade builds its own corner piece | Look at the corner from above | Build each corner once, as one solid |
| Legs or posts not attached | Lengths hand-set, or the part they meet was removed | Measure the gap | Run the member into its partner (a post into a volute's eye, a leg into the rail) |
| Mirrored half inside-out | The transform has a negative determinant and the winding wasn't flipped | Volume sign or culling | Use a writer that flips winding on mirroring (meshkit does) |

## Verification

- A single-sided clay render: the hero view, four orbit views, and close-ups of every junction class.
- `closedSolidCheck` (or the shell audit) clean for every part.
- A pixel-footprint check: the relief depth of each detail tier against the footprint at the hero and closest distances.
- The `env-geometry-audit` report: nothing visible remaining.

## References

- [references/construction-patterns.md](references/construction-patterns.md): how common architectural and structural elements are actually built.
- [references/junctions.md](references/junctions.md): how parts meet.
- [references/detail-scale.md](references/detail-scale.md): pixel footprint and depth of relief.
- [references/supplied-models.md](references/supplied-models.md): placing, grounding and repairing supplied models.

## Tools

- **[scripts/meshkit/meshkit.mjs](scripts/meshkit/meshkit.mjs):** a dependency-free mesh writer, with the API in its header. `node scripts/meshkit/selftest.mjs` runs its checks.
- **[examples/arcade-bay.mjs](examples/arcade-bay.mjs):** one carved arcade bay built to this standard: an opening cut as a notch, a swept archivolt, flush imposts, seated pilasters, and an entablature that breaks forward.
