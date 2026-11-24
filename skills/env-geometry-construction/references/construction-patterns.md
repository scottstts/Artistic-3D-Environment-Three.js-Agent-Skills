# Construction patterns

How common elements are really built: what to model, and with which construction. Proportions are classical defaults. The reference overrides them.

## Walls and openings

- **Wall:** a solid of real thickness, with openings cut through it (`extrude` with holes, or `notchOutline` for openings down to the floor). Reveals show the thickness.
- **Window:**
  - a surround (an architrave swept around the opening, or a frame with sill and head);
  - a sill projecting with a drip;
  - a recessed frame and glazing bars;
  - glass set in from the face.

  The sill's top sits clearly proud of the opening's bottom face (a real step), or exactly on it. Never a few millimetres off, which is close enough to flicker.
- **Door:** a surround, the door leaf recessed in the reveal, and a threshold seated into the floor.
- **On curved walls,** every surround follows the curve: sweep it along the host's curve.

## Classical orders

- **Column:**
  - a plinth and base mouldings (a lathe profile);
  - a shaft with entasis (a lathe), fluted if the reference shows it;
  - a capital: Doric echinus and abacus as a lathe and a block; Ionic volutes; Corinthian acanthus bell (see `env-ornament-and-relief`).

  Column height is about 7–10 lower diameters, by order.
- **Entablature:** architrave, frieze and cornice, each a swept profile. Over columns or pilasters it often breaks forward. Read the reference for how deep: shallow breaks read flat.
- **Pilaster:** a flat column with the same base, capital and proportions, seated into the wall. The entablature breaks over it.
- **Pedestal and balustrade:** plinth, die and cap mouldings. Balusters are lathes spaced about 0.12–0.2 m, seated in the base rail and the handrail. Posts at the ends and corners.

## Arches and vaults

- **Arch:** voussoir rings concentric with the opening, from one curve: round, segmental, pointed or elliptical. Then an archivolt moulding swept along the extrados or intrados, imposts at the springing, and a keystone within the ring.
- **Arcade:** repeated bays from one definition, with piers or columns between them and a spandrel wall above.
- **Barrel vault:** a shell of real thickness. Transverse ribs at the bays, as swept profiles along the vault curve.
- **Groin or rib vault:** ribs as sweeps along the diagonal and transverse curves, with infill shells between them. Bosses at the crossings.
- **Dome:** a lathe shell of real thickness, with a drum below (a wall wrapped on a cylinder surface, with openings) and a lantern above. Where the reference shows ribs or coffers, they are real: swept ribs, or coffers sunk into the shell.

## Roofs

- **Pitched roof:** rafters or a deck, a covering of tile courses as real rows where they read at the hero distance (otherwise relief in the material), ridge and hip pieces, fascia, eaves overhang.
- **Flat roof:** a deck that runs into the parapet, a parapet with coping, and drainage features where seen.
- **Domes and spires:** a lathe or loft, with the covering pattern following the curvature.

## Stairs

- Treads and risers with nosings. Stringers or a solid substructure, and landings.
- The balustrade follows the pitch, returning at the landings.
- A real riser of 0.15–0.18 m. The number of steps fits the height.

## Hard-surface objects (vehicles, furniture, machines)

- Start from the real assembly: a frame or chassis, then panels, joints and fasteners.
- Panels have thickness and real gaps. Edges are bevelled or rounded, as made.
- Glass is closed: inner and outer surfaces, no see-through bodies.
- Wheels have tyres, rims and hubs. A vehicle body is closed.
- Moving parts have clearance through their whole motion (`env-geometry-audit`).

## Organic or sculpted architecture

For walls carved like ivory or stone lace: the wall mass is cut into depth layers, with no flat plane carrying the ornament. Projecting piers of clustered shafts, panels sunk in moulded frames, arches stepping inward order by order, cornices breaking forward over every pier, relief in the fields. See `env-ornament-and-relief`.
