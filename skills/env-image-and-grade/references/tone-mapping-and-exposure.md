# Tone mapping and exposure

## Choosing (three.js r187: `renderer.toneMapping`)

| Tone mapper | Character | Use when |
|---|---|---|
| `AgXToneMapping` | Wide dynamic range, gentle highlight rolloff, hues preserved into the highlights (a sunlit orange stays orange, not yellow-white) | Bright sunlit scenes, sunsets, strong emissives; the default for photographic targets |
| `ACESFilmicToneMapping` | Punchier contrast, highlights desaturate and shift hue (toward yellow-white) | References with a filmic, contrasty look; check the hue shifts on skin and gold |
| `NeutralToneMapping` | Faithful base colour, modest range, little hue shift | Stylized or illustrated references with controlled range; product-like colour fidelity |
| None, plus a custom curve | Full control | Only when you implement the whole curve. Never stacked on another tone map. |

Compare on the hero view: render all three, measure highlight rolloff (sunlit whites, sky near the sun) and colour fidelity on known materials (gold, foliage, skin) against the reference.

## Exposure

- **Anchor it to the reference:** pick a sunlit mid-albedo surface (stone, sand, wall), and set `toneMappingExposure` so its post-tonemap value matches the reference's region.
- **Never set exposure to hide a lighting problem.** If exposure lifts the shade, the shadows are wrong. If it is lowered to stop the sun clipping, the sun is too strong relative to everything else.
- **Physical scenes:** with sun and sky in physical proportion (`env-lighting`), one exposure fits all the sunlit content. A need for local exposure tricks points to a broken ratio.

## Contrast placement

```
scene radiance → [contrast here: lighting, or a power curve around mid-grey in scene-referred space] → tone map → [grade: gentle only]
```

A contrast curve before tone mapping keeps the texture in shadows and highlights, because the tone mapper still compresses gracefully afterwards. In three.js r187 that is the default place: `RenderPipeline.outputNode` runs before the renderer's tone mapping. After tone mapping, an S-curve compresses the ends, where texture lives.
