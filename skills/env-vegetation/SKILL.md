---
name: env-vegetation
description: "Building trees, shrubs, palms, conifers, flowers, grass, crops, vines and potted plants with real botanical structure, plausible rooting, natural variation, invisible detail tiers and physically plausible wind. Load whenever a scene has any vegetation, and when plants look like balls/blobs/cut-outs, float or grow out of roofs, look cartoonish, pop between LODs, or animate like tornadoes, seaweed or rotating props."
---

# Vegetation

## Owns

Plant structure, placement and rooting, variation, detail tiers, and wind motion. Plant materials are owned by `env-materials`. Distant vegetation layers are owned by `env-world-completion`, which uses this skill's tiers.

## Standard

**Default: real botanical structure.** Every plant is built the way it grows:

- **Trees:** a root flare entering the ground, surface roots where the species has them, a trunk tapering upward, and branches splitting recursively and tapering.
  - Radius follows a pipe model: children's cross-sections roughly sum to the parent's.
  - Each child grows out of its parent: the wood is continuous, with no gap and no stub.
  - Twigs carry the leaves, needles, flowers or fronds, attached at nodes in a plausible arrangement.
- **Shrubs and bushes:** many stems from a root crown, with leaves on the stems.
- **Palms:** a ringed trunk and a crown of fronds. Each frond is a rachis with leaflets.
- **Conifers:** a whorled branch structure, needle sprays on the branchlets.
- **Flowers:** petals joined to a receptacle, a stem, leaves on the stem. Cupped petals with real form.
- **Grass:** blades from the ground up, in clumps. **Crops:** real plants in rows.
- **Climbers:** stems following the surface they climb, with leaves on the stems.

**Banned stand-ins:**

| Stand-in | Why it fails |
|---|---|
| A solid core (ball, ellipsoid, blob) covered in leaves | Reads as a topiary prop; the light stops at its surface |
| Loose leaves arranged in a ball with no branches | Nothing holds them; the canopy floats |
| A blob of geometry for a crown, or a lumpy "tree" at distance | Reads as a 2000s game. Show a real tree at a lower tier, or nothing. |
| A flat card or impostor for a whole plant | No parallax and no volume; it breaks when orbited |
| A green patch with grass blades on top | A cartoon. Grass is blades all the way down. |
| Paper cut-out flowers with no connection | No receptacle, no stem, no depth |
| A textured plane for a crop field | No plants, so no parallax, shadow or silhouette |
| A trunk ending as a pole inside the crown | Branches must split from the trunk, and the trunk must taper into them |

Alpha-tested leaf cards attached to real twigs are fine. They are leaves, not stand-ins.

**Always a defect:**

- A plant growing from a roof or a wall, from thin air, through a structure, or floating above its soil.
- Identical clones of natural things. Every individual varies: shape, size, lean, branching, colour.
- A detail-tier boundary you can see in shape, density or colour. Popping.
- Wind that swirls, orbits, waves like seaweed or rotates whole plants. A whole plant "breathing" in scale.
- Shadows that don't move with the moving plant, or proxy shadows that don't match it.
- Fallen petals or leaves sliding on the ground.

**What the reference decides:** the species, the density, the stylization of leaf shape and colour, and how much wind.

## Procedure

1. **Name the species or archetype** for each plant in the reference ([references/species-archetypes.md](references/species-archetypes.md)). Note height, crown shape, branch habit, leaf size and arrangement, and colour.
2. **Grow the structure** ([references/plant-structure.md](references/plant-structure.md)):
   - trunk and roots;
   - recursive branching with tropism and droop;
   - leaves at the twig nodes.

   Use deterministic seeds per individual, and vary every parameter between individuals.
3. **Plant it.** Choose the ground (soil, a planter, a crack), seat the root flare into it, and put the soil surface inside the planter, facing up.
4. **Test against the solids at build time.** Push a sprig out along its normal, or drop it, where it touches a structure (`env-geometry-audit` → `clearance` between plants and solids). Prune whole branches that would grow through a roof.
5. **Build the detail tiers from the same structure** ([references/vegetation-lod.md](references/vegetation-lod.md)):
   - keep a deterministic subset of the finest twigs;
   - simplify the tubes;
   - enlarge the remaining leaves so leaf area is conserved;
   - check the crown envelope holds.

   Choose a tier from its projected size, and never cull a visible plant.
6. **Add wind** ([references/wind.md](references/wind.md)) only if the reference has motion or the scene calls for life:
   - pin the motion at the base;
   - amplitude from the plant's size and stiffness;
   - gusts travel across the scene;
   - shadows update with it.
7. **Check:**
   - close-ups of junctions (trunk to branch, twig to leaf) and of the base;
   - a mid-distance view of the silhouette;
   - a fly-through for tier popping;
   - motion close up.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| Trees look cartoonish | Too few levels, straight sticks, uniform leaves, no variation | Count levels; look at branch curvature | More levels, tropism and droop, irregularity, varied individuals |
| A pole sticking out of the crown | The trunk continues straight with no taper or split | Side view without leaves | Taper the trunk into the leader, and split it into scaffold branches |
| Leaves swirl like a tornado | Sway amplitude scaled by world height (tens of metres), with random phase per leaf | Measure the displacement of one leaf | Pin at the sprig base. Amplitude in centimetres, from the sprig's own length. Phase from a travelling gust field. |
| Trees look like seaweed | Phase varies with height, so a wave travels up the trunk | Watch the trunk | A stiff trunk bends as one piece. Branches bob rigidly with their own phase. |
| A ring of darker, different trees at a distance | Far tier uses a different colour, normal or ambient | Mean colour of the band at the handover, rendered by each tier alone | Match material, normals and coverage between tiers |
| Plants through roofs | Placed without a solid test | Clearance audit | Build-time test: push out, prune or drop |
| A bottle-brush far tier | Leaf area moved onto the remaining main branches | Crown envelope per tier | Keep a subset of real twigs and enlarge their leaves (see the example) |

## Verification

- Clean audits: clearance (plants against solids) and support (every plant rooted).
- Close-ups: the root flare entering the ground, trunk-to-branch junctions, leaves attached at twigs.
- A tier comparison: the same plant at each tier, side by side, with matching envelope and colour. A fly-through shows no popping.
- Motion: a close capture shows centimetre-scale sway pinned at the base, and shadows moving with the plant.

## Example

- **[examples/tree.mjs](examples/tree.mjs):** a broadleaf tree with root flare, surface roots, pipe-model branching, tropism and droop, and leaves on twigs, in three tiers that keep the crown envelope and conserve leaf area.
  - `node examples/tree.mjs [seed]` runs its checks: branches start inside their parents, roots enter the ground, every leaf is attached, the envelope and leaf area hold across tiers.

## References

- [references/plant-structure.md](references/plant-structure.md): branching rules, taper, arrangement, rooting.
- [references/species-archetypes.md](references/species-archetypes.md): the parameters that make each archetype read.
- [references/ground-cover.md](references/ground-cover.md): grass, crops, flowers, moss.
- [references/vegetation-lod.md](references/vegetation-lod.md): tiers that never show.
- [references/wind.md](references/wind.md): wind motion that reads as real.
