import React from 'react'
import { Box, Typography } from '@mui/material'
import StudentNavbar from '../../components/StudentNavbar'

function StudentProfile() {
  return (
    <Box>
      <StudentNavbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Profile</Typography>
        <Typography>Manage your account information here. (Coming soon)</Typography>
      </Box>
    </Box>
  )
}

export default StudentProfile

