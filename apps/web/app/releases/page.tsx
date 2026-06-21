import { PageHeader } from "@/components/shared/PageHeader";
import { ReleaseTimeline } from "@/components/releases/ReleaseTimeline";
import { Footer } from "@/components/layout/Footer";

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="Release notes"
        title={
          <>
            What’s <span className="text-grn-ink">new in Grove.</span>
          </>
        }
      >
        Every release, in order. Grove updates automatically — but here’s exactly what changed and
        why.
      </PageHeader>

      <ReleaseTimeline />
      <Footer />
    </>
  );
}
