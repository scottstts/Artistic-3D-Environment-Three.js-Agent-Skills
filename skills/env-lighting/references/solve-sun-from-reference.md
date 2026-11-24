# Solving the sun from a reference

## Evidence, strongest first

1. **Cast shadows on the ground** from vertical objects (posts, columns, people, balusters).
   - **Direction:** the shadow points away from the sun's azimuth. Back-project the shadow's base and tip onto the ground with the solved camera (`env-camera-and-space`) to get its world direction.
   - **Elevation:** tan(elevation) = object height ÷ shadow length.
2. **Lit and shaded faces:**
   - **Up-facing faces brightest, camera-facing faces in soft shade:** the sun is ahead of the camera, high (backlit).
   - **Camera-facing faces brightest, with shadows behind the objects:** the sun is behind the camera.
   - **Terminators running down columns and corners:** the sun is to the side of the bright side.
3. **Specular highlights** on known geometry (a sphere, a cylinder, a flat floor). The highlight sits where the normal bisects the sun and view directions.
4. **Sky glow:** the brightest part of the sky, the sun's aureole, and the warm side of the horizon.
5. **Light patches** cast through openings onto floors and walls. The opening and the patch together give the direction.

## Procedure

1. Collect two or three shadow vectors. They must agree. If they don't, the reference is inconsistent (often AI-generated): weight the signature region.
2. Check the lit/shaded face pattern against the solved direction.
3. Place the sun, then render a clay view from the reference camera beside the reference. Compare where the light and shade fall.
4. If several readings conflict, pick the one that keeps the most of the reference's value structure, and state the trade-off.

## When the reference is physically impossible

- **Building facades lit though their neighbours should shade them:** look for a sun position, such as a higher elevation or a different azimuth, that throws the shade where the reference has it.
- **A figure backlit by the sun but lit on the front:** a real bounce (a bright floor), or a subtle physical fill with a reason.
- **Never** use no-cast exemptions or proxies that only work from the hero view.
