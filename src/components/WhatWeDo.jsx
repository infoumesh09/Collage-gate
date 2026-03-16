import React from 'react';
import { motion } from 'framer-motion';

const WhatWeDo = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center py-24 z-10 snap-start">
      <div className="container mx-auto px-6 max-w-4xl text-center">
        {/* White Dot */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-3 h-3 bg-white rounded-full mx-auto mb-12"
        />

        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-serif mb-12 tracking-wide"
        >
          WHAT IT IS
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8 text-text-secondary/90 text-sm md:text-lg leading-relaxed md:leading-loose font-light"
        >
          <p>
            Smart access control for modern campuses.
          </p>
          <p>
            UniGate unifies ID scanning, face verification and vehicle plate recognition
            to automate pedestrian and vehicle entry while keeping admins in full control
            of who is on campus.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhatWeDo;
