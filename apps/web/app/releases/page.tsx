import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReleaseTimeline } from "@/components/releases/ReleaseTimeline";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Release notes",
  description:
    "Every Grove release, in order — exactly what changed in each version and why.",
  alternates: {
    canonical: "/releases",
  },
  openGraph: {
    title: "Release notes · Grove",
    description:
      "Every Grove release, in order — exactly what changed in each version and why.",
    url: "/releases",
  },
};

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
