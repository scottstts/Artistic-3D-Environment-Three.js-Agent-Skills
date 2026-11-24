---
name: env-sky-atmosphere-clouds
description: "Building the visible sky, the sun disc and glow, aerial perspective and haze, volumetric clouds (cumulus, cloud seas, cirrus, storm decks), cloud shadows, and participating media placed in space (mist, fog banks, god rays, smoke, fire). Load whenever a scene shows sky or clouds, and when clouds look like cotton balls, solid blobs, waxy shells, sliced plateaus, grainy, banded or fabric-like, when the sky looks fake or flat, when haze looks like a veil, or when god rays or fog look painted."
---

# Sky, atmosphere and clouds

## Owns

Everything the viewer sees of the air: the sky, the sun's disc and glow, haze and aerial perspective, clouds, and the media placed in space. How the sun and sky light the scene is owned by `env-lighting`, which shares this skill's atmosphere model.

## Standard

**The sky is built.** An HDRI is for illumination only, never a visible backdrop. The visible sky is a sky model: single scattering with a sun term at minimum, or a multiple-scattering lookup-table model. It is in the same units and the same sun direction as the scene light.

**The sun:**

- **A physical disc** (0.53° across) with limb darkening, plus a narrow aureole from aerosol forward scattering.
- **Glow size from the atmosphere:** match how fast the glow falls off with distance from the disc to the reference, by measurement.
- **No painted sunbursts or rays,** unless the reference is a lens-flare image (`env-image-and-grade`).
- **The sun is visible where the reference shows it.** Clear cloud from the line of sight in the cloud coverage itself, not with a view-dependent cheat.

**Aerial perspective:**

- **Computed from the same atmosphere model:** extinction along the view path, plus in-scattered light. Haze is sun-coloured toward the sun and sky-coloured elsewhere. Distant landforms take the horizon colour of their direction (`env-world-completion`).
- **How much haze** *(reference decides)*. Add none the reference doesn't have.
- **Audit the veil:** distance fog, mist volumes, haze in the cloud lighting and glare bloom must not stack into a grey film. Check each one's contribution separately.

**Clouds are volumetric by default.**

- **Rendering:** ray-marched density from a weather or coverage field, shaped by height profiles and eroded by 3D noise. Lit by marching toward the sun, with forward-scattering phase (Henyey–Greenstein, dual-lobe), powder darkening and multiple-scattering approximations. Silver linings and lit tops with shaded hollows emerge from that lighting.
- **True scale and placement:** cumulus at real sizes and altitudes. Bases meet what they rest on. A sea fog bank's widest point sits low, so it bulges only metres past its foot.
- **They cast shadows** on the ground and the water: march toward the sun through the density, or use a cloud-shadow map.
- **They extend past the horizon** with no visible layer edge.

**Banned stand-ins:**

| Stand-in | Why it fails |
|---|---|
| Cotton balls (stacked spheres or round puffs) | No billow structure, no lit/shaded volume |
| Solid-shaded shells (waxy surface clouds) | Light doesn't penetrate the heads or die in the creases |
| Flat white plateaus (a cloud deck sliced at a ceiling) | Reads as fog, not cloud |
| Sprites or billboards | Break on orbiting, and sort wrongly |
| Painted god-ray bursts | Physical rays come from shadowed in-scattering |
| A flat fog-colour sheet standing in for a cloud floor | No form at all |
| A glowing orb hidden inside a cloud ("sky glow") | Reads as an object. A glow belongs to the sky gradient itself. |

**Participating media in space:** mist, fog banks, god rays, smoke and fire are volumes in world space, shadowed by what stands in the light. God rays are sunlight in-scattered by haze, with each sample shadowed through the sun's shadow map or the cloud density. Never screen-space smears or flat sheets.

**Always a defect:**

- Visible grain or noise.
- Banding or stair-steps.
- A dark grid from amortised tracing.
- Fabric-like patterning.
- A hard edge where the march runs out of steps.
- Trails or smears when the camera turns.
- Popping as the camera moves.

## Procedure

1. **Read the sky in the reference:**
   - the sun's position (often from shadows, see `env-lighting`);
   - the sky gradient (zenith colour, horizon colour);
   - the haze amount;
   - each cloud type, altitude, coverage and lighting (tops lit, bases shaded);
   - the glow profile around the sun.
