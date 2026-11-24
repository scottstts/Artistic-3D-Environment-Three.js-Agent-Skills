# Relief methods

| Method | Use for | How |
|---|---|---|
| Carved height field over the field's own ground | Low and medium relief: friezes, panels, carved walls | A closed solid whose front surface is the ground displaced by a composed height field. The field is a union (max) of rounded members: a half-round tube around each stem or scroll curve, cupped lobes for leaves, petals for rosettes. The frame moulding is part of the same field. See `examples/scroll-panel.mjs`. |
| Raised fielded panel | A panel standing out of a stone face | The panel rises straight out of the face from a flush edge, so no hole has to be cut. Moulded border, carving on its field. |
| Sunk panel | A recessed field in a moulded frame | Cut the recess with `extrude` (an outline with a hole, plus a separate ground slab), or with a stepped frame swept around the recess |
| Swept and lofted members | High relief and free scrolls: brackets, consoles, throne arms, crests | Sweep a section (round, ogee, leaf-edged) along a scroll curve, with a taper. Loft for leaf bodies. Seat everything into the ground. |
| Modelled leaves and volutes | Capitals, acanthus clusters, finials | Individual leaves as cupped lofted blades with lobes, arranged in whorls. Volutes as tapered swept spirals with a rolled cushion. |
| Normal and parallax relief in the material | Only the fine tier, at distances where geometry wouldn't resolve | Never in place of the mass and medium tiers. It has no silhouette and casts no shadow. |

## Height-field rules

- **Resolution:** the grid cell is no larger than about a third of the smallest member's radius, or the members facet. Use creased normals (meshkit `patch`, crease about 50°) so rounded members shade smooth.
- **Union by max, not sum.** Summing heights makes blobs where members cross.
- **Rounded sections:** half-round or ogee falloffs. A linear falloff reads as a ridge. A step reads as a cut-out.
- **Taper** every member toward its free end.
- **The ground is real material:** it gets the same scanned PBR set, and AO in its hollows.
- **Depth** beats the shadow system's limit (texel size plus bias), or the relief won't cast or receive shadow (`env-shadows-ao-gi`).

## Never

- Height from the reference image's pixels.
- Noise as "carving".
- Relief that only exists in the normal map at the hero distance, when the reference shows deep forms.
