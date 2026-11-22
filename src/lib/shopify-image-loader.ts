"use client";

/**
 * Global custom image loader, wired up in next.config.mjs.
 *
 * This has to be a loader *file* rather than a `loader` prop. `next/image` is
 * a client component, and a function cannot be serialised across the server →
 * client boundary, so passing the loader as a prop from a server component
 * throws at runtime. Registering it in the config puts the function in the
 * client bundle where it belongs.
 *
 * Shopify already generates and compresses responsive variants, so we let its
 * CDN do the resizing and skip Vercel's optimizer entirely. Re-optimising an
 * already-optimised CDN image costs money and buys nothing.
 */
export default function shopifyImageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Local files (anything in /public) have no resizing service behind them.
  if (!src.startsWith("http")) return src;

  try {
    const url = new URL(src);
    url.searchParams.set("width", String(width));
    return url.toString();
  } catch {
    return src;
  }
}
