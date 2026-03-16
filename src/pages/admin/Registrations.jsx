import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { format } from 'date-fns';
import AdminLayout from '../../components/AdminLayout';
import { registrationsAPI } from '../../services/api';

// API functions
const fetchRegistrations = async (status = '') => {
  const response = await registrationsAPI.getAll(status);
  return response.data;
};

const approveRegistration = async ({ id }) => {
  const response = await registrationsAPI.approve(id);
  return response.data;
};

const rejectRegistration = async ({ id, note }) => {
  const response = await registrationsAPI.reject(id, note);
  return response.data;
};

export default function Registrations() {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  
  // Get status based on tab value
  const getStatusFilter = () => {
    switch (tabValue) {
      case 0: return ''; // All
      case 1: return 'pending';
      case 2: return 'approved';
      case 3: return 'rejected';
      default: return '';
    }
  };

  // Fetch registrations
  const { data: registrations, isLoading, isError } = useQuery(
    ['registrations', getStatusFilter()],
    () => fetchRegistrations(getStatusFilter()),
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  // Approve mutation
  const approveMutation = useMutation(approveRegistration, {
    onSuccess: () => {
      queryClient.invalidateQueries('registrations');
      setError('');
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Failed to approve registration');
    }
  });

  // Reject mutation
  const rejectMutation = useMutation(rejectRegistration, {
    onSuccess: () => {
      queryClient.invalidateQueries('registrations');
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedRegistration(null);
      setError('');
    },
    onError: (error) => {
      setError(error.response?.data?.error || 'Failed to reject registration');
    }
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleApprove = (registration) => {
    approveMutation.mutate({ id: registration.id });
  };

  const handleOpenRejectDialog = (registration) => {
    setSelectedRegistration(registration);
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    
    rejectMutation.mutate({
      id: selectedRegistration.id,
      note: rejectionReason
    });
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Student Registration Requests
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage student registration requests
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      <Paper>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error">Failed to load registration requests</Alert>
        ) : registrations?.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No registration requests found
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Moodle ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Division</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrations?.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>{registration.moodle_id}</TableCell>
                    <TableCell>{registration.name}</TableCell>
                    <TableCell>{registration.email || '-'}</TableCell>
                    <TableCell>{registration.year || '-'}</TableCell>
                    <TableCell>{registration.division || '-'}</TableCell>
                    <TableCell>{getStatusChip(registration.status)}</TableCell>
                    <TableCell>
                      {format(new Date(registration.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {registration.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleApprove(registration)}
                            disabled={approveMutation.isLoading}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => handleOpenRejectDialog(registration)}
                            disabled={rejectMutation.isLoading}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                      {registration.status !== 'pending' && (
                        <Typography variant="body2" color="text.secondary">
                          {registration.note || '-'}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Registration Request</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a reason for rejecting this registration request.
          </DialogContentText>
          <TextField
            id="registration-reject-reason"
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            error={!rejectionReason.trim() && error !== ''}
            helperText={!rejectionReason.trim() && error !== '' ? 'Rejection reason is required' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error" disabled={rejectMutation.isLoading}>
            {rejectMutation.isLoading ? <CircularProgress size={24} /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
