# FFT ocean

## Cascades

- **Three or four cascades,** each an N×N inverse FFT (N = 128–256) over its own patch size. For example: about 230 m (swell), about 40 m (wind waves), about 7 m (ripples), and optionally about 1 m (capillary).
- **Disjoint bands:** cascade c carries only wavenumbers in [k_min,c, k_max,c). Its band sits inside its grid's resolvable range. No energy is counted twice.
- **Incommensurate patch sizes** (not integer multiples), so the repeats of different cascades don't line up into a visible tile.
- **Validate first:** run `spectrum.mjs` with the scene's wind and fetch. Check Hs against the reference's sea state, and the resolved slope variance against Cox–Munk (mss ≈ 0.003 + 0.00512·U). The difference goes to roughness.

## GPU pipeline (per frame)

1. **Time evolution** (compute): h(k,t) = h0(k)·e^{iωt} + conj(h0(−k))·e^{−iωt}. Also build i·k·h for the slopes and −i·(k/|k|)·h for the choppy horizontal displacement.
2. **Inverse FFT** (compute): a butterfly pass per stage per axis, or a single-pass shared-memory FFT for N ≤ 256. Outputs:
   - height;
   - displacement x and z;
   - slopes x and z;
   - the Jacobian, for foam.
3. **Foam accumulation** (compute): where the Jacobian J < threshold (folding), add foam. Decay the history each frame.
4. **Validate** with a self-test at load: a constant field and a single wave must reproduce exactly (max error about 1e-3). This catches butterfly and sign errors before you judge the look.

## Displacement and the mesh

- Choppy displacement: x += λ·D_x with λ about 0.8–1.2. Watch the Jacobian: λ too high folds the surface into loops.
- A dense grid near the viewer (cells under about 1 m), growing geometrically with distance. A cell can't resolve waves shorter than about twice its size: fade those cascades in displacement before the mesh aliases them.
- The mesh extends to the horizon, or meets a far ring that uses the same shading.

## Footprint fading

For each cascade, compute the pixel footprint at the shaded point along the view direction. At grazing angles the footprint stretches by 1/cos(view angle) along the view. Fade the cascade's slopes out as its wavelength approaches the footprint, and add its slope variance to the roughness term. The far sea then keeps the right brightness and glitter width with no aliasing.

## Life and motion

- **Wind direction** consistent with the clouds, smoke and vegetation.
- **Swell** can come from a different direction than the wind sea: a second spectrum or a narrow band.
- **Slicks** (calm streaks along the wind) are visible mainly inside the glitter path. Model them by reducing short-wave energy in streak masks.
