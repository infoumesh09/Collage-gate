import React, { useRef, useState } from 'react'
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material'
import {
  Upload as UploadIcon,
  CameraAlt as CameraIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { formatConfidence } from '../utils/formatConfidence'

const PlateDetector = ({ onPlateDetected, onError, isActive = true }) => {
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedPlate, setDetectedPlate] = useState('')
  const [editedPlate, setEditedPlate] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState('')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)

  const preprocessImage = (imageData) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0, img.width, img.height)

        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageDataObj.data

        const sharpenedData = applySharpen(imageDataObj)
        ctx.putImageData(sharpenedData, 0, 0)

        const enhancedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const enhancedData = enhancedImageData.data

        for (let i = 0; i < enhancedData.length; i += 4) {
          const gray = (enhancedData[i] * 0.3 + enhancedData[i + 1] * 0.5 + enhancedData[i + 2] * 0.2)
          const threshold = 130
          const newValue = gray > threshold ? 255 : 0
          enhancedData[i] = enhancedData[i + 1] = enhancedData[i + 2] = newValue
        }

        ctx.putImageData(enhancedImageData, 0, 0)
        resolve(canvas.toDataURL('image/jpeg', 1.0))
      }
      img.src = imageData
    })
  }

  const applySharpen = (imageData) => {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const result = new ImageData(width, height)
    const resultData = result.data

    for (let i = 0; i < data.length; i++) {
      resultData[i] = data[i]
    }

    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const offset = (y * width + x) * 4
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kernelIndex = (ky + 1) * 3 + (kx + 1)
              const pixelOffset = ((y + ky) * width + (x + kx)) * 4 + c
              sum += data[pixelOffset] * kernel[kernelIndex]
            }
          }
          resultData[offset + c] = Math.min(255, Math.max(0, sum))
        }
      }
    }

    return result
  }

  const processImage = async (imageData) => {
    try {
      setIsProcessing(true)
      setError('')

      const response = await fetch('/api/ocr-plate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imageData })
      })

      if (!response.ok) {
        throw new Error('Failed to detect plate')
      }

      const data = await response.json()
      const plate = data.plate
      const confidenceValue = data.confidence ?? 0

      setDetectedPlate(plate)
      setEditedPlate(plate)
      setConfidence(confidenceValue / 100)

      if (onPlateDetected) {
        onPlateDetected(plate, confidenceValue / 100)
      }
    } catch (err) {
      console.error('OCR Error:', err)
      setError('Failed to detect plate. Please try again or enter manually.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      processImage(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const captureFromCamera = async () => {
    let stream
    try {
      setError('')
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: 'environment'
          }
        })
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        })
      }
    } catch (err) {
      console.error('Camera access error:', err)

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
      return
    }

    try {
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsCapturing(true)
      }
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Camera access denied. Please allow camera permissions.')
    }
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      const imageData = canvas.toDataURL('image/jpeg')
      processImage(imageData)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      setIsCapturing(false)
    }
  }

  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }

  const handleEditPlate = () => {
    setShowEditDialog(true)
  }

  const confirmEdit = () => {
    if (editedPlate.trim()) {
      setDetectedPlate(editedPlate.trim().toUpperCase())
      onPlateDetected(editedPlate.trim().toUpperCase(), 1.0)
      setShowEditDialog(false)
    }
  }

  const validatePlate = (plate) => {
    return /^[A-Z0-9-]{3,10}$/.test(plate)
  }

  return (
    <Box>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant='h6' gutterBottom>
          License Plate Detection
        </Typography>

        {!isProcessing && !detectedPlate && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant='outlined'
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              fullWidth
            >
              Upload Image
            </Button>
            <Button
              variant='outlined'
              startIcon={<CameraIcon />}
              onClick={captureFromCamera}
              fullWidth
            >
              Take Photo
            </Button>
          </Box>
        )}

        {isCapturing && (
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                maxWidth: '400px',
                height: 'auto',
                borderRadius: '8px'
              }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <Box sx={{ mt: 2 }}>
              <Button
                variant='contained'
                color='primary'
                onClick={takePhoto}
                sx={{ mr: 1 }}
              >
                Capture
              </Button>
              <Button
                variant='outlined'
                onClick={stopCapture}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        {isProcessing && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant='body2' color='text.secondary' gutterBottom>
              Processing image for license plate detection...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {detectedPlate && !isProcessing && (
          <Box>
            <Alert 
              severity={confidence > 0.7 ? 'success' : 'warning'} 
              sx={{ mb: 2 }}
            >
              <Typography variant='body2'>
                <strong>Detected Plate:</strong> {detectedPlate}
                <br />
                <strong>Confidence:</strong> {formatConfidence(confidence)}%
              </Typography>
            </Alert>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant='outlined'
                startIcon={<EditIcon />}
                onClick={handleEditPlate}
                size='small'
              >
                Edit
              </Button>
              <Button
                variant='contained'
                startIcon={<CheckIcon />}
                onClick={() => onPlateDetected(detectedPlate, confidence)}
                size='small'
              >
                Confirm
              </Button>
            </Box>
          </Box>
        )}

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </Paper>

      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)}>
        <DialogTitle>
          Edit License Plate
          <IconButton
            onClick={() => setShowEditDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            label='License Plate'
            value={editedPlate}
            onChange={(e) => setEditedPlate(e.target.value.toUpperCase())}
            fullWidth
            margin='normal'
            placeholder='e.g., ABC123'
            error={!!editedPlate && !validatePlate(editedPlate)}
            helperText={editedPlate && !validatePlate(editedPlate) ? 'Invalid plate format' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={confirmEdit} 
            variant='contained'
            disabled={!editedPlate || !validatePlate(editedPlate)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PlateDetector
