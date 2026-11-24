# Vegetation detail tiers that never show

## Principle

A farther tier is **the same plant with less structure**:

- fewer of the finest twigs (a deterministic subset), fewer ring segments and path points;
- larger leaves on the remaining twigs, with total leaf area conserved;
- the same materials, the same normals, the same colour.

It is never a proxy: no ball, no card, no blob. See `examples/tree.mjs` (`TIERS`).

## Choosing the tier

Choose by projected size (pixels covered), not by fixed metres. A tree under about 2–3 pixels wide is part of the terrain's canopy shading, and the far landscape handles it.

## Making the transition invisible

1. **Coverage:** the fraction of pixels covered by leaves must match between tiers at the handover distance. Enlarge the leaves to conserve area.
2. **Colour:** the same material and lighting terms. A farther tier that reads darker usually lacks the near tier's translucency or ambient term, or its normals differ. Fix the cause.
3. **Measure the seam.** Render a band at the handover distance twice: once with tier k only, once with tier k+1 only. Compare mean colour and coverage. Any difference is the seam the user will see.
4. **Hysteresis or blending:** switch with a little hysteresis, or blend over a short range (dithered fade, then enlarging leaves). Never a hard swap that flickers when the camera hovers at the boundary.
5. **No culling in view:** distance culling of a visible plant is popping. Only frustum culling is allowed.

## Common seams

| Seam | Cause | Fix |
|---|---|---|
| Far band darker | The far tier lacks translucency or ambient, or has a different normal | The same material terms in every tier |
| Far band sparser | Leaves dropped without conserving area | Enlarge the remaining leaves |
| Shadows appear only up close | The shadow map range ends and the far tier casts nothing | Cascades or a long-range map (`env-shadows-ao-gi`) |
| A boundary ring on the ground cover | The grass-blade tier ends abruptly into terrain material | Match the terrain material's mean colour to the blade coverage, and fade blade density |
