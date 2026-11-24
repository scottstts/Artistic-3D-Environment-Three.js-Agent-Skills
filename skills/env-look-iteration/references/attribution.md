# Attributing a gap to its layer

## Per-layer views

| View | Shows | Use it to decide |
|---|---|---|
| Albedo only | Material colour and its variation | Is the colour gap in the material? |
| Clay (uniform grey material), sun only | Light direction, shadows, form | Is the form or key wrong? |
| Clay, sun plus sky and indirect | The full light structure | Fill ratio, occlusion, bounce |
| Pre-grade (after tone map, before grade) | Light plus material, before colour work | Is the gap there before the grade? Then it isn't a grade problem. |
| Final | Everything | — |
| Per-term (reflection only, AO only, fog only) | One contribution | Bisect artifacts and veils |

## Gap → layer

| Gap | Usually caused by | Check |
|---|---|---|
| Shape, count, proportion, position | Geometry or camera | Overlay at the reference camera, clay view |
| Flatness despite detail | Geometry (detail below the pixel footprint, flat planes), shadows (relief too small to cast) | Footprint against relief depth, local contrast in clay |
| Wrong surface colour, consistently across light and shade | Material albedo | Albedo view against the reference region |
| Wrong value in light only, or shade only | Light: key strength or fill ratio | The lit:shade ratio on one material |
| Wrong light direction or terminators | Sun position | Clay view, stick shadows |
| Recesses too bright | Unoccluded indirect light | AO and probe view |
| Grey veil, lifted blacks | Atmosphere or post (fog, haze, glare), or fill | Toggle each term, measure the darkest 1% |
| Wrong saturation everywhere | Tone map or grade, or a sky fill colour that's off | Pre-grade against final |
| Wrong saturation in one class | Material or bounce | The class's albedo, and the bounce source |
| Glow too wide or strong | The sky's aureole width, or bloom radius and strength | `measure.py --glow` profile |
| Artifact in motion only | Temporal (`env-temporal-stability`) | Stepped frames |

## Rules

- **Fix at the owning layer.** A grade that compensates for a lighting error breaks every view the grade wasn't tuned on.
- **Name what's under a mismatching pixel** with a raycast from the camera. The region may not contain what you think: a tree in front of the tower you're recolouring.
- **One change at a time** when the cause is uncertain. Measure every region after each change.
