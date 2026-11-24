# Visual sweep

The programmatic audit finds candidates. The visual sweep proves what the viewer actually sees.

## Flicker sweep

Z-fighting shows as pixels that change when the camera moves by less than a pixel.

1. Choose views:
   - the hero view;
   - 8–24 views around the scene at several heights, including from below where the viewer can go;
   - close orbits of every junction class;
   - the user's reported view.
2. For each view, render frame A, then nudge the camera by a sub-pixel amount (about 0.3 px of screen motion) and render frame B. Render with post-processing off, or at least without temporal accumulation.
3. Diff A and B. Isolated pixels that flip between two different surface colours, clustered along edges or planes, are flicker. Smooth shading changes from the nudge are not.
4. For each cluster, raycast from the camera through the cluster to name the two surfaces. Fix the class at the generator.
5. Re-run on the same views. A view taken with the camera inside geometry is invalid: discard it.

## Single-sided clay

- Render the scene in a uniform clay material that is **single-sided**, with a key and a fill.
- A double-sided clay view hides flipped and missing faces. Never use one to sign off structure.
- View thin parts (walls, roofs, shells, vessels) from both sides.

## Junction close-ups

For each junction class (columns on bases, roofs on walls, rails on posts, ornament on grounds, buildings on ground or host), take a close-up from two sides and one from below. Look for:

- gaps: a dark line or light leak;
- overlap: one surface visible through the other;
- floating: a shadow gap;
- parts stopping short.

## Seen in motion

Some defects only show in motion:

- flicker on narrow edges;
- interpenetration during an animation;
- shells that show their inside as the view turns.

Record a short camera move past each fixed junction and check it frame by frame.
