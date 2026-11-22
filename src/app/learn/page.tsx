import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/ui";
import { getEntitlements } from "@/lib/entitlements-server";
import { cardSummaries, deckCounts } from "@/lib/learn";
import { CardLibrary } from "./card-library";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Art-history lesson cards. Each pairs a real, public-domain artwork with one idea and one thing to make.",
};

// Reads the session cookie, so it renders per request.
export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const { learn } = await getEntitlements();
  const counts = deckCounts();

  return (
    <Container>
      <PageHeader
        eyebrow="Learn"
        title="Lesson cards"
        intro={`Each card pairs one real artwork — public domain, from the world's open museum collections — with one idea and one thing to make. ${counts.total} cards across ${counts.strands} strands. ${counts.free} are free to everyone; the rest come with the Learn subscription.`}
      />
      <CardLibrary cards={cardSummaries()} entitled={learn} counts={counts} />
    </Container>
  );
}
