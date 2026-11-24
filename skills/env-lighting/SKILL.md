---
name: env-lighting
description: "Lighting a 3D environment — one sun solved from the reference, sun and sky in physical proportion, HDRI as fill only, designed key/fill structure, practical and emissive lights, character lighting, and art-directed deviation done with lights. Load when setting up or fixing lighting, and when a scene looks flat, overcast, foggy, front-lit, \"like no light is shining on it\", when the sun and shadows disagree, when a light source sits in an unlit world, or when a character is lit badly."
---

# Lighting

## Owns

Direct light (sun, moon, practical lights), the sky and image-based fill, the key-to-fill structure, emissive sources lighting their surroundings, and art-directed light. Shadows, AO and indirect light are owned by `env-shadows-ao-gi`. The visible sky is owned by `env-sky-atmosphere-clouds`. The final tone and grade are owned by `env-image-and-grade`.

## Standard

**One sun.** The visible disc, the light direction, every shadow, every light patch and the sky glow agree, from every angle. Define the direction once and derive everything from it. Check with a mirror sphere and a vertical stick in the scene.

**Solve the sun from the reference,** never guess it ([references/solve-sun-from-reference.md](references/solve-sun-from-reference.md)):

- which faces are lit;
- which way cast shadows run;
- shadow lengths against heights;
- where the glow sits.

A sun put behind the camera to "light the front" usually contradicts the reference and flattens everything.

**Sun and sky in physical proportion** ([scripts/sun-sky.mjs](scripts/sun-sky.mjs), [references/sun-and-sky-units.md](references/sun-and-sky-units.md)):

- The sun is a real shadow-casting light. Its colour comes from atmospheric transmittance: a low sun is warm.
- The sky fill (HDRI or sky-model image-based light) is in proportion to the sun: a clear-sky diffuse/direct ratio of about 0.1–0.2.
- Ambient too strong against the sun is the most common cause of an overcast look.

**HDRI is image-based light only** ([references/hdri-handling.md](references/hdri-handling.md)):

- It gives diffuse fill and specular reflections, aligned to the sun's direction.
- It never acts as a second, shadowless sun: remove or account for its sun energy, because environment prefiltering spreads a bright sun into a broad glow with no shadow.
- It is never visible as the sky.
- It is not global illumination: it knows nothing about occlusion or bounce (`env-shadows-ao-gi`).

**Light is designed.**

- Every form has a lit side and a shadow side. The key comes from where the reference puts it, so forms model with terminators.
- Light enters through real openings: light patches on a floor need holes that make them.
- The key-to-fill ratio, the warm-and-cool split, the veil and the strength of the bloom *(reference decides)*. Measure them. Never flatten light the reference renders strongly.

**Emitters light their surroundings.**

- Lanterns light the stone around them. Glowing water lights the rocks beside it. A hologram lights the ground under it.
- Reflections of a source come from its real extent, not one proxy point.
- No light source sits in an unlit world.

**Characters** are lit as a cinematographer would light them:

- the key from above and to the side;
- fill soft and lower;
- a rim to separate them from the background;
- never from below unless the scene's real source is below: under-lighting a face reads as horror;
- characters receive the scene's shadows. A self-lit fill that makes a figure ignore shadows is banned.

**Art direction uses lights, subtly, and only to resolve a real conflict.**

- Never key or tint pixels.
- Never add per-material fake lights or self-lit fills.
- No shadow-only proxies or no-cast exemptions that only work from the hero angle.
- If the reference's light is physically impossible, find the physically consistent setup that gives its look from the hero view: another sun position, an opening, a real bounce.
- For a stylized reference, deviate deliberately, and check the deviation still holds when the viewer orbits (`env-reference-reading` → style decides method).

**Always a defect:**

- The visible sun, the light direction, the shadows and the light patches disagreeing.
- Light patches with no physical cause.
- A washed-out or overcast look the reference doesn't have.
- A colour cast on whites.

## Procedure

