import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Stepper,
  Step,
  StepLabel,
  MenuItem
} from '@mui/material';
import { useMutation } from 'react-query';
import { registrationsAPI } from '../services/api';
import FaceScanner from '../components/FaceScanner';

const registerStudent = async (data) => {
  const response = await registrationsAPI.request(data);
  return response.data;
};

// Convert base64 string to Blob for file upload
const base64ToBlob = (base64, mimeType) => {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeType });
};

export default function Register() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    moodle_id: '',
    name: '',
    email: '',
    note: '',
    photo: null,
    year: '',
    division: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);

  const registerMutation = useMutation(registerStudent, {
    onSuccess: () => {
      setSuccess(true);
      setError('');
      // Reset form
      setFormData({
        moodle_id: '',
        name: '',
        email: '',
        note: '',
        photo: null,
        year: '',
        division: ''
      });
      setActiveStep(0);
      setFaceDescriptor(null);
    },
    onError: (error) => {
      // Surface clearer network/proxy issues to the user
      const isNetworkIssue = !error.response && (error.request || error.code === 'ERR_NETWORK');
      const message = isNetworkIssue
        ? 'Cannot reach server. Please ensure the backend is running on http://localhost:3006.'
        : (error.response?.data?.error || 'Registration failed');
      setError(message);
      setSuccess(false);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!formData.moodle_id || !formData.name) {
      setError('Moodle ID and name are required');
      return;
    }

    if (activeStep === 0) {
      // Move to face capture step
      setActiveStep(1);
      return;
    }
    
    // Validate photo
    if (!formData.photo) {
      setError('Please capture your photo for face verification');
      return;
    }
    
    // Ensure face_descriptor is properly formatted for the server
    const dataToSubmit = {
      ...formData,
      // Convert face_descriptor to string if it's an array
      face_descriptor: Array.isArray(formData.face_descriptor) 
        ? JSON.stringify(formData.face_descriptor) 
        : formData.face_descriptor
    };
    
    console.log('Submitting registration with data:', {
      moodle_id: dataToSubmit.moodle_id,
      name: dataToSubmit.name,
      email: dataToSubmit.email,
      hasPhoto: !!dataToSubmit.photo,
      photoLength: dataToSubmit.photo?.length,
      hasFaceDescriptor: !!dataToSubmit.face_descriptor,
      descriptorType: typeof dataToSubmit.face_descriptor
    });
    
    registerMutation.mutate(dataToSubmit);
  };

  const handleFaceDetected = (descriptor, result, photo) => {
    console.log('Face detected:', { descriptor, photo: !!photo });
    setFaceDescriptor(descriptor);
    
    // Use the photo captured by FaceScanner
    if (photo) {
      console.log('Using photo from FaceScanner');
      // Update form data with photo
      setFormData({
        ...formData,
        photo: photo,
        face_descriptor: descriptor
      });
    } else {
      console.log('Fallback: manually capturing photo');
      // Fallback to capturing photo manually if not provided
      const video = document.querySelector('video');
      if (!video) {
        console.error('No video element found for fallback photo capture');
        return;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const photoData = canvas.toDataURL('image/jpeg');
      console.log('Manually captured photo data length:', photoData?.length);
      
      // Update form data with photo
      setFormData({
        ...formData,
        photo: photoData,
        face_descriptor: descriptor
      });
    }
  };

  const handleBack = () => {
    setActiveStep(0);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setUploadedPhoto(base64);
      setFormData({
        ...formData,
        photo: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedPhoto = () => {
    setUploadedPhoto(null);
    setFormData({
      ...formData,
      photo: null,
    });
  };

  return (
    <Box sx={{ py: 8, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h5" gutterBottom>
            Student Registration
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Register for campus access. Your request will be reviewed by an administrator.
          </Typography>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
            <Step>
              <StepLabel>Personal Information</StepLabel>
            </Step>
            <Step>
              <StepLabel>Face Enrollment</StepLabel>
            </Step>
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Registration request submitted successfully! An administrator will review your request.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {activeStep === 0 ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="register-moodle-id"
                    label="Moodle ID"
                    name="moodle_id"
                    value={formData.moodle_id}
                    onChange={handleChange}
                    disabled={registerMutation.isLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    id="register-name"
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={registerMutation.isLoading}
                  />
                </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="register-email"
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={registerMutation.isLoading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  required
                  fullWidth
                  id="register-year"
                  label="Year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  disabled={registerMutation.isLoading}
                >
                  {['FE','SE','TE','BE'].map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  required
                  fullWidth
                  id="register-division"
                  label="Division"
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  disabled={registerMutation.isLoading}
                >
                  {['A','B','C','D'].map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </TextField>
              </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="register-note"
                    label="Additional Notes"
                    name="note"
                    multiline
                    rows={3}
                    value={formData.note}
                    onChange={handleChange}
                    disabled={registerMutation.isLoading}
                  />
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ width: '100%' }}>
                <FaceScanner 
                  onFaceDetected={handleFaceDetected} 
                  isActive={activeStep === 1}
                  isEnrollment={true}
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    If camera access is blocked, upload a clear face photo.
                  </Typography>
                  <Button variant="outlined" component="label" sx={{ mr: 2 }}>
                    Upload Photo
                    <input hidden accept="image/*" type="file" onChange={handlePhotoUpload} />
                  </Button>
                  {uploadedPhoto && (
                    <Button variant="text" color="secondary" onClick={clearUploadedPhoto}>
                      Remove Photo
                    </Button>
                  )}
                  {uploadedPhoto && (
                    <Box sx={{ mt: 2 }}>
                      <img src={uploadedPhoto} alt="Uploaded preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
                    </Box>
                  )}
                </Box>
                {formData.photo && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Photo captured successfully!
                  </Alert>
                )}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, mb: 2 }}>
              {activeStep === 1 && (
                <Button
                  onClick={handleBack}
                  variant="outlined"
                  disabled={registerMutation.isLoading}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit"
                fullWidth={activeStep === 0}
                variant="contained"
                color="primary"
                disabled={registerMutation.isLoading}
                sx={{ ml: activeStep === 1 ? 1 : 0 }}
              >
                {registerMutation.isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : activeStep === 0 ? (
                  'Next'
                ) : (
                  'Submit Registration'
                )}
              </Button>
            </Box>
            
            <Grid container justifyContent="center">
              <Grid item>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    Already have an account? Login
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
