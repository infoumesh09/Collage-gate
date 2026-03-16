import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  Divider
} from '@mui/material'
import {
  DirectionsCar as CarIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { useMutation, useQuery } from 'react-query'
import { vehiclesAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

const VehicleRequest = () => {
  const { user } = useAuthStore()
  const [plate, setPlate] = useState('')
  const [note, setNote] = useState('')
  const [activeStep, setActiveStep] = useState(0)

  // Get user's vehicle requests
  const { data: requests, refetch } = useQuery(
    'vehicleRequests',
    () => vehiclesAPI.getMy(),
    {
      enabled: !!user
    }
  )

  // Submit vehicle request
  const requestMutation = useMutation(vehiclesAPI.register, {
    onSuccess: () => {
      setActiveStep(1)
      setPlate('')
      setNote('')
      refetch()
    },
    onError: (error) => {
      console.error('Request failed:', error)
    }
  })

  const handleSubmit = () => {
    if (!plate.trim()) return
    
    requestMutation.mutate({
      plate: plate.trim().toUpperCase(),
      note: note.trim() || 'Vehicle access request'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success'
      case 'denied': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckIcon />
      case 'denied': return <CancelIcon />
      case 'pending': return <SendIcon />
      default: return null
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Vehicle Access Request
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Request permission to bring your vehicle to campus. Your request will be reviewed by an administrator.
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        <Step>
          <StepLabel>Submit Request</StepLabel>
          <StepContent>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Vehicle Plate Number"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder="e.g., ABC-1234"
                  helperText="Enter your vehicle's license plate number"
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Notes (Optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any additional information about your vehicle or request..."
                />
              </Box>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!plate.trim() || requestMutation.isLoading}
                startIcon={<SendIcon />}
                sx={{ mr: 2 }}
              >
                {requestMutation.isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>

              {requestMutation.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {requestMutation.error.response?.data?.error || 'Failed to submit request'}
                </Alert>
              )}
            </Paper>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Request Submitted</StepLabel>
          <StepContent>
            <Paper sx={{ p: 3 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Your vehicle request has been submitted successfully!
              </Alert>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                Your request will be reviewed by an administrator. You'll be notified once a decision is made.
              </Typography>

              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                sx={{ mr: 2 }}
              >
                Submit Another Request
              </Button>
            </Paper>
          </StepContent>
        </Step>
      </Stepper>

      {/* My Requests */}
      {requests && requests.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            My Vehicle Requests
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          {requests.map((request) => (
            <Card key={request.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CarIcon color="primary" />
                    <Typography variant="h6">
                      {request.plate}
                    </Typography>
                  </Box>
                  
                  <Chip
                    icon={getStatusIcon(request.status)}
                    label={request.status.toUpperCase()}
                    color={getStatusColor(request.status)}
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Submitted:</strong> {new Date(request.created_at).toLocaleString()}
                </Typography>

                {request.note && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Notes:</strong> {request.note}
                  </Typography>
                )}

                {request.admin_note && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Admin Response:</strong> {request.admin_note}
                  </Typography>
                )}

                {request.status === 'pending' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Your request is under review. Please wait for administrator approval.
                  </Alert>
                )}

                {request.status === 'approved' && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Your vehicle has been approved! You can now use it for campus access.
                  </Alert>
                )}

                {request.status === 'denied' && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Your vehicle request has been denied. Please contact administration for more information.
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {requests && requests.length === 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            My Vehicle Requests
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <CarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              No vehicle requests yet. Submit your first request above.
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  )
}

export default VehicleRequest
