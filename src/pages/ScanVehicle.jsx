import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MdArrowBack, MdDirectionsCar } from 'react-icons/md'
import { useMutation } from 'react-query'
import Stepper from '../components/Stepper'
import BarcodeScanner from '../components/BarcodeScanner'
import FaceScanner from '../components/FaceScanner'
import PlateDetector from '../components/PlateDetector'
import ResultCard from '../components/ResultCard'
import { usersAPI, gateAPI } from '../services/api'
import { formatConfidence } from '../utils/formatConfidence'

export default function ScanVehicle({ kiosk = false, defaultDirection, onBack }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const direction = defaultDirection || searchParams.get('type') || 'entry'
  
  const [activeStep, setActiveStep] = useState(0)
  const [scannedMoodleId, setScannedMoodleId] = useState('')
  const [user, setUser] = useState(null)
  const [faceResult, setFaceResult] = useState(null)
  const [detectedPlate, setDetectedPlate] = useState('')
  const [plateConfidence, setPlateConfidence] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [scannerError, setScannerError] = useState('')

  const steps = ['Scan ID', 'Scan Face', 'Detect Plate', 'Result']

  // Fetch user by moodle_id
  const fetchUserMutation = useMutation(usersAPI.getByMoodleId, {
    onSuccess: (response) => {
      console.log('ScanVehicle: User fetched', response)
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
          setResult(prev => ({ 
            ...prev,
            success: false, 
            note: 'Already inside - please exit first'
          }))
          return
        } else if (response.requiresEntry) {
          setError('No active session found - please enter first')
          setResult(prev => ({ 
            ...prev,
            success: false, 
            note: 'No active session found - please enter first'
          }))
          return
        } else {
          setError(response.error)
          setResult(prev => ({ 
            ...prev,
            success: false, 
            note: response.error
          }))
          return
        }
      }

      if (response.success) {
        console.log('Access granted - showing result page')
      }
    },
    onError: (error) => {
      console.error('Failed to create access log:', error)
      setError('Failed to process access request')
    }
  })

  const handleBarcodeScan = (moodleId) => {
    setScannedMoodleId(moodleId)
    fetchUserMutation.mutate(moodleId)
  }

  const processFaceFailure = (comparisonResult) => {
    if (!user) return

    const confidence = comparisonResult?.confidence || 0
    const note = 'Face mismatch - vehicle entry denied before plate check.'

    const logData = {
      moodle_id: user.moodle_id,
      method: 'vehicle',
      direction,
      success: false,
      confidence,
      plate_detected: null,
      note
    }

    gateUpdateMutation.mutate(logData)

    setResult({
      success: false,
      user,
      method: 'vehicle',
      direction,
      confidence,
      plateDetected: null,
      faceMatch: false,
      timestamp: new Date().toISOString(),
      note
    })

    setActiveStep(3)
  }

  const handleFaceDetected = (descriptor, comparisonResult = null, capturedPhoto = null) => {
    if (comparisonResult) {
      setFaceResult(comparisonResult)
      if (comparisonResult.match) {
        // Face verified, proceed to plate detection
        setActiveStep(2)
      } else {
        // Face mismatch - deny entry and show result popup
        processFaceFailure(comparisonResult)
      }
    } else {
      // No comparison result (maybe user has no face enrolled?)
      // For now, if no result, we might just log it or fail
      if (user && !user.photo) {
          setError('User has no face registered. Please contact admin.')
      } else {
          setError('Face verification failed.')
      }
    }
  }

  const handlePlateDetected = (plate, confidence) => {
    setDetectedPlate(plate)
    setPlateConfidence(confidence)
    processResult(plate, confidence)
  }

  const normalizePlate = (plate) => {
    if (!plate) return ''
    const value = typeof plate === 'string' ? plate : String(plate)
    return value
      .toUpperCase()
      .replace(/\s|-/g, '')
      .replace(/O/g, '0')
      .replace(/I/g, '1')
      .replace(/B/g, '8')
      .replace(/S/g, '5')
  }

  const plateDistance = (a, b) => {
    const s = a || ''
    const t = b || ''
    const m = s.length
    const n = t.length
    if (m === 0) return n
    if (n === 0) return m
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
    for (let i = 0; i <= m; i++) dp[i][0] = i
    for (let j = 0; j <= n; j++) dp[0][j] = j
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        )
      }
    }
    return dp[m][n]
  }

  const processResult = (plateOverride, confidenceOverride) => {
    const effectivePlate = plateOverride ?? detectedPlate
    const effectivePlateConfidence = confidenceOverride ?? plateConfidence

    if (!user || !effectivePlate) return

    const normalizedRegistered = user.vehicle_plate ? normalizePlate(user.vehicle_plate) : ''
    const normalizedDetected = normalizePlate(effectivePlate)

    let plateMatch = !!normalizedRegistered && normalizedRegistered === normalizedDetected
    let correctedPlate = effectivePlate

    if (!plateMatch && normalizedRegistered && normalizedDetected) {
      const maxLen = Math.max(normalizedRegistered.length, normalizedDetected.length)
      const distance = plateDistance(normalizedRegistered, normalizedDetected)
      const similarity = 1 - distance / maxLen
      if (similarity >= 0.8) {
        plateMatch = true
        correctedPlate = user.vehicle_plate
      }
    }
    
    // Check face result
    const faceMatch = faceResult && faceResult.match
    
    const success = plateMatch && faceMatch
    const confidence = (effectivePlateConfidence + (faceResult?.confidence || 0)) / 2
    
    let note = ''
    if (!plateMatch) note += `Plate mismatch (Detected: ${effectivePlate}, Registered: ${user.vehicle_plate}). `
    if (!faceMatch) note += `Face mismatch. `
    if (success) note = 'Vehicle and driver verified successfully.'

    const logData = {
      moodle_id: user.moodle_id,
      method: 'vehicle',
      direction,
      success,
      confidence,
      plate_detected: correctedPlate,
      note
    }

    gateUpdateMutation.mutate(logData)

    setResult({
      success,
      user,
      method: 'vehicle',
      direction,
      confidence,
      plateDetected: correctedPlate,
      faceMatch,
      timestamp: new Date().toISOString(),
      note
    })

    setActiveStep(3)
  }

  const handleNewScan = () => {
    setActiveStep(0)
    setScannedMoodleId('')
    setUser(null)
    setFaceResult(null)
    setDetectedPlate('')
    setPlateConfidence(0)
    setResult(null)
    setError('')
  }

  const handleViewLog = () => {
    navigate('/admin/logs')
  }

  const canProceedToPlate = () => {
    return user && !fetchUserMutation.isLoading
  }

  const canProceedToResult = () => {
    return detectedPlate && plateConfidence > 0
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
              <MdDirectionsCar className="text-lg text-accent" />
              <span>Vehicle {direction === 'entry' ? 'Entry' : 'Exit'}</span>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-white">
            Vehicle {direction === 'entry' ? 'Entry' : 'Exit'}
          </h1>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-text-secondary">
            Scan ID, verify driver and detect plate
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

              {user && (
                <div className="mt-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-[12px] text-emerald-100">
                  <p>
                    <span className="font-semibold">User Found:</span> {user.name} ({user.role})
                  </p>
                  <p className="mt-1">
                    Registered vehicle: {user.vehicle_plate || 'None'}
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  disabled={!canProceedToPlate()}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                    canProceedToPlate()
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
                Step 2: Driver Face Verification
              </h2>

              {user && (
                <div className="mb-3 px-4 py-3 rounded-2xl bg-sky-500/10 border border-sky-500/40 text-[12px] text-sky-100">
                  <p>
                    Verifying driver: <span className="font-semibold">{user.name}</span>
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/40 text-[12px] text-red-200">
                  {error}
                </div>
              )}

              <FaceScanner
                onFaceDetected={handleFaceDetected}
                onError={handleScannerError}
                isActive={activeStep === 1}
                userMoodleId={user?.moodle_id}
              />
            </div>
          )}

          {activeStep === 2 && (
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white mb-2">
                Step 3: License Plate Detection
              </h2>

              {user && (
                <div className="mb-3 px-4 py-3 rounded-2xl bg-sky-500/10 border border-sky-500/40 text-[12px] text-sky-100">
                  <p>
                    Detecting plate for: <span className="font-semibold">{user.name}</span>
                  </p>
                  <p className="mt-1">
                    Expected plate: <span className="font-semibold">{user.vehicle_plate || 'Not registered'}</span>
                  </p>
                </div>
              )}

              <PlateDetector
                onPlateDetected={handlePlateDetected}
                onError={handleScannerError}
                isActive={activeStep === 2}
              />
            </div>
          )}

          {activeStep === 3 && result && (
            <ResultCard 
              success={result.success}
              user={result.user}
              method={result.method}
              direction={result.direction}
              confidence={result.confidence}
              plateDetected={result.plateDetected}
              timestamp={result.timestamp}
              note={result.note}
              onNewScan={handleNewScan}
              onViewLog={handleViewLog}
            />
          )}
        </Stepper>
      </div>
    </div>
  )
}
