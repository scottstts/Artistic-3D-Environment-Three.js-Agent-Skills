---
name: env-look-iteration
description: "The comparison loop that closes the gap between a 3D render and its reference (or the intended look) — side-by-side captures, region measurement, attributing each gap to the layer that causes it, bisecting, fixing root causes, handling user feedback and screenshots, and knowing when tuning can't close a gap. Load for \"keep iterating until it matches\", for every iteration pass, when passes stop converging, when the user reports an artifact or says it \"still doesn't look like the reference\", and before declaring anything finished."
---

# Look iteration

## Owns

The loop: compare, measure, attribute, fix, re-measure. Also handling feedback, and deciding when a pass is done. Each fix is made in the skill that owns its layer.

## Standard

**"Iterate" means the whole pipeline for the whole scene:**

- geometry;
- materials and shaders;
- shadows and AO;
- lighting and indirect light;
- atmosphere;
- post and grade;
- motion.

It never means only the next item on a to-do list.

**Always:**

- **The reference stays beside the render** in every capture, at the reference's framing, through the whole build. Compare against the reference itself, not your notes about it.
- **Measure, don't eyeball** ([scripts/measure.py](scripts/measure.py)):
  - region colours;
  - luminance percentiles;
  - local contrast (flatness);
  - saturation;
  - class coverage (for example, how much of a region is gold);
  - glow profiles.

  Choose metrics that can see the gap. Matching means and coverage while the image still looks different proves the metric is blind: change the metric.
- **Attribute each gap to the layer that causes it** ([references/attribution.md](references/attribution.md)), using per-layer views (albedo, clay lighting, pre-grade, final). Fix it at that layer. Never push one layer to fake another's result (a grade faking light, a fill faking a key, emission faking a material).
- **Fix the biggest gaps first,** then re-capture the same crops. Never let a visible mismatch slide.
- **Fixes are systematic, not marginal.** If an approach is rejected twice, or two passes don't move the measurement, stop tuning. Rethink from the light transport or the geometry up.
- **Know when tuning can't close a gap.** Some gaps need a missing physical effect. Examples:
  - rainbow patches thrown onto faces need dispersive caustics;
  - a sea glowing across its surface needs slope-integrated reflection;
  - deep relief needs geometry.

  Name the missing mechanism and build it.
- **Look for structural deviations in your own captures** before tuning anything. A wrong form visible in your capture outranks every colour gap.
- **Independent read before declaring a pass finished:** hand the full side-by-side to an independent reviewer (an advisor, or a fresh agent given only the images), ask for the top five gaps, and work on those.
- **The look is not done until the user says it is.** A goal-loop re-prompt means the work is below standard: re-compare and list the discrepancies, don't just continue a to-do list.

**Handling feedback** ([references/feedback-handling.md](references/feedback-handling.md)):

- **Read the user's comments as pointers to a gap in the reference,** not as literal instructions.
- **For a reported artifact:**
  1. zoom into their screenshot or recording at the marks;
  2. describe back what you see;
  3. reproduce it in your own capture;
  4. find the root cause;
  5. then fix it.

  If unsure what they mean, ask before changing code.
- **Their guesses at causes are leads to test,** not facts.
- **Never hide an artifact.** Until the cause is found, assume it is still there.

## Procedure (one pass)

1. **Capture** the hero view beside the reference, plus region crops (gridded 3–4× zooms of each signature element), plus per-layer views. Include one or more orbit or close views of what the pass touches.
2. **List every visible discrepancy,** by region, in plain words. Include structural ones.
3. **Measure the discrepancies** with `measure.py`:
   - regions or a grid;
   - colour classes where coverage matters;
   - glow profiles around bright sources.

   Note the deltas.
4. **Attribute each to a layer** (per-layer views, toggles). Use a raycast from the camera through a mismatching pixel to name the surface that's actually there, because the region may not hold what you think it does.
5. **Fix the biggest,** one change at a time when the cause is uncertain. When a change regresses another region, isolate which part did it and keep the good half.
6. **Re-capture the same crops** and re-measure. Record the before and after numbers.
7. **Repeat.** Before reporting a pass as finished, do the independent top-five read and act on it.

## Failure modes

| Symptom | Mechanism | Fix |
|---|---|---|
| Passes change things but don't converge | Tuning parameters in the wrong layer, or a blind metric | Attribute with per-layer views. Change the metric to one that sees the gap. |
| Numbers match, the user says "night and day" | The metric (means, coverage) can't see flatness or form | Measure local contrast, percentile spread and structure. Look at the crops. |
| Fixed the wrong artifact | Guessed what the user meant | Restate what you see in their image at the marks, and ask when unsure |
| A good change reverted by a later "restore" | Restoring an earlier state discards later fixes | Track what each state contains. Re-apply fixes after a restore. |
| An improvement in one region broke another | A shared term changed (a global fill, a tone curve) | Measure all regions after each change. Isolate the regressing part. |
| Reporting "closer but not a match" pass after pass | Marginal tuning | Rethink the layer from physics. Name the missing mechanism. |

## Verification

- A pass log: each discrepancy, its layer, the fix, and before and after measurements.
- The hero side-by-side and region crops after the pass.
- The independent top-five read, and what was done about it.

## References

- [references/attribution.md](references/attribution.md): which layer causes which kind of gap, and how to tell.
- [references/measurements.md](references/measurements.md): which measurement sees which gap.
- [references/feedback-handling.md](references/feedback-handling.md): turning user comments and screenshots into correct fixes.

## Tools

- **[scripts/measure.py](scripts/measure.py):** region and grid statistics for reference against render: mean, percentiles, saturation, local contrast, clipping, colour-class coverage, glow profile, plus side-by-side and difference images. Run `--self-test` to check it.
