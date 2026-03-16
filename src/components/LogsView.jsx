import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MdArrowBack, 
  MdSearch, 
  MdFilterList,
  MdArrowUpward,
  MdArrowDownward,
  MdDirectionsCar,
  MdPerson,
  MdRefresh
} from 'react-icons/md';
import { logsAPI } from '../services/api';

const LogsView = ({ onBack }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await logsAPI.getAll();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.moodle_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.plate_detected?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:border-accent transition-all group"
            >
              <MdArrowBack className="text-xl group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-5xl font-serif text-white mb-2">Activity Logs</h1>
              <p className="text-text-secondary font-light tracking-wide uppercase text-xs">Full history of campus access</p>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-full text-sm text-white focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <button 
              onClick={fetchLogs}
              className={`p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all ${loading ? 'animate-spin' : ''}`}
            >
              <MdRefresh className="text-xl" />
            </button>
            <button className="p-3 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-all">
              <MdFilterList className="text-xl" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-400">
              <p>{error}</p>
              <button onClick={fetchLogs} className="mt-4 text-accent hover:underline">Try Again</button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-text-secondary">
              No logs found matching your criteria
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-4 text-xs font-bold tracking-widest uppercase text-text-secondary/50">Date & Time</th>
                    <th className="pb-4 text-xs font-bold tracking-widest uppercase text-text-secondary/50">User</th>
                    <th className="pb-4 text-xs font-bold tracking-widest uppercase text-text-secondary/50">Method</th>
                    <th className="pb-4 text-xs font-bold tracking-widest uppercase text-text-secondary/50">Plate No</th>
                    <th className="pb-4 text-xs font-bold tracking-widest uppercase text-text-secondary/50">Direction</th>
                    <th className="pb-4 text-xs font-bold tracking-widest uppercase text-text-secondary/50">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log, i) => (
                    <motion.tr 
                      key={log.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="text-[10px] text-text-secondary font-light">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs">
                            {(log.user?.name?.[0] || log.moodle_id?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{log.user?.name || 'Unknown User'}</p>
                            <p className="text-[10px] text-text-secondary">{log.moodle_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-2">
                          {log.method === 'pedestrian' ? (
                            <MdPerson className="text-text-secondary" />
                          ) : (
                            <MdDirectionsCar className="text-text-secondary" />
                          )}
                          <span className="text-xs text-white capitalize">{log.method}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <span className="text-xs font-mono text-white bg-white/5 px-2 py-1 rounded">
                          {log.plate_detected || '-'}
                        </span>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-2">
                          {log.direction === 'entry' ? (
                            <MdArrowUpward className="text-green-400" />
                          ) : (
                            <MdArrowDownward className="text-blue-400" />
                          )}
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            log.direction === 'entry' ? 'text-green-400' : 'text-blue-400'
                          }`}>
                            {log.direction}
                          </span>
                        </div>
                      </td>
                      <td className="py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${log.success ? 'bg-green-400' : 'bg-red-500'}`}></div>
                          <span className="text-xs text-white">{log.success ? 'Success' : 'Failed'}</span>
                          {log.confidence && (
                            <span className="text-[10px] text-text-secondary font-light">({log.confidence}%)</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsView;
