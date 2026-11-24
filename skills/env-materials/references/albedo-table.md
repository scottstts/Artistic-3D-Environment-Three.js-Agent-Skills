# Physical value ranges

These are linear values. Typical ranges, which vary with weathering and moisture.

## Albedo (diffuse reflectance)

| Material | Linear albedo |
|---|---|
| Fresh snow | 0.80–0.90 |
| White paint, whitewash | 0.70–0.85 |
| White marble (fresh) | 0.65–0.85 |
| Limestone, weathered | 0.35–0.50 |
| Sandstone | 0.25–0.45 |
| Light sand (desert, beach) | 0.35–0.50 |
| Concrete | 0.25–0.40 |
| Granite | 0.15–0.30 |
| Brick | 0.20–0.35 |
| Bare soil, dry / wet | 0.15–0.25 / 0.08–0.15 |
| Grass, foliage | 0.08–0.20 (green dominant) |
| Bark | 0.10–0.25 |
| Wood (planed, light / dark) | 0.30–0.50 / 0.08–0.20 |
| Asphalt | 0.04–0.12 |
| Charcoal, soot | 0.02–0.04 |

If a scan's measured linear mean sits outside its material's range, check the colour space first. Then decide whether a stylized lift is intended, and say so.

## Metals (base colour = reflectance at normal incidence, linear)

| Metal | Linear F0 (approx. RGB) |
|---|---|
| Gold | 1.00, 0.77, 0.34 |
| Silver | 0.97, 0.96, 0.92 |
| Copper | 0.96, 0.64, 0.54 |
| Brass | 0.91, 0.78, 0.42 |
| Bronze (polished) | 0.80, 0.55, 0.35 |
| Iron, steel | 0.56, 0.57, 0.58 |
| Aluminium | 0.91, 0.92, 0.92 |

Tarnish, patina and dirt lower the reflectance and raise the roughness locally. Drive them with cavity and exposure masks.

## Dielectrics (F0 from IOR)

`F0 = ((n − 1) / (n + 1))²`:

| Material | IOR | F0 |
|---|---|---|
| Water | 1.33 | 0.02 |
| Ice | 1.31 | 0.018 |
| Glass | 1.5 | 0.04 |
| Quartz | 1.54–1.55 | 0.046 |
| Diamond | 2.42 | 0.17 |
| Strontium titanate | 2.41 | 0.17 (very high dispersion) |

## Roughness (perceptual, typical)

| Surface | Roughness |
|---|---|
| Polished marble, lacquer | 0.05–0.15 |
| Polished metal | 0.05–0.2 |
| Satin paint, waxed wood | 0.3–0.5 |
| Stone, concrete, plaster | 0.6–0.9 |
| Soil, sand, fabric | 0.8–1.0 |
| Wet surfaces | lower by 0.3–0.6, darker albedo |
