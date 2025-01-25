import { Mail, Phone } from "lucide-react";

export const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-cream">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-navy">
          Get In Touch
        </h2>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8">
          <a
            href="tel:720-934-9848"
            className="flex items-center gap-3 text-lg text-navy hover:text-coral transition-colors"
          >
            <Phone className="h-6 w-6" />
            720-934-9848
          </a>
          <a
            href="mailto:hmeibling@gmail.com"
            className="flex items-center gap-3 text-lg text-navy hover:text-coral transition-colors"
          >
            <Mail className="h-6 w-6" />
            hmeibling@gmail.com
          </a>
        </div>
      </div>
    </section>
  );
};