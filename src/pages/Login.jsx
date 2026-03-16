import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'
import { useMutation } from 'react-query'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, user } = useAuthStore()
  
  const isAdminLogin = location.pathname.includes('admin')

  useEffect(() => {
    if (isAuthenticated && user) {
      const isUrlAdmin = location.pathname.includes('admin')
      const isUserAdmin = user.role === 'admin'

      if (location.pathname === '/login') {
         navigate(user.role === 'admin' ? '/admin' : '/portal')
         return
      }

      if (isUrlAdmin && isUserAdmin) {
        navigate('/admin')
      } else if (!isUrlAdmin && !isUserAdmin && location.pathname.includes('student')) {
        navigate('/portal')
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname])

  const [formData, setFormData] = useState({
    moodle_id: '',
    name: '',
    role: 'student',
    year: 'FE',
    division: 'A',
    username: '',
    password: ''
  })
  const [error, setError] = useState('')

  const loginMutation = useMutation(authAPI.login, {
    onSuccess: (response) => {
      const { token, user } = response.data
      login(user, token)
      navigate(user.role === 'admin' ? '/admin' : '/portal')
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Login failed')
    }
  })

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!isAdminLogin) {
      // Student/Staff login
      if (!formData.moodle_id || !formData.name) {
        setError('Moodle ID and name are required')
        return
      }
      loginMutation.mutate({
        moodle_id: formData.moodle_id,
        name: formData.name,
        role: formData.role,
        // Include year/division for students; staff can ignore
        year: formData.role === 'student' ? formData.year : undefined,
        division: formData.role === 'student' ? formData.division : undefined
      })
    } else {
      // Admin login
      if (!formData.username || !formData.password) {
        setError('Username and password are required')
        return
      }
      loginMutation.mutate({
        role: 'admin',
        username: formData.username,
        password: formData.password
      })
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" textAlign="center" gutterBottom>
          {isAdminLogin ? 'Admin Login' : 'Student Login'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {!isAdminLogin ? (
            // Student/Staff form
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Moodle ID"
                value={formData.moodle_id}
                onChange={handleInputChange('moodle_id')}
                fullWidth
                required
                placeholder="e.g., 23102185"
              />
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                fullWidth
                required
                placeholder="e.g., John Doe"
              />
              <TextField
                select
                label="Role"
                value={formData.role}
                onChange={handleInputChange('role')}
                fullWidth
                SelectProps={{ native: true }}
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </TextField>
              {formData.role === 'student' && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    select
                    label="Year"
                    value={formData.year}
                    onChange={handleInputChange('year')}
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    <option value="FE">FE</option>
                    <option value="SE">SE</option>
                    <option value="TE">TE</option>
                    <option value="BE">BE</option>
                  </TextField>
                  <TextField
                    select
                    label="Division"
                    value={formData.division}
                    onChange={handleInputChange('division')}
                    fullWidth
                    SelectProps={{ native: true }}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </TextField>
                </Box>
              )}
            </Box>
          ) : (
            // Admin form
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Username"
                value={formData.username}
                onChange={handleInputChange('username')}
                fullWidth
                required
                placeholder="admin"
              />
              <TextField
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                fullWidth
                required
                placeholder="admin123"
              />
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loginMutation.isLoading}
            sx={{ mt: 3 }}
          >
            {loginMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Login'
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="text"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
          
          {!isAdminLogin && (
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button variant="text" color="primary">
                New Student? Register
              </Button>
            </Link>
          )}
        </Box>

        {/* Demo credentials */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Demo Credentials:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdminLogin ? (
              <>Admin: admin, admin123</>
            ) : (
              <>
                Student: 23102185, John Doe<br />
                Staff: 23102186, Jane Smith
              </>
            )}
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
