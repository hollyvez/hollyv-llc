import { Rocket, Target, Zap } from "lucide-react";
import { ServiceCard } from "./ServiceCard";

export const Services = () => {
  return (
    <section id="services" className="py-20 bg-cream">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-navy">
          How I Can Help
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <ServiceCard
            title="Growth"
            description="Building, launching, and growing products in startups looks much different than in large companies. With years of experience in PLG and GTM motions, I have the right experience to help startups grow."
            icon={Rocket}
            delay={0.2}
          />
          <ServiceCard
            title="Focus"
            description="One of the hardest things for startups to know is what to focus on. As a systems-thinker, I'm able to help you see the highest order opportunities."
            icon={Target}
            delay={0.4}
          />
          <ServiceCard
            title="Accelerate"
            description="Startups must move fast. As a long-time product leader, I help teams deliver the right things quickly."
            icon={Zap}
            delay={0.6}
          />
        </div>
      </div>
    </section>
  );
};