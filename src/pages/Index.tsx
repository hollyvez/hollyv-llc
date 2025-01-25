import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Stats } from "@/components/Stats";
import { Contact } from "@/components/Contact";

const Index = () => {
  return (
    <main className="min-h-screen bg-cream">
      <Hero />
      <Services />
      <Stats />
      <Contact />
    </main>
  );
};

export default Index;