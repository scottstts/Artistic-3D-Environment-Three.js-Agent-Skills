# Supplied models

## Placement

- **Rigid only:** translate, rotate, scale uniformly. Never deform, remesh, crop or "fix" the file.
- **Orient by the feature the reference shows:** which way the face, the gaze or the bow points. Check by rendering the model from the reference camera beside the reference.
- **Scale** from the reference's scale cues and the model's real-world size: a person 1.6–1.8 m, a whale 15–30 m. If the reference's scale is off (a "gigantic" figure), use the intended scale and say so.
- **A model that comes with its own base** (a rock under a sitting figure, a table under an object): use it. The base was supplied for a reason. Make the base meet the scene naturally.

## Grounding

- **Contact:** the model touches what it stands on, at its true contact points. No floating, no sinking past the sole.
- **Junction:** where it sits on built geometry, build the support to fit it: a plinth sized to its footprint, a socket, a niche.
- **Contact shadow:** the model casts and receives shadows. A character must receive shadow from the scene. Never self-light a character so that it ignores shadows.

## Repairs without touching the file

- **Missing maps:** an export with only base colour renders as matte paint. Derive roughness, metalness and relief in the shader from the base colour: segment by hue and saturation (gold areas to metal, mouths to lacquer, fur to matte), and derive bump from the painted detail. See `env-materials` → derived maps.
- **A detached part inside the model** (a whisker, a strand, a floating piece):
  1. Split the model into connected components to find it.
  2. Move it rigidly to where the anatomy says it attaches.
  3. Check that only its intended contact region touches the body.

  The original file stays unchanged; the fix is applied at load.
- **Rig distortions** (a twisting head mesh): fix in the animation data or skin weights if the user asks. Never by deforming the mesh at render time.

## Conflicts

If a supplied model and the reference disagree (a pose, a part present in one and missing in the other), ask the user before resolving it.
