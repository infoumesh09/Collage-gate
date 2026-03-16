import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Box,
  Button,
  Typography,
  Alert,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  CameraAlt as CameraIcon,
  Upload as UploadIcon,
  Close as CloseIcon
} from '@mui/icons-material'

const BarcodeScanner = ({ onScan, onError, isActive = true }) => {
  const scannerRef = useRef(null)
  const fileInputRef = useRef(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const handleScanSuccess = (decodedText) => {
    if (/^\d+$/.test(decodedText)) {
      onScan(decodedText)
    } else {
      setError('Invalid Moodle ID format. Please scan a valid student ID.')
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const html5Qrcode = new Html5Qrcode('temp-scanner')
    html5Qrcode.scanFile(file, true)
      .then(decodedText => {
        handleScanSuccess(decodedText)
        setShowUploadDialog(false)
        html5Qrcode.clear()
      })
      .catch(err => {
        setError('Could not detect barcode in uploaded image')
        const errorMessage = typeof err === 'string' ? err : err.message || JSON.stringify(err)
        if (!errorMessage.includes('No MultiFormat Readers') && !errorMessage.includes('NotFoundException')) {
          console.error('File scan error:', err)
        }
        html5Qrcode.clear().catch(() => {})
      })
  }

  const stopScanning = async () => {
    const instance = scannerRef.current
    if (!instance) return

    // Clear local state first so UI updates immediately
    scannerRef.current = null
    setIsScanning(false)

    try {
      await instance.stop()
    } catch (_) {
      // Ignore stop errors (already stopped, etc.)
    }

    try {
      await instance.clear()
    } catch (_) {
      // Ignore clear errors if instance is already cleared
    }
  }

  const startScanning = async () => {
    if (scannerRef.current) return
    setError('')
    try {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true })
      } catch (permissionErr) {
        if (permissionErr.name !== 'NotFoundError' && permissionErr.name !== 'DevicesNotFoundError') {
          console.error('Camera permission error:', permissionErr)
        }
        if (permissionErr.name === 'NotFoundError' || permissionErr.name === 'DevicesNotFoundError') {
          setError('No camera detected. Please use the "Upload Image" button (if available) or check your camera connection.')
        } else {
          setError('Camera access denied. Please allow camera permissions in your browser settings.')
        }
        return
      }

      const html5Qrcode = new Html5Qrcode('barcode-scanner')
      scannerRef.current = html5Qrcode

      const devices = await Html5Qrcode.getCameras()
      const cameraId = devices && devices.length > 0 ? devices[0].id : null
      if (!cameraId) {
        setError('No camera detected. Please check your camera connection.')
        return
      }

      await html5Qrcode.start(
        { deviceId: { exact: cameraId } },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          handleScanSuccess(decodedText)
        },
        (scanError) => {
          if (scanError && typeof scanError === 'string' && !scanError.includes('No MultiFormat Readers')) {
            console.log('QR Code scan error:', scanError)
          }
        }
      )
      setIsScanning(true)
    } catch (err) {
      console.error('Scanner initialization error:', err)
      setError('Failed to initialize camera. Please check permissions.')
    }
  }

  useEffect(() => {
    if (!isActive) {
      stopScanning()
    }
    return () => {
      stopScanning()
    }
  }, [isActive])

  return (
    <Box>
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: '2rem',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          backdropFilter: 'blur(28px)',
          boxShadow: '0 40px 80px rgba(15, 23, 42, 0.9)',
          color: '#e2e8f0'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant='h6'>Scan Student ID</Typography>
          <Box>
            <IconButton onClick={() => setShowUploadDialog(true)} color='primary'>
              <UploadIcon />
            </IconButton>
            {isScanning ? (
              <Button onClick={stopScanning} color='error' size='small'>
                Stop
              </Button>
            ) : (
              <Button onClick={startScanning} color='primary' size='small' startIcon={<CameraIcon />}>
                Start
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <div id='barcode-scanner' style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} />
          {!isScanning && (
            <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
              Click "Start" to begin scanning or upload an image
            </Typography>
          )}
        </Box>
      </Paper>

      <Dialog open={showUploadDialog} onClose={() => setShowUploadDialog(false)}>
        <DialogTitle>
          Upload Image
          <IconButton
            onClick={() => setShowUploadDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Upload an image containing a barcode to scan
          </Typography>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Button
            variant='outlined'
            fullWidth
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Image
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUploadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <div id='temp-scanner' style={{ display: 'none' }} />
    </Box>
  )
}

export default BarcodeScanner
