# Plant structure

## Branching

- **Levels:** trunk → scaffold branches → secondary → twigs. A mature broadleaf needs at least three levels below the trunk, or it reads as sparse sticks.
- **Placement along the parent:** children start from about 0.3 of the parent's length to its tip. Their azimuths follow a golden-angle rotation (about 137.5°) with jitter, so no two line up.
- **Angles:** the angle from the parent narrows with level and with species (wide for oak, narrow for poplar). Children near the tip lean toward the parent's direction.
- **Length:** a child is about 0.4–0.6 of its parent's length, longer near the base of the crown and shorter near the top. That gives a crown its dome.
- **Pipe model:** the cross-sections of children roughly sum to the parent's: r_child ≈ r_parent · √(1/n). Uniform thin sticks read as wire.
- **Taper:** the radius falls along each branch, fastest near the tip. The trunk flares at the base.
- **Continuity:** a child starts inside its parent, sunk along the parent's surface normal. The bark is continuous at the junction. Never a gap, a stub, or a floating start.
- **Tropism:** branches bend toward the light (up and outward). Thin branches droop under weight. Add small random turns so nothing is straight.
- **The leader:** the trunk tapers into a leader or splits into scaffolds. It never continues as a straight pole through the crown.

## Leaves

- **Attached at nodes on twigs,** with a petiole. Leaves sit along the outer two-thirds of a twig, phyllotaxis rotating around it.
- **Orientation:** blades turn toward the light (outward and up). Interior leaves are fewer.
- **Size:** real leaf size for the species (broadleaf 5–15 cm). Leaves several metres across read as fake.
- **Cards:** alpha-tested leaf cards with real scanned leaf textures. Double-sided, with translucency on the back face. The normals are the card's real normals, not bent toward a sphere.

## Rooting

- The root flare widens the trunk base, and surface roots dive into the ground.
- In planters: the soil surface faces up inside the planter's inner wall, and the trunk enters the soil.
- On rock or cracks: roots follow the crack and enter it.
- In grass or turf: the trunk base is surrounded by real ground cover, never a bare decal ring.

## Variation

Per individual, vary: height (±15–25%), crown width, lean, branch count and angles, leaf colour (a small hue and value spread), and seed. Clones are a defect. Instancing is fine if each instance's geometry varies, or there are enough variants that no two neighbours match.
