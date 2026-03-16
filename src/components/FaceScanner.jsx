import React, { useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  LinearProgress
} from '@mui/material'
import {
  CameraAlt as CameraIcon,
  Stop as StopIcon
} from '@mui/icons-material'

const FaceScanner = ({ 
  onFaceDetected, 
  onError, 
  isActive = true, 
  userMoodleId = null,
  isEnrollment = false 
}) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [detectionInterval, setDetectionInterval] = useState(null)
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [isProcessingUpload, setIsProcessingUpload] = useState(false)
  const isVerifyingRef = useRef(false)

  const userMoodleIdRef = useRef(userMoodleId)

  useEffect(() => {
    userMoodleIdRef.current = userMoodleId
  }, [userMoodleId])

  useEffect(() => {
    if (isActive) {
      loadModels()
    }

    return () => {
      stopScanning()
    }
  }, [isActive])

  const loadModels = async () => {
    try {
      setIsLoading(true)
      setError('')

      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
      ])
      
      setModelsLoaded(true)
      setIsLoading(false)
    } catch (err) {
      console.error('Model loading error:', err)
      setError('Failed to load face recognition models')
      setIsLoading(false)
    }
  }

  const startScanning = async () => {
    if (!modelsLoaded) {
      setError('Models not loaded yet')
      return
    }

    try {
      setError('')
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          }
        })
      } catch (err) {
        console.warn('Preferred camera settings failed, trying fallback...', err)
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        startFaceDetection()
      }
    } catch (err) {
      if (err.name !== 'NotFoundError' && err.name !== 'DevicesNotFoundError') {
        console.error('Camera access error:', err)
      }
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please allow camera permissions in your browser settings and refresh the page.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera detected. Please use the "Upload Image" button to upload a photo instead.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application. Please close other applications using the camera.')
      } else {
        setError('Camera access error: ' + (err.message || 'Unknown error'))
      }
      if (onError) {
        onError(err)
      }
    }
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError('')
      setIsProcessingUpload(true)

      if (!modelsLoaded) {
        await loadModels()
      }

      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = reader.result
        setUploadedPhoto(base64)
        await processUploadedImage(base64)
      }
      reader.onerror = () => {
        setError('Failed to read the selected image file')
        setIsProcessingUpload(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Image upload error:', err)
      setError('Image upload failed')
      setIsProcessingUpload(false)
    }
  }

  const processUploadedImage = async (base64Image) => {
    try {
      const img = new Image()
      img.src = base64Image

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const detections = await faceapi
        .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors()

      if (!detections || detections.length === 0) {
        setError('No face detected in the uploaded image. Try a clearer photo.')
        setIsProcessingUpload(false)
        return
      }

      const detection = detections[0]
      const descriptor = Array.from(detection.descriptor)

      if (isEnrollment) {
        onFaceDetected(descriptor, null, base64Image)
        setIsProcessingUpload(false)
        return
      }

      if (userMoodleId) {
        try {
          const response = await fetch(`/api/face/${userMoodleId}/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descriptor, capturedPhoto: base64Image })
          })

          const result = await response.json()
          onFaceDetected(descriptor, result, base64Image)
        } catch (err) {
          console.error('Face comparison error (uploaded image):', err)
          setError('Failed to compare face from uploaded image')
        }
      }

      setIsProcessingUpload(false)
    } catch (err) {
      console.error('Process uploaded image error:', err)
      setError('Could not process the uploaded image')
      setIsProcessingUpload(false)
    }
  }

  const stopScanning = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval)
      setDetectionInterval(null)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) {
      console.error('capturePhoto: Video reference is null')
      return null
    }
    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('capturePhoto: Invalid video dimensions', { 
          width: videoRef.current.videoWidth, 
          height: videoRef.current.videoHeight 
        })
        return null
      }
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      const photoData = canvas.toDataURL('image/jpeg', 0.8)
      return photoData
    } catch (error) {
      console.error('capturePhoto: Error capturing photo', error)
      return null
    }
  }

  const startFaceDetection = () => {
    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
          const detections = await faceapi
            .detectAllFaces(videoRef.current, options)
            .withFaceLandmarks()
            .withFaceDescriptors()

          if (detections.length > 0) {
            if (isVerifyingRef.current) {
              return
            }
            const detection = detections[0]
            const descriptor = Array.from(detection.descriptor)
            const photo = capturePhoto()
            if (!photo) {
              return
            }
            drawFaceBox(detection)
            if (isEnrollment) {
              onFaceDetected(descriptor, null, photo)
              return
            }
            const currentMoodleId = userMoodleIdRef.current
            if (currentMoodleId) {
              try {
                isVerifyingRef.current = true
                const response = await fetch(`/api/face/${currentMoodleId}/compare`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ descriptor, capturedPhoto: photo })
                })

                if (!response.ok) {
                  console.error('Face comparison HTTP error:', response.status)
                  setError('Face comparison failed on server')
                  isVerifyingRef.current = false
                  return
                }

                const result = await response.json()
                onFaceDetected(descriptor, result, photo)
                if (!result.match) {
                  setTimeout(() => {
                    isVerifyingRef.current = false
                  }, 2000)
                } else {
                  isVerifyingRef.current = false
                }
              } catch (err) {
                console.error('Face comparison error:', err)
                setError('Failed to compare face')
                isVerifyingRef.current = false
              }
            }
          } else {
            clearCanvas()
          }
        } catch (err) {
          console.error('Face detection error:', err)
        }
      }
    }, 500)

    setDetectionInterval(interval)
  }

  const drawFaceBox = (detection) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const { x, y, width, height } = detection.detection.box
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, width, height)
    ctx.fillStyle = '#00ff00'
    ctx.font = '16px Arial'
    ctx.fillText('Face Detected', x, y - 10)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='h6'>
            {isEnrollment ? 'Enroll Face' : 'Face Verification'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isScanning ? (
              <Button onClick={stopScanning} color='error' size='small' startIcon={<StopIcon />}>
                Stop
              </Button>
            ) : (
              <Button 
                onClick={startScanning} 
                color='primary' 
                size='small' 
                startIcon={<CameraIcon />}
                disabled={!modelsLoaded || isLoading}
              >
                {isLoading ? 'Loading...' : 'Start Camera'}
              </Button>
            )}
            <Button
              component='label'
              size='small'
              variant='outlined'
              disabled={isLoading}
            >
              Upload Image
              <input type='file' accept='image/*' hidden onChange={handleImageUpload} />
            </Button>
          </Box>
        </Box>

        {isLoading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Loading face recognition models...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        <Box sx={{ textAlign: 'center', position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              borderRadius: '8px',
              display: isScanning ? 'block' : 'none'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              maxWidth: '400px',
              width: '100%',
              height: 'auto',
              pointerEvents: 'none',
              display: isScanning ? 'block' : 'none'
            }}
          />
          {!isScanning && !isLoading && (
            <Box sx={{ 
              width: '100%', 
              maxWidth: '400px', 
              height: '300px', 
              border: '2px dashed #ccc',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto'
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                  Start camera or upload an image to continue
                </Typography>
                {uploadedPhoto && (
                  <Box sx={{ mt: 1 }}>
                    <img 
                      src={uploadedPhoto} 
                      alt='Uploaded preview' 
                      style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px' }} 
                    />
                  </Box>
                )}
                {isProcessingUpload && (
                  <Box sx={{ mt: 1 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {isEnrollment && (
          <Alert severity='info' sx={{ mt: 2 }}>
            This will create your face template for future verification.
          </Alert>
        )}

        {!isEnrollment && (
          <Alert severity='info' sx={{ mt: 2 }}>
            <Typography variant='body2' component='div'>
              <strong>Tips for better accuracy:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Ensure good lighting (avoid shadows on face)</li>
                <li>Look directly at the camera</li>
                <li>Remove sunglasses or face masks</li>
                <li>Keep a neutral expression</li>
              </ul>
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  )
}

export default FaceScanner
