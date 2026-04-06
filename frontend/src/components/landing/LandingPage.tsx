import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";
import { Features } from "./Features";
import { Hero } from "./Hero";
import { Navbar } from "./Navbar";
import { Pricing } from "./Pricing";

export default function LandingPage() {
  return (
    <div className="w-full relative bg-[#fafcff] flex flex-col items-start py-0 px-12 box-border isolate min-h-[900px] leading-[normal] tracking-[normal] mq825:pl-6 mq825:pr-6 mq825:box-border">
      <Navbar />

      <main className="self-stretch flex items-start py-12 px-0 box-border isolate max-w-full z-[1] mq1410:pt-5 mq1410:pb-5 mq1410:box-border">
        <section className="flex-1 flex flex-col items-start isolate max-w-full z-[0] text-center text-[64px] text-[#1b2028] font-[Manrope]">
          <Hero />
          <Features />
          <Pricing />
          <FinalCTA />
        </section>
      </main>

      <Footer />
    </div>
  );
}
