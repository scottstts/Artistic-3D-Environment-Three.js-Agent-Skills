---
name: env-geometry-audit
description: "Mandatory programmatic and visual audit of a 3D scene's geometry — coplanar/near-coplanar overlap (z-fighting, flicker), floating or unsupported parts, interpenetration (including over animations), open shells, inside-out or flipped winding, vegetation through structures. Load after every build step that adds geometry, before any look work, and whenever the user reports coplanar flicker, floating/detached parts, things poking through, see-through gaps, surfaces visible only from one side, or a defect that must be fixed \"everywhere\"."
---

# Geometry audit

## Owns

Finding geometry defects across the whole scene, fixing the visible ones at the generator that made them, and proving each fix visually.

## Standard

**Every scene gets a programmatic, whole-scene audit.** It is not optional, and one view is not a substitute. The audit covers:

- coplanar and near-coplanar overlap;
- parts with no chain of contact to the ground;
- interpenetration deeper than a seat, including across the full range of every animation;
- open shells, flipped or inconsistent winding, inside-out solids;
- vegetation intersecting solids.

**The audit and the visual check together are the evidence.** Fix the hits that are visibly exposed. Verify each fix from the view that exposes it.

**Always a defect, whatever the reference shows:**

- coplanar flicker, including along narrow edges and seams;
- floating or detached parts;
- unintended interpenetration at any moment of an animation;
- surfaces that vanish or render wrong from some angle;
- see-through gaps;
- visible faceting on surfaces meant to be smooth.

**Defects are classes.** When one is found or reported, find and fix every instance of that class in the scene. Fix it at the generator that emitted it. Never patch the one spot, and never use a scene-wide automatic resolver that nudges geometry blindly.

**Triage by visibility, not count.** Thousands of hits on faces that can never be seen (buried, interior, behind other solids) are not worth fixing one by one. Use judgement: fix what can be seen from anywhere the viewer can go, and fix the generator so the class stops appearing. A report of "N hits fixed" means nothing if the one the user sees remains.

## Procedure

1. **Export the scene's geometry.**
   - In Node, import the builders and call them.
   - In a debug hook, use `meshesFromThree(scene)` from [scripts/audit-lib.mjs](scripts/audit-lib.mjs). It expands instances and reads meshkit's per-part ids.
   - Tag groups: `ground` for terrain and floors, `plant` for vegetation.
2. **Run the audits:**
   - `node scripts/audit.mjs scene.json --ground-y 0`, or call `runAll(meshes)` in-page.
   - Pass animation frames to check clearance over motion.
   - The default thresholds and their reasons are in [references/defect-catalogue.md](references/defect-catalogue.md).
3. **For each hit, read the mesh names and the world position.** Trace the hit to the generator and the call that emitted it. Tag vertices with their source while debugging, or log the call stack for vertices in a box.
4. **Classify:**
   - **visible:** a face the viewer can see from somewhere they can go;
   - **buried:** inside other solids, or under the ground;
   - **interior:** inside a closed building the viewer can't enter.
5. **Fix visible classes at the generator** ([references/defect-catalogue.md](references/defect-catalogue.md)):
   - change how the generator places, sizes or ends the part;
   - re-run the audit and confirm the class count drops to zero for visible cases.
6. **Verify visually** ([references/visual-sweep.md](references/visual-sweep.md)):
   - a flicker sweep with sub-pixel camera jitter over views around and inside the scene;
   - close orbits of every fixed junction class;
   - single-sided clay views from both sides of thin parts.
7. **Re-run** after every build step that adds geometry.

## Failure modes

| Symptom | Mechanism | Confirm | Fix at the generator |
|---|---|---|---|
| Flicker on window rims, deck edges, ledges | Two parts' faces share a plane: a wall top and paving at one height, a frame face flush with a reveal | `coplanar` hit at that position | Stop one surface at the other's face, or offset it by a deliberate step. See `env-geometry-construction` → junctions. |
| Flicker the audit didn't report | Near-coplanar faces at a slight angle, or faces outside the plane tolerance that fight at distance | Increase `tolAngleDeg` and `tolDist`. Flicker sweep at that view. | The same fix. Also check the near/far plane ratio and use a reversed depth buffer. |
| The user still sees flicker after an "audit clean" | The audit was run on a subset, sampled views only, or cached modules | Re-export everything and re-run. Flicker sweep from the user's viewpoint. | Fix, then repeat both checks |
| A part floating near its support | Hand-set height, or the support resized later | `support` hit: lowest Y against the support's top | Compute the seat from the support's real geometry |
| Pinnacle or finial shows sky from below | No bottom face, a slit to the spire, smaller cap than shaft | `shells` (open edges). A view from below. | Closed solids, seated on supports at least their footprint |
| Leaves inside walls or roofs | Vegetation placed without testing against solids | `clearance(between: ['plant','solid'])` | Push the sprig out along its normal, or drop it, at build time. Never grow plants through structures. |
| A surface visible only from one side | Inverted winding, a missing back face, a single-sided shell | `shells`: inside-out or open | Fix the writer or the loop orientation. Close the shell. |

## Verification

- An audit report with the summaries of all four audits and every remaining visible hit explained (none should remain).
- A flicker-sweep report, plus close-ups of each fixed class.
- For animated parts: clearance per frame over the whole range.

## Tools

- **[scripts/audit-lib.mjs](scripts/audit-lib.mjs):** `coplanar`, `support`, `clearance`, `shells`, `runAll`, `meshesFromThree`. No dependencies; runs in Node or the browser. Measured at about 360k triangles and 32k components: about 11 s for all four audits in Node. For scenes of millions of triangles, audit per district or per generator, and always the region the user reported.
- **[scripts/audit.mjs](scripts/audit.mjs):** the command line (`--ground-y`, `--seat`, `--tol`, `--top`).
- **[scripts/selftest.mjs](scripts/selftest.mjs):** a synthetic scene with one defect of each class, plus correct parts that must not be reported. Run `node scripts/selftest.mjs`.

## References

- [references/defect-catalogue.md](references/defect-catalogue.md): defect classes, causes in the generator, fixes, and thresholds.
- [references/visual-sweep.md](references/visual-sweep.md): flicker sweeps and the visual checks that confirm a fix.
