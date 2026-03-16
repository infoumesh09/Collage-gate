import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdArrowOutward, MdAdd, MdClose } from 'react-icons/md';
import StaggeredMenu from './StaggeredMenu';

const Header = ({ onNavigate, userRole, hidePrimaryActions = false }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAdmin = userRole === 'admin';

  const handlePrimaryAction = () => {
    if (isAdmin) {
      onNavigate('admin');
    } else {
      onNavigate('auth');
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { 
        timeZone: 'America/New_York', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      };
      setTime('EST ' + now.toLocaleTimeString('en-US', options));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-primary/90 backdrop-blur-md py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-3 items-center">
        {/* Left: Brand + Menu */}
        <div className="flex items-center gap-4">
          {!hidePrimaryActions && (
            <>
              <button 
                onClick={() => onNavigate('home')}
                className="text-xl font-serif font-bold tracking-wider flex items-center"
              >
                <span className="hidden md:inline">UNIGATE</span>
              </button>
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="hidden md:flex items-center gap-1.5 text-[10px] font-bold tracking-widest hover:text-accent transition-colors uppercase"
              >
                <MdAdd className="text-base" />
                Menu
              </button>
            </>
          )}
        </div>

        {/* Center: Time */}
        <div className="hidden md:flex justify-center">
          <span className="text-[10px] font-medium tracking-widest text-text-secondary/80">
            {time}
          </span>
        </div>

        {/* Right: CTA */}
        <div className="flex justify-end items-center gap-4">
          {!hidePrimaryActions && (
            <>
              <button
                onClick={handlePrimaryAction}
                className="hidden md:flex items-center gap-1.5 px-6 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm group rounded-full text-white"
              >
                <span>{isAdmin ? 'Dashboard' : 'Login'}</span>
                <MdArrowOutward className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
              <button 
                className="md:hidden text-2xl"
                onClick={() => setIsMenuOpen(true)}
              >
                <MdAdd />
              </button>
            </>
          )}
        </div>
      </div>

      <StaggeredMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onNavigate={onNavigate}
        userRole={userRole}
      />
    </header>
  );
};
export default Header;
