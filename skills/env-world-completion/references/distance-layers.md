# Distance layers: method per content type

The extents are typical and scale with the scene. A distance layer is about how many pixels a thing covers, not about metres: choose the tier from the projected size.

| Content | Near (full) | Mid | Far | Horizon |
|---|---|---|---|---|
| Ground or terrain | Scanned PBR and displacement, contact detail | Same material, coarser mesh with a normal map | Displaced terrain, baked normal and shadow map, scanned albedo at macro scale | Smooth terrain under aerial perspective |
| Trees | Full botanical build | Same skeleton, thinned branches, fewer and larger leaves (`env-vegetation`) | Instanced real trees at a low tier | Canopy as terrain shading, only where a single tree is under a pixel |
| Buildings | Full construction and ornament | Same massing, ornament reduced to relief normals | Massing with openings, roofs, materials | Massing silhouettes with lit and shaded faces |
| Sea | FFT displacement and full shading (`env-water`) | FFT normals, slopes faded by footprint | Slope variance into roughness, sky reflection | Same shading: no seam at the horizon |
| Clouds | Volumetric | Volumetric | Volumetric or baked panorama | The layer continues past the horizon |
| Fields and crops | Real plants | Fewer, larger plants | Furrow or row geometry and material | Material on terrain |

## Rules for all tiers

- **Tiers reduce the same thing.** A tree's far tier is the same tree with less structure, never a different object.
- **Transitions are invisible.** The tiers match in colour, average density and shading at the handover. Measure the mean colour of the band at the handover distance rendered by each tier alone. Fix any difference at its cause: missing ambient, a different normal, coverage that changes.
- **No culling in view.** Frustum culling is fine. Distance culling of anything visible is not.
- **Silhouettes stay crisp** at their tier. A far ridge that is too smooth needs mesh density, or a tessellation driven by screen-space error.

## Cheap but real

| Need | Real and cheap | Not acceptable |
|---|---|---|
| A distant forest | Instanced real trees at a low tier, plus canopy shading on the terrain | Lumpy blobs, sprites |
| A distant city | Instanced massing with real openings, interior-mapped windows | Boxes with a window texture and no depth |
| Distant ranges | Displaced terrain from a well-shaped height field, baked shading | Cones, flat cards, a ring of noise spikes |
| A cloud floor below a sky realm | A volumetric field or a baked panorama of one | A flat white plane, a fog colour |
| An ocean to the horizon | FFT at reduced cascades, shading faded by footprint | A flat plane with a scrolling normal map |
