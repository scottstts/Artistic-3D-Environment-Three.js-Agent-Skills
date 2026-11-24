# Rock

## Forms by type

| Rock | Form | Joints | Weathering |
|---|---|---|---|
| Limestone | Blocky, horizontal bedding, vertical joints, karst towers | Orthogonal sets give stepped skylines and fissures | Dissolution channels, dark streaks below ledges, moss on ledges |
| Granite | Massive, rounded, with exfoliation sheets | Widely spaced, curving | Rounded boulders, tors, lichen patches |
| Sandstone | Layered, cross-bedded, alcoves | Bedding dominates | Wind-sculpted hollows, colour bands |
| Basalt | Columnar (hexagonal prisms) or massive | Column joints | Talus of broken columns at the foot |
| Slate/schist | Thin sheets, angled foliation | Foliation planes | Sharp splintered edges |

## Building a cliff

1. **Massing:** a bundle of prisms or blocks following the joint sets. Each block stands proud or recessed, ending at its own height, which gives a stepped skyline.
2. **Ledges** along the bedding planes. Each catches light on top and casts a shadow below. Moss, snow or soil lies on the ledges.
3. **Meso detail:** displace the faces by the scanned height map, projected exactly as the material projects its maps (the same triplanar axes, scale and offset). Then every crack in the texture is a crack in the geometry. Use enough vertices to resolve the displacement where the viewer can get close.
4. **Talus and scree** at the foot. The angle of repose is about 35°.
5. **Material at three scales:** the near scan (metres per tile), the same scan at the cliff scale (tens of metres) for large fractures, and a macro colour variation. Blend by distance.

## Boulders

A closed mesh with facets from joint planes, rounded by weathering according to the type. Seat it into the ground: its base sinks in, and soil and grass come up around it. Vary every individual.

## Checks

- **Raking light** across the cliff: fractures cast shadows. If they don't, they are only in the normal map.
- **Close-up of the nearest rock:** no stretching, the joints read as real.
- **From distance:** the stepped skyline reads.
