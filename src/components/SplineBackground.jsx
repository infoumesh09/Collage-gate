import React, { Suspense, useRef, useEffect } from 'react';
const Spline = React.lazy(() => import('@splinetool/react-spline'));

const SplineBackground = ({ isLandingPage = true }) => {
  const splineRef = useRef();

  function onLoad(spline) {
    splineRef.current = spline;
  }

  useEffect(() => {
    const handleScroll = () => {
      if (splineRef.current) {
        const scrollY = window.scrollY;
        // Animation completes when scrolled 1 viewport height (when the second section is fully in view)
        const animationRange = window.innerHeight;
        const scrollPercent = Math.min(scrollY / animationRange, 1);
        
        // Try to find the main object - based on original site it might be named "Object"
        // or we can manipulate the camera or a specific group.
        // Let's try to find an object named "Object" first, otherwise fallback to root.
        const obj = splineRef.current.findObjectByName('Object');
        
        if (obj) {
          // Replicating the animation from original site:
          // from: pos(10, 0, 0), scale(0,0,0), rot(0,0,0)
          // to: pos(-130, -64.4, 0), scale(3,3,3), rot(-1.7, 1.2, 0.7)
          
          // We'll interpolate based on scrollPercent
          
          // Initial state (Hero section)
          // We want it visible initially, so let's adjust the "from" state to be visible
          // Original site starts with scale 0? That might be for the entrance animation.
          // Let's start with a visible scale.
          
          const startScale = 0.86; // From HTML data-object-preferences
          const endScale = 3;
          
          const startPos = { x: -18, y: 3, z: -35 }; // From HTML data-object-preferences
          const endPos = { x: -130, y: -64, z: 0 };
          
          const startRot = { x: 0.27, y: -0.1, z: 0.03 }; // From HTML data-object-preferences
          const endRot = { x: -1.7, y: 1.2, z: 0.7 };

          obj.scale.x = startScale + (endScale - startScale) * scrollPercent;
          obj.scale.y = startScale + (endScale - startScale) * scrollPercent;
          obj.scale.z = startScale + (endScale - startScale) * scrollPercent;

          obj.position.x = startPos.x + (endPos.x - startPos.x) * scrollPercent;
          obj.position.y = startPos.y + (endPos.y - startPos.y) * scrollPercent;
          obj.position.z = startPos.z + (endPos.z - startPos.z) * scrollPercent;

          obj.rotation.x = startRot.x + (endRot.x - startRot.x) * scrollPercent;
          obj.rotation.y = startRot.y + (endRot.y - startRot.y) * scrollPercent;
          obj.rotation.z = startRot.z + (endRot.z - startRot.z) * scrollPercent;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Video Background Layer */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src="https://www.orfeoai.com/wp-content/uploads/2025/compressed.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-primary/40 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-primary/80"></div>
        {/* Grain Noise Overlay */}
        <div className="noise-bg"></div>
      </div>

      {/* Spline 3D Scene Layer */}
      <div 
        className={`absolute inset-0 z-10 transition-opacity duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
          isLandingPage ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {isLandingPage && (
          <Suspense fallback={null}>
            <Spline 
              scene="/scene.splinecode"
              onLoad={onLoad}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
};

export default SplineBackground;
