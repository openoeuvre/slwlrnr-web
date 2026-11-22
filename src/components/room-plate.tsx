/**
 * RoomPlate — the in-situ view, composited at runtime.
 *
 * There is no room mockup per artwork. There is one calibrated room
 * photograph, and every artwork is placed into it at correct scale
 * automatically from its real inch dimensions.
 *
 * The requirement on the photograph is that the camera be square to the wall.
 * A straight-on shot composites convincingly because a flat rectangle pasted
 * onto a flat parallel plane is geometrically correct.
 */

import { ArtworkImage } from "./artwork-image";
import type { Artwork } from "@/data/artworks";

/**
 * Calibration for one room photograph. Measure once per photo.
 *
 * The viewport is square and the photo is pre-cropped square, so one percent
 * of width equals one percent of height in pixels — which is what lets a
 * single `wallInches` figure drive both dimensions.
 */
export type RoomScene = {
  id: string;
  /** Photo in /public. Omit to draw the schematic instead. */
  src?: string;
  /** Real inches of wall spanned by the full width of the square crop. */
  wallInches: number;
  /** Where the centre of a hung work sits, as % of the crop. */
  anchorX: number;
  anchorY: number;
  note?: string;
};

/** Fallback: 12ft × 12ft elevation, floor at 9ft, works hung 60" to centre. */
export const SCHEMATIC: RoomScene = {
  id: "schematic",
  wallInches: 144,
  anchorX: 50,
  anchorY: (48 / 144) * 100,
  note: "Schematic — drawn to scale",
};

/**
 * Courtyard lounge. Pre-cropped square, so no object-cover guesswork.
 *
 * `wallInches` was derived from the sofa: body ≈ 96" wide and ≈ 32" overall
 * height, which put the crop at ~134". The pouf (≈29") and rug (≈116") both
 * land in normal ranges at that figure, so the three agree.
 *
 * ►► If you learn the real sofa length, correct this and everything rescales:
 *      wallInches = 134 × (trueSofaInches / 96)
 */
export const COURTYARD: RoomScene = {
  id: "courtyard-lounge",
  src: "/rooms/courtyard-lounge.jpg",
  wallInches: 134,
  anchorX: 50,
  anchorY: 35, // 60" above a floor line at ~79.5%
  note: "Scale derived from a 96in sofa",
};

export const ROOMS = { schematic: SCHEMATIC, courtyard: COURTYARD };

const SCENE = 144;
const FLOOR_Y = 108;
const pct = (n: number) => `${(n / SCENE) * 100}%`;

export function RoomPlate({
  artwork,
  scene = COURTYARD,
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  artwork: Artwork;
  scene?: RoomScene;
  className?: string;
  sizes?: string;
}) {
  // Percentages of the square viewport. Because the viewport is square, the
  // same inches-per-percent figure governs both axes.
  const wPct = (artwork.widthIn / scene.wallInches) * 100;
  const hPct = (artwork.heightIn / scene.wallInches) * 100;

  return (
    <div className={`relative overflow-hidden bg-wash ${className}`}>
      {scene.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={scene.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Schematic />
      )}

      {/* The work, hung at the scene's anchor, with a float frame.
          Shadow falls down-and-right to match the light in the courtyard. */}
      <div
        className="absolute border border-ink/20 bg-paper p-[0.5%] shadow-[4px_5px_18px_rgba(0,0,0,0.18)]"
        style={{
          width: `${wPct}%`,
          height: `${hPct}%`,
          left: `${scene.anchorX - wPct / 2}%`,
          top: `${scene.anchorY - hPct / 2}%`,
        }}
      >
        <ArtworkImage
          image={artwork.image}
          alt=""
          sizes={sizes}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

/** Elevation drawing used when no room photograph is calibrated. */
function Schematic() {
  return (
    <>
      <div
        className="absolute inset-x-0 top-0 bg-[hsl(220_8%_94%)]"
        style={{ height: pct(FLOOR_Y) }}
      />
      <div
        className="absolute inset-x-0 bottom-0 bg-[hsl(220_6%_88%)]"
        style={{ height: pct(SCENE - FLOOR_Y) }}
      />
      <div
        className="absolute inset-x-0 border-t border-rule-strong"
        style={{ top: pct(FLOOR_Y) }}
      />
      {/* Bench, 60" × 30" — the human-scale reference */}
      <div
        className="absolute border border-rule-strong bg-[hsl(220_6%_91%)]"
        style={{
          left: pct(8),
          width: pct(60),
          top: pct(FLOOR_Y - 30),
          height: pct(30),
        }}
      />
      <div
        className="absolute border-l border-rule-strong"
        style={{ left: pct(130), top: pct(FLOOR_Y - 60), height: pct(60) }}
      />
    </>
  );
}
