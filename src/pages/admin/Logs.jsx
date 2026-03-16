import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Logout as LogoutIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { logsAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { formatConfidence } from '../../utils/formatConfidence'

export default function AdminLogs() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [filters, setFilters] = useState({
    moodle_id: '',
    method: '',
    direction: '',
    success: '',
    start_date: '',
    end_date: ''
  })

  // Fetch logs with filters
  const { data: logsData, isLoading, refetch } = useQuery(
    ['logs', filters, page, rowsPerPage],
    () => logsAPI.getAll({
      ...filters,
      limit: rowsPerPage,
      offset: page * rowsPerPage
    }),
    { keepPreviousData: true }
  )

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }))
    setPage(0) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    setFilters({
      moodle_id: '',
      method: '',
      direction: '',
      success: '',
      start_date: '',
      end_date: ''
    })
    setPage(0)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (success) => {
    return success ? 'success' : 'error'
  }

  const getMethodIcon = (method) => {
    return method === 'pedestrian' ? '🚶' : '🚗'
  }

  const getDirectionColor = (direction) => {
    return direction === 'entry' ? 'success' : 'error'
  }

  const logs = logsData?.data || []
  const totalCount = logsData?.headers?.['x-total-count'] || logs.length

  return (
    <Box>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/admin')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <AdminIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Access Logs
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Access Logs
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Moodle ID"
                  value={filters.moodle_id}
                  onChange={handleFilterChange('moodle_id')}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Method</InputLabel>
                  <Select
                    value={filters.method}
                    onChange={handleFilterChange('method')}
                    label="Method"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="pedestrian">Pedestrian</MenuItem>
                    <MenuItem value="vehicle">Vehicle</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Direction</InputLabel>
                  <Select
                    value={filters.direction}
                    onChange={handleFilterChange('direction')}
                    label="Direction"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="entry">Entry</MenuItem>
                    <MenuItem value="exit">Exit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.success}
                    onChange={handleFilterChange('success')}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Success</MenuItem>
                    <MenuItem value="false">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="Start Date"
                  type="datetime-local"
                  value={filters.start_date}
                  onChange={handleFilterChange('start_date')}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  label="End Date"
                  type="datetime-local"
                  value={filters.end_date}
                  onChange={handleFilterChange('end_date')}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => refetch()}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Access Logs ({totalCount} total)
            </Typography>
            {isLoading ? (
              <Typography>Loading logs...</Typography>
            ) : logs.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Direction</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Plate</TableCell>
                      <TableCell>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {log.user?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.moodle_id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${getMethodIcon(log.method)} ${log.method}`}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.direction}
                            color={getDirectionColor(log.direction)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.success ? 'Success' : 'Failed'}
                            color={getStatusColor(log.success)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {log.confidence !== null && log.confidence !== undefined
                            ? `${formatConfidence(log.confidence)}%`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {log.plate_detected || '-'}
                        </TableCell>
                        <TableCell>
                          {log.note || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  component="div"
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(event, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10))
                    setPage(0)
                  }}
                />
              </TableContainer>
            ) : (
              <Typography color="text.secondary">
                No logs found matching the current filters.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
