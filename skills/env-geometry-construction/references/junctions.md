# How parts meet

Every junction is resolved the way the real thing would be built or would grow. When one is unresolved, the eye reads the scene as fake, even if it can't say why.

## Rules

1. **Contact, never float, never overlap in a host's plane.** An applied piece meets its host in one of two ways:
   - **Exact contact on shared coordinates.** Its back face lies on the host face, facing the opposite way. Single-sided materials never show the coincident pair. Build both from the same numbers, not from values that should merely be equal.
   - **Sunk a few millimetres into the host.** Only where no side face of the piece would land in the plane of a host face. A piece sunk into a wall face while flush with the wall's end, an opening's reveal or a slab's edge puts a strip of its side face exactly in the host's plane, facing the same way. That strip flickers.

   A gap shows as a dark line or a light leak. A deep overlap shows through thin parts. Prove each junction with the coplanar and clearance audits (`env-geometry-audit`).
2. **Seat on the true support height.** Compute where the support ends from its own construction, for example the top of a pedestal's moulding chain. Never use a hand-set number that drifts when the support changes.
3. **Size to the support.** A part never overhangs a support smaller than its footprint: a pinnacle on a cap, a statue on a plinth. Build the support up to fit, or size the part down.
4. **Run members into their partners.**
   - A post ends inside a volute's eye, or tapers into a coil.
   - A rail dies into a newel.
   - A leg enters a rail.
   - Nothing stops with a square cut end beside what it should meet.
5. **Stop features at openings and blank faces.** String courses, dado rails, cornices and gallery bands run only along the faces that carry them. They return or die at openings. They never sweep a closed ring through a gate.
6. **Cut openings through every layer.** A doorway passes through the wall, its lining, and any wall behind it in the same path. Line up both openings exactly. A sliver of a back wall left standing is a defect.
7. **Build corners once.** Where two façades meet, one corner solid (a pier, a turret, a quoin stack) serves both. Never two overlapping corner pieces.
8. **Ground everything.**
   - Buildings sit on foundations that follow the ground or host: plinths, stepped bases, retaining walls, terraces cut level into a slope.
   - On a curved or living host (a rock, an animal's back, a hull), build a base that meets the host's surface. Never slice the building with the host mesh.
9. **Roofs reach their walls.** Decks run into the parapets, and eaves overhang the wall plane. No open gaps into the building's hollow inside.
10. **Shells have thickness** where an edge can be seen: walls, floor slabs, roof edges, vessels, planters. Hollow parts with an opening (pots, basins) have an inner wall and a floor or soil surface facing up.

## Junction catalogue

| Junction | Resolved as |
|---|---|
| Column to floor | Base mouldings on a plinth block, sitting on the paving (seated, never floating) |
| Column to entablature | A capital whose abacus carries the architrave. The entablature breaks forward over the columns where the reference shows it. |
| Arch to pier | An impost block or capital at the springing. Its inner face is flush with the opening edge; the flare goes only outward. |
| Arch rings | Concentric voussoir courses from one curve definition. The keystone sits within the ring, not below the soffit. |
| Wall to roof | Eaves with fascia, or a parapet with coping. Gutter or cornice continuous at the corners. |
| Rail to post | The rail dies into the post. Balusters are seated into the base rail and the handrail. |
| Stair to landing | The nosing line continuous, the stringers meeting the landing structure, the balustrade returning |
| Building to sloped or curved ground | A stepped foundation, a retaining wall, or a podium following the ground. Never a building sliced by terrain. |
| Bridge to bank | Abutments into the ground. The deck carried end to end, with no free end in mid-air. |
| Planter to plant | Soil surface facing up, inside the planter's inner wall. Trunk flare entering the soil. |
| Furniture | Legs into rails, cushions with real gaps between them, frames that hold their panels |
| Rope and fittings | Tied around the ring or cleat, with real wraps, padded where it crosses an edge |
