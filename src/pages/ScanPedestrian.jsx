import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MdArrowBack, MdPerson } from 'react-icons/md'
import { useMutation } from 'react-query'
import Stepper from '../components/Stepper'
import BarcodeScanner from '../components/BarcodeScanner'
import FaceScanner from '../components/FaceScanner'
import ResultCard from '../components/ResultCard'
import { usersAPI, gateAPI } from '../services/api'
import { formatConfidence } from '../utils/formatConfidence'

export default function ScanPedestrian({ kiosk = false, defaultDirection, onBack }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const direction = defaultDirection || searchParams.get('type') || 'entry'
  
  const [activeStep, setActiveStep] = useState(0)
  const [scannedMoodleId, setScannedMoodleId] = useState('')
  const [user, setUser] = useState(null)
  // Manual entry removed to enforce QR-only policy
  const [faceDescriptor, setFaceDescriptor] = useState(null)
  const [faceResult, setFaceResult] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [scannerError, setScannerError] = useState('')
  const firstFailureTime = React.useRef(null)

  const steps = ['Scan ID', 'Scan Face', 'Result']

  // Fetch user by moodle_id
  const fetchUserMutation = useMutation(usersAPI.getByMoodleId, {
    onSuccess: (response) => {
      setUser(response)
      setError('')
    },
    onError: (error) => {
      setError(error.message || 'User not found')
    }
  })

  const gateUpdateMutation = useMutation((logData) => (
    direction === 'entry' ? gateAPI.updateEntry(logData) : gateAPI.updateExit(logData)
  ), {
    onSuccess: (response) => {
      console.log('Access log created:', response)
      
      if (response.error) {
        if (response.requiresExit) {
          setError('Already inside - please exit first')
          setResult({ 
            success: false, 
            user, 
            method: 'pedestrian', 
            direction, 
            confidence: 0, 
            timestamp: new Date().toISOString(),
            note: 'Already inside - please exit first'
          })
          setActiveStep(2)
          return
        } else if (response.requiresEntry) {
          setError('No active session found - please enter first')
          setResult({ 
            success: false, 
            user, 
            method: 'pedestrian', 
            direction, 
            confidence: 0, 
            timestamp: new Date().toISOString(),
            note: 'No active session found - please enter first'
          })
          setActiveStep(2)
          return
        } else {
          setError(response.error)
          setResult({ 
            success: false, 
            user, 
            method: 'pedestrian', 
            direction, 
            confidence: 0, 
            timestamp: new Date().toISOString(),
            note: response.error
          })
          setActiveStep(2)
          return
        }
      }

      if (response.success) {
        console.log('Access granted - showing result page')
      }
    },
    onError: (error) => {
      console.error('Failed to create access log:', error)
    }
  })

  const handleBarcodeScan = (moodleId) => {
    setScannedMoodleId(moodleId)
    fetchUserMutation.mutate(moodleId)
  }

  // Manual Moodle ID submission removed

  const handleFaceDetected = (descriptor, comparisonResult = null, capturedPhoto = null) => {
    setFaceDescriptor(descriptor)
    
    if (comparisonResult) {
      // Face verification
      if (comparisonResult.match) {
        // Immediate success
        setFaceResult(comparisonResult)
        processResult(true, comparisonResult.confidence)
        firstFailureTime.current = null
      } else {
        // Handle failure with grace period (3 seconds)
        if (!firstFailureTime.current) {
          firstFailureTime.current = Date.now()
        }

        const elapsed = Date.now() - firstFailureTime.current
        if (elapsed > 3000) {
          // Time's up, accept defeat
          setFaceResult(comparisonResult)
          processResult(false, comparisonResult.confidence)
          firstFailureTime.current = null
        }
        // Else: continue scanning...
      }
    } else {
      if (user && !user.face_enrolled) {
        setError('No face template registered for this user. Please contact admin.')
        setFaceResult({ match: false, confidence: 0 })
      } else {
        setFaceResult({ match: false, confidence: 0 })
      }
    }
  }

  const processResult = (success, confidence, note = '') => {
    const logData = {
      moodle_id: user.moodle_id,
      method: 'pedestrian',
      direction,
      success,
      confidence,
      note
    }

    gateUpdateMutation.mutate(logData)

    setResult({
      success,
      user,
      method: 'pedestrian',
      direction,
      confidence,
      timestamp: new Date().toISOString(),
      note
    })

    setActiveStep(2)
  }

  const handleNewScan = () => {
    setActiveStep(0)
    setScannedMoodleId('')
    setUser(null)
    setFaceDescriptor(null)
    setFaceResult(null)
    setResult(null)
    setError('')
    firstFailureTime.current = null
  }

  const handleViewLog = () => {
    navigate('/admin/logs')
  }

  const canProceedToFace = () => {
    return user && !fetchUserMutation.isLoading
  }

  const canProceedToResult = () => {
    // Only allow proceeding when we have a verification result
    return !!faceResult
  }

  // Handle scanner errors
  const handleScannerError = (err) => {
    console.error('Scanner error:', err)
    setScannerError(err.message || 'Camera error occurred')
  }

  const isKiosk = kiosk || window.location.pathname.startsWith('/gate/')

  const handleBackClick = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/')
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (scannedMoodleId) {
      handleBarcodeScan(scannedMoodleId)
    }
  }

  return (
    <div className={`min-h-screen ${isKiosk ? 'pt-16' : 'pt-32'} pb-20 px-6 md:px-12 relative z-10`}>
      <div className="max-w-5xl mx-auto space-y-8">
        {!isKiosk && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-bold tracking-widest uppercase text-text-secondary hover:text-white hover:bg-white/10 transition-all"
            >
              <MdArrowBack className="text-sm" />
              Back
            </button>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-text-secondary">
              <MdPerson className="text-lg text-accent" />
              <span>Pedestrian {direction === 'entry' ? 'Entry' : 'Exit'}</span>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-white">
            Pedestrian {direction === 'entry' ? 'Entry' : 'Exit'}
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-text-secondary">
            Scan ID and face to {direction === 'entry' ? 'enter campus' : 'exit campus'}
          </p>
        </div>

        {scannerError && (
          <div className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/40 text-[12px] text-red-200 space-y-1">
            <p className="font-semibold">Camera Permission Error</p>
            <p>{scannerError}</p>
            <p className="mt-1">
              To fix this issue:
            </p>
            <ol className="list-decimal list-inside text-[11px] space-y-0.5">
              <li>Click the camera icon in your browser&apos;s address bar</li>
              <li>Select &quot;Allow&quot; for camera access</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}

        <Stepper activeStep={activeStep} steps={steps}>
          {activeStep === 0 && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white mb-2">
                Step 1: Scan Student ID
              </h2>

              {error && (
                <div className="mb-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/40 text-[12px] text-red-200">
                  {error}
                </div>
              )}

              <BarcodeScanner
                onScan={handleBarcodeScan}
                onError={handleScannerError}
                isActive={activeStep === 0}
              />

              <form
                onSubmit={handleManualSubmit}
                className="mt-4 flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="text"
                  placeholder="Enter Moodle ID (Testing)"
                  value={scannedMoodleId}
                  onChange={(e) => setScannedMoodleId(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-sm text-white placeholder:text-text-secondary focus:outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-accent text-[10px] font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-all"
                >
                  Test
                </button>
              </form>

              {user && (
                <div className="mt-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-[12px] text-emerald-100">
                  <p>
                    <span className="font-semibold">User Found:</span> {user.name} ({user.role})
                  </p>
                  <p className="mt-1">
                    Face enrolled: {user.face_enrolled ? 'Yes' : 'No'}
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  disabled={!canProceedToFace()}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    canProceedToFace()
                      ? 'bg-accent text-white hover:bg-accent/90'
                      : 'bg-white/[0.03] text-text-secondary cursor-not-allowed'
                  }`}
                >
                  Continue to Face Scan
                </button>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white mb-2">
                Step 2: Face {user?.face_enrolled ? 'Verification' : 'Enrollment'}
              </h2>

              {user && (
                <div className="mb-3 px-4 py-3 rounded-2xl bg-sky-500/10 border border-sky-500/40 text-[12px] text-sky-100">
                  <p>
                    Scanning face for: <span className="font-semibold">{user.name}</span>
                  </p>
                  {!user.face_enrolled && (
                    <p className="mt-1">
                      This will create your face template for future verification.
                    </p>
                  )}
                </div>
              )}

              <FaceScanner
                onFaceDetected={handleFaceDetected}
                onError={handleScannerError}
                isActive={activeStep === 1}
                userMoodleId={user?.moodle_id}
                isEnrollment={!user?.face_enrolled}
              />

              {faceResult && (
                <div
                  className={`mt-3 px-4 py-3 rounded-2xl border text-[12px] ${
                    faceResult.match
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-100'
                      : 'bg-red-500/10 border-red-500/40 text-red-200'
                  }`}
                >
                  <p className="font-semibold">
                    Face {faceResult.match ? 'Match' : 'Mismatch'}
                  </p>
                  <p>Confidence: {formatConfidence(faceResult.confidence)}%</p>
                  <p>Distance: {faceResult.distance?.toFixed(3)}</p>
                  <p>Threshold: {faceResult.threshold}</p>
                </div>
              )}

              <div className="mt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className="px-5 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                >
                  Back to ID Scan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (faceResult) {
                      processResult(faceResult.match, faceResult.confidence)
                    }
                  }}
                  disabled={!canProceedToResult()}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    canProceedToResult()
                      ? 'bg-accent text-white hover:bg-accent/90'
                      : 'bg-white/[0.03] text-text-secondary cursor-not-allowed'
                  }`}
                >
                  Complete Scan
                </button>
              </div>
            </div>
          )}

          {activeStep === 2 && result && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4">
                Step 3: Access Result
              </h2>

              <ResultCard
                success={result.success}
                user={result.user}
                method={result.method}
                direction={result.direction}
                confidence={result.confidence}
                timestamp={result.timestamp}
                note={result.note}
                onNewScan={handleNewScan}
                onViewLog={handleViewLog}
              />
            </div>
          )}
        </Stepper>
      </div>
    </div>
  )
}
