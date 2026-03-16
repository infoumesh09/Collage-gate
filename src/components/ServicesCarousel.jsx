import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdArrowForward, MdArrowBack } from 'react-icons/md';

const services = [
  {
    title: 'Unified Gate Access',
    description:
      'Single platform for pedestrian and vehicle entry using QR / ID scanning, face verification and license plate recognition at campus gates.'
  },
  {
    title: 'Real-Time Attendance & Logs',
    description:
      'Automatically capture every entry and exit into a central log, see who is on campus in real time and export histories for audits or investigations.'
  },
  {
    title: 'Admin Dashboard & Control',
    description:
      'Give security and operations teams a live dashboard to monitor gates, manage users and vehicles, configure rules and respond quickly to incidents.'
  }
];

const ServicesCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(1); // Start with center card

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % services.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + services.length) % services.length);
  };

  const getCardStyle = (index) => {
    // Calculate relative position based on current index
    const diff = (index - currentIndex + services.length) % services.length;
    
    // Center card
    if (diff === 0) {
      return {
        scale: 1,
        opacity: 1,
        blur: '0px',
        zIndex: 10,
        x: '0%',
        rotateY: 0
      };
    }
    
    // Right card (next)
    if (diff === 1) {
      return {
        scale: 0.85,
        opacity: 0.8,
        blur: '1px',
        zIndex: 5,
        x: '50%',
        rotateY: -15
      };
    }
    
    // Left card (prev) - effectively when diff is 2 in a 3-item array
    return {
      scale: 0.85,
      opacity: 0.8,
      blur: '1px',
      zIndex: 5,
      x: '-50%',
      rotateY: 15
    };
  };

  const handleWheel = (e) => {
    // Prevent default scroll behavior only if we are scrolling horizontally or significantly enough
    // But since this is a carousel, we might just want to capture the intent
    
    // Simple debounce logic could be added here if needed, but for now we'll just check delta
    if (Math.abs(e.deltaX) > 20 || Math.abs(e.deltaY) > 20) {
      if (e.deltaX > 0 || e.deltaY > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <section 
      className="py-20 min-h-screen flex flex-col items-center justify-center snap-start overflow-hidden perspective-1000"
      onWheel={(e) => {
        const target = e.currentTarget;
        if (!target.isScrolling) {
          target.isScrolling = true;
          handleWheel(e);
          setTimeout(() => {
            target.isScrolling = false;
          }, 500);
        }
      }}
    >
      <div className="container mx-auto px-6 mb-12">
        <h2 className="text-4xl md:text-6xl font-serif text-center">Our Services</h2>
      </div>

      <div className="relative w-full max-w-6xl h-[500px] flex items-center justify-center">
        {services.map((service, index) => {
          const style = getCardStyle(index);
          
          return (
            <motion.div
              key={index}
              className="absolute w-[350px] md:w-[400px] p-8 border border-white/10 rounded-2xl backdrop-blur-md bg-primary/30 cursor-pointer shadow-2xl"
              initial={false}
              animate={{
                scale: style.scale,
                opacity: style.opacity,
                filter: `blur(${style.blur})`,
                zIndex: style.zIndex,
                x: style.x,
                rotateY: style.rotateY
              }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              onClick={() => setCurrentIndex(index)}
            >
              <div className="h-12 w-12 bg-accent/20 rounded-full flex items-center justify-center mb-6 text-accent">
                {index + 1}
              </div>
              <h3 className="text-2xl font-bold mb-4 font-serif">{service.title}</h3>
              <p className="text-text-secondary leading-relaxed text-sm md:text-base">
                {service.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default ServicesCarousel;
