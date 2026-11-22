import { Container } from "@/components/container";
import { ButtonLink, PageHeader } from "@/components/ui";

export default function NotFound() {
  return (
    <Container>
      <PageHeader
        eyebrow="404"
        title="Nothing here"
        intro="The page you asked for does not exist, or has not been made yet."
      />
      <div className="flex flex-wrap gap-3 pb-32">
        <ButtonLink href="/">Home</ButtonLink>
        <ButtonLink href="/gallery" variant="outline">
          Gallery
        </ButtonLink>
      </div>
    </Container>
  );
}
