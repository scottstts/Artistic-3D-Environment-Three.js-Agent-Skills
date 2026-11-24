# Grading: what reads as real

## Reads as real

- **Contrast from light:** deep shade next to hot sun, with texture in both.
- **Colour from light:** blue shade from the sky, warm sun, coloured bounce.
- **Saturation by material:** foliage, sky and water rich; stone, plaster and white walls near neutral.
- **Highlights roll off,** keeping their hue.
- **Blacks are as deep as the reference,** never lifted by a veil.

## Reads as "graded"

- An S-curve after tone mapping: punchy frame, flat surfaces.
- Colour split by brightness standing in for light: dark trunks go teal and bright water goes gold, whatever lights them. A mild luminance-keyed warm/cool split on top of correct light can match a reference. It can't replace the light's own colour.
- Stacked saturation and vibrance boosts pushing colours to the gamut edge, so neighbouring tones merge.
- A global tint over whites.
- Heavy vignetting, bloom haze.

## Gamut-limited saturation (TSL)

Scale the saturation boost per pixel by the largest factor that keeps every channel within [0, 1]. Then no channel clips and hues don't shift.

```js
import { Fn, luminance, vec3, min, max, float } from 'three/tsl';

export const saturateInGamut = Fn(([c, amount]) => {
  const l = luminance(c), d = c.sub(vec3(l));                     // chroma vector from the grey axis
  // the largest factor k such that l + k·d stays inside [0, 1] for each channel
  const up = vec3(1).sub(vec3(l)).div(max(d, vec3(1e-6)));        // limit for positive components
  const dn = vec3(l).div(max(d.negate(), vec3(1e-6)));            // limit for negative components
  const lim = min(min(min(up.x, up.y), up.z), min(min(dn.x, dn.y), dn.z));
  const k = min(float(amount), max(lim, float(1)));               // never reduce below the original
  return vec3(l).add(d.mul(k));
});
```

Apply it to display-referred values: after tone mapping, which in r187 means `outputColorTransform = false` and your own `renderOutput(...)` before this node (see the SKILL's chain). On HDR values before tone mapping the [0, 1] gamut limit doesn't apply. Drive `amount` by what the pixel is (the sky mask from depth, a foliage or water mask from material IDs or MRT), not by brightness.

## Matching the reference with a LUT

When the reference has a deliberate look (an AI image's vividness, a film stock), fit a 3D lookup table from ungraded render regions to reference regions over matching materials. Apply it last, with three.js's `Lut3DNode`. Fit it only after the light and material layers match. A LUT can't fix a lighting gap, and fitting one to hide it bakes the error in.

## Measuring

Use `env-look-iteration` → `scripts/measure.py`:

- luminance percentiles;
- the darkest 1%;
- mean saturation by class;
- local contrast (the 8 px window standard deviation) within key surfaces;
- the share of clipped pixels.

Compare the pre-grade and graded images: the grade should move the medians and colours toward the reference without lowering local contrast.
