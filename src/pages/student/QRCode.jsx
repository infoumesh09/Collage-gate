import React from 'react'
import { Box, Typography } from '@mui/material'
import StudentNavbar from '../../components/StudentNavbar'

function StudentQRCode() {
  return (
    <Box>
      <StudentNavbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>QR Code</Typography>
        <Typography>Your campus QR will be displayed here. (Coming soon)</Typography>
      </Box>
    </Box>
  )
}

export default StudentQRCode

