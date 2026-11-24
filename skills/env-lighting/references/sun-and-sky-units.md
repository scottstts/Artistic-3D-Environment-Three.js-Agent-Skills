# Sun and sky in shared units

## Physical anchors (clear sky)

Values from `scripts/sun-sky.mjs`:

| Sun elevation | Direct normal (W/m²) | Diffuse horizontal (W/m²) | Diffuse/direct | Lit:shade, up-facing surface |
|---|---|---|---|---|
| 70° | about 940 | about 90 | about 0.10 | about 11:1 |
| 45° | about 860 | about 100 | about 0.12 | about 7:1 |
| 18° | about 620 | about 90 | about 0.15 | about 3:1 (sun-facing walls about 15:1) |
| 10° | about 430 | about 60 | about 0.14 | about 2:1 (sun-facing walls about 15:1) |

The ratios are what matter, more than the absolute values. Haze raises the diffuse share. An overcast sky has no direct sun at all.

## Mapping to three.js

- **`DirectionalLight.intensity = S`**, in three.js's physical units (illuminance-like). Choose S, then set exposure so the sunlit albedo lands where the reference has it.
- **Sky fill:** an up-facing surface should receive about S × (diffuse/direct) from the sky.
  - For a uniform sky of radiance L, the irradiance is π·L, so L ≈ S × ratio ÷ π.
  - With an HDRI as `scene.environment`, scale `environmentIntensity` so an up-facing white swatch in shade measures that irradiance. Measure, don't trust the file's own scale.
  - A `HemisphereLight` used as fill follows the same rule, plus a ground colour from the actual ground's albedo times its irradiance.
- **Colour:**
  - the sun's colour from transmittance: about 5500–6000 K high, warm orange near the horizon;
  - the sky fill from the sky model's colour: blue at high sun, warmer at sunset.

  The warm-and-cool split in lit versus shade comes from this, not from a grade.

## Checking

- **A grey card (albedo 0.18) and a white sphere** placed in the scene:
  - lit versus shaded card ratio against the table above;
  - the sphere's terminator falls at the sun direction;
  - shade colour on the white sphere is blue-ish from the sky, never neutral grey or black.
- **Against the reference:** the brightest sunlit stone value and the lit:shade ratio on a matching surface pair.

## Deliberate deviation

A stylized reference may hold the sky down, raise fill, or push the warm/cool split. Start from the physical values, then deviate by a measured amount toward the reference. Say what deviates and by how much.
