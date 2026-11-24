# Motion

## Secondary motion

Subtle motion makes a scene feel alive: foliage swaying, water moving, flags, slow swimming, drifting clouds, flickering flames. Include it where the reference implies it, keep it subtle, and keep it physically driven:

- **Wind:** foliage (`env-vegetation` → wind), cloth, flags, smoke, water ripples all agree on direction and gust timing.
- **Water:** spectral or simulated, never a scrolling texture.
- **Clouds:** drift slowly with the wind and evolve their shape.
- **Fire, emissives:** flicker by physics (turbulent flame), never a random strobe.
- **Creatures:** gait and swim cycles with weight, at a cadence natural for their size.

## Plausibility

- **Gravity and support:** subjects stay upright. Resting things stay put. Thrown things follow ballistic arcs.
- **Contact:** nothing interpenetrates at any moment. Check numerically over the full range: per-frame clearance with `env-geometry-audit`. Don't tune just to make the audit pass.
- **Timing:**
  - a crashing wave resolves in about a second;
  - a lane change on an empty road is a slow drift, not a yank;
  - a breaking curl is fast;
  - a giant moves slowly.

  Use the real timescale for the size.
- **Smoothness:** camera and object motion use continuous curves (eased, critically damped springs). No jitter, no velocity spikes, no frame-rate dependence: integrate with dt, clamped against hitches.

## Loops

- Make a loop seamless in every channel: position, phase of every oscillator, procedural noise time, foam and wetness history, and the wrap of all lookups.
- An "infinite" motion (endless road, endless surf) moves the world, not the camera, past a fixed frame. Vary its content so the repetition never reads.
