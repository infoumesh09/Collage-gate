import React from 'react'
import { Box, Typography } from '@mui/material'
import StudentNavbar from '../../components/StudentNavbar'

function StudentRegisterFace() {
  return (
    <Box>
      <StudentNavbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Register Face</Typography>
        <Typography>Face registration flow will be available here. (Coming soon)</Typography>
      </Box>
    </Box>
  )
}

export default StudentRegisterFace

