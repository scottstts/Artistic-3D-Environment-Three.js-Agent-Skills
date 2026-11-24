# Diagnosing flat or overcast lighting

Measure these on the hero view and the reference, region by region (`env-look-iteration` → `measure.py`). Each row that differs points to its cause.

| Trait | How to measure | When it is off, the usual cause |
|---|---|---|
| Brightest sunlit value on a mid-albedo surface | The 95th percentile of luminance in a sunlit stone region | Exposure too low, sun too weak, a tone curve compressing highlights, a material too dark |
| Lit:shade ratio on one material | The mean of a sunlit patch over the mean of a shaded patch of the same material | Fill too strong (HDRI, hemisphere, ambient), the HDRI's sun not removed, no AO on the fill |
| Shade colour | Blue minus red in shaded regions | Fill not sky-coloured; a grade neutralizing it or over-boosting it |
| Black level | The darkest 1% of the frame | A veil of fog, haze, glare and lifted grade blacks; un-occluded fill in recesses |
| Saturation | Mean saturation by class: sky, foliage, stone | A desaturating grade or tone curve; a missing coloured bounce |
| Sunlit whites | Saturation of sunlit white surfaces (should be near neutral, slightly warm) | Wrong white balance, a cast in the grade |
| Light direction | Which faces are brightest | The sun on the wrong side (front-lit versus backlit) |
| Recess darkness | Interiors of loggias, arch soffits, under balconies | No occlusion of the fill (no AO, no probe grid) |

## Order of fixes

1. **Direction:** the sun on the solved side.
2. **Ratio:** cut the fill to the physical ratio. Remove the HDRI's sun.
3. **Occlusion:** AO on the fill only, and a probe grid for interiors (`env-shadows-ao-gi`).
4. **Exposure and tone curve:** the sunlit value reaches the reference's without clipping whites (`env-image-and-grade`).
5. **Veil:** audit fog, haze and glare.
6. **Grade last:** saturation and contrast, applied scene-aware, never compensating for steps 1–5.

## The trap

Raising the fill to compensate for a key placed in the wrong spot produces exactly the overcast look: lots of fill, no visible key. If you're raising fill to see the forms, the key is wrong.
