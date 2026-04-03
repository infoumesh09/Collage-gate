import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdArrowBack, MdPeople, MdDirectionsCar, MdDirectionsWalk, MdRefresh } from 'react-icons/md';
import { statsAPI } from '../services/api';

const CurrentlyInside = ({ onBack }) => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsidePeople = async () => {
    setLoading(true);
    try {
      const data = await statsAPI.getInside();
      setPeople(data.inside_users || []);
      setError('');
    } catch (err) {
      console.error('Failed to fetch people inside:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsidePeople();
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 relative z-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all group"
            >
              <MdArrowBack className="text-2xl group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-5xl md:text-6xl font-serif text-white mb-2">Currently Inside</h1>
              <p className="text-text-secondary font-light tracking-wide uppercase text-xs">
                {people.length} People on Campus
              </p>
            </div>
          </div>
          <button 
            onClick={fetchInsidePeople}
            className="flex items-center gap-3 px-6 py-3 bg-accent rounded-full text-white text-xs font-bold tracking-widest uppercase hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
          >
            <MdRefresh className={loading ? 'animate-spin' : ''} />
            Refresh List
          </button>
        </div>

        {/* Content */}
        {error ? (
          <div className="p-8 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button 
              onClick={fetchInsidePeople}
              className="px-6 py-2 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold uppercase tracking-widest"
            >
              Try Again
            </button>
          </div>
        ) : loading && people.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 rounded-[2.5rem] bg-white/[0.03] border border-white/10 animate-pulse" />
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="p-20 text-center rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl">
            <MdPeople className="text-6xl text-text-secondary/10 mx-auto mb-6" />
            <h3 className="text-2xl font-serif text-white/40 mb-2">Campus is Empty</h3>
            <p className="text-text-secondary/40 text-[10px] uppercase tracking-widest">No active entries recorded</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {people.map((person, i) => (
              <motion.div
                key={person.moodle_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl group hover:bg-white/[0.05] transition-all relative overflow-hidden"
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                  {person.type === 'vehicle' ? (
                    <MdDirectionsCar className="text-8xl" />
                  ) : (
                    <MdDirectionsWalk className="text-8xl" />
                  )}
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${person.type === 'vehicle' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                      {person.type === 'vehicle' ? <MdDirectionsCar className="text-xl" /> : <MdDirectionsWalk className="text-xl" />}
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">
                      Entered {new Date(person.entered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h3 className="text-2xl font-serif text-white mb-1">{person.name}</h3>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                      {person.role} • {person.moodle_id}
                    </span>
                    {person.year && (
                      <span className="text-[10px] text-text-secondary/60 uppercase tracking-widest">
                        {person.year} {person.division && `- Division ${person.division}`}
                      </span>
                    )}
                    {person.plate && (
                      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 w-fit">
                        <MdDirectionsCar className="text-text-secondary/60" />
                        <span className="text-[11px] font-mono font-bold text-white tracking-wider">{person.plate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentlyInside;