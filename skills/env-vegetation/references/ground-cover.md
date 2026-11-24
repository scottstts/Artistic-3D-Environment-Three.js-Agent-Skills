# Ground cover: grass, crops, flowers, moss

## Grass

- **Blades all the way down:** each blade is a narrow, curved, tapered strip (3–5 segments) rising from the ground. Clumps vary in height and lean.
- **The ground under the grass** is soil or thatch material, never a flat green colour the blades sit on.
- **Density by distance:**
  - near: full blades;
  - mid: fewer, wider blades with the same coverage colour;
  - far: the terrain's own grass material (a scanned grass set) whose mean colour matches the blades' coverage colour.

  Measure the handover (`vegetation-lod.md`).
- **Colour:** a base-to-tip gradient (darker base, lighter tip) and variation between clumps. Light passing through blades backlit by the sun.

## Crop fields

- Rows of real plants: stalk, leaves, head. Row direction and spacing are consistent within a field.
- Far tiers keep the row structure (furrows, row geometry) until it is sub-pixel. Then the terrain material carries the row stripes.
- **Field to horizon:** with a field at the horizon, the field itself continues to the horizon at the right tier. Never bare land beyond the last row.
- **Around the camera:** never clear plants by horizontal distance from the camera, which leaves a bare disc straight down. Clear only plants the camera is actually inside.

## Flowers

- Each flower: petals cupped and overlapping, joined to a receptacle; a stem; leaves on the stem.
- Beds: varied heights and facing. Some buds, some open, some past bloom.
- Fallen petals lie still on the ground. They move only in wind, and then as rigid flat pieces that tumble.

## Moss and lichen

These are material layers, driven by up-facing, sheltered and damp masks on rock and masonry (`env-materials`), plus small real clumps where they read at the hero distance.