2. **Build the sky model,** in the units shared with the scene light. Match the gradient and the sun glow by region measurement.
3. **Plan the cloud march** with [scripts/march-plan.mjs](scripts/march-plan.mjs):
   - layer heights, eye height, feature size;
   - bound the step length at every elevation;
   - decide where to stop marching and continue with a baked far layer.
4. **Build the clouds:**
   - a coverage or weather field shaped to the reference's placement (back-project the positions of large masses);
   - height profiles per type;
   - eroding noise at enough resolution for the feature size;
   - lighting with a sun march, phase functions and ambient from the sky.
5. **Hide the remaining noise correctly:**
   - a per-pixel start offset (interleaved gradient or blue noise), averaged over frames only where it is stable;
   - a full-quality path with no amortisation for stills;
   - a soft fade where a ray runs out of steps, never a snap.
6. **Cloud shadows** on the terrain and water.
7. **Aerial perspective** on the scene, from the same model. Then audit the veil.
8. **Check:**
   - the hero view against the reference: sky crops, cloud crops, sun glow profile;
   - looking up, looking toward and away from the sun, low over the horizon;
   - a fast camera turn, for trails, grids and grain.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| Cotton-ball clouds | Spherical puffs, no erosion, no sun march | Look at a single cloud in isolation | Coverage field, height profile, eroding noise, sun-march lighting |
| Clouds look like solid objects | Density too high or shaded at the surface. No translucent edges. | Edge profile | Lower edge density, a ramp at the edges, real light penetration |
| A flat white plateau over the clouds | The deck clipped by a ceiling | View over the deck | Put the deck below the ceiling. Let the billows form the surface. |
| Stair-steps and streaks near the horizon | Step length grows to hundreds of metres | `march-plan.mjs` | Bound the step length. Fade into a baked far layer. |
| Banding on grazing cloud surfaces | Coarse steps without jitter | Freeze jitter: the bands appear | A per-pixel start offset, then averaged |
| Grain that never settles in motion | Jitter averaged by temporal accumulation, which can't converge while moving | Move the camera | More samples, a denoise or bilateral upsample, and a full-quality path |
| A dark grid in the clouds | Amortised tracing (1 pixel in N per frame); untraced pixels from a mismatched fallback | Freeze the frame and look at the pattern | Fill untraced pixels from the current low-resolution trace, not a stale cube. Reproject properly. Full-quality path for stills. |
| Slanted stripes after turning | Newly revealed pixels filled from the previous direction's trace | Turn the camera | Fill disocclusions from a direction-correct source (a baked full-quality sky cube) |
| Fabric-like pattern at grazing angles | A long grazing march through a thin layer, under-sampled | View the layer edge-on | Remove or thicken the layer, add steps along grazing paths, or bake it |
| Clouds hover above the sea | The widest point sits high and the underside curves inward | A low view across the water | Bases meet the surface: widest point low, little overhang |
| Foggy, grey, flat scene | Fog, mist, cloud haze and glare stacking into a veil | Toggle each one | Cut each back to the reference's measured haze |
| The sky looks fake | A gradient painted by eye, not from a model. The sun glow is the wrong size. | Measure the glow's falloff and the gradient against the reference | A physical sky model in shared units, with the glow width matched by measurement |

## Verification

- Sky and cloud region crops against the reference: colour, gradient, sun glow at 10, 50, 90 and 140 px from the disc.
- `march-plan.mjs`: no banding risk at any elevation.
- Views up, toward the sun, away from it and along the horizon: no layer edges, no bands.
- A fast-turn capture: no grain, grid, trail or popping.
- Cloud shadows visible on the ground and water, matching the clouds above.
- A veil audit: each haze source's contribution measured, and the total matching the reference.

## References

- [references/atmosphere.md](references/atmosphere.md): the sky model, the sun disc and aureole, aerial perspective, shared units.
- [references/volumetric-clouds.md](references/volumetric-clouds.md): density, lighting, marching, cloud types, cost.
- [references/participating-media.md](references/participating-media.md): mist, fog banks, god rays, smoke, fire.

## Tools

- **[scripts/march-plan.mjs](scripts/march-plan.mjs):** path length and step length per view elevation for a curved cloud layer, with a banding-risk flag and the step count needed. Run `--self-test` to check it.
