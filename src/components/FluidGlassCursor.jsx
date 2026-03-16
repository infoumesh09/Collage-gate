import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

const FluidGlassCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // Softer springs for a "following" effect with slight lag
  const springConfig = { damping: 30, stiffness: 120, mass: 0.8 };
  const x = useSpring(0, springConfig);
  const y = useSpring(0, springConfig);
  
  // Outer glow trail follows even more slowly
  const springConfigTrail = { damping: 25, stiffness: 80, mass: 1.2 };
  const trailX = useSpring(0, springConfigTrail);
  const trailY = useSpring(0, springConfigTrail);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      x.set(clientX);
      y.set(clientY);
      trailX.set(clientX);
      trailY.set(clientY);
      setMousePosition({ x: clientX, y: clientY });
    };

    const handleMouseOver = (e) => {
      if (e.target.closest('button, a, .cursor-pointer')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [x, y, trailX, trailY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Outer Glow/Fluid Layer */}
      <motion.div
        style={{
          x: trailX,
          y: trailY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 2.5 : 1,
          opacity: isHovering ? 0.3 : 0.15,
        }}
        className="absolute w-64 h-64 bg-accent/30 rounded-full blur-[80px]"
      />

      {/* Glass Cursor Body */}
      <motion.div
        style={{
          x: x,
          y: y,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 150 : 30,
          height: isHovering ? 150 : 30,
          backgroundColor: isHovering ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)',
        }}
        className="absolute flex items-center justify-center rounded-full backdrop-blur-[2px] shadow-[0_0_15px_rgba(255,255,255,0.2)]"
      >
      </motion.div>

      {/* Fluid Distortion Effect (CSS only SVG Filter) */}
      <svg className="hidden">
        <defs>
          <filter id="fluid-glass-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default FluidGlassCursor;
