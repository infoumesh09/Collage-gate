import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Paper,
  AppBar,
  Toolbar,
  Button,
  CircularProgress
} from '@mui/material'
import {
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { statsAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import loginBg from '../assets/loginbg.jpeg'

const ActionCard = ({ title, icon, color, onClick, disabled = false }) => (
  <Card 
    sx={{ 
      height: '100%',
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer'
    }}
  >
    <CardActionArea 
      onClick={disabled ? undefined : onClick}
      sx={{ height: '100%', p: 2 }}
    >
      <CardContent sx={{ textAlign: 'center' }}>
        <Box sx={{ color, mb: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
)

const StatCard = ({ title, value, color = 'primary' }) => (
  <Paper sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="h4" color={color} fontWeight="bold">
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {title}
    </Typography>
  </Paper>
)

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, user, isAdmin } = useAuthStore()

  const handleLoginStudent = () => {
    if (isAuthenticated) {
      if (!isAdmin()) {
        navigate('/portal')
      } else {
        navigate('/student/login')
      }
    } else {
      navigate('/student/login')
    }
  }

  const handleLoginAdmin = () => {
    if (isAuthenticated) {
      if (isAdmin()) {
        navigate('/admin')
      } else {
        navigate('/admin/login')
      }
    } else {
      navigate('/admin/login')
    }
  }

  const handleAbout = () => {
    navigate('/about')
  }

  const handleContact = () => {
    alert("Contact Support:\n\nEmail: support@campusaccess.com\nPhone: +1 234 567 890")
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${loginBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white', fontWeight: 'bold' }}>
            🏫 Campus Access Control
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
        <Paper elevation={6} sx={{ p: 6, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
          <Typography 
            variant="h3" 
            component="h1" 
            textAlign="center" 
            gutterBottom
            sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}
          >
            Welcome to Campus Access
          </Typography>
          
          <Typography 
            variant="h6" 
            textAlign="center" 
            color="text.secondary"
            sx={{ mb: 6 }}
          >
            Secure • Efficient • Smart
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Button 
                fullWidth 
                variant="contained" 
                size="large"
                startIcon={<PersonIcon />}
                onClick={handleLoginStudent}
                sx={{ py: 2, fontSize: '1.1rem', backgroundColor: '#1a237e' }}
              >
                {isAuthenticated && !isAdmin() ? 'Go to Portal' : 'Student/Staff Login'}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button 
                fullWidth 
                variant="outlined" 
                size="large"
                startIcon={<AdminIcon />}
                onClick={handleLoginAdmin}
                sx={{ py: 2, fontSize: '1.1rem', borderWidth: 2 }}
              >
                {isAuthenticated && isAdmin() ? 'Go to Dashboard' : 'Admin Login'}
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button 
                fullWidth 
                variant="outlined" 
                size="large"
                color="info"
                onClick={handleAbout}
                sx={{ py: 2, fontSize: '1.1rem', borderWidth: 2 }}
              >
                About System
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button 
                fullWidth 
                variant="outlined" 
                size="large"
                color="secondary"
                onClick={handleContact}
                sx={{ py: 2, fontSize: '1.1rem', borderWidth: 2 }}
              >
                Contact Support
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
      
      <Box sx={{ py: 3, textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
        <Typography variant="body2">
          © {new Date().getFullYear()} Campus Access Control System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  )
}
