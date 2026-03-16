import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  Visibility as ViewLogIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  LiveTv as LiveTvIcon,
  DirectionsWalk as PedestrianIcon
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { statsAPI, logsAPI } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { formatConfidence } from '../../utils/formatConfidence'

const StatCard = ({ title, value, color = 'primary', icon, subtitle }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ color, mr: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" color={color} fontWeight="bold">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
)

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading, refetch: refetchStats } = useQuery(
    'dashboardStats',
    statsAPI.getDashboard,
    { refetchInterval: 30000 }
  )

  // Fetch recent logs
  const { data: recentLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery(
    'recentLogs',
    () => logsAPI.getRecent({ limit: 10 }),
    { refetchInterval: 10000 }
  )

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

  const stats = dashboardStats?.data || {}
  const todayStats = stats.today || {}
  const userStats = stats.users || {}

  return (
    <Box>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <AdminIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<RefreshIcon />}
            onClick={() => {
              refetchStats()
              refetchLogs()
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
          Campus Access Control - Admin Dashboard
        </Typography>

        {/* Today's Statistics */}
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Today's Activity
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Entries"
              value={statsLoading ? '...' : todayStats.entries || 0}
              color="success.main"
              icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
              subtitle="Successful entries today"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Exits"
              value={statsLoading ? '...' : todayStats.exits || 0}
              color="info.main"
              icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
              subtitle="Successful exits today"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Denied"
              value={statsLoading ? '...' : todayStats.denied || 0}
              color="error.main"
              icon={<TrendingUpIcon sx={{ fontSize: 32 }} />}
              subtitle="Failed attempts today"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Currently Inside"
              value={statsLoading ? '...' : stats.currently_inside || 0}
              color="primary.main"
              icon={<PeopleIcon sx={{ fontSize: 32 }} />}
              subtitle="People on campus"
            />
          </Grid>
        </Grid>

        {/* User Statistics */}
        <Typography variant="h5" gutterBottom>
          User Statistics
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={statsLoading ? '...' : userStats.total || 0}
              color="primary.main"
              icon={<PeopleIcon sx={{ fontSize: 32 }} />}
              subtitle="All registered users"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Users"
              value={statsLoading ? '...' : userStats.active || 0}
              color="success.main"
              icon={<PeopleIcon sx={{ fontSize: 32 }} />}
              subtitle="Active accounts"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Face Enrolled"
              value={statsLoading ? '...' : userStats.face_enrolled || 0}
              color="info.main"
              icon={<PeopleIcon sx={{ fontSize: 32 }} />}
              subtitle="Users with face templates"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Vehicle Registered"
              value={statsLoading ? '...' : userStats.vehicle_registered || 0}
              color="warning.main"
              icon={<CarIcon sx={{ fontSize: 32 }} />}
              subtitle="Users with vehicles"
            />
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<ViewLogIcon />}
              onClick={() => navigate('/admin/logs')}
            >
              View All Logs
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/admin/students')}
            >
              Manage Users
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<CarIcon />}
              onClick={() => navigate('/admin/vehicles')}
            >
              Vehicle Approvals
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/admin/registrations')}
            >
              Student Registrations
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<TrendingUpIcon />}
              onClick={() => navigate('/admin/attendance-summary')}
            >
              Attendance Summary
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/admin/division-attendance')}
            >
              Division Attendance
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/admin/settings')}
            >
              Settings
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="info"
              startIcon={<PedestrianIcon />}
              onClick={() => navigate('/scan/pedestrian?type=entry')}
            >
              Pedestrian Entry
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="info"
              startIcon={<PedestrianIcon />}
              onClick={() => navigate('/scan/pedestrian?type=exit')}
            >
              Pedestrian Exit
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="warning"
              startIcon={<CarIcon />}
              onClick={() => navigate('/scan/vehicle?type=entry')}
            >
              Vehicle Entry
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<CarIcon />}
              onClick={() => navigate('/scan/vehicle?type=exit')}
            >
              Vehicle Exit
            </Button>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        <Card>
          <CardContent>
            {logsLoading ? (
              <Typography>Loading recent activity...</Typography>
            ) : recentLogs?.data?.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Direction</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Confidence</TableCell>
                      <TableCell>Plate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentLogs.data.map((log) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary">
                No recent activity found.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
