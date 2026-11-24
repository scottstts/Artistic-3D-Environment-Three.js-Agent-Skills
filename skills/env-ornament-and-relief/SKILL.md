---
name: env-ornament-and-relief
description: "Designing and building architectural ornament, carving and relief — scrolls, acanthus, cartouches, mouldings, sculpted walls, gilded decoration, throne and furniture carving — whether carved from the mass or applied, as the reference shows. Load when a surface needs decoration, when walls read flat where the reference is sculpted, or when ornament looks like \"random stuff glued on the wall\", \"tubes put together\", \"melted gold\", scattered fragments, or flat ribbons."
---

# Ornament and relief

## Owns

Composing ornament and building it: carved versus applied, hierarchy, section, density, and how ornament grows out of the structure. General construction and junctions are owned by `env-geometry-construction`.

## Standard

**Carved or applied, as the reference shows** *(reference decides)*:

- **Carved:** the wall *is* the ornament. There is no flat plane behind it. Depth layers, sunk panels in moulded frames and relief in the fields are cut from the mass.
- **Applied:** discrete pieces with a visible ground behind them. Build them as applied pieces, seated into the ground.
- **Read it, never default it.** Test: is any flat wall plane visible between the motifs? If not, it's carved.

**Always:**

- **Composed, never scattered.** Ornament is designed as a whole: a running scroll, mirrored scrolls from a centre, a candelabrum, a cartouche, a frieze. It is continuous, with one dominant movement and subordinate members growing out of it. Every leaf grows from a stem, and every scroll from a stem or a frame.
- **Hierarchy and tiers.** Masses that read from the farthest view, then medium forms at the hero distance, then fine detail up close (`env-geometry-construction` → detail scale). Ornament at the wrong scale reads as lines or noise.
- **Full sections.** Stems and scrolls are rounded and taper toward their tips. Leaves are cupped, with a midrib and lobes. Gold members are near-round in section. Flat ribbons, planks and thin blades read as cut-outs, not carving.
- **It grows from the structure.** Ornament sits where the construction invites it: on frames, friezes, panels, capitals, keystones, spandrels and brackets. Its outline follows the field it fills.
- **Density matches the reference.** Restraint is part of taste. Never add pieces to raise the count.
- **Metal ornament reads as metal:** chunky, faceted forms that reflect a varied surrounding, giving near-black next to hot highlights (`env-materials`).

**Banned stand-ins:**

| Stand-in | Why it fails |
|---|---|
| Primitives (balls, rods, rings, wedges) glued on a flat wall to look busy | Quantity instead of composition. It reads as clutter, and the wall still reads flat. |
| Scattered, disconnected scrolls and leaf chips from a scatter generator | Nothing grows out of anything, so it reads as debris |
| Tubes bent into scroll shapes | No section variety, no leaves, no carving |
| Relief traced from the reference image (a height field made from pixels) | Reproduces the image's noise. Reads as melted or dripped material. |
| Ornament half sunk into the wall, or floating off it | An unresolved junction |
| One long rod standing in for a cluster of leaves | Wrong form: real acanthus bursts in clusters from points |

## Procedure

1. **Read the ornament from 3–4× crops of the reference.** For each field, record:
   - whether it is carved or applied;
   - the composition type ([references/ornament-vocabulary.md](references/ornament-vocabulary.md));
   - the dominant movement;
   - the density;
   - its colour or material split (white stone against gilt, for example).
2. **Size the tiers** from the pixel footprint at the hero and the closest distances. Decide each tier's depth of relief before building.
3. **Build the field's structure first:** frames, sunk panels, breaks and projections (`env-geometry-construction`). Check it in clay: the masses alone should already read.
4. **Compose each field as a whole.**
   - Lay out the main stem or axis.
   - Grow the subordinate members from it.
   - Put terminals (rosettes, flowers, volutes) where movements end.
   - Mirror around the field's axis where the reference is symmetric.
5. **Build the relief by the method that fits** ([references/relief-methods.md](references/relief-methods.md)):
   - a carved height field over the panel's own ground, for low and medium relief;
   - swept and lofted members, for high relief and free-standing scrolls;
   - real modelled leaves and volutes, for capitals and brackets.
6. **Seat and check junctions.** Ornament meets its ground by exact contact, or by sinking where no side face lands in a host plane (`env-geometry-construction` → junctions, rule 1). It never stops short.
7. **Check from the hero view, then up close, then raking light.** Raking light exposes flat or ribbon-like sections.
8. **For AI-generated references,** where the ornament can't be read consistently, build the most refined version that fits the reference's character and composition. Never reproduce the noise.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| "Random stuff glued on the wall" | Pieces scattered without a composition | Can you trace the main stem through the field? No. | Recompose: main movement, grown members, terminals |
| The wall still reads flat after adding ornament | Detail below the footprint, and the wall plane intact | Pixel footprint against the relief depth, and local contrast against the reference | Carve the wall mass in depth layers first. Ornament comes after. |
| Gold reads as ribbons or planks | Sections too flat (wide versus tall), leaves as thin blades | Section view, raking light | Near-round sections, cupped leaves with a midrib, clusters instead of long rods |
| "Melted gold, dripping" | Relief traced from the image, or smeared height fields | Look at it in clay | Delete it. Rebuild from designed compositions. |
| Ornament crosses an opening or runs into a neighbour | Swept as a closed ring, or placed without checking clearances | Close-up | Clip each member to its field, and stop it at openings |
| Not enough gold or ornament compared with the reference | Fields left bare, or tiers missing | Per-tile coverage map against the reference, with a raycast naming the surface under each tile | Fill the named fields with composed ornament, sized to the tier |

## Verification

- 3–4× crops of every ornamented field against the reference, with the composition type named.
- Clay views under raking light: sections read round, and leaves read cupped.
- Hero-distance capture: the tiers read as designed.
- Junction close-ups: everything seated.
- Audit clean (`env-geometry-audit`).

## References

- [references/ornament-vocabulary.md](references/ornament-vocabulary.md): compositions and motifs, and how each is built.
- [references/relief-methods.md](references/relief-methods.md): carved height fields, raised and sunk panels, swept members, and when to use each.

## Example

- **[examples/scroll-panel.mjs](examples/scroll-panel.mjs):** a carved running-scroll panel, built as one closed solid with meshkit. It has a continuous stem; scrolls drawn as curvature-ramped spirals that coil into each bay and end in rosettes; sheath leaves at the junctions; and a moulded frame.
  - Run `node examples/scroll-panel.mjs out.obj preview.pgm` to write the mesh and a height preview.
