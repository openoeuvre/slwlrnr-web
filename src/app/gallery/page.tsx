import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Note, PageHeader } from "@/components/ui";
import { getArtworks } from "@/lib/catalogue";
import type { Artwork } from "@/data/artworks";
import { GalleryGrid } from "./gallery-grid";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Original works from the SLWLRNR studio catalogue, as archival prints and ready-to-hang editions.",
};

export default async function GalleryPage() {
  let artworks: Artwork[];
  let error: string | null = null;

  try {
    artworks = await getArtworks();
  } catch (e) {
    artworks = [];
    error = e instanceof Error ? e.message : "Could not reach Shopify.";
  }

  return (
    <Container>
      <PageHeader
        eyebrow="Gallery"
        title="Original works"
        intro="Original works from the studio catalogue, offered as archival photo metallic prints. Each is available rolled and unmounted, or face-mounted to acrylic and ready for the wall."
      />
      {error ? (
        <div className="pb-24">
          <Note>{error}</Note>
        </div>
      ) : (
        <GalleryGrid artworks={artworks} />
      )}
    </Container>
  );
}
