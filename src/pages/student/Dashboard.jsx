import React from 'react'
import { Box } from '@mui/material'
import StudentNavbar from '../../components/StudentNavbar'
import Portal from '../Portal'

function StudentDashboard() {
  return (
    <Box>
      <StudentNavbar />
      <Portal />
    </Box>
  )
}

export default StudentDashboard

