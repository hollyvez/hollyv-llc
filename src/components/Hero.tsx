import { motion } from "framer-motion";

export const Hero = () => {
  return (
    <div className="relative min-h-screen bg-navy text-white flex items-center">
      <div className="container mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src="/lovable-uploads/7f44510f-85df-4f53-a9d0-e02a9f50c3d7.png"
            alt="Professional headshot"
            className="rounded-full w-64 h-64 object-cover mx-auto md:mx-0"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center md:text-left"
        >
          <h1 className="text-5xl font-bold mb-4">Holly Vezina</h1>
          <h2 className="text-2xl text-coral mb-6">
            FRACTIONAL HEAD OF PRODUCT/CPO
          </h2>
          <p className="text-lg mb-8 text-gray-300">
            As a Product-executive turned founder, I understand the challenges of building
            a company and bringing product capabilities and mindset onto your team.
          </p>
          <a
            href="#contact"
            className="inline-block bg-coral text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Let's Connect
          </a>
        </motion.div>
      </div>
    </div>
  );
};