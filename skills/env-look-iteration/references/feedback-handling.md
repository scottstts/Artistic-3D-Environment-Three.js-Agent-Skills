# Handling feedback

## Comments are pointers, not specifications

- "Warm afternoon feel" points at a gap in how the reference looks. Look at what the reference does (light colour, shadow length, haze), and match that. Don't simply lower the sun.
- "It looks flat" may mean geometry (no depth at the hero scale), light (no key), or grade (S-curve flattening). Diagnose before acting.
- "Make it like the reference" for an element means its structure, material, light and motion, not a vibe.

## Reported artifacts

1. **Zoom into the screenshot or recording** at every mark. Extract frames from a video at the frame rate it was recorded.
2. **Describe back what you see**, in specific terms: "dark vertical stripes in a band just below the horizon, about 20 px tall, across the left half". Say where, what shape, and when it appears.
3. **If the description could fit more than one thing, ask.** A confident fix to the wrong artifact wastes a pass and erodes trust.
4. **Reproduce it** in your own capture: same viewpoint, same motion, same height. If it doesn't show, change your setup until it does. Don't conclude it's gone.
5. **Find the root cause** (`env-temporal-stability` → bisection). Test the user's guessed cause as a lead. Confirm or reject it with a measurement.
6. **Fix the class at its source,** across the scene.
7. **Verify from the user's viewpoint,** in motion if it was a motion artifact. Report what you checked and what you didn't.

## Instructions about scope

- **"Fix X and stop":** fix exactly X, verify quickly, stop. Mention anything else you noticed in one line, without fixing it.
- **A question:** answer it, and change nothing until told to.
- **"Rethink" or "tell me why":** analyse and answer. No code changes in that turn.
- **A structural reading the user corrects:** restate the corrected reading, get sign-off if asked, then rebuild from it. Don't patch the old reading.

## Things the user said once still apply

Every correction from earlier in the project still holds. When picking up a scene, collect all of them before changing anything (`env-build-protocol`).
