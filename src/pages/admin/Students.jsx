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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { usersAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function AdminStudents() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()
  
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editDialog, setEditDialog] = useState({ open: false, user: null })
  const [editData, setEditData] = useState({})

  // Fetch users
  const { data: usersData, isLoading, refetch } = useQuery(
    ['users', search, roleFilter, statusFilter],
    () => usersAPI.getAll({
      search,
      role: roleFilter || undefined,
      status: statusFilter || undefined
    }),
    { keepPreviousData: true }
  )

  // Update user mutation
  const updateUserMutation = useMutation(
    ({ moodleId, data }) => usersAPI.updateUser(moodleId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
        setEditDialog({ open: false, user: null })
        setEditData({})
      },
      onError: (error) => {
        console.error('Failed to update user:', error)
      }
    }
  )

  // Delete user mutation
  const deleteUserMutation = useMutation(
    (moodleId) => usersAPI.deleteUser(moodleId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users')
      },
      onError: (error) => {
        console.error('Failed to delete user:', error)
      }
    }
  )

  const handleEditUser = (user) => {
    setEditData({
      name: user.name,
      role: user.role,
      vehicle_plate: user.vehicle_plate || '',
      status: user.status
    })
    setEditDialog({ open: true, user })
  }

  const handleSaveUser = () => {
    if (editDialog.user) {
      updateUserMutation.mutate({
        moodleId: editDialog.user.moodle_id,
        data: editData
      })
    }
  }

  const handleResetFace = (moodleId) => {
    if (window.confirm('Are you sure you want to reset the face template for this user?')) {
      updateUserMutation.mutate({
        moodleId,
        data: { reset_face: true }
      })
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const users = usersData?.data || []

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
            Manage Students & Staff
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
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
          Students & Staff Management
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Search by name or Moodle ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                size="small"
                sx={{ minWidth: 250 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="filter-role-label">Role</InputLabel>
                <Select
                  labelId="filter-role-label"
                  id="filter-role"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="filter-status-label">Status</InputLabel>
                <Select
                  labelId="filter-status-label"
                  id="filter-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={() => {
                  setSearch('')
                  setRoleFilter('')
                  setStatusFilter('')
                }}
              >
                Clear
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Users ({users.length} total)
            </Typography>
            {isLoading ? (
              <Typography>Loading users...</Typography>
            ) : users.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Moodle ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Face Enrolled</TableCell>
                      <TableCell>Vehicle Plate</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((user) => (
                        <TableRow key={user.moodle_id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {user.moodle_id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {user.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.role}
                              color={user.role === 'admin' ? 'error' : user.role === 'staff' ? 'warning' : 'primary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.status}
                              color={user.status === 'active' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.face_enrolled ? 'Yes' : 'No'}
                              color={user.face_enrolled ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {user.vehicle_plate || '-'}
                          </TableCell>
                          <TableCell>
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditUser(user)}
                              >
                                Edit
                              </Button>
                              {user.face_enrolled && (
                                <Button
                                  size="small"
                                  color="warning"
                                  onClick={() => handleResetFace(user.moodle_id)}
                                >
                                  Reset Face
                                </Button>
                              )}
                              <Button
                                size="small"
                                color="error"
                                onClick={() => {
                                  if (window.confirm(`Delete user ${user.moodle_id} and all related records?`)) {
                                    deleteUserMutation.mutate(user.moodle_id)
                                  }
                                }}
                                disabled={deleteUserMutation.isLoading}
                              >
                                Delete
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50]}
                  component="div"
                  count={users.length}
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
                No users found matching the current filters.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog 
          open={editDialog.open} 
          onClose={() => setEditDialog({ open: false, user: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Edit User: {editDialog.user?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Name"
                value={editData.name || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="edit-role-label">Role</InputLabel>
                <Select
                  labelId="edit-role-label"
                  id="edit-role"
                  value={editData.role || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, role: e.target.value }))}
                  label="Role"
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Vehicle Plate"
                value={editData.vehicle_plate || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, vehicle_plate: e.target.value }))}
                fullWidth
                placeholder="e.g., ABC123"
              />
              <FormControl fullWidth>
                <InputLabel id="edit-status-label">Status</InputLabel>
                <Select
                  labelId="edit-status-label"
                  id="edit-status"
                  value={editData.status || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveUser}
              variant="contained"
              disabled={updateUserMutation.isLoading}
            >
              {updateUserMutation.isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}
