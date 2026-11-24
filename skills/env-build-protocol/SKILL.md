---
name: env-build-protocol
description: "Entry point for building, rebuilding or continuing a 3D environment in three.js, especially from a reference image, clip or written brief. Load first whenever the task is \"recreate this scene\", \"build this world\", \"keep iterating until it matches\", or picking up an unfinished scene. Sets the phases, the gate each phase must pass, which skill owns each part of the standard, and what \"done\" means."
---

# Environment build protocol

## Owns

The order of work, the gate at the end of each phase, and the definition of done. Each phase hands the detailed standard to the skill that owns it.

## Standard

**The target:** a complete, coherent world that looks like the reference from the reference's viewpoint. It is not a prop set built for one frame. It is judged by orbiting it, inspecting it up close and watching it in motion. With no reference, it is judged as real footage of a real, well-designed place.

**Always a defect:**

- Work that passes only from the hero angle.
- A later phase polishing an earlier phase's errors. Light, materials and grade on wrong geometry are wasted work.
- Ten elements at 60%. Finish one element to standard before starting the next.
- Placeholder geometry left in what the viewer sees.
- A cheap stand-in kept because "it reads fine from here". Each owning skill lists the stand-ins it bans.
- Image quality cut to save cost. When a feature is too expensive, redesign it so it costs less and still reads as the real thing. See the cost section below.

**Default methods:** every owning skill states its own. They hold unless the user explicitly says otherwise. A stylized reference changes shading, light and grade. It never licenses dropping a method.

## Phases and gates

| # | Phase | Gate (evidence before moving on) | Owning skills |
|---|---|---|---|
| 1 | Read the reference | Every element named as what it physically is and where it lives. Structure and light direction decoded. Style category decided. | `env-reference-reading` |
| 2 | Interpretation sign-off | Written interpretation of the space and its structure. Approved by the user when the structure is ambiguous or they asked for it. | `env-reference-reading` |
| 3 | Camera and space | Lens, pitch and eye height solved. Landmarks back-projected to world positions with sizes. The world is level, plumb and true-shaped. Blockout overlaid on the reference. | `env-camera-and-space` |
| 4 | Clay structure | Every mass built in a single-sided clay view. Proportions, counts, orientations and junctions match the reference. Audit run. | `env-geometry-construction`, `env-geometry-audit` |
| 5 | Signature elements | Each signature element finished to standard, one at a time, before the next. | construction, `env-ornament-and-relief`, `env-vegetation`, `env-terrain-rock-ground`, `env-water` |
| 6 | Whole world | The world is complete to the horizon, at world scale. Nothing in a void. Seen from orbit views, not only the hero view. | `env-world-completion` |
| 7 | Integrity | The whole-scene audit is clean on everything visible. Each fix is checked visually. | `env-geometry-audit` |
| 8 | Look, layer by layer | Materials, lighting, shadows and AO, indirect light, sky and atmosphere, then image and grade. Each layer matches the reference by measurement before the next layer is tuned. | `env-materials`, `env-lighting`, `env-shadows-ao-gi`, `env-sky-atmosphere-clouds`, `env-image-and-grade` |
| 9 | Motion | Secondary motion is plausible. Nothing interpenetrates over the animation range. Everything is clean in motion. | `env-temporal-stability`, `env-vegetation` |
| 10 | Close-out | The comparison loop finds no visible mismatch worth fixing. An independent read of the top gaps has been done and acted on. The user says the look is done. | `env-look-iteration` |

Phases 8 to 10 loop. A new defect found in any phase sends work back to the phase that owns it.

## Procedure

1. **Before building anything:**
   - Load `env-reference-reading`. Read the whole reference, crop by crop.
   - Name the scene's signature elements: the two to five things that make the image what it is.
   - Write the interpretation. If the structure is ambiguous, stop for the user's sign-off.
2. **Solve camera and space** (`env-camera-and-space`). Build the blockout from back-projected landmarks, not by eye. Overlay it on the reference.
3. **Build structure in clay:**
   - Use a single-sided clay view: a double-sided view hides flipped faces.
   - Check from the reference camera, from at least four orbit views, and up close at the junctions.
   - Run the geometry audit (`env-geometry-audit`).
   - When the user asked for a structure-only pass, stop here for approval.
4. **Build the signature elements, one at a time, to standard.**
   - Treat each one as if it were the whole task.
   - Compare it region by region against the reference before moving on.
   - Use the owning skill's Standard section as the checklist.
5. **Complete the world** (`env-world-completion`). Invent what the reference doesn't show, out to the horizon, at full build quality.
6. **Run the audit pass** over the whole scene. Fix what is visibly exposed, at the generator that made it. Check each fix visually.
7. **Work through the look, one layer at a time, each with the reference beside the render:**
   1. materials: scanned PBR on everything;
   2. light: one sun, physical sun-to-sky ratio;
   3. shadows, AO and indirect light;
   4. sky, clouds and atmosphere;
   5. image and grade, applied last.

   Attribute each gap to the layer that causes it (`env-look-iteration`). Fix it at that layer.
8. **Check motion and temporal stability** (`env-temporal-stability`). Judge in motion and close up, never only in stills.
9. **Loop the comparison** (`env-look-iteration`) until no visible mismatch is worth fixing.
   - Before calling anything finished, get an independent read of the top gaps from the reference-versus-render comparison, and work on those gaps.
   - The look is not done until the user says so.

### Cost

When something is too expensive, find what actually costs (profile it), then redesign it so it costs less and still reads as the real thing. Accepted moves:

- bake what is static: shadows of fixed casters, irradiance, sky maps that rarely change;
- use real-time LOD that reduces real structure invisibly;
- use temporal or amortised passes, but only if they are stable in motion and have a full-quality path;
- render an effect at lower resolution if it stays clean.

Never cut resolution or detail across the board, delete a required phenomenon, or swap in a banned stand-in.

### Picking up an unfinished scene

1. Read the earlier sessions' feedback in full: every correction the user made is still in force.
2. Capture the current state against the reference.
3. Re-run the audit.
4. List the gaps by layer before touching code. Everything is open to change, from a minor adjustment to a full rebuild.

## Failure modes

| Symptom | Mechanism | Fix |
|---|---|---|
| "Resemblance, not exactness" | The reference was glanced at, then improvised from | Back to phases 1–3. Build from measured landmarks, with the reference beside every capture. |
| Polishing an element that is still structurally wrong | Look work started before the structure gate passed | Stop look work. Fix structure in clay. |
| Every element at "roughly" | Breadth before depth | Pick one element and take it to standard before the next. |
| The user keeps finding defects the agent's own captures showed | Captures were taken but not looked at, or only the hero view was checked | Inspect your own captures for structural deviation before tuning anything else. Orbit and close-up views are required, not optional. |
| A pass "improves numbers" but looks no closer | The metric is blind to the real gap (see `env-look-iteration`) | Change the measurement, not the tuning. |
| The same approach rejected twice | Tuning a wrong model | Rethink from the light transport or the geometry up. |

## Verification

At close-out:

- A side-by-side of the hero view against the reference, plus region crops.
- At least four orbit views, and close-ups of every junction class and every signature element.
- An in-motion check of everything that animates or depends on the camera.
- An audit report showing nothing visible remaining.
- Each owning skill's Verification section satisfied.

See [references/phase-gates.md](references/phase-gates.md) for the gate checklists and [references/done-criteria.md](references/done-criteria.md) for what "done" means.
