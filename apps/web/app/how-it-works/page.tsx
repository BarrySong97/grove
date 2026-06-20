import { PageHeader } from "@/components/shared/PageHeader";
import { CompareCards } from "@/components/how-it-works/CompareCards";
import { StepFlow } from "@/components/how-it-works/StepFlow";
import { LifecycleCards } from "@/components/how-it-works/LifecycleCards";
import { CtaCard } from "@/components/how-it-works/CtaCard";

export default function Page() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title={
          <>
            One repo. Many branches. <span className="text-grn-ink">No more stashing.</span>
          </>
        }
      >
        Grove is built on <b className="font-semibold text-ink">git worktrees</b> — a native git
        feature that lets one repository have many branches checked out at once, each in its own
        folder. Grove makes that a menu-bar click instead of a string of terminal commands.
      </PageHeader>

      <main className="pb-[92px] pt-6">
        <div className="mx-auto max-w-[820px] px-8">
          <CompareCards />
          <StepFlow />
          <LifecycleCards />
          <CtaCard />
        </div>
      </main>
    </>
  );
}
