# Phase gate checklists

Each gate is passed with evidence, not a feeling. If an item can't be checked, the gate isn't passed.

## Gate 1: reference read

- [ ] Every distinct element listed, each with:
  - what it physically is (material, construction, scale class);
  - where it lives in the world: in front of, behind, under or on what.
- [ ] Each reading cross-checked against lighting, perspective, scale and neighbouring forms. The most obvious reading is not always right.
- [ ] What connects to what: how the big forms meet and what carries what.
- [ ] Light decoded: sun side, shadow directions, which faces are lit, key-to-fill impression, how much haze.
- [ ] What is cut off at the frame edge, and how it plausibly continues.
- [ ] Style category: stylized or illustrated, versus photographic or none. This decides where deviation from physics may live.
- [ ] Places where an AI-generated reference makes no physical sense, each with the plausible version you will build.
- [ ] The signature elements, named.

## Gate 2: interpretation

- [ ] A written description of the space covering:
  - footprint and levels;
  - what encloses it;
  - where the camera stands;
  - what lies beyond the frame;
  - the structure of each signature element.
- [ ] The ambiguous readings stated as questions, each with your recommended reading.
- [ ] The user's sign-off, when the structure is ambiguous or they asked for it. Until then, build nothing.

## Gate 3: camera and space

- [ ] Horizon row, FOV, pitch and eye height solved from cues, with reprojection error stated.
- [ ] A normal or slightly long lens unless the cues prove otherwise.
- [ ] Landmarks back-projected to world positions, heights and widths. Listed as a table.
- [ ] The blockout overlaid on the reference at the solved camera. Mismatches listed.
- [ ] The world is level and plumb. Circles are circles. Repeated elements share dimensions.
- [ ] Differences from the reference that come from keeping true shapes are accepted and stated, not "fixed" by bending the world.

## Gate 4: clay structure

- [ ] Single-sided clay render: hero view, four orbit views, and close-ups of every junction class.
- [ ] Every mass placed, with counts, proportions and orientations matching the reference.
- [ ] Junctions resolved: everything seated, nothing stopping short, nothing poking through.
- [ ] Geometry audit run (`env-geometry-audit`); visible hits fixed.
- [ ] No placeholder geometry visible.

## Gate 5: per signature element

- [ ] The owning skill's Standard section passed item by item.
- [ ] Region crops of the element compared with the reference.
- [ ] Close-up from at least two sides.
- [ ] Audit clean for this element.

## Gate 6: whole world

- [ ] A view from high above, and views in every direction from the hero position: no void, no bare plane, no floating base.
- [ ] Every distance layer present out to the horizon.
- [ ] Layers that extend past what can be seen show no visible ends.

## Gate 7: integrity

- [ ] Whole-scene audit: coplanar, support, clearance, shells and winding, vegetation against solids.
- [ ] Every visible hit fixed at its generator, and checked visually from the view that exposes it.
- [ ] Each defect the user reported has been treated as a class: every instance found.

## Gate 8: look, per layer

- [ ] Per-layer captures (albedo, clay lighting, pre-grade, final) beside the reference.
- [ ] Region measurements, compared with the reference:
  - mean colour;
  - percentiles;
  - local contrast;
  - lit-to-shade ratio.
- [ ] Every remaining gap attributed to a layer, with the fix made at that layer.

## Gate 9: motion

- [ ] In-motion captures for:
  - camera moves near fine detail;
  - every animated element;
  - turning toward and away from bright sources.
- [ ] Numeric interpenetration audit over each animation's full range.

## Gate 10: close-out

- [ ] No visible mismatch worth fixing remains in the comparison loop.
- [ ] An independent read of the top gaps (the full comparison handed over, asking for the top five) has been acted on.
- [ ] The user's explicit "the look is good".
