# Lens and sensor traits

These are for photographic targets, or no reference. Each is subtle: the viewer should feel a camera, not see an effect.

| Trait | Physical cause | How | Limit |
|---|---|---|---|
| Lateral chromatic aberration | Different wavelengths magnified slightly differently | Scale the R and B channels radially by about ±0.05–0.2% from the frame centre | Invisible at the centre, faint fringes at the corners. Never a uniform RGB split. |
| Vignette | Light falloff toward the frame edges | Darken by radius with a smooth curve, slightly elliptical for wide frames | A gentle frame. Never a dark ring. |
| Sensor noise | Photon and read noise, stronger in shadows | Luminance-weighted noise: more in dark areas, little in highlights. Vary it per frame but with fine grain. | Must not crawl or form patterns. Never on top of render noise that is already visible. |
| Veiling glare | Scatter in the lens from very bright sources | A wide, low-energy bloom above a high threshold (see SKILL) | Must not grey the image |
| Halation | Light scattering in film or the sensor stack around bright edges | A faint warm halo on bright-to-dark edges | Optional. Only if the reference shows it. |
| Depth of field | Aperture | Only if the reference shows it. Computed from each pixel's true depth: emissive sprites carry their own depth. | No DOF in an all-in-focus reference |
| Motion blur | Shutter time | Per-object or camera blur at the reference's shutter (fast-moving water, jets, rotors) | Only for motion the reference implies |

## Never, unless the reference has them

- **Sunbursts and diffraction spikes:** they come from aperture blades and small apertures. Rare in the photographic look these scenes target.
- **Lens flares and ghost rings.**
- **Dirty-lens overlays.**
- **Heavy film grain** hiding render noise. Fix the noise instead (`env-temporal-stability`).
