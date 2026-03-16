import React from 'react'
import { Box, Typography } from '@mui/material'
import StudentNavbar from '../../components/StudentNavbar'

function StudentRegisterVehicle() {
  return (
    <Box>
      <StudentNavbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Register Vehicle</Typography>
        <Typography>Submit your vehicle details for approval. (Coming soon)</Typography>
      </Box>
    </Box>
  )
}

export default StudentRegisterVehicle

