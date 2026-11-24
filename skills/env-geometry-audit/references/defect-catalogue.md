# Defect catalogue

## Thresholds (audit-lib defaults)

| Audit | Setting | Default | Why |
|---|---|---|---|
| coplanar | `tolDist` | 6 mm | Depth precision at mid-range distances can't separate planes closer than a few millimetres. Faces in that band can fight. |
| coplanar | `tolAngleDeg` | 2° | Slightly angled crossings flicker along their crossing band |
| coplanar | `minArea` | 1 cm² | Ignore touching corners and shared edges |
| coplanar | `sameFacingOnly` | false | Opposite-facing coincident faces are safe with single-sided materials. Set to true for the visible-defect pass. Keep it false when double-sided materials are present. |
| support | `contactTol` | 2 cm | Contact closer than this counts as touching. Interpenetration also counts as contact. |
| clearance | `seat` | 1 cm | A seat deeper than this is reported as interpenetration |
| clearance | `sampleStep` | 5 cm | Points along edges catch parts that pass straight through a solid |

## Classes, causes and fixes

| Class | Typical generator cause | Fix |
|---|---|---|
| Two materials on one plane | The top of a wall and the paving both at the same height | The paving stops at the wall's inner face, or the wall top steps clearly above it |
| A trim flush with an opening or edge, sunk into the host | Sinking applied parts by a fixed amount without checking their side faces | Exact contact on shared coordinates, or a deliberate step. Never a few mm. |
| Duplicate faces | Mirrored halves written onto the wrong side; a part emitted twice | Fix the mirroring transform, or remove the second emission |
| A lining against stones (teeth along a rim) | A coarse polygon for one, the true curve for the other | Build both from one curve definition and one segment count |
| A string course across an opening | Swept as a closed ring around a tier | Sweep only along the faces that carry it, ending at openings |
| A floating seat | A hand-set Y for a part on a moulded support | Use the support's computed top |
| An overhanging part | The part's footprint larger than its support | Size the part to its support, or enlarge the support |
| Hollow shafts and slits | Shafts emitted without bottom faces, spires offset upward | Closed solids, with the spire standing on the shaft top |
| Doubled corners | Each façade emits its own corner piece | Emit one corner solid per convex corner |
| A roof short of its walls | A deck sized to the inner footprint | The deck runs into the walls or parapets |
| A soil disc facing down | The disc's loop ordered centre → rim | Order rim → centre, or check winding against the intended normal |
| A missing wall side | One face of a carved wall wound backwards. A double-sided clay view hid it. | Fix the polygon writer. Clay views are single-sided. Run a winding audit. |
| Vegetation in structures | Plants placed with no solid test | Build-time test against the solids (push out, or drop) |
| A swept-path collision | A moving part's path crosses static members | Clearance per animation frame. Re-route the part or move the member. |
| Bottomless container | An open box with no floor or inner wall | Closed vessel: wall thickness, floor, rim |
