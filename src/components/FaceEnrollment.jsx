import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { motion } from 'framer-motion';
import { MdCamera, MdCheckCircle, MdError, MdRefresh, MdArrowForward } from 'react-icons/md';
import { faceAPI } from '../services/api';

const FaceEnrollment = ({ onComplete, userData }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [descriptor, setDescriptor] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    startCamera();
    loadModels();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatus('ready');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please check permissions.');
      setStatus('error');
    }
  };

  const loadModels = async () => {
    try {
      setIsLoadingModels(true);
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models')
      ]);
      setModelsLoaded(true);
      setIsLoadingModels(false);
    } catch (err) {
      console.error('Model loading error:', err);
      setError('Failed to load face recognition models');
      setIsLoadingModels(false);
      setStatus('error');
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);
      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          0.95
        );
      });
    }
    return null;
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setStatus('scanning');
    setProgress(0);
    
    // Simulate face scanning progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          handleScanComplete();
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const handleScanComplete = async () => {
    const blob = await captureFrame();
    if (!blob) {
      setError('Failed to capture image');
      setStatus('error');
      return;
    }

    if (!modelsLoaded) {
      await loadModels();
      if (!modelsLoaded) {
        return;
      }
    }

    try {
      const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
      const detection = await faceapi
        .detectSingleFace(videoRef.current, options)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection || !detection.descriptor) {
        setError('No face detected. Please try again with better lighting and framing.');
        setStatus('error');
        setIsScanning(false);
        return;
      }

      const descArray = Array.from(detection.descriptor);
      setDescriptor(descArray);
      setCapturedBlob(blob);
      setIsScanning(false);
      setStatus('success');
    } catch (err) {
      console.error('Face detection error during enrollment:', err);
      setError('Failed to process face. Please try again.');
      setStatus('error');
      setIsScanning(false);
    }
  };

  const handleFinish = async () => {
    try {
      setStatus('scanning');
      if (!capturedBlob || !descriptor) {
        setError('No face data captured. Please rescan your face.');
        setStatus('error');
        return;
      }
      onComplete({
        blob: capturedBlob,
        photo: await blobToBase64(capturedBlob),
        descriptor
      });
    } catch (err) {
      console.error('Enrollment error:', err);
      setError('Failed to complete enrollment');
      setStatus('error');
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleRetry = () => {
    setStatus('ready');
    setProgress(0);
    setError('');
  };

  return (
    <div className="min-h-[600px] flex flex-col items-center justify-center p-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl p-8 md:p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col items-center"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-serif text-white mb-2">Face Enrollment</h2>
          <p className="text-text-secondary text-xs uppercase tracking-widest font-light">
            {status === 'success' ? 'Enrollment Complete' : 'Secure Identity Verification'}
          </p>
        </div>

        <div className="relative w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-inner group">
          {/* Camera View */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-500 ${status === 'success' ? 'opacity-30' : 'opacity-100'}`}
          />

          {/* Scanning Overlay */}
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none">
              <motion.div 
                className="absolute top-0 left-0 w-full h-1 bg-accent shadow-[0_0_15px_rgba(20,255,236,0.8)]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 bg-accent/5" />
            </div>
          )}

          {/* Success Overlay */}
          {status === 'success' && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-accent/10 backdrop-blur-sm"
            >
              <MdCheckCircle className="text-accent text-8xl drop-shadow-[0_0_20px_rgba(20,255,236,0.5)]" />
            </motion.div>
          )}

          {/* Error Overlay */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 backdrop-blur-sm p-6 text-center">
              <MdError className="text-red-500 text-6xl mb-4" />
              <p className="text-white text-sm font-medium">{error}</p>
              <button 
                onClick={startCamera}
                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Face Frame Guide */}
          {status !== 'success' && status !== 'error' && (
            <div className="absolute inset-0 border-[30px] border-black/20 pointer-events-none">
              <div className="w-full h-full border-2 border-white/20 rounded-[40px] border-dashed" />
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {status === 'scanning' && (
          <div className="w-full max-w-[320px] mt-8">
            <div className="flex justify-between text-[10px] text-text-secondary uppercase tracking-widest mb-2 font-bold">
              <span>Scanning Face...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="w-full max-w-[320px] mt-10">
          {status === 'ready' && (
            <button
              onClick={handleStartScan}
              className="w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent/20"
            >
              <MdCamera className="text-xl" />
              Start Enrollment
            </button>
          )}

          {status === 'success' && (
            <button
              onClick={handleFinish}
              className="w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent/20"
            >
              Complete Registration
              <MdArrowForward className="text-xl group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={handleRetry}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group"
            >
              <MdRefresh className="text-xl" />
              Try Again
            </button>
          )}

          <p className="mt-6 text-center text-[10px] text-text-secondary/60 leading-relaxed uppercase tracking-widest">
            {status === 'success' 
              ? 'Your face profile has been securely stored.' 
              : 'Position your face within the frame and ensure good lighting.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default FaceEnrollment;
