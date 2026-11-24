# Atmosphere

## Sky model

- **Minimum:** single scattering of Rayleigh (molecules, λ⁻⁴, giving the blue) and Mie (aerosols, forward-peaked, giving the white glow around the sun), integrated along the view ray with the optical depth toward the sun at each sample.
- **Better:** a precomputed multiple-scattering model (transmittance, multiple-scattering and sky-view lookup tables). It gives correct twilight, horizon brightening and an earth shadow.
- **Bake** the sky into an environment map for reflections and image-based light whenever the sun moves. Remove the sun disc from that map: it is handled by the directional light and glitter terms.

## Sun

- **Disc:** an angular diameter of 0.53°, with limb darkening (darker, redder edge).
- **Its colour comes from transmittance** along the path through the air. A low sun is genuinely warm, without tinting by eye.
- **Aureole:** Mie forward scattering gives a bright glow a few degrees across, which hazy air strengthens. Fit its falloff to the reference by measuring brightness at several radii from the disc. Common errors are too wide (a milky half of the sky) and too narrow.
- **Lens glow** (veiling glare) is separate, in post (`env-image-and-grade`). Don't double-count it.

## Shared units

The sun's illuminance and the sky's radiance come from the same model. Then their ratio, which decides whether a scene reads as sunny or overcast, is physical: a clear sky gives diffuse/direct ratios of about 0.1–0.2 at mid-to-high sun elevations. `env-lighting` → `scripts/sun-sky.mjs` gives the ratio for any elevation.

## Aerial perspective

```
L_seen = L_object · T(d) + L_inscatter(d)
T(d) = exp(−∫ σ_ext ds)      // along the view path, by altitude
```

- **In-scatter** uses the same phase functions: warm toward the sun, blue elsewhere.
- **Apply it per pixel** from depth, or with a froxel or volume texture. Mountains, towns and sea fade into the horizon colour of their direction.
- **Exclude the sky itself** (depth = far), but avoid a hard edge at the sky boundary. Anti-aliased silhouettes mix sky and object, so blend by coverage, not by a single depth sample.

## Veil audit

List every term that lifts blacks or greys the image:

- distance fog;
- height fog or mist;
- cloud ambient haze;
- bloom and glare;
- the grade's black lift.

Measure the darkest 1% of the frame and the contrast of near objects against the reference. Turn each term off in turn to see its share. Remove what the reference doesn't have.
