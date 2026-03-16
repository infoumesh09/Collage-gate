import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline } from 'react-icons/io5';

const menuItems = [
  { title: 'Home', id: 'home' },
  { title: 'Login / Register', id: 'auth' },
  { title: 'Dashboard', id: 'admin' },
  { title: 'Scanning', id: 'scanning' },
];

const StaggeredMenu = ({ isOpen, onClose, onNavigate, userRole }) => {
  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const underlayVariants = {
    closed: {
      x: '-100%',
      transition: {
        duration: 0.6,
        ease: [0.76, 0, 0.24, 1],
      },
    },
    open: (i) => ({
      x: 0,
      transition: {
        duration: 0.8,
        delay: i * 0.1,
        ease: [0.76, 0, 0.24, 1],
      },
    }),
  };

  const menuVariants = {
    closed: {
      x: '-100%',
      transition: {
        duration: 0.6,
        ease: [0.76, 0, 0.24, 1],
      },
    },
    open: {
      x: 0,
      transition: {
        duration: 0.8,
        delay: 0.2,
        ease: [0.76, 0, 0.24, 1],
      },
    },
  };

  const itemVariants = {
    closed: {
      x: -80,
      opacity: 0,
    },
    open: (i) => ({
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.5 + i * 0.1,
        ease: [0.76, 0, 0.24, 1],
      },
    }),
  };

  const handleItemClick = (id) => {
    if (id === 'admin' && userRole !== 'admin') {
      onNavigate('auth');
    } else {
      onNavigate(id);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-start">
          {/* Click-away Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] cursor-pointer"
          />

          {/* Layered Underlays */}
          <motion.div
            custom={0}
            variants={underlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 left-0 bottom-0 w-full md:w-[500px] bg-accent/20 z-[-1]"
          />
          <motion.div
            custom={1}
            variants={underlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 left-0 bottom-0 w-full md:w-[500px] bg-accent/40 z-[-1]"
          />

          {/* Main Menu Panel */}
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="relative w-full md:w-[500px] h-full bg-primary border-r border-white/10 p-12 flex flex-col justify-between"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer"
            >
              <IoCloseOutline className="text-3xl text-white group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Menu Items */}
            <nav className="mt-20">
              <ul className="space-y-6">
                {menuItems.map((item, i) => (
                          <motion.li
                            key={item.title}
                            custom={i}
                            variants={itemVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                          >
                            <button
                              onClick={() => handleItemClick(item.id)}
                              className="group flex items-baseline gap-4 cursor-pointer text-left"
                            >
                              <span className="text-xs font-sans text-accent/60 group-hover:text-accent transition-colors">
                                0{i + 1}
                              </span>
                              <span className="text-5xl md:text-6xl font-serif text-white group-hover:translate-x-4 transition-transform duration-300">
                                {item.title}
                              </span>
                            </button>
                          </motion.li>
                        ))}
              </ul>
            </nav>

            {/* Footer Info removed as requested */}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StaggeredMenu;
