import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdCamera, MdCheckCircle, MdError, MdRefresh, MdArrowBack, 
  MdPerson, MdDirectionsCar, MdLogin, MdLogout, MdFingerprint,
  MdShield, MdVerifiedUser, MdTimer, MdPause, MdPlayArrow,
  MdFileUpload
} from 'react-icons/md';
import Quagga from '@ericblade/quagga2';
import { faceAPI, vehicleAPI, logsAPI } from '../services/api';

const ActiveScanner = ({ mode, onBack }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('ready'); // ready, scanning, success, denied, error
  const [step, setStep] = useState('barcode'); // barcode, biometric, result
  const [scanResult, setScanResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [barcodeData, setBarcodeData] = useState('');
  const [showStepTransition, setShowStepTransition] = useState(false);
  const [autoResetTime, setAutoResetTime] = useState(5);
  const [isAutoResetStopped, setIsAutoResetStopped] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef(null);

  const isVehicle = mode.type === 'vehicle';
  const isEntry = mode.id.includes('entry');

  const startBarcodeScanner = () => {
    if (!scannerRef.current) return;

    const initScanner = (retryCount = 0) => {
      const target = scannerRef.current;
      if (!target) return;

      // Ensure the container is visible and has dimensions
      const width = target.clientWidth || target.offsetWidth;
      const height = target.clientHeight || target.offsetHeight;

      console.log(`Scanner container dimensions: ${width}x${height}`);

      if ((width === 0 || height === 0) && retryCount < 15) {
        console.log("Waiting for scanner container dimensions...");
        setTimeout(() => initScanner(retryCount + 1), 200);
        return;
      }

      // If we still don't have dimensions, use a fallback or wait more
      if (width === 0 || height === 0) {
        console.error("Scanner container has no dimensions after multiple retries");
        return;
      }

      Quagga.stop();
      
      const config = {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: target,
          constraints: {
            width: { min: 640 },
            height: { min: 480 },
            facingMode: "environment",
          },
          area: {
            top: "10%",
            right: "10%",
            left: "10%",
            bottom: "10%",
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: Math.min(navigator.hardwareConcurrency || 2, 4),
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ],
          multiple: false
        },
        locate: true,
        debug: false
      };

      Quagga.init(config, (err) => {
        if (err) {
          console.error("Quagga init error:", err);
          if (retryCount < 3) {
            setTimeout(() => initScanner(retryCount + 1), 1000);
          } else {
            setStatus('error');
          }
          return;
        }
        console.log("Quagga initialized successfully");
        Quagga.start();
      });

      Quagga.onDetected((data) => {
        if (data.codeResult && data.codeResult.code) {
          console.log("Barcode detected:", data.codeResult.code);
          Quagga.stop();
          handleBarcodeComplete(data.codeResult.code);
        }
      });
    };

    initScanner();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus('scanning');
    setProgress(30);

    try {
      const result = await vehicleAPI.verify(file);
      processVerificationResult(result);
    } catch (err) {
      console.error('File upload verification error:', err);
      setStatus('error');
    }
  };

  const processVerificationResult = async (result) => {
    setProgress(100);
    if (result.status === 'Identified' || result.status === 'Allowed') {
      setScanResult({
        plate: result.plate,
        owner: result.owner,
        name: result.name,
        student_id: result.student_id,
        div: result.div,
        moodleId: result.student_id || result.moodle_id,
        role: result.role || 'student',
        confidence: result.confidence || '94%',
        time: new Date().toLocaleTimeString()
      });
      
      await logsAPI.create({
        moodle_id: result.student_id || result.moodle_id || barcodeData,
        method: isVehicle ? 'vehicle' : 'pedestrian',
        direction: isEntry ? 'entry' : 'exit',
        success: true,
        plate_detected: result.plate
      });

      setStatus('success');
      setTimeout(() => setStep('result'), 1500);
    } else {
      setStatus('denied');
      await logsAPI.create({
        moodle_id: barcodeData,
        method: isVehicle ? 'vehicle' : 'pedestrian',
        direction: isEntry ? 'entry' : 'exit',
        success: false,
        note: result.status
      });
      setTimeout(() => setStep('result'), 1500);
    }
  };

  useEffect(() => {
    const initScanner = async () => {
      if (step === 'biometric') {
        await startCamera();
      } else if (step === 'barcode') {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        startBarcodeScanner();
      } else {
        // result step
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        Quagga.stop();
      }
    };

    initScanner();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      Quagga.stop();
    };
  }, [step]);

  // Auto-reset timer logic
  useEffect(() => {
    let interval;
    if (step === 'result' && !isAutoResetStopped && autoResetTime > 0) {
      interval = setInterval(() => {
        setAutoResetTime((prev) => prev - 1);
      }, 1000);
    } else if (autoResetTime === 0) {
      onBack();
    }
    return () => clearInterval(interval);
  }, [step, autoResetTime, isAutoResetStopped, onBack]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: step === 'barcode' ? 'environment' : (isVehicle ? 'environment' : 'user'),
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
      setStatus('error');
    }
  };

  const handleScan = () => {
    setStatus('scanning');
    setProgress(0);
    
    if (step === 'barcode') {
      // Barcode scanning is handled by Quagga
      // We've already initialized it in the useEffect
      // But we'll ensure it's running
      startBarcodeScanner();
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);
    } else {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            processBiometricResult();
            return 100;
          }
          return prev + 10;
        });
      }, 150);
    }
  };

  const handleBarcodeComplete = (data) => {
    setBarcodeData(data || 'ID-23102199');
    setShowStepTransition(true);
    setStatus('success');
    setProgress(100);
    
    setTimeout(() => {
      setShowStepTransition(false);
      setStep('biometric');
      setStatus('ready');
      setProgress(0);
    }, 2000);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    }
    return null;
  };

  const processBiometricResult = async () => {
    const blob = await captureFrame();
    if (!blob) {
      setStatus('error');
      return;
    }

    try {
      let result;
      if (isVehicle) {
        result = await vehicleAPI.verify(blob);
      } else {
        result = await faceAPI.verify(blob);
      }
      processVerificationResult(result);
    } catch (err) {
      console.error('Verification error:', err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center relative z-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-2 group"
          >
            <MdArrowBack className="text-xl group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest pr-2">Back to Portal</span>
          </button>
          
          <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent">
            {step === 'barcode' ? <MdFingerprint className="text-xl" /> : (step === 'biometric' ? (isVehicle ? <MdDirectionsCar className="text-xl" /> : <MdPerson className="text-xl" />) : <MdCheckCircle className="text-xl" />)}
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {step === 'barcode' ? 'Step 1: ID Barcode' : (step === 'biometric' ? `Step 2: ${isVehicle ? 'Vehicle Scan' : 'Face Scan'}` : 'Step 3: Access Result')}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step !== 'result' ? (
            <motion.div
              key="scanner-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
            >
              {/* Scanner View */}
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-black/40 border border-white/10 shadow-2xl group">
                {/* Barcode Scanner Container */}
                <div 
                  ref={scannerRef}
                  className={`absolute inset-0 z-10 [&>video]:w-full [&>video]:h-full [&>video]:object-cover [&>canvas]:absolute [&>canvas]:inset-0 transition-opacity duration-500 ${step === 'barcode' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />

                {/* Biometric Video */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-500 ${step === 'biometric' ? (status === 'success' || status === 'denied' ? 'opacity-30' : 'opacity-100') : 'opacity-0'}`}
                />

                {/* Scanning Overlay */}
                <AnimatePresence>
                  {status === 'scanning' && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      <motion.div 
                        className="absolute top-0 left-0 w-full h-1 bg-accent shadow-[0_0_20px_rgba(20,255,236,1)]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="absolute inset-0 bg-accent/5" />
                      <div className="absolute inset-0 border-[40px] border-black/20">
                        <div className="w-full h-full border-2 border-accent/30 rounded-[40px] border-dashed animate-pulse" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status Icons */}
                <AnimatePresence>
                  {(status === 'success' || showStepTransition) && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-accent/20 backdrop-blur-md z-20"
                    >
                      <div className="relative mb-6">
                        <MdCheckCircle className="text-accent text-9xl drop-shadow-[0_0_30px_rgba(20,255,236,0.6)]" />
                        <motion.div 
                          className="absolute inset-0 rounded-full border-4 border-accent"
                          initial={{ scale: 0.8, opacity: 1 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      </div>
                      
                      {showStepTransition && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center"
                        >
                          <h4 className="text-white font-bold text-xl mb-1">ID Verified</h4>
                          <p className="text-accent text-[10px] uppercase tracking-[0.3em]">Preparing {isVehicle ? 'Vehicle' : 'Face'} Scan</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mode Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${status === 'scanning' ? 'bg-accent' : 'bg-white/40'}`} />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">
                    {status === 'scanning' ? 'Extracting Data...' : (step === 'barcode' ? 'Scanning Barcode' : 'Ready for Biometrics')}
                  </span>
                </div>
              </div>

              {/* Info & Controls */}
              <div className="space-y-6">
                <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-accent/10 text-accent">
                      {step === 'barcode' ? <MdFingerprint className="text-2xl" /> : <MdShield className="text-2xl" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {step === 'barcode' ? 'Identity Check' : 'Biometric Auth'}
                      </h3>
                      <p className="text-[10px] text-text-secondary uppercase tracking-widest">
                        {step === 'barcode' ? 'Scan ID Card' : 'Verify Identity'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {status === 'ready' && (
                      <div className="text-sm text-text-secondary leading-relaxed">
                        {step === 'barcode' 
                          ? 'Please present your ID card barcode to the camera for initial verification.' 
                          : `Initial check passed. Now position your ${isVehicle ? 'vehicle plate' : 'face'} clearly in the frame.`}
                      </div>
                    )}

                    {status === 'scanning' && (
                      <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-accent">
                          <span>Extracting Features</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-accent shadow-[0_0_10px_rgba(20,255,236,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 space-y-4">
                    {status === 'ready' && (
                      <>
                        <button
                          onClick={handleScan}
                          className="w-full py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group shadow-lg shadow-accent/20"
                        >
                          <MdFingerprint className="text-xl" />
                          Initialize Scan
                        </button>

                        {isVehicle && step === 'biometric' && (
                          <>
                            <div className="flex items-center gap-4 py-2">
                              <div className="h-[1px] flex-1 bg-white/10" />
                              <span className="text-[10px] text-text-secondary uppercase tracking-widest">OR</span>
                              <div className="h-[1px] flex-1 bg-white/10" />
                            </div>
                            
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 group"
                            >
                              <MdFileUpload className="text-xl" />
                              Upload Plate Image
                            </button>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleFileUpload} 
                              accept="image/*" 
                              className="hidden" 
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Security Notice */}
                <div className="p-6 rounded-2xl bg-accent/5 border border-accent/10">
                  <p className="text-[10px] text-accent/70 uppercase tracking-[0.2em] font-medium leading-relaxed">
                    Notice: All activity is logged and monitored. unauthorized access attempts will be reported to security.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg mx-auto"
            >
              <div className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Result Header */}
                <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl mb-8 ${status === 'success' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  <MdCheckCircle className="text-xl" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {status === 'success' ? 'Access Granted' : 'Access Denied'}
                  </span>
                </div>

                <div className="flex flex-col items-center text-center mb-8">
                  <div className={`p-6 rounded-full mb-6 ${status === 'success' ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-500'}`}>
                    {status === 'success' ? <MdCheckCircle className="text-7xl" /> : <MdError className="text-7xl" />}
                  </div>
                  <h2 className={`text-3xl font-bold uppercase tracking-[0.2em] mb-6 ${status === 'success' ? 'text-accent' : 'text-red-500'}`}>
                    {status === 'success' ? 'Access Granted' : 'Access Denied'}
                  </h2>

                  {scanResult && (
                    <div className="w-full space-y-2 text-left bg-white/5 p-6 rounded-2xl border border-white/10">
                      <p className="text-xl font-bold text-white mb-2">{scanResult.name || scanResult.owner}</p>
                      <p className="text-xs text-text-secondary">Moodle ID: <span className="text-white font-mono">{scanResult.moodleId}</span></p>
                      <p className="text-xs text-text-secondary capitalize">Role: <span className="text-white">{scanResult.role}</span></p>
                      
                      <div className="flex flex-wrap gap-2 mt-6">
                        <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-text-secondary border border-white/10">
                          {isVehicle ? 'Vehicle' : 'Pedestrian'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${isEntry ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                          {isEntry ? 'Entry' : 'Exit'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold uppercase tracking-widest">
                          {scanResult.confidence} confidence
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-4">{scanResult?.time}</p>
                    <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest mb-2">
                      {isAutoResetStopped ? 'Auto-reset stopped' : `Auto-reset in ${autoResetTime} seconds`}
                    </p>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-accent"
                        initial={{ width: "100%" }}
                        animate={{ width: isAutoResetStopped ? "100%" : `${(autoResetTime / 5) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setIsAutoResetStopped(true)}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      Stop Auto-Reset
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => onBack()}
                        className="py-4 bg-accent text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
                      >
                        <MdRefresh className="text-lg" />
                        New Scan
                      </button>
                      <button className="py-4 bg-white/5 text-white border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <MdShield className="text-lg" />
                        View Log
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ActiveScanner;