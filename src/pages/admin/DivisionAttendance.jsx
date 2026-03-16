import React, { useEffect, useState } from 'react'
import { attendanceAPI } from '../../services/api'
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, TextField, MenuItem, Button } from '@mui/material'

const years = ['FE','SE','TE','BE']
const divisions = ['A','B','C','D']

export default function DivisionAttendance() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [year, setYear] = useState('FE')
  const [division, setDivision] = useState('A')
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const { data } = await attendanceAPI.getDivision({ year, division, date })
      setRecords(data.records || [])
    } catch (e) {
      setError('Failed to load division attendance')
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Box p={2}>
      <Typography variant="h5" gutterBottom>Division Attendance</Typography>
      <Box display="flex" gap={2} mb={2} alignItems="center">
        <TextField select label="Year" value={year} onChange={(e)=>setYear(e.target.value)} size="small">
          {years.map((y)=> <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
        <TextField select label="Division" value={division} onChange={(e)=>setDivision(e.target.value)} size="small">
          {divisions.map((d)=> <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        <TextField type="date" label="Date" value={date} onChange={(e)=>setDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
        <Button variant="outlined" onClick={load}>Refresh</Button>
      </Box>
      {error && <Typography color="error">{error}</Typography>}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Entry</TableCell>
            <TableCell>Exit</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell>{r.moodle_id}</TableCell>
              <TableCell>{r.user?.name || '-'}</TableCell>
              <TableCell>{r.entry_time ? 'Present' : 'Absent'}</TableCell>
              <TableCell>{r.entry_time ? new Date(r.entry_time).toLocaleTimeString() : '-'}</TableCell>
              <TableCell>{r.exit_time ? new Date(r.exit_time).toLocaleTimeString() : '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}