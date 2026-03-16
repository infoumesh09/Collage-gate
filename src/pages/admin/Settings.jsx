import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Divider
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  Save as SaveIcon,
  Logout as LogoutIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { settingsAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function AdminSettings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()
  
  const [settings, setSettings] = useState({
    face_threshold: 0.6,
    allow_manual: true,
    max_retries: 3
  })
  const [saveMessage, setSaveMessage] = useState('')

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery(
    'settings',
    settingsAPI.get,
    {
      onSuccess: (response) => {
        setSettings(response.data)
      }
    }
  )

  // Update settings mutation
  const updateSettingsMutation = useMutation(settingsAPI.update, {
    onSuccess: () => {
      queryClient.invalidateQueries('settings')
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    },
    onError: (error) => {
      console.error('Failed to update settings:', error)
      setSaveMessage('Failed to save settings')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  })

  const handleSettingChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    updateSettingsMutation.mutate(settings)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading settings...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <AdminIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            System Settings
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Settings
        </Typography>

        {saveMessage && (
          <Alert 
            severity={saveMessage.includes('success') ? 'success' : 'error'} 
            sx={{ mb: 3 }}
            onClose={() => setSaveMessage('')}
          >
            {saveMessage}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Face Recognition Settings
            </Typography>
            
            <TextField
              label="Face Match Threshold"
              type="number"
              value={settings.face_threshold}
              onChange={handleSettingChange('face_threshold')}
              fullWidth
              margin="normal"
              inputProps={{ 
                min: 0, 
                max: 1, 
                step: 0.1 
              }}
              helperText="Lower values = more strict matching (0.0-1.0). Recommended: 0.6"
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              System Behavior
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.allow_manual}
                  onChange={handleSettingChange('allow_manual')}
                />
              }
              label="Allow Manual Overrides"
              sx={{ mb: 2 }}
            />

            <TextField
              label="Maximum Retry Attempts"
              type="number"
              value={settings.max_retries}
              onChange={handleSettingChange('max_retries')}
              fullWidth
              margin="normal"
              inputProps={{ 
                min: 1, 
                max: 10 
              }}
              helperText="Number of retry attempts before allowing manual override (1-10)"
            />

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={updateSettingsMutation.isLoading}
                size="large"
              >
                {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Face Recognition:</strong> Uses face-api.js with TinyFaceDetector, FaceLandmarks, and FaceRecognitionNet models.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>Barcode Scanning:</strong> Uses html5-qrcode library for webcam and image-based scanning.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>License Plate Detection:</strong> Uses Tesseract.js OCR for text recognition from images.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Database:</strong> SQLite with Prisma ORM for data persistence.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
