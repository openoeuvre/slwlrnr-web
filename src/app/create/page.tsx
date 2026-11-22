import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageHeader } from "@/components/ui";
import { Paywall } from "@/components/paywall";
import { getEngineStatus } from "@/lib/create/inference";
import { getEntitlements } from "@/lib/entitlements-server";
import { CreateStudio } from "./create-studio";

export const metadata: Metadata = {
  title: "Create",
  description:
    "Computational collage. Bring two or three of your own images and blend them through a natural system.",
};

// Tier is read from the session on every request.
export const dynamic = "force-dynamic";

export default async function CreatePage() {
  const [entitlements, engine] = await Promise.all([
    getEntitlements(),
    getEngineStatus(),
  ]);

  return (
    <Container wide>
      <PageHeader
        eyebrow="Create · computational collage"
        title="Blend your sources through a natural system"
        intro="Bring two or three of your own images. The engine reads what each one is made of and fuses them into a new form, shaped by a process borrowed from nature — reaction–diffusion, mineral banding, mycelial growth. It does not average your images; it negotiates between them."
      />

      <CreateStudio
        catalogue={engine.ok ? engine.catalogue : null}
        engineProblem={engine.ok ? null : engine}
        studio={entitlements.create}
        signedIn={entitlements.account}
      />

      {!entitlements.create && (
        <section className="pt-28">
          <Paywall
            plan="create"
            headline="Every natural system, four variations at a time, full resolution."
            points={[
              "All nine natural systems, plus Signature",
              "Up to four variations from one set of sources",
              "Seed control, to return to a result and push it further",
              "Direction — steer palette and material in a few words",
              "Full-resolution output, with print-scale upscaling to follow",
            ]}
          />
        </section>
      )}
    </Container>
  );
}
