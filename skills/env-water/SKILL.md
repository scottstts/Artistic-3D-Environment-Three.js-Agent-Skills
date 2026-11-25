---
name: env-water
description: "Building water — open ocean (FFT spectral by default), seas to the horizon, coasts and foam, pools, rivers, fountains, breaking waves and surf — with physically based shading (Fresnel, sky and object reflection integrated over wave slopes, refraction, absorption, caustics, sun glitter). Load whenever a scene has water, and when the sea looks painted, flat, dark with one glint strip, glassy, muddy at the horizon, banded, has no reflections of objects, or waves look like curved sheets."
---

# Water

## Owns

Water surfaces and bodies: their wave fields, their shading, and how they meet objects and shores. The sky the water reflects is owned by `env-sky-atmosphere-clouds`. Screen-space and temporal artifacts are cross-checked with `env-temporal-stability`.

## Standard

**Default for open water: an FFT spectral ocean.**

- **Spectrum:** physically based (JONSWAP or Phillips, from wind speed and fetch), with directional spreading and deep or finite-depth dispersion.
- **Cascades:** several, with disjoint wavenumber bands, from swell (hundreds of metres) down to centimetre ripples.
- **Geometry:** displaced (choppy) near the viewer, with a grid dense enough to resolve the largest visible waves.
- **Detail faded by pixel footprint,** per cascade. The slope variance lost by fading goes to roughness, so the far sea keeps its sheen instead of going muddy or banded. Use the footprint along the view slant, not just the distance.

Analytic sine-sum water and normal-mapped planes are stand-ins *(only if the user explicitly asks)*.

**Shading is physical:**

- **Fresnel:** reflectance from F0 ≈ 0.02 at normal incidence, rising to 1 at grazing.
- **Sky reflection integrated over the wave-slope distribution inside each pixel,** sampling the sky map at the mip level that matches each sample's footprint. A single reflection direction per pixel leaves the sea dark outside the sun's column, and single sky texels stretch into stripes at the horizon.
- **Reflections of actual scene objects:** a planar mirror render clipped at the waterline, integrated over the slopes; or probes for small bodies. A painted tint standing in for a reflection is banned.
- **Sun glitter** computed from the sun's real irradiance over the slope distribution. Never a clamped highlight strip.
- **Refraction and absorption** (Beer–Lambert with real seawater coefficients) wherever you can see into the water: shallows, pools, near the viewer. Scattering gives the body colour.
- **Foam** driven by the wave field (Jacobian folding, with persistence and decay), plus foam at contact lines and wakes.
- **Caustics** on the beds of shallow water, from the surface curvature or slopes. Never a scrolling texture.
- **Cloud shadows** on the water modulate the sun terms.

**Horizon-safe by construction.** Every ocean so far has shipped a "barcode": dark or bright vertical stripes in a band just below the horizon. Three separate mechanisms each produce it, so all three are closed when the water is first built, not after the stripes appear:

1. **Ambient occlusion on far, low-precision depth.** Leave water, sky and emissives out of the AO input from the moment AO is set up. Fade AO out with view distance. Use a reversed depth buffer.
2. **Sky reflection reading single texels at grazing angles.** Each slope sample is squeezed vertically near the horizon, so one sky-map texel stretches into a stripe. Always read the sky map at the mip level that matches the sample's footprint.
3. **Depth-based water terms at distance:** screen-space refraction, absorption by water depth, foam from depth difference. Depth precision fails toward the horizon and these terms quantize into columns. Fade every depth-based term out by distance, well before precision fails. Beyond that, far water uses the analytic body colour and the sky reflection only.

Also: no fixed per-pixel dither or jitter pattern on far water, because a static pattern stretched at grazing angles reads as stripes.

**Bounded water** (pools, rivers, fountains): simulated or spectral waves at the body's own scale (capillary-gravity for small pools), with refraction to the real bed, depth absorption, caustics, and reflection of the real surroundings.

**Breaking waves and surf:** a body of water with thickness. The crest is thin and translucent, the base thick and dark, the face textured, and the wave has a life cycle: form, throw, crash, then subside fast. The spray hides nothing. A curved sheet with foam is a stand-in.

**Always a defect:**

- Barcode stripes (vertical columns) anywhere near the horizon, at any camera height.
- A bright line where water meets an object.
- A camera-dependent boundary or band in the water.
- A seam between cascades or detail tiers.
- A visibly repeating patch.
- Reflections updated in stepped frames.
- A frozen look: correct shapes with no motion.

**What the reference decides:**

- **Wind and sea state:** amplitude and chop.
- **Water colour:** depth, turbidity, how much bed shows.
- **Foam amount.**
- **Stylization:** simplified shading for a stylized reference. The FFT method stays.

## Procedure

1. **Read the sea state from the reference:**
   - wavelength of the visible swell;
   - chop;
   - foam coverage;
   - glitter shape (a wide glitter path means rough water);
   - colour of deep and shallow water;
   - what is reflected.
