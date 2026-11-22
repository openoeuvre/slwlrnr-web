/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Artwork is served straight from Shopify's CDN, which does the resizing.
    // Registered here rather than passed as a `loader` prop — next/image is a
    // client component and functions cannot cross the server/client boundary.
    //
    // With a custom loader, Next skips its own optimizer, so `remotePatterns`
    // is not consulted and is deliberately absent.
    loader: "custom",
    loaderFile: "./src/lib/shopify-image-loader.ts",
  },
  // The gated PDF route reads card PDFs from disk. On Vercel, public/ is not
  // part of a function's bundle unless traced in explicitly.
  outputFileTracingIncludes: {
    "/api/learn/pdf/[slug]": ["./public/learn/pdf/**/*"],
  },
};

export default nextConfig;
