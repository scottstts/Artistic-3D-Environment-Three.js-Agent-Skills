# How distant landforms read

## Shape

- **Ranges are massifs:** several summits joined by ridges and saddles, with gullies and spurs. Avoid single cones and noise spikes.
- **Ridge lines step down in layers** with distance. Each range is a separate silhouette.
- **The ground runs under the ranges and past them.**
- **Islands have irregular coastlines,** several uneven summits, bare rock on steep faces, cover on gentle slopes, and a shore.

## Backlit ranges (sun in front of the camera, low)

- **Darker than the sky behind them, never lighter.** The faces you see are turned away from the sun and lit only by the sky. They read as soft silhouettes.
- **Values step lighter with distance.** The haze between you and each range adds the colour of sunlit air. The nearest range is darkest, with the most contrast and some visible ridges and gullies. The farthest is barely separable from the sky.
- **The haze takes the horizon sky colour in each direction:** warm gold toward the sun, greyer or violet away from it. Never one fixed colour.
- **Crests facing the sun catch a thin warm rim.**

## Front-lit ranges (sun behind the camera)

- Lit faces carry real albedo, cooled and lifted by distance.
- Shadowed gullies stay distinctly darker than the lit faces until the far layers. Then haze closes the gap.
- Snow lies on ledges and low-angle faces, never on steep rock. It brightens toward the sun side.

## Side-lit

The terminator runs along every ridge. Lit flanks are warm, shaded flanks cool and lifted by sky light. This is the most legible light for relief. Don't flatten it with fill.

## Failures

| Symptom | Cause | Fix |
|---|---|---|
| Paper cut-out ranges, the same value as the sky | Front fill on backlit faces, or haze in a fixed beige | Remove the front fill. Take the haze colour from the horizon sky per direction. Thin the haze so the near range keeps contrast. |
| All ranges the same value | Haze not integrated by distance | Compute aerial perspective from distance with the same atmosphere model as the sky (`env-sky-atmosphere-clouds`) |
| Ranges look like cones | Shape field is a single radial falloff | Use ridged multifractal or erosion-like fields, with saddles between summits |
| Too smooth at the silhouette | Mesh band-limited to its vertex spacing | Denser mesh near the silhouette, or tessellation driven by screen-space error |
