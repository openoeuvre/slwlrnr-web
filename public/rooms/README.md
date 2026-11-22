# Room photographs

Drop calibrated room shots here. Referenced as `/rooms/<filename>` from a
`RoomScene` in `src/components/room-plate.tsx`.

## What makes a usable shot

- **Camera square to the wall.** Perpendicular, not angled. This is the whole
  requirement — a flat rectangle composites correctly onto a flat parallel
  plane, and incorrectly onto an angled one.
- **Something of known width in frame**, so real scale can be derived. A
  doorway (usually 32" or 36"), an outlet plate (4.5"), a light switch (2.75"),
  or a piece of furniture you can measure.
- **Plain wall where the work will hang.** Leave room for a 48" piece.
- **Even light, no strong cast shadows** across the hanging area.
- 2000px or more on the long edge, JPEG.

## Calibration

Three numbers per photo, measured once:

| Field | Meaning |
| --- | --- |
| `wallInches` | Real inches of wall spanned by the full width of the square crop |
| `anchorX` | Horizontal centre of a hung work, as % of the crop |
| `anchorY` | Vertical centre of a hung work, as % of the crop |

Note the viewport is square and the photo is cover-cropped to it, so measure
`wallInches` across the *cropped* width, not the original frame.
