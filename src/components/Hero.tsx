import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LinkedinIcon, Calendar, Mail, Phone } from "lucide-react";

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
          <Dialog>
            <DialogTrigger asChild>
              <button className="inline-block bg-coral text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-colors mb-16 md:mb-0">
                Let's Connect
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold mb-4">Let's Connect!</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href="mailto:hmeibling@gmail.com"
                      className="flex items-center justify-center"
                    >
                      <Mail className="mr-2" />
                      hmeibling@gmail.com
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href="tel:+17209349848"
                      className="flex items-center justify-center"
                    >
                      <Phone className="mr-2" />
                      (720) 934-9848
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href="https://www.linkedin.com/in/hollymeibling/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                    >
                      <LinkedinIcon className="mr-2" />
                      Connect on LinkedIn
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href="https://calendar.app.google/LL4bK4VwUvwkJ6B6A" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                    >
                      <Calendar className="mr-2" />
                      Schedule a Meeting
                    </a>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-2xl mx-auto px-6"
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