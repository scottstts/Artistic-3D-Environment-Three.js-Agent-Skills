# Transparent and translucent media

## Physics to model

- **Fresnel:** reflectance rises from F0 at normal incidence to 1 at grazing angles (Schlick is fine). The edges of glass and water reflect more.
- **Refraction:** Snell's law with the material's IOR. The view through thick glass shifts and inverts. Total internal reflection at steep internal angles.
- **Absorption (Beer–Lambert):** transmitted = exp(−σ · distance). Thin edges stay nearly clear, and thick bodies darken and tint. Set σ from the colour the material should have at a reference thickness, then check it at the real thickness. A tint chosen on a 1 cm sample compounds over metres of crystal to near black.
- **Dispersion:** IOR varies with wavelength. Strong in diamond and strontium titanate, weak in glass. Gives fire: coloured flashes on facets aligned with a bright source.
- **Scattering:** frosted, milky or included media scatter light inside. Forward scattering spreads light through the body.

## Real-time approaches

| Need | Approach |
|---|---|
| Panes and thin glass | `MeshPhysicalNodeMaterial` with transmission, thickness and IOR. Reflection of the real environment. Thin panes refract little. |
| Thick glass and crystal bodies | Screen-space refraction of the opaque scene, plus per-wavelength refracted lookups for dispersion, plus internal bounces against the back faces (depth-peeled layers), plus Beer–Lambert by traced thickness |
| Gems | Analytic or traced internal multi-bounce in the faceted geometry, with dispersion |
| Rainbow patches thrown onto other surfaces | Those are dispersive caustics. A shader that traces only from the eye can't produce them. Trace light from the sun through the stones at several wavelengths and splat the arrivals into a light map (bake it if static). |
| Ice | IOR 1.31, slight blue absorption, internal bubbles and fractures as real geometry or volume texture, frost as surface roughness |
| Translucent leaves and petals | A back-face transmission term coloured by the leaf. Light shows through when backlit. |

## Failures

| Symptom | Cause | Fix |
|---|---|---|
| Glass looks like a hologram | Additive emission or alpha blending instead of refraction | Refraction, Fresnel and absorption |
| Clouds or sky show through the bottom of a glass deck | Refracted rays fall below the frame, and the fallback samples a probe without the scene in it | Render internal buffers with a guard band (about 15–20% wider) and crop. Fall back gracefully toward the pixel's own position. |
| A trail at the frame edge while moving | Same cause, smeared by temporal blending | Guard band. No history in the band. |
| Milky glass | Reflections from screen space reading what lies behind the glass instead of what is reflected | Reflections from probes or real reflection renders, never from the refraction buffer |
| No fire | The sun is seen as a tiny disc that few facets catch; the lobe is too broad | Include the sun's aureole in the light the crystal sees. Narrow the scattering lobe. Add facets. |
