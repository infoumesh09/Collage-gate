import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { vehiclesAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function AdminVehicles() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()
  
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [actionDialog, setActionDialog] = useState({ 
    open: false, 
    type: '', 
    registration: null 
  })
  const [note, setNote] = useState('')

  // Fetch pending vehicle registrations
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending } = useQuery(
    'pendingVehicles',
    vehiclesAPI.getPending,
    { refetchInterval: 30000 }
  )

  // Fetch all vehicle registrations
  const { data: allVehiclesData, isLoading: allLoading, refetch: refetchAll } = useQuery(
    'allVehicles',
    () => vehiclesAPI.getAll(),
    { refetchInterval: 30000 }
  )

  // Approve/Deny vehicle mutation
  const vehicleActionMutation = useMutation(
    ({ plate, action, note }) => {
      if (action === 'approve') {
        return vehiclesAPI.approve(plate, note)
      } else {
        return vehiclesAPI.deny(plate, note)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingVehicles')
        queryClient.invalidateQueries('allVehicles')
        setActionDialog({ open: false, type: '', registration: null })
        setNote('')
      },
      onError: (error) => {
        console.error('Vehicle action failed:', error)
      }
    }
  )

  const handleApprove = (registration) => {
    setActionDialog({ open: true, type: 'approve', registration })
  }

  const handleDeny = (registration) => {
    setActionDialog({ open: true, type: 'deny', registration })
  }

  const handleConfirmAction = () => {
    if (actionDialog.registration) {
      vehicleActionMutation.mutate({
        plate: actionDialog.registration.plate,
        action: actionDialog.type,
        note: note.trim() || undefined
      })
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success'
      case 'denied': return 'error'
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const pendingRegistrations = pendingData?.data || []
  const allRegistrations = allVehiclesData?.data || []

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
            Vehicle Management
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<RefreshIcon />}
            onClick={() => {
              refetchPending()
              refetchAll()
            }}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vehicle Management
        </Typography>

        {/* Pending Approvals */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Approvals ({pendingRegistrations.length})
            </Typography>
            {pendingLoading ? (
              <Typography>Loading pending registrations...</Typography>
            ) : pendingRegistrations.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Plate</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRegistrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {registration.user?.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {registration.moodle_id} ({registration.user?.role})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {registration.plate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {formatDate(registration.created_at)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              color="success"
                              startIcon={<CheckIcon />}
                              onClick={() => handleApprove(registration)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<CloseIcon />}
                              onClick={() => handleDeny(registration)}
                            >
                              Deny
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No pending vehicle registrations.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* All Vehicle Registrations */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Vehicle Registrations ({allRegistrations.length})
            </Typography>
            {allLoading ? (
              <Typography>Loading all registrations...</Typography>
            ) : allRegistrations.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Plate</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Updated</TableCell>
                      <TableCell>Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allRegistrations
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((registration) => (
                        <TableRow key={registration.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {registration.user?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {registration.moodle_id} ({registration.user?.role})
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {registration.plate}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={registration.status}
                              color={getStatusColor(registration.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {formatDate(registration.created_at)}
                          </TableCell>
                          <TableCell>
                            {formatDate(registration.updated_at)}
                          </TableCell>
                          <TableCell>
                            {registration.note || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50]}
                  component="div"
                  count={allRegistrations.length}
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
              <Alert severity="info">
                No vehicle registrations found.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog 
          open={actionDialog.open} 
          onClose={() => setActionDialog({ open: false, type: '', registration: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {actionDialog.type === 'approve' ? 'Approve' : 'Deny'} Vehicle Registration
          </DialogTitle>
          <DialogContent>
            {actionDialog.registration && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  User: {actionDialog.registration.user?.name} ({actionDialog.registration.moodle_id})
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Plate: {actionDialog.registration.plate}
                </Typography>
                <TextField
                  id="vehicle-action-note"
                  label="Note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ mt: 2 }}
                  placeholder={
                    actionDialog.type === 'approve' 
                      ? 'Add a note for approval...'
                      : 'Reason for denial...'
                  }
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialog({ open: false, type: '', registration: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAction}
              variant="contained"
              color={actionDialog.type === 'approve' ? 'success' : 'error'}
              disabled={vehicleActionMutation.isLoading}
            >
              {vehicleActionMutation.isLoading ? 'Processing...' : 
               actionDialog.type === 'approve' ? 'Approve' : 'Deny'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
