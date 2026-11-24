# Which measurement sees which gap

| Gap | Measurement (`measure.py`) | Blind spots |
|---|---|---|
| Overall brightness | Frame percentiles p25 / p50 / p75 | Can match while the distribution's shape differs |
| Tonal range (flat versus punchy) | Spread of percentiles (p95 − p5) per band or region | Global spread can match while each surface is flat |
| Flatness within surfaces | `local`: the median 8×8 window standard deviation of luminance | Sensitive to noise. Compare at matched resolution. |
| Colour of a material | Region `mean` on matching surfaces, in light and in shade separately | Mixed regions (sky plus building) mislead. Sample clean pixels. |
| Saturation | `sat` per region or class | Doesn't show which hue is off: compare `mean` too |
| Amount of a material (gold, foliage, water) | `classes` coverage per grid tile, then raycast the tiles with the biggest deficit | Coverage can match while the forms are wrong |
| Black level and veil | `p1`, the darkest 1% | — |
| Clipping | `clipped` share | Clipping in a single channel isn't counted separately. Check `mean` near 255. |
| Glow around bright sources | `--glow` profile at 10–140 px | Depends on the source's position and size matching |
| Whites | Mean and saturation of sunlit white regions, plus the clipped share | A uniform white reads blown out even when it isn't clipped: check `local` |

## Practice

- **Use the same framing and resolution** for reference and render. The script resizes the render to match.
- **Use regions that hold the same content** in both images. Check with the side-by-side.
- **Record the before and after** for every change in a pass log.
- **Trust the eye over a metric when they disagree:** then find the metric that agrees with the eye.
