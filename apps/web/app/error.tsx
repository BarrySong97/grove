"use client";

import { Button } from "@heroui/react/button";

/** Route-segment error boundary — shown when a page throws at runtime. */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex max-w-[820px] flex-col items-start px-8 pb-[40px] pt-[110px]">
      <span className="eyebrow">Something went wrong</span>
      <h1 className="mt-4 text-[clamp(36px,5vw,50px)] font-[680] leading-[1.05] -tracking-[1.6px] text-balance">
        That didn’t go as planned.
      </h1>
      <p className="mt-5 max-w-[600px] text-[18px] leading-[1.55] text-ink-2 text-pretty">
        An unexpected error interrupted this page. Try again — if it keeps
        happening, the issue is on our end.
      </p>
      <Button
        size="lg"
        onPress={() => reset()}
        className="mt-8 h-auto cursor-pointer gap-2 rounded-[11px] border-[0.5px] border-transparent px-6 py-[13px] text-[15.5px] font-semibold -tracking-[0.1px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.10)] transition hover:-translate-y-px"
        style={{ background: "var(--grn)" }}
      >
        Try again
      </Button>
    </main>
  );
}
