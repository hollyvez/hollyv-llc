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
            src="/lovable-uploads/f0eff5c5-547d-42c8-bf0e-a9652045a413.png"
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
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 max-w-2xl mx-auto px-6"
      >
        <blockquote className="text-center">
          <p className="text-xl italic text-gray-300 mb-4">
            "Holly helped us to create a focused product strategy that changed the trajectory of our company. And she's also just really great to work with. I can't recommend hiring her enough."
          </p>
          <footer className="text-coral">
            — Brendan K <span className="text-gray-400">(AI Startup)</span>
          </footer>
        </blockquote>
      </motion.div>
    </div>
  );
};