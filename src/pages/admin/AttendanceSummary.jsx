import React, { useEffect, useState } from 'react'
import { attendanceAPI } from '../../services/api'
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TextField, Button } from '@mui/material'

export default function AttendanceSummary() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [summary, setSummary] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const { data } = await attendanceAPI.getSummary(date)
      setSummary(data.summary || [])
    } catch (e) {
      setError('Failed to load attendance summary')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>Attendance Summary</Typography>
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <TextField type="date" label="Date" value={date} onChange={(e)=>setDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
        <Button variant="outlined" onClick={load}>Refresh</Button>
      </Box>
      {error && <Typography color="error">{error}</Typography>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Year</TableCell>
            <TableCell>Division</TableCell>
            <TableCell>Present</TableCell>
            <TableCell>Absent</TableCell>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {summary.map((row, idx) => {
            const present = row.present || 0
            const absent = row.absent || 0
            const total = present + absent
            return (
              <TableRow key={idx}>
                <TableCell>{row.year || 'UNKNOWN'}</TableCell>
                <TableCell>{row.division || 'UNK'}</TableCell>
                <TableCell>{present}</TableCell>
                <TableCell>{absent}</TableCell>
                <TableCell>{total}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Box>
  )
}
