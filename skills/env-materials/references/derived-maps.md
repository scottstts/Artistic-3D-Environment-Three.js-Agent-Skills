# Deriving the missing maps of supplied models

Many exported models carry only a base colour texture, so they render as matte paint. Build the missing layers in the shader from what the model has. Leave the file unchanged.

## Method

1. **Segment the albedo into surface classes** by hue, saturation and value: gold areas (orange-yellow, saturated), lacquer (saturated red), hair or fur (pale, low saturation), skin, cloth, stone. Use smooth masks (`smoothstep` over hue distance and saturation), not hard cuts.
2. **Assign physical properties per class:**
   - gold: metalness 1, base colour shifted toward gold F0, low roughness;
   - lacquer: dielectric, low roughness, a clearcoat;
   - fur: matte, with a soft rim sheen;
   - stone: rough.
3. **Derive relief from the painted detail:** a bump from the high-pass luminance of the albedo, with its strength per class. Scales and carving catch the light; the creases between them darken and roughen.
4. **Vary the roughness** with the bump: raised areas polished, creases rougher and slightly tarnished.
5. **Keep the textures sharp at grazing angles:** anisotropic filtering, and a mip bias only if needed.

## Checks

- The model beside the reference under the scene light: the materials read as distinct surfaces (metal reflects the environment, fur stays matte).
- No new seams or banding at the class mask edges.
- The original file is byte-identical. The derivation lives in code.
