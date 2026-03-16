import React from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Avatar,
  Paper,
  Divider,
  useTheme,
  Chip
} from '@mui/material'
import {
  Description as FileIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Group as GroupIcon,
  School as SchoolIcon
} from '@mui/icons-material'

export default function AboutSystem() {
  const theme = useTheme()

  const papers = [
    {
      title: 'Innovative QR Code System',
      journal: 'MDPI',
      filename: 'Innovative QR Code System(MDPI).pdf',
      description: 'A novel approach to secure campus access using dynamic QR codes.'
    },
    {
      title: 'Enhanced YOLOv8-plate Detection',
      journal: 'Journal of Computer Vision',
      filename: 'Enhanced YOLOv8-plate  Detection.pdf',
      description: 'Improving license plate recognition accuracy using YOLOv8 architecture.'
    },
    {
      title: 'Applied Sciences: Campus Security',
      journal: 'Applied Sciences (15-09390)',
      filename: 'applsci-15-09390-with-cover.pdf',
      description: 'Comprehensive study on integrated campus security systems.'
    }
  ]

  const developers = [
    {
      name: 'Tanmay Shelar',
      role: 'Lead Developer & Researcher',
      description: 'Full-stack development, System Architecture, AI Model Integration.',
      initials: 'TS',
      color: '#1976d2'
    },
    {
      name: 'Developer 2',
      role: 'Frontend Specialist',
      description: 'UI/UX Design, React Implementation, Responsive Layouts.',
      initials: 'D2',
      color: '#dc004e'
    },
    {
      name: 'Developer 3',
      role: 'Backend Engineer',
      description: 'Database Management, API Optimization, Security Protocols.',
      initials: 'D3',
      color: '#2e7d32'
    },
    {
      name: 'Developer 4',
      role: 'AI/ML Researcher',
      description: 'Model Training, Data Analysis, Computer Vision Algorithms.',
      initials: 'D4',
      color: '#ed6c02'
    }
  ]

  const features = [
    {
      icon: <SecurityIcon fontSize="large" color="primary" />,
      title: 'Enhanced Security',
      text: 'Multi-factor authentication using QR codes and License Plate Recognition.'
    },
    {
      icon: <SpeedIcon fontSize="large" color="secondary" />,
      title: 'Real-time Processing',
      text: 'Instant verification and logging of entry/exit events for students and vehicles.'
    },
    {
      icon: <CodeIcon fontSize="large" color="success" />,
      title: 'Modern Stack',
      text: 'Built with React, Node.js, and advanced AI models for robust performance.'
    }
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', pb: 8 }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          mb: 6,
          textAlign: 'center',
          backgroundImage: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
            Campus Access Control System
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9 }}>
            Next-Generation Security & Management Solution
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* System Overview */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12}>
            <Typography variant="h4" component="h2" gutterBottom color="primary.main" fontWeight="bold">
              About The System
            </Typography>
            <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="body1" paragraph fontSize="1.1rem">
                The Campus Access Control System is a state-of-the-art solution designed to streamline and secure entry and exit points within educational institutions. By leveraging cutting-edge technologies, we ensure a seamless experience for students, staff, and administrators.
              </Typography>
              <Grid container spacing={3} sx={{ mt: 2 }}>
                {features.map((feature, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      {feature.icon}
                      <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.text}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Research Papers */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom color="primary.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SchoolIcon fontSize="large" /> Research Publications
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Our system is built upon rigorous research and development. Below are the key papers detailing our methodologies and innovations.
          </Typography>
          <Grid container spacing={3}>
            {papers.map((paper, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: '0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 } }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <FileIcon color="error" sx={{ mr: 1 }} />
                      <Chip label="PDF" size="small" color="error" variant="outlined" />
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {paper.title}
                    </Typography>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      {paper.journal}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {paper.description}
                    </Typography>
                  </CardContent>
                  <Divider />
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      size="small" 
                      variant="contained" 
                      startIcon={<DownloadIcon />}
                      component="a"
                      href={`/papers/${paper.filename}`}
                      target="_blank"
                      fullWidth
                    >
                      Read Paper
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Development Team */}
        <Box>
          <Typography variant="h4" component="h2" gutterBottom color="primary.main" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GroupIcon fontSize="large" /> Meet the Developers
          </Typography>
          <Grid container spacing={3}>
            {developers.map((dev, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center', transition: '0.3s', '&:hover': { boxShadow: 6 } }}>
                  <Box sx={{ pt: 4, pb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Avatar 
                      sx={{ 
                        width: 80, 
                        height: 80, 
                        bgcolor: dev.color,
                        fontSize: '2rem',
                        boxShadow: 3
                      }}
                    >
                      {dev.initials}
                    </Avatar>
                  </Box>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">
                      {dev.name}
                    </Typography>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      {dev.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {dev.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}
