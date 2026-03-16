import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import WhatWeDo from './components/WhatWeDo';
import ServicesCarousel from './components/ServicesCarousel';
import SplineBackground from './components/SplineBackground';
import FluidGlassCursor from './components/FluidGlassCursor';
import AdminDashboard from './components/AdminDashboard';
import LogsView from './components/LogsView';
import Auth from './components/Auth';
import ScanningOptions from './components/ScanningOptions';
import ScanPedestrian from './pages/ScanPedestrian';
import ScanVehicle from './pages/ScanVehicle';
import Portal from './pages/Portal';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [userRole, setUserRole] = useState(null);
  const [activeScanningMode, setActiveScanningMode] = useState(null);

  const handleLoginSuccess = (role) => {
    setUserRole(role);
    if (role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('student');
    }
  };

  const handleScanningSelect = (mode) => {
    setActiveScanningMode(mode);
    setCurrentPage('scanning-active'); 
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');
    if (token && role) {
      setUserRole(role);
      if (role === 'admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('student');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    setUserRole(null);
    setCurrentPage('home');
  };

  return (
    <div className="bg-primary text-text font-sans selection:bg-accent selection:text-white">
      <FluidGlassCursor />
      <Header 
        onNavigate={setCurrentPage} 
        userRole={userRole} 
        hidePrimaryActions={currentPage === 'student'}
      />
      <SplineBackground isLandingPage={currentPage === 'home'} />
      
      <main className="relative z-10">
        {currentPage === 'home' ? (
          <>
            <Hero />
            <WhatWeDo />
            <ServicesCarousel />
          </>
        ) : currentPage === 'auth' ? (
          <Auth onLoginSuccess={handleLoginSuccess} />
        ) : currentPage === 'scanning' ? (
          <ScanningOptions onSelect={handleScanningSelect} />
        ) : currentPage === 'scanning-active' ? (
          activeScanningMode?.type === 'pedestrian' ? (
            <ScanPedestrian 
              defaultDirection={activeScanningMode?.id?.includes('exit') ? 'exit' : 'entry'} 
              onBack={() => setCurrentPage('scanning')}
            />
          ) : (
            <ScanVehicle 
              defaultDirection={activeScanningMode?.id?.includes('exit') ? 'exit' : 'entry'} 
              onBack={() => setCurrentPage('scanning')}
            />
          )
        ) : currentPage === 'student' ? (
          <Portal onLogout={handleLogout} />
        ) : currentPage === 'admin' ? (
          <AdminDashboard onNavigate={setCurrentPage} onLogout={handleLogout} />
        ) : (
          <LogsView onBack={() => setCurrentPage('admin')} />
        )}
      </main>
    </div>
  );
}

export default App;
