import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
}

export const ServiceCard = ({ title, description, icon: Icon, delay = 0 }: ServiceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="text-coral mb-4">
        <Icon size={40} />
      </div>
      <h3 className="text-xl font-bold mb-2 text-navy">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};