1. **Solve the sun** (direction, elevation) from the reference's evidence. Put it in one place in code.
2. **Set the sun's intensity and colour.** Run `sun-sky.mjs <elevation> <intensity>` for the physical sky fill. Set the HDRI or sky-model image-based light so an up-facing surface gets about that irradiance. Remove the HDRI's sun.
3. **Light the scene with sun and sky only.** Render a clay view. Check:
   - every form models;
   - shadows fall where the reference has them;
   - lit-to-shade ratios against the reference (a grey card and a white sphere in the scene help).
4. **Add practical and emissive lights** where the scene has sources, with plausible falloff and shadows where they matter ([references/practical-and-emissive.md](references/practical-and-emissive.md)).
5. **Measure against the reference:**
   - the brightest sunlit value;
   - the lit-to-shade ratio;
   - shade colour (how blue);
   - black level;
   - saturation;
   - where light patches fall.

   Diagnose gaps with [references/flat-or-overcast-diagnosis.md](references/flat-or-overcast-diagnosis.md). Fix them at the light, not the grade.
6. **Art-direct only what physics can't reach,** with lights, subtly. Check the result from orbit views.
7. **Verify direction agreement:** a mirror sphere, stick shadows, and a view toward the sun with a shadow-casting object in frame.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| Flat, nothing models | The sun is behind the camera (front light), or ambient swamps the sun | Clay view: no terminators | Re-solve the sun from the reference. Cut the fill to a physical ratio. |
| Overcast look on a sunny reference | The sun/sky ratio is arbitrary; the HDRI contributes a second, shadowless sun; there's a veil | Measure the brightest lit stone and the lit:shade ratio against the reference | Sun and sky from one model. Remove the HDRI's sun. Audit the veil. |
| The user says the lighting is completely off | The key is on the wrong side: front-lit versus backlit | Which faces are bright in the reference? (Up-facing ones mean the sun is ahead.) | Move the sun to the solved position, and accept physically consistent consequences |
| Shadows point toward the sun | The shadow caster is a fake key light, not the visible sun | A stick shadow next to the sun disc | The sun is the only shadow caster. Fill casts nothing. |
| Light spots with no source | Fill lights or patterns with no physical cause | Trace each spot to an opening | Remove them, or build the opening that makes them |
| A creepy statue face | Lit from below | Look at the light positions | Key from above and to the side |
| A figure ignores shadows | A self-lit or per-material fill | Move it into shade | Remove the fill. Light the figure with scene lights. |
| A bright source in an unlit space | An emissive material with no light | Look at the surroundings | Add a real light at the source, with falloff and a bounce probe |
| Sun and shadows decoupled when orbiting | No-cast exemptions or shadow-only proxies faking the reference from one view | Orbit, look up at the sun | Remove the exemptions. Find a consistent sun that gives the look. |

## Verification

- A mirror sphere and stick-shadow check: one direction everywhere.
- A clay render, sun only and then sun plus sky: forms model, shadows land correctly.
- Measurements against the reference: brightest lit value, lit:shade, shade colour, black level, saturation.
- Orbit views: no art-directed trick breaks.
- Close-ups near every emitter: the surroundings are lit by it.

## References

- [references/solve-sun-from-reference.md](references/solve-sun-from-reference.md): reading the sun's direction from an image.
- [references/sun-and-sky-units.md](references/sun-and-sky-units.md): physical ratios and how to map them to three.js.
- [references/flat-or-overcast-diagnosis.md](references/flat-or-overcast-diagnosis.md): a measured checklist.
- [references/hdri-handling.md](references/hdri-handling.md): HDRI as fill: aligning it and removing its sun.
- [references/practical-and-emissive.md](references/practical-and-emissive.md): lanterns, windows, glowing materials, holograms, characters.

## Tools

- **[scripts/sun-sky.mjs](scripts/sun-sky.mjs):** clear-sky direct and diffuse light, and their ratio, for a sun elevation (valid from about 10° to 90°), plus the matching sky-fill setting for a given sun intensity. Run `--self-test` to check it.
