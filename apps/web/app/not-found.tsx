import type { Metadata } from "next";
import { GhostButton } from "@/components/shared/GhostButton";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <main className="mx-auto flex max-w-[820px] flex-col items-start px-8 pb-[40px] pt-[110px]">
        <span className="eyebrow">404</span>
        <h1 className="mt-4 text-[clamp(36px,5vw,50px)] font-[680] leading-[1.05] -tracking-[1.6px] text-balance">
          This worktree doesn’t exist.
        </h1>
        <p className="mt-5 max-w-[600px] text-[18px] leading-[1.55] text-ink-2 text-pretty">
          The page you’re looking for moved or never existed. Head back to the
          start and pick up from there.
        </p>
        <div className="mt-8">
          <GhostButton route="home">Back to home</GhostButton>
        </div>
      </main>
      <Footer />
    </>
  );
}
