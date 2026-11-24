# Camera solve: geometry and practice

## Model

A pinhole camera at height `h` above flat ground, pitched by `θ` (positive looks up), with roll `ρ` and a focal length `f` in pixels. Vertical FOV = `2·atan(H / 2f)`.

- **Horizon:** the image of eye level. With no roll, it sits at row `cy + f·tanθ`. So the horizon below the image centre means the camera is pitched up.
- **Ground point:** a pixel below the horizon casts a ray that meets the ground at a distance that grows to infinity at the horizon.
- **Known height:** an upright object of height `H_obj` standing on the ground, with base row `v_b` and top row `v_t`. At zero pitch, `H_obj / h = (v_b − v_t) / (v_b − v_h)`. With pitch the relation is non-linear, which is why the script solves the full model by least squares.
- **Verticals** converge to a vanishing point at row `cy − f / tanθ` (upward pitch puts it far above the frame). Their convergence fixes `f` and `θ` together.
- **Two perpendicular horizontal directions** give vanishing points `p1` and `p2`. Their back-projected rays are perpendicular, which fixes `f`.

## Cue quality, best first

1. Several objects of known height at different depths: they fix scale, pitch and partly `f`.
2. Two perpendicular vanishing points (street grids, building corners): they fix `f`.
3. Long vertical edges near the frame sides: they fix `f` and `θ`.
4. A clean sea horizon: it fixes `θ` and roll.
5. An eye-height prior, alone: scale only, and weak.

Measure on the full-resolution reference. Tap the base of an object where it actually meets the ground, not where its shadow ends.

## Diagnosing a bad solve

| Sign | Likely cause |
|---|---|
| RMS residual high, dominated by one object | The object isn't standing on the visible ground, or its height is wrong (a "door" that is a gate) |
| FOV jumps between widely different values across starts | Too few cues constrain `f`. Add verticals or perpendicular vanishing points. |
| The solved horizon disagrees with the visible horizon | Terrain isn't level (a sloping street), or the sea horizon is hidden by haze. Use only cues on the same ground plane. |
| AI-generated reference with inconsistent perspective | The image has no single camera. Weight the signature region's cues, and accept differences elsewhere. |

## Sloped or stepped ground

The script assumes one flat ground plane. For a street that climbs:

- solve using cues on the near, level part only;
- place later landmarks by back-projecting to the known plane they stand on (a terrace height, a stair landing), not to `y = 0`.

## Solving by hand (quick check)

Pitch about zero, horizon at row `v_h`, a person 1.7 m tall standing with feet at `v_b` and head at `v_t`:

- `h ≈ 1.7 · (v_b − v_h) / (v_b − v_t)`;
- distance ≈ `f · h / (v_b − v_h)`.

If two people at different depths give the same `h`, the horizon is right. Use this to sanity-check the script.
