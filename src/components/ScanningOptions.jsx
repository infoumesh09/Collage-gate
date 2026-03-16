import React from 'react';
import { motion } from 'framer-motion';
import { MdPerson, MdDirectionsCar, MdLogin, MdLogout, MdArrowForward } from 'react-icons/md';

const ScanningOptions = ({ onSelect }) => {
  const options = [
    {
      id: 'pedestrian_entry',
      title: 'Pedestrian Entry',
      description: 'Facial recognition for student & staff entry',
      icon: MdPerson,
      actionIcon: MdLogin,
      color: 'accent',
      type: 'pedestrian'
    },
    {
      id: 'pedestrian_exit',
      title: 'Pedestrian Exit',
      description: 'Facial recognition for student & staff exit',
      icon: MdPerson,
      actionIcon: MdLogout,
      color: 'accent',
      type: 'pedestrian'
    },
    {
      id: 'vehicle_entry',
      title: 'Vehicle Entry',
      description: 'License plate recognition for vehicle entry',
      icon: MdDirectionsCar,
      actionIcon: MdLogin,
      color: 'accent',
      type: 'vehicle'
    },
    {
      id: 'vehicle_exit',
      title: 'Vehicle Exit',
      description: 'License plate recognition for vehicle exit',
      icon: MdDirectionsCar,
      actionIcon: MdLogout,
      color: 'accent',
      type: 'vehicle'
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-5xl font-serif text-white mb-4">Scanning Portal</h2>
        <p className="text-text-secondary text-sm uppercase tracking-widest font-light max-w-lg mx-auto leading-relaxed">
          Select the appropriate entry or exit point to begin automated verification.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {options.map((option, index) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(option)}
            className="group relative p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.08] hover:border-accent/50 transition-all text-left overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />
            
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 rounded-2xl bg-accent/10 text-accent group-hover:scale-110 transition-transform">
                <option.icon className="text-3xl" />
              </div>
              <div className="p-2 rounded-xl bg-white/5 text-text-secondary group-hover:text-accent transition-colors">
                <option.actionIcon className="text-xl" />
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent transition-colors">
                {option.title}
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                {option.description}
              </p>
              
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                Start Scanning
                <MdArrowForward className="text-base" />
              </div>
            </div>

            {/* Progress/Status Indicator (Decorative) */}
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-accent group-hover:w-full transition-all duration-500" />
          </motion.button>
        ))}
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 text-[10px] text-text-secondary/60 uppercase tracking-[0.2em] font-medium"
      >
        Automated Identity & Vehicle Verification System
      </motion.p>
    </div>
  );
};

export default ScanningOptions;