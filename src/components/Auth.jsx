import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdEmail, MdLock, MdPerson, MdArrowForward, MdSchool, MdAdminPanelSettings, MdBadge, MdCalendarToday, MdGroups } from 'react-icons/md';
import FaceEnrollment from './FaceEnrollment';
import { authAPI, registrationAPI } from '../services/api';

const Auth = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('student'); // 'student' or 'admin'
  const [showFaceEnroll, setShowFaceEnroll] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAlreadyAdmin, setIsAlreadyAdmin] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    moodleId: '',
    year: 'FE',
    batch: 'A',
    username: '',
    password: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedRole = localStorage.getItem('user_role');
    if (token && storedRole === 'admin') {
      setIsAlreadyAdmin(true);
      setRole('admin');
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'admin') {
        // Admin Login
        const response = await authAPI.login({
          role: 'admin',
          username: formData.username,
          password: formData.password
        });
        
        // Store token if needed, or just pass the role
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_role', 'admin');
        }
        onLoginSuccess('admin');
      } else if (isLogin) {
        // Student Login (Moodle ID based)
        const response = await authAPI.login({
          role: 'student',
          moodle_id: formData.moodleId,
          name: formData.name,
          year: formData.year,
          division: formData.batch
        });
        
        if (response.token) {
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('user_role', 'student');
        }
        onLoginSuccess('student');
      } else {
        // Student Registration Request
        setShowFaceEnroll(true);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceComplete = async (faceData) => {
    setLoading(true);
    try {
      // Send registration request with face data
      await registrationAPI.request({
        moodle_id: formData.moodleId,
        name: formData.name,
        email: formData.email,
        year: formData.year,
        division: formData.batch,
        face_descriptor: faceData.descriptor,
        photo: faceData.photo
      });
      alert('Registration request sent successfully! Please wait for admin approval.');
      setIsLogin(true);
      setShowFaceEnroll(false);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (showFaceEnroll) {
    return <FaceEnrollment onComplete={handleFaceComplete} userData={formData} />;
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center relative z-10">
      <div className="w-full max-w-md">
        {/* Toggle Role */}
        <div className="flex bg-white/5 p-1 rounded-full mb-8 border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setRole('student')}
            className={`flex-1 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              role === 'student' ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            <MdSchool className="text-base" />
            Student
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
              role === 'admin' ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'
            }`}
          >
            <MdAdminPanelSettings className="text-base" />
            Admin
          </button>
        </div>

        <motion.div
          layout
          className="p-8 md:p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-4xl font-serif text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-text-secondary text-xs uppercase tracking-widest font-light">
              {isLogin ? `Login as ${role}` : `Register as ${role}`}
            </p>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-red-400 text-[10px] font-bold uppercase tracking-widest"
              >
                {error}
              </motion.p>
            )}
          </div>

          {isAlreadyAdmin && isLogin && role === 'admin' ? (
            <div className="space-y-6">
              <p className="text-text-secondary text-xs uppercase tracking-widest text-center">
                You are already logged in as admin.
              </p>
              <button
                type="button"
                onClick={() => onLoginSuccess('admin')}
                className="w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent/20"
              >
                <span>Go to Dashboard</span>
                <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {role === 'admin' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-4">Admin Username</label>
                    <div className="relative">
                      <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-accent text-xl" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter admin username"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-accent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-4">Password</label>
                    <div className="relative">
                      <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent text-xl" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-accent transition-all"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-4">Full Name</label>
                    <div className="relative">
                      <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-accent text-xl" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-accent transition-all"
                        required
                      />
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-4">Email</label>
                      <div className="relative">
                        <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-accent text-xl" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-accent transition-all"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-4">Moodle ID</label>
                    <div className="relative">
                      <MdBadge className="absolute left-4 top-1/2 -translate-y-1/2 text-accent text-xl" />
                      <input
                        type="text"
                        name="moodleId"
                        value={formData.moodleId}
                        onChange={handleChange}
                        placeholder="23102185"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-accent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-4">Year</label>
                      <div className="relative">
                        <MdCalendarToday className="absolute left-4 top-1/2 -translate-y-1/2 text-accent text-xl" />
                        <select
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-accent transition-all appearance-none"
                        >
                          <option value="FE">FE</option>
                          <option value="SE">SE</option>
                          <option value="TE">TE</option>
                          <option value="BE">BE</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-4">Division</label>
                      <div className="relative">
                        <MdGroups className="absolute left-4 top-1/2 -translate-y-1/2 text-accent text-xl" />
                        <select
                          name="batch"
                          value={formData.batch}
                          onChange={handleChange}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:border-accent transition-all appearance-none"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Send Request'}
                    <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-text-secondary hover:text-white transition-colors"
            >
              {isLogin ? (
                <>Don't have an account? <span className="text-accent font-bold">Register</span></>
              ) : (
                <>Already have an account? <span className="text-accent font-bold">Login</span></>
              )}
            </button>
          </div>
        </motion.div>

        {role === 'student' && !isLogin && (
          <p className="mt-6 text-center text-[10px] text-text-secondary/60 leading-relaxed uppercase tracking-widest px-8">
            Registration requests are sent to the admin for approval. You will be notified once access is granted.
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
