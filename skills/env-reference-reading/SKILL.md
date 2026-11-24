---
name: env-reference-reading
description: "Reading a reference image, clip or brief before building a 3D scene. Covers what each element physically is, how the structure connects, where the light comes from, and stylized versus photographic. Also covers designing what the reference doesn't show, or when it is AI-generated, dropped or absent. Load at the start of any scene recreation, when a build \"resembles but doesn't match\", when the user says the geometry or spatial reading is wrong, or when design is left open."
---

# Reference reading and design intent

## Owns

Turning a reference into a correct physical, structural and stylistic reading before anything is built. Deciding what to follow, what to fix, and what to invent. Design and taste where the reference is silent, unreliable or dropped.

## Standard

**The reference is the target.** Model what it shows: structure, composition, orientation, proportions, counts and scale. A general vibe is not a match, and neither is a resemblance. Keep the reference beside every capture through the whole build, not just at the start.

**Always a defect:**

- Building from a glance and then improvising.
- Inventing structure where the reference clearly shows something else. Examples: stairs or podiums that aren't there; a closed building where the frame shows a road leading out.
- Turning an element on its own axis when the reference aligns it with its neighbours.
- Seeing a structural deviation in your own captures and tuning something else instead.
- Reading the user's words literally. "Warm afternoon feel" is not an instruction to lower the sun. It is a pointer to a gap in the reference: look at what the reference does and match that.

**Default reading discipline:**

- Name what each element physically is, and where it lives in the world, before choosing a technique.
- Cross-check every reading against the lighting, perspective, scale and neighbouring forms. The most obvious reading isn't always right: a dark circle may be a hole, not an arch.
- The frame is a window onto a larger world. Anything cut off at the edge continues past it.
- Decode the structure before modelling: what connects to what, how large forms meet, what carries what, and where the light comes from.

**What the reference decides:**

- **How each object is made:** carved from the mass where it shows carving, applied pieces where it shows applied pieces, flat where it is flat. Read it; never default it.
- **How much detail, and where.** Detail exists because the reference, or the logic of the object, puts it there. Never add detail to raise density.
- **The style category, which decides the method:**
  - **Stylized or illustrated:** the image is the only authority. You may art-direct past physics: light that ignores occluders, a sky held down, fills with no physical source. Where the reference's appeal is an impossibility, preserve it. Don't rationalize it away with physics. Modelling still aims at realism. The style lives in shading, light and grade.
  - **Photographic, or no reference:** the result must read as real footage. Use physical light transport, natural variation between individuals, bloom only as veiling glare, and subtle lens and sensor traits.
  - **In both:** deviate from physics only deliberately, and just enough. A strong, realistic base anchors the image. The deviation carries it to the reference's beauty. Every deviation must still hold when the viewer orbits.

**When the reference doesn't hold up:**

- **AI-generated nonsense:** build the plausible version and say in one line where you deviated. For ornament and other fine detail an AI image can't make consistent, build the most refined version that fits the reference's character. Never reproduce noise.
- **Silent areas:** invent plausibly, the way a skilled maker would really build that object or place.

**Precedence for geometry and space:**

1. the user's explicit instructions;
2. spatial integrity and physical sense;
3. what the reference shows clearly;
4. plausible invention for what it doesn't show.

**Open design** applies when design is left to you, or the user drops the reference:

- Discard your first ~5 textbook ideas, and build something more original that stays coherent with the theme.
- No boring defaults: plain tile grids, box openings with plain frames, uniform walls of windows.
- Signature elements are designed structures, not a generic version of that kind of thing.
- Judge the scene on its own terms, as a real, well-designed place.

## Procedure

1. **Look at the whole reference at full size, then in gridded crops at 3–4× zoom, region by region.** Write down what you see, not what you expect.
2. **Make an element table.** For each element record:
   - its physical identity;
   - its material;
   - how it is made (carved, applied, assembled, grown);
   - its approximate scale, judged from cues of known size;
   - what it touches;
   - whether it continues off-frame.
3. **Decode the light:**
   - sun side and elevation, read from cast shadows and which faces are lit;
   - how bright the shade is compared with the lit faces;
   - the colour of light versus the colour of shade;
   - how much haze, and where;
   - where bloom appears.

   Those clues give the sun's direction. Don't guess it.
4. **Cross-check every reading:**
   - Does the shadow direction agree with the lit faces?
   - Does the perspective agree with the scale you assigned?
   - Would a builder actually make this this way?

   Revise readings that fail.
5. **Classify the style**, and write down where deviation from physics will live: shading, light or grade, never geometry.
6. **List the AI-generated or impossible areas**, each with the plausible version you'll build.
7. **Name the signature elements.** These are built as designed structures, each finished to standard before the next.
8. **Write the interpretation** ([references/interpretation-template.md](references/interpretation-template.md)). When the structure is ambiguous, or the user asks, stop for sign-off before building.
9. **During the build,** keep the reference beside every capture. Re-read the reference itself, not your notes, whenever a region doesn't match.

## Failure modes

| Symptom | Mechanism | Confirm | Fix |
|---|---|---|---|
| "Resemblance, not exactness" | Built from the gist, then improvised | Overlay the blockout on the reference: masses drift | Rebuild from the element table and back-projected landmarks |
| A structure the user calls wrong outright | A misread identity: hole versus arch, closed form versus continuing path, concave versus convex profile | Write the reading down and test it against light and perspective | Re-read, write it up, get sign-off. See [references/misreadings.md](references/misreadings.md) |
| Invented features in a clear region | Filling space with defaults | Compare that crop: the reference shows open space | Delete the invention. "What the reference shows, follow closely. What it doesn't show, invent plausibly." |
| Logic imposed on a surreal reference | Rationalizing the impossibility that makes the image | Ask what the image would lose if it were made plausible | Keep the impossibility in light, shading or composition. Keep the geometry coherent. |
| Fixing the wrong thing after user feedback | Took the words literally, or guessed the meaning | Restate the issue in your own words before acting | Read the comment as a pointer to a gap in the reference. Ask when unsure. |

## Verification

- A written element table and light decode, before any geometry exists.
- An interpretation that names the signature elements and the AI-generated deviations.
- After the blockout: an overlay at the reference camera. Every remaining difference is explained by precedence (true shapes kept) or by a stated deviation.

## References

- [references/interpretation-template.md](references/interpretation-template.md): the sign-off write-up.
- [references/style-decides-method.md](references/style-decides-method.md): where deviation lives, per style.
- [references/misreadings.md](references/misreadings.md): misreadings that recur, and how to catch them.
- [references/open-design.md](references/open-design.md): designing when the reference is silent or dropped.
