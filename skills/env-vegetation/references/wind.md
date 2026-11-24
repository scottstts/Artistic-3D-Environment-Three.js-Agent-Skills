# Wind that reads as real

## Mechanics

- **Pinned at the base.** Displacement is zero where the plant meets the ground or its parent, and grows along the member, roughly quadratically with distance from the attachment.
- **Amplitude from the member's own size and stiffness:**
  - a trunk sways a fraction of a percent of its height;
  - branches a little more;
  - leaves and grass tips the most.

  Never scale amplitude by world-space height. That gives metres of motion on a tree standing on a hill.
- **Hierarchy:** the trunk bends as one piece. Branches add their own sway in the trunk's frame. Leaves flutter in the branch's frame. Each level has its own frequency: lower for heavy members, higher for light ones.
- **Gusts travel:** a gust field (noise scrolling along the wind direction) drives the amplitude, so waves of motion cross a lawn or a forest. Neighbours move together, but not in lockstep.
- **Species stiffness:** conifers are stiff (the whole tree barely moves; branch tips bob). Grass and willows are pliant. Palms flex their fronds.
- **Direction is consistent** across the scene and matches other wind cues: smoke, flags, cloud drift, water ripples.

## Banned

| Motion | Why it's wrong |
|---|---|
| Orbiting or rotating whole plants | Plants don't spin |
| Swirling leaves (each with a random circular path) | Reads as a tornado |
| A wave travelling up the trunk (phase rising with height) | Reads as seaweed in water |
| Scale pulsing | Nothing grows and shrinks in wind |
| Fallen petals or leaves sliding on the ground | Things lying on the ground stay put unless blown, and then they tumble |

## Shadows and cost

- A moving plant's shadow must move with it. Re-render the shadow map for animated casters every frame. Measure the cost: it is often a few milliseconds. Never fall back to a static or proxy shadow for moving foliage.
- If motion is too costly, or the user prefers it, keep plants still. Still is better than wrong.

## Checking

Capture close up at real frame rate:

- displacement at the tip of a sprig: centimetres, pinned at its base;
- the trunk: a rigid bend;
- a gust visibly crossing several plants;
- shadows tracking the motion.
