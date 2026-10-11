import { Closing } from "@/components/sections/closing";
import { Features } from "@/components/sections/features";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { Moments } from "@/components/sections/moments";
import { SelfHost } from "@/components/sections/self-host";
import { Tour } from "@/components/sections/tour";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Moments />
        <Tour />
        <Features />
        <SelfHost />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
