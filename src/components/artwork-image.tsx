import Image from "next/image";
import type { ArtworkImage as ArtworkImageData } from "@/data/artworks";

/**
 * Artwork from Shopify's CDN.
 *
 * Resizing is handled by the global loader registered in next.config.mjs
 * (`src/lib/shopify-image-loader.ts`) — deliberately NOT a `loader` prop,
 * which cannot be passed from a server component.
 */
export function ArtworkImage({
  image,
  sizes,
  priority = false,
  className = "",
  alt,
}: {
  image: ArtworkImageData;
  /** Required for correct srcset selection. */
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Override when the image plays a different role, e.g. decorative. */
  alt?: string;
}) {
  return (
    <Image
      src={image.url}
      alt={alt ?? image.alt}
      width={image.width}
      height={image.height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
