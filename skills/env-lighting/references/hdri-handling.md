# HDRI as fill

## What it does in three.js

`scene.environment` gives two things:

- **Diffuse fill:** the sky's light from every direction, via the prefiltered irradiance.
- **Specular reflections:** what glossy surfaces reflect, via the prefiltered radiance mips.

It does **not**:

- cast shadows;
- know about occlusion: a loggia's interior gets the same sky as an open roof unless AO or probes occlude it;
- bounce light between objects.

So it is unshadowed sky light plus reflections, not global illumination.

## The second-sun problem

An HDRI's sun is a tiny, extremely bright region. Prefiltering spreads it into a broad glow that lights everything from the sun side, with no shadows. That flattens the scene and fills in the real sun's shadows.

**Fix:** remove the sun energy from the HDRI before use.

1. Locate the sun: the brightest region.
2. Measure how far its glow extends: the radius where brightness falls back to the plain sky level.
3. Replace that disc with the surrounding sky, at that radius or a little more.

The real `DirectionalLight` carries the sun.

## Alignment

Rotate the environment (`scene.environmentRotation`) so any remaining warm side of the HDRI lines up with the scene's sun azimuth. Never leave the fill's warm side opposite the sun.

## Below the horizon

Many HDRIs have ground below the horizon that doesn't match the scene: a parking lot under an ocean. Replace the lower hemisphere with a colour or a mirrored, darkened sky that matches the scene's real ground or water. Otherwise reflections and the upward fill carry the wrong ground.

## Calibration

Scale `environmentIntensity` so an up-facing shaded white swatch receives the physical sky irradiance for the sun's elevation (`sun-sky-units.md`). Measure it in the render, not by trusting the file's values.

## Never

- Visible as the backdrop: the sky is built (`env-sky-atmosphere-clouds`).
- Used as the only light in a sunny scene.
