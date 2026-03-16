import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdArrowOutward, MdArrowDownward } from 'react-icons/md';

const Hero = () => {
  const words = ["not smarter entry?", "trust manual checks?", "not automated gates?", "wait any longer?"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden snap-start">
      {/* Video Background - Commented out to show global Spline background */}
      {/* <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-40"
        >
          <source src="https://www.orfeoai.com/wp-content/uploads/2025/compressed.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/50 to-primary/90"></div>
      </div> */}

      {/* Main Centered Content */}
      <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-5xl mx-auto"
        >
          <p className="text-4xl md:text-6xl lg:text-7xl font-light leading-tight">
            <span className="italic font-serif text-accent">Uni-Gate</span> Smart Campus Access.
            <br />
            <br />
            Why 
            <span className="text-accent font-bold inline-block min-w-[300px]">
              <motion.span
                key={currentWordIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {words[currentWordIndex]}
              </motion.span>
            </span>
          </p>
          
          <div className="mt-12 flex justify-center">
            <a
              href="#"
              className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-sm font-bold tracking-wide uppercase backdrop-blur-sm group"
            >
              <span>Get Started</span>
              <MdArrowOutward className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom Left Info Box - Shifted to corner and smaller */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute bottom-12 left-0 md:left-12 max-w-sm z-20"
      >
        <div className="bg-primary/30 backdrop-blur-md p-6 border border-white/5 rounded-2xl shadow-xl">
          <h2 className="text-xl font-serif mb-3 leading-tight">
            Stay Ahead with best AI
          </h2>
          <p className="text-text-secondary text-xs leading-relaxed">
            Secure, interactive entry for students using ID card scanning, face recognition, and vehicle number detection — all in real time.
          </p>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 right-10 md:right-20 z-20"
      >
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <div className="w-2 h-2 bg-white rounded-full mb-1"></div>
        </div>
      </motion.div>
    </section>
  );
};
export default Hero;
