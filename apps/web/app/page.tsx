import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { Faq } from "@/components/home/Faq";
import { ClosingCta } from "@/components/home/ClosingCta";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/shared/JsonLd";

export default function Page() {
  return (
    <>
      <JsonLd />
      <Hero />
      <Features />
      <Faq />
      <ClosingCta />
      <Footer />
    </>
  );
}
