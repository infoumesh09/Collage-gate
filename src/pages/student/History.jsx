import React from 'react'
import { Box, Typography } from '@mui/material'
import StudentNavbar from '../../components/StudentNavbar'

function StudentHistory() {
  return (
    <Box>
      <StudentNavbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Access History</Typography>
        <Typography>Your pedestrian and vehicle access logs will appear here. (Coming soon)</Typography>
      </Box>
    </Box>
  )
}

export default StudentHistory

