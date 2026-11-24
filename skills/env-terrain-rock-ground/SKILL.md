---
name: env-terrain-rock-ground
description: "Building rock, cliffs, terrain, mountains, sand dunes, snow, soil and the ground contact between built things and land, so they read as the real material at every distance. Load when rock looks blobby or smooth with a texture painted on, cliffs look like columns or cones, terrain is flat or one-scale, sand/snow look unconvincing, textures stretch on slopes, or the ground has bare patches at building feet."
---

# Terrain, rock and ground

## Owns

The forms of rock, terrain, sand, snow and soil, and how built things meet the land. Surface materials are owned by `env-materials`. Distant ranges are owned by `env-world-completion`.

## Standard

**Rock:**

- **Fracture geometry at the scale of joints and ledges:** bedding planes, joints, ledges, overhangs, blocks standing proud or recessed. Smooth blobs or columns with a rock texture painted on are a stand-in.
- **Displacement from the scanned height map,** projected exactly as the rock material projects its maps. Every crack in the texture is then a crack in the geometry. The mesh must be dense enough to hold that displacement where it is seen up close.
- **Several scales of material:** the scanned set at the near scale, applied again at the cliff scale (tens of metres per tile) to give fractures and ribs, and a macro variation. Never one scale stretched over a kilometre.
- **The rock type decides the form** *(reference decides)*:
  - limestone: blocky, bedded, fissured;
  - granite: rounded joints, exfoliation;
  - basalt: columns;
  - sandstone: layered, wind-worn.

**Terrain:**

- **Detail at more than one scale,** with features that follow how the land forms: ridges and gullies, scree at cliff feet, terraces, river cuts.
- **No single radial bumps or noise spikes.**
- **Ground under every structure is resolved:**
  - terraces cut level into slopes;
  - foundations and retaining walls where buildings meet uneven ground;
  - natural transitions: grass and soil at a wall's foot, no bare decal patch, no hard ring.

**Sand:** dunes with crests, slip faces at the angle of repose (about 30–34°) on the lee side, wind ripples close up, and scattered scrub or stones where the reference shows them. Large-scale shading and self-shadowing (dune on dune) are baked if they're static.

**Snow:** lies where it would settle: on up-facing surfaces, ledges and low-angle faces. Steep rock stays bare. Drifts form in the lee of objects, with soft edges. Snow caps on objects follow their top surfaces, with real thickness.

**Always a defect:**

- Visible texture stretching on steep faces. Use triplanar or slope-aware projection.
- Visible tiling at any distance.
- A bare patch or ring at a building's foot.
- Terrain whose silhouette is too smooth at the distance it's seen from.
- Ground that ends: sky showing under the ranges.

## Procedure

1. **Identify the material and its formation** from the reference: the rock type, how the dunes form, how snow is distributed.
2. **Build the large form:**
   - a height field or mesh with the right landform features;
   - cliffs as blocks or prisms with joints;
   - dunes with crest lines.
3. **Add meso detail as geometry.** Displace with the scanned height map, projected the same way as the material. Use enough mesh density where the viewer can get close.
4. **Apply the material at several scales** (`env-materials`), with slope- and height-driven masks: rock on steep faces, soil and vegetation on gentle ones, snow on up-facing ones.
5. **Resolve every place where built things meet the ground:**
   - level terraces, foundations, retaining walls;
   - ground cover running up to the walls.
6. **Bake the static large-scale lighting** where it helps: dune-on-dune shadows, cavity occlusion.
7. **Check:**
   - the hero view;
   - a close view of the nearest rock;
   - a grazing view of slopes, for stretching;
   - a high view, for tiling;
   - the building feet.

## Failure modes

| Symptom | Mechanism | Fix |
|---|---|---|
| Rock reads as smooth blobs with texture | The mesh is too coarse to hold fractures; one material scale | Displace from the scanned height in the material's projection. Densify near the viewer. Apply the scan again at cliff scale. |
| Cliffs look like columns or cones | The form is a radial falloff | Jointed prisms or blocks with stepped tops and recesses, bedding planes |
| Stone looks like a two-colour ramp | The scan was collapsed into a gradient, so no real texture survives | Use the scanned albedo, normal and roughness. Tint it, never replace it (`env-materials`). |
| Displacement pushed rock into the view or onto paths | Displacement applied without checking the space it occupies | Mask displacement near required clearances. Re-check the composition. |
| Sand unconvincing | One scale, no slip faces, no ripples, no self-shadowing | Three scales of crests, slip faces at the angle of repose, ripples, baked self-shadow |
| Snow on vertical rock | Snow mask by height, not slope | Snow by up-facing normal and shelter, with drifts in the lee |
| A bare patch at a building's foot | Vegetation or ground cover cleared too wide around footprints | Clear only the footprint. Run cover and material up to the wall. |

## Verification

- A close-up of the nearest rock from two sides: fractures are geometry, with no stretching.
- A grazing view of a steep slope: no stretching.
- A high overhead view: no visible tiling.
- Building feet: no bare ring or patch, and foundations resolved.
- Region crops of rock, sand or snow against the reference: value structure and form.

## References

- [references/rock.md](references/rock.md): rock forms by type, building cliffs, displacement in the material's projection.
- [references/sand-and-snow.md](references/sand-and-snow.md): dune anatomy and snow distribution.
