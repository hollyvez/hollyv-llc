import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState, useEffect } from "react";

const CountUp = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start > end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [end, duration, inView]);

  return <span ref={ref}>{count}</span>;
};

export const Stats = () => {
  return (
    <section className="py-20 bg-navy text-white">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-5xl font-bold mb-2">
              <CountUp end={100} />+
            </h3>
            <p className="text-coral">FORTUNE 500 BRANDS</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-5xl font-bold mb-2">
              <CountUp end={14} />
            </h3>
            <p className="text-coral">0-1 PRODUCTS</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-5xl font-bold mb-2">
              <CountUp end={68} />+
            </h3>
            <p className="text-coral">COUNTRIES</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};