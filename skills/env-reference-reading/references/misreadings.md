# Misreadings that recur

Each entry names the misreading, why it happens, and the test that catches it.

## Identity

| Misreading | Correct reading, typically | Test |
|---|---|---|
| A big ring overhead read as an arch | A circular cut in a ceiling. Its far half may be a separate structure on a terrain rim, the two projecting into one ellipse. | Sky visible through it? Do its two halves have different depths, judged from occlusion and haze? |
| A curved structure at the frame edge read as a closed round building | A road, deck or arcade entering from beyond the frame and bending away | Does any closing back half show? If not, it continues off-frame. |
| A slope profile read the wrong way | Convex (steep at the top, flattening toward the bottom) shows the whole run. Concave hides its lower part. | From the viewpoint, can you see the full length of the path? Then it's convex. |
| A shell or panel read as a free-form surface | A patch cut from a large sphere. Its edges are circles on the sphere. | Curvature constant across the surface? Do the edges read as circular arcs? |
| Ornament read as applied pieces | Detail carved out of the wall mass: no flat field behind it | Is any flat wall plane visible between the motifs? If not, it's carved. |
| Ornament read as carved | Applied pieces with a visible ground behind them | Do the motifs cast shadows onto a flat ground? |
| Water read as water | A stylized glossy floor with caustic patterning, or vice versa | Does it reflect the scene the way water would, and does it have depth? |
| Clouds read as small puffs nearby | A huge cloud mass far away, or a deliberately impossible giant cloud indoors | Atmospheric fade, edge sharpness, how the surrounding light falls on it |
| A gigantic figure read as normal size | A hologram or monument at architectural scale | Compare it with the doors, storeys and people next to it |

## Space and scale

| Misreading | Correct reading, typically | Test |
|---|---|---|
| A shallow, cramped space | The reference spans hundreds of metres: depth from atmospheric fade and the size of known objects | Solve distances from objects of known size: people, doors, storeys, trees |
| A wide-angle look | A normal or long lens: verticals barely converge, near and far objects of the same type differ little in size | Measure convergence. Solve the FOV (`env-camera-and-space`). |
| Walls beside the viewer | Open ground. The nearest façade is far ahead. | What is actually at the left and right edges of the frame? |
| An element turned diagonally | Aligned with its neighbours. The diagonal look is perspective. | Do its eave lines converge to the same vanishing point as its neighbours'? |
| Buildings deformed to match the silhouettes | True shapes, with a camera placed so the silhouettes line up | If matching needs shearing or bending, the camera is wrong |

## Light

| Misreading | Correct reading, typically | Test |
|---|---|---|
| A front-lit scene | Backlit: the up-facing surfaces bright, the camera-facing ones in soft shade, glow above the frame | Which faces are brightest? Which way do cast shadows run? |
| Light coming from a feature, such as a water ceiling | Light coming through a window, with god rays | Shadow shapes and light patches point to the real opening |
| Overcast-looking stone | A clear, sunlit day with strong colour | Measure the lit-to-shade ratio and saturation in the reference |
| A fog veil | A clear atmosphere. The softness is distance, not fog. | Do near objects have crisp contrast? |
