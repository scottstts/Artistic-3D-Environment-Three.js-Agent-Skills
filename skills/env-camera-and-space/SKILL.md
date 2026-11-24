---
name: env-camera-and-space
description: "Solving the camera (lens/FOV, pitch, eye height) and the true layout and scale of a scene from a reference image, then building a level, true-shaped world that lines up with it. Load when starting a recreation, when the build \"looks wide-angle\", \"too shallow\", \"like a narrow alley\", or \"not spacious like the reference\", when positions/orientations/scale don't match, or when tempted to bend geometry to fit the frame."
---

# Camera and space

## Owns

Solving the lens, pitch, roll and eye height from the reference. Back-projecting landmarks to world positions and sizes. Keeping the world level, plumb and true-shaped while it lines up with the reference.

## Standard

**Always a defect:**

- Bending, shearing, tilting or deforming geometry so one frame matches. That includes buildings deformed to match silhouettes, a circle squashed into the ellipse it appears as, and a road curled into a ring.
- Placing elements by eye when they could be measured.
- Repeated elements that should match but don't: one arcade with arches of different radii, bays with different rhythms.
- A FOV that changes during the session. The lens solved for the hero view stays fixed unless the user asks for a different one.

**Default method:**

- Solve the camera numerically from cues, using [scripts/camera-solve.mjs](scripts/camera-solve.mjs).
- Default to a normal or slightly long lens: roughly 35–55 mm full-frame equivalent. Leave that range only when the cues prove it: verticals that converge strongly, or near and far objects of one type whose sizes differ a lot. Wide-angle builds that read as cramped are the common failure.
- Back-project every landmark to a world position, height and width, and build the blockout from that table.
- Build the world level and plumb, with true circles, straight runs and consistent repeats. Then accept the small differences from the reference that keeping true shapes causes, and state them.

**What the reference decides:**

- Where the camera stands and where it points.
- How spacious the place is.
- The heights of storeys, doors and people.

All of these are measured from the reference, never assumed.

## Procedure

1. **Mark cues on the reference**, using pixel coordinates of the full-resolution image:
   - **The horizon (eye level):** where parallel horizontal lines converge, a sea horizon, or the vanishing points of two horizontal directions.
   - **Upright objects of known height standing on the ground:** base pixel and top pixel. People are about 1.7 m, doors 2.0–2.4 m, storeys 3–4 m, balusters about 0.9–1.1 m, steps about 0.15–0.18 m. More in [references/scale-cues.md](references/scale-cues.md).
   - **Vertical edges:** two points on each. Their convergence fixes pitch and focal length together.
   - **Vanishing points of two perpendicular horizontal directions**, if the scene has them. These fix the focal length directly.
2. **Run the solve:** `node scripts/camera-solve.mjs cues.json`. Read the output:
   - FOV;
   - 35 mm equivalent;
   - pitch, roll and eye height;
   - RMS residual: under about 3 px on a 2K image means the cues agree;
   - each landmark's ground position.

   If the residual is high, one cue is wrong or one "vertical" isn't vertical. Remove the cues one at a time to find it.
3. **Make the landmark table:** for each element, its world position, width, height and orientation. Get orientation from where its horizontal edges converge: an element whose eaves meet the lane's vanishing point is parallel to the lane.
4. **Build the blockout from the table**, at true sizes, level and plumb. Repeated elements come from one definition.
5. **Overlay the blockout on the reference** at the solved camera. List each mismatch with its cause:
   - **a wrong cue:** fix the cue and re-solve;
   - **a wrong reading** of what the element is or where it stands: re-read it (`env-reference-reading`);
   - **a true-shape trade-off:** accept it and state it.

   Never fix a mismatch by deforming geometry.
6. **Check spaciousness:**
   - Compare the open ground in front of the camera, and what stands at each edge of the frame, with the reference.
   - Nothing should stand beside the viewer that the reference doesn't show.
   - If the build reads tighter than the reference, the distances or the FOV are wrong. Fix the solve, not the props.
7. **Lock the lens.** Every later view uses the same FOV.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| Looks wide-angle, or "like a narrow alley" | The FOV was guessed too wide, and the camera placed too close to compensate | Solve from cues and compare the FOV | Re-solve. Move the camera back with a narrower lens. Clear walls the reference doesn't show beside the viewer. |
| Scene too shallow | Distances guessed, not derived from objects of known size | Back-project the objects of known size | Rebuild depth from the landmark table |
| Buildings look "weirdly shaped" | Geometry deformed to match silhouettes | Measure a building: are its walls not plumb, its plan not square? | Rebuild true shapes. Re-solve the camera so the silhouettes line up. |
| An element "diagonal" when it should be parallel | Orientation guessed from its silhouette | Its eaves' vanishing point differs from its neighbours' | Align it with the vanishing point it shares with its neighbours |
| The ring reads flatter, or sits lower, than in the reference after the world was made level | A true trade-off: the reference is internally inconsistent | Re-solve: the residual stays high whatever you do | Accept the trade-off, and state it in one line |
| Arches in one run have different radii | Each built ad hoc | Measure them | Build from one definition, with the count and span taken from the reference |

## Verification

- A solve report: FOV, 35 mm equivalent, pitch, roll, eye height, and residual.
- The landmark table.
- The blockout overlay at the reference camera, with the list of mismatches and the cause of each.
- A plan view from above: circles round, runs straight, repeats regular.
- At least two orbit views: level floors, plumb walls.

## References

- [references/camera-solve.md](references/camera-solve.md): the geometry behind the solve, cue quality, and solving by hand.
- [references/scale-cues.md](references/scale-cues.md): real sizes of common objects.
- [scripts/camera-solve.mjs](scripts/camera-solve.mjs): the solver. It has no dependencies; run `--self-test` to check it.