2. **Set up the cascades** with [examples/fft-ocean/spectrum.mjs](examples/fft-ocean/spectrum.mjs):
   - wind speed and fetch;
   - patch sizes, with disjoint bands;
   - check Hs and the resolved slope variance against Cox–Munk;
   - note the remainder to hand to roughness.
3. **Implement the GPU FFT** (a compute inverse FFT per cascade for height, choppy displacement and slopes). Validate one frame against the CPU reference: same seed, same height statistics.
4. **Build the mesh:** a dense grid near the viewer, cells growing with distance. Displace by the cascades, and fade each cascade by its footprint.
5. **Shade** ([references/water-shading.md](references/water-shading.md)):
   - Fresnel;
   - slope-integrated sky reflection with mip selection;
   - object reflection (mirror render);
   - glitter from the sun's irradiance;
   - refraction and absorption;
   - foam;
   - cloud shadows.
6. **Horizon check, before any look work.** Right after the first render of the shaded ocean:
   - capture grazing views toward the horizon from three or more heights (near the water, eye or deck height, high above), facing toward and away from the sun;
   - run `measure.py --stripes` (`env-look-iteration`) on the band just below the horizon in each;
   - any stripe flag: bisect the three mechanisms above (AO off, then depth-based terms off, then reflection off) and close the one that removes it.

   Repeat the check whenever AO, refraction, reflection or the depth setup changes.
7. **Contact:** reflections clipped at the waterline, no bright edge where objects meet the water, wakes and foam where they belong.
8. **Shallow and bounded water:** caustics on the bed, refraction with a guard band, real absorption ([references/bounded-water.md](references/bounded-water.md)).
9. **Breaking waves**, where the scene has surf ([references/breaking-waves.md](references/breaking-waves.md)).
10. **Check:**
   - the hero view region against the reference;
   - toward the sun and away from it;
   - grazing views near the horizon (banding, muddiness);
   - from height (repetition);
   - in motion (frozen look, stepped updates).

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| Sea dark except one glint strip | One reflection direction per pixel; glitter from a clamped sun radiance | Per-term view: reflection only | Integrate reflection and glitter over the slope distribution. Use the sun's real irradiance, not the display-clamped disc. |
| Flat, painted blue sea | The sky reflection scaled far below Fresnel | Reflection term alone | A physical Fresnel weight, with the real sky map |
| Barcode or vertical stripes below the horizon | One of three: AO on quantized far depth; depth-based water terms (refraction, depth absorption, depth foam) quantizing at distance; single sky texels stretched at grazing angles | `measure.py --stripes` on the band. Bisect in order: AO off, depth-based terms off, reflection off. | Close all three, not just the one found: AO masked and faded, depth-based terms faded by distance, footprint-matched sky mips. Fixing one cause and stopping is the plausible wrong fix: the next change re-exposes another. |
| Muddy horizon with no wave texture | Detail faded without handing slope variance to roughness; the footprint ignores the view slant | Roughness and slope view at the horizon | Hand the lost slope variance to roughness. Use the slanted footprint. |
| No reflection of the ship or buildings | Only the sky is reflected | Look at the waterline | A planar mirror render of the scene, clipped at the waterline, integrated over the slopes |
| Waves look like a water-park chute or a curved sheet | A shaped surface with no water-body physics | Cross-section | Thickness, crest translucency, a textured face, the life cycle |
| Waves look frozen | The shape is static and only the texture scrolls | Watch the crest | A time-evolving lip, then crash, then subsidence |
| A view-dependent boundary on the water | Screen-space refraction or reflection running out of data | Tilt the camera: the boundary moves | Guard band, and fallbacks that match the missing data (`env-temporal-stability`) |

## Verification

- A per-term breakdown at the hero view (reflection, glitter, refraction and body, foam) against the reference.
- Region crops: glitter path, deep water, shallows, horizon.
- The horizon check: `measure.py --stripes` clean on grazing views from three or more heights, toward and away from the sun.
- Grazing and high views: no banding, no repetition.
- A motion capture: waves evolve, foam lives and decays, reflections update every frame.
- The CPU reference statistics matching one GPU frame.

## Example

- **[examples/fft-ocean/spectrum.mjs](examples/fft-ocean/spectrum.mjs):** the physics core as a CPU reference: JONSWAP with a fetch cap, spreading, disjoint cascades, a Hermitian h(k,t), a 2D inverse FFT for height and slopes, and Hs plus slope variance against Cox–Munk. `--self-test` checks reality, Parseval, a fully developed sea and slope bounds. Use it to set up the cascades and validate the GPU version.

## References

- [references/fft-ocean.md](references/fft-ocean.md): cascades, the GPU FFT pipeline, choppiness, footprint fading.
- [references/water-shading.md](references/water-shading.md): the shading terms and how to integrate them.
- [references/bounded-water.md](references/bounded-water.md): pools, rivers, fountains, caustics, guard bands.
- [references/breaking-waves.md](references/breaking-waves.md): surf, breakers, the life cycle and spray.
