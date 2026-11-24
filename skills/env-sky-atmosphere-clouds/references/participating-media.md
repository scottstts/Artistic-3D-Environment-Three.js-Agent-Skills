# Participating media in space

## Principle

Mist, fog, haze, god rays, smoke and fire are volumes at real positions in the world. They are lit by the scene's real lights, with shadows, and composited by depth. They are never screen-space overlays, flat sheets or painted streaks.

## God rays (crepuscular rays)

- Sunlight scattered by thin haze. Each sample along the view ray is shadowed by the scene (the sun shadow map) and by the clouds (cloud density or a cloud shadow map).
- The phase function (Henyey–Greenstein, forward) makes rays strongest looking toward the sun.
- **Visible only where the reference has them,** and only as strong as it shows. Rays without a real gap in the occluders are fake.
- **Cost:** half-resolution marching with a per-pixel offset, then a bilateral upsample. Fixed per-pixel dither can leave a static texture in the glow: vary the offset over frames, or blur it bilaterally.

## Mist and fog banks

- Height fog with a density falloff by altitude, plus local volumes: mist in gorges, at waterfall feet, over water at dawn.
- Placed in space. When computed along a single ray direction instead of in space, mist becomes a flat veil.
- **Lit by the sun with shadows,** forward-scattering toward the sun, and coloured by the sky in shade.
- **Edges:** soft and noisy at the volume scale. Never a visible sheet or quad.

## Smoke

- A volume (a simulated or procedural density field) advected by wind, rising by buoyancy, spreading and thinning.
- Lit by a march toward the light, with self-shadowing. Dark smoke absorbs; light smoke scatters.

## Fire

- An emissive volume whose temperature maps to blackbody colour, under turbulent flow. Flames are thin, bright sheets with smoke above them.
- It lights its surroundings: a flickering point or area light with shadows, placed at the flame.
- No sprite-sheet fire in a realistic scene.

## Spray, splash, dust and specks

Real particles in the world: drops, dust motes, plankton and bubbles underwater. They are lit by the scene, depth-tested, and motion-blurred. Drawn circles or screen-space specks are stand-ins.
