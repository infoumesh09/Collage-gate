import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MdDashboard, 
  MdPeople, 
  MdDirectionsCar, 
  MdAssignment, 
  MdHistory, 
  MdSettings,
  MdArrowUpward,
  MdArrowDownward,
  MdBlock,
  MdLogin,
  MdPersonAdd,
  MdRefresh
} from 'react-icons/md';
import { statsAPI, logsAPI, registrationAPI, faceAPI, vehiclesAPI, usersAPI } from '../services/api';

const AdminDashboard = ({ onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState([
    { label: 'Entries', value: '0', sub: 'Successful entries today', icon: <MdArrowUpward />, color: 'text-green-400' },
    { label: 'Exits', value: '0', sub: 'Successful exits today', icon: <MdArrowDownward />, color: 'text-blue-400' },
    { label: 'Currently Inside', value: '0', sub: 'People on campus', icon: <MdPeople />, color: 'text-accent' },
  ]);

  const [userStats, setUserStats] = useState([
    { label: 'Total Users', value: '0', sub: 'All registered users', icon: <MdPeople /> },
    { label: 'Active Users', value: '0', sub: 'Active accounts', icon: <MdAssignment /> },
    { label: 'Face Enrolled', value: '0', sub: 'Users with face templates', icon: <MdDashboard /> },
    { label: 'Vehicle Registered', value: '0', sub: 'Users with vehicles', icon: <MdDirectionsCar /> },
  ]);

  const [recentActivity, setRecentActivity] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehiclePending, setVehiclePending] = useState([]);
  const [vehicleAll, setVehicleAll] = useState([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({});
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceDateFrom, setAttendanceDateFrom] = useState('');
  const [attendanceDateTo, setAttendanceDateTo] = useState('');
  const [attendanceYear, setAttendanceYear] = useState('');
  const [attendanceDivision, setAttendanceDivision] = useState('');
  const [attendanceSort, setAttendanceSort] = useState('time_desc');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [todayStats, dashboardData, logs, regs] = await Promise.all([
        statsAPI.getToday(),
        statsAPI.getDashboard(),
        logsAPI.getAll(),
        registrationAPI.getAll('pending')
      ]);

      setStats([
        { label: 'Entries', value: todayStats.entries || 0, sub: 'Successful entries today', icon: <MdArrowUpward />, color: 'text-green-400' },
        { label: 'Exits', value: todayStats.exits || 0, sub: 'Successful exits today', icon: <MdArrowDownward />, color: 'text-blue-400' },
        { label: 'Currently Inside', value: dashboardData.currently_inside || 0, sub: 'People on campus', icon: <MdPeople />, color: 'text-accent' },
      ]);

      setUserStats([
        { label: 'Total Users', value: dashboardData.users?.total || 0, sub: 'All registered users', icon: <MdPeople /> },
        { label: 'Active Users', value: dashboardData.users?.active || 0, sub: 'Active accounts', icon: <MdAssignment /> },
        { label: 'Face Enrolled', value: dashboardData.users?.face_enrolled || 0, sub: 'Users with face templates', icon: <MdDashboard /> },
        { label: 'Vehicle Registered', value: dashboardData.users?.vehicle_registered || 0, sub: 'Users with vehicles', icon: <MdDirectionsCar /> },
      ]);

      setRecentActivity(logs.slice(0, 5));
      setRegistrations(regs);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefreshClick = () => {
    if (activeTab === 'vehicles') {
      fetchVehicleData();
    } else if (activeTab === 'users') {
      fetchUsersData();
    } else if (activeTab === 'attendance') {
      fetchAttendanceLogs();
    } else {
      fetchDashboardData();
    }
  };

  const fetchVehicleData = async () => {
    setVehicleLoading(true);
    setVehicleError('');
    try {
      const [pendingRes, allRes] = await Promise.all([
        vehiclesAPI.getPending(),
        vehiclesAPI.getAll()
      ]);
      setVehiclePending(
        Array.isArray(pendingRes) ? pendingRes : pendingRes?.data || []
      );
      setVehicleAll(
        Array.isArray(allRes) ? allRes : allRes?.data || []
      );
    } catch (err) {
      console.error('Failed to fetch vehicle data:', err);
      setVehicleError(err.message || 'Failed to load vehicle registrations');
    } finally {
      setVehicleLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'vehicles') {
      fetchVehicleData();
    }
  }, [activeTab]);

  const fetchAttendanceLogs = async () => {
    setAttendanceLoading(true);
    setAttendanceError('');
    try {
      const params = {};
      if (attendanceDateFrom) {
        params.start_date = `${attendanceDateFrom}T00:00:00`;
      }
      if (attendanceDateTo) {
        params.end_date = `${attendanceDateTo}T23:59:59`;
      }
      const response = await logsAPI.getAll({
        ...params,
        limit: 1000,
      });
      let list = Array.isArray(response) ? response : response?.data || [];

      if (attendanceYear) {
        list = list.filter((log) => {
          const year = (log.user?.year || log.year || '').toUpperCase();
          return year === attendanceYear;
        });
      }

      if (attendanceDivision) {
        list = list.filter((log) => {
          const division = (log.user?.division || log.division || log.batch || '').toUpperCase();
          return division === attendanceDivision;
        });
      }

      list.sort((a, b) => {
        const ta = new Date(a.timestamp).getTime();
        const tb = new Date(b.timestamp).getTime();
        if (Number.isNaN(ta) || Number.isNaN(tb)) return 0;
        return attendanceSort === 'time_asc' ? ta - tb : tb - ta;
      });

      setAttendanceLogs(list);
    } catch (err) {
      console.error('Failed to fetch attendance logs:', err);
      setAttendanceError(err.message || 'Failed to load logs');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceLogs();
    }
  }, [activeTab, attendanceDateFrom, attendanceDateTo, attendanceYear, attendanceDivision, attendanceSort]);

  const fetchUsersData = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const response = await usersAPI.getAll({
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
        status: userStatusFilter || undefined,
      });
      const list = Array.isArray(response) ? response : response?.data || [];
      setUsers(list);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsersError(err.message || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersData();
    }
  }, [activeTab, userSearch, userRoleFilter, userStatusFilter]);

  const handleApprove = async (reg) => {
    try {
      await registrationAPI.approve(reg.id);

      if (reg.photo) {
        try {
          const blob = await fetch(reg.photo).then(r => r.blob());
          const formData = new FormData();
          formData.append('student_id', reg.moodle_id);
          formData.append('name', reg.name);
          formData.append('div', reg.division || 'A');
          formData.append('file', blob, `${reg.moodle_id}.jpg`);
          await faceAPI.register(formData);
        } catch (mlError) {
          console.error('Face model registration failed:', mlError);
          alert('User approved, but face model service is not reachable. You can train later when it is running.');
          await fetchDashboardData();
          return;
        }
      }

      alert('Registration approved successfully');
      fetchDashboardData();
    } catch (err) {
      console.error('Approval error:', err);
      alert(err.message || 'Failed to approve registration');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await registrationAPI.reject(id, reason);
      fetchDashboardData();
    } catch (err) {
      console.error('Rejection error:', err);
    }
  };

  const handleVehicleAction = async (registration, action) => {
    const verb = action === 'approve' ? 'Approve' : 'Deny';
    const note = window.prompt(
      `${verb} vehicle ${registration.plate}? Optional note:`,
      registration.note || ''
    );
    if (note === null) return;
    try {
      if (action === 'approve') {
        await vehiclesAPI.approve(registration.plate, note || undefined);
      } else {
        await vehiclesAPI.deny(registration.plate, note || undefined);
      }
      await fetchVehicleData();
    } catch (err) {
      console.error('Vehicle action error:', err);
      alert(err.message || 'Failed to update vehicle registration');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name || '',
      role: user.role || 'student',
      vehicle_plate: user.vehicle_plate || '',
      status: user.status || 'active',
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      await usersAPI.updateUser(editingUser.moodle_id, editUserData);
      setEditingUser(null);
      setEditUserData({});
      await fetchUsersData();
    } catch (err) {
      console.error('Failed to update user:', err);
      alert(err.message || 'Failed to update user');
    }
  };

  const handleResetFace = async (user) => {
    if (!window.confirm(`Reset face template for ${user.moodle_id}?`)) return;
    try {
      await usersAPI.updateUser(user.moodle_id, { reset_face: true });
      await fetchUsersData();
    } catch (err) {
      console.error('Failed to reset face:', err);
      alert(err.message || 'Failed to reset face');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete user ${user.moodle_id} and all related records?`)) return;
    try {
      await usersAPI.deleteUser(user.moodle_id);
      await fetchUsersData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 relative z-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-serif text-white mb-2">Dashboard</h1>
            <p className="text-text-secondary font-light tracking-wide uppercase text-xs">Campus Access Control System</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={onLogout}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-white/10 transition-all"
            >
              Logout
            </button>
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'overview' ? 'bg-accent text-white' : 'bg-white/5 text-text-secondary hover:text-white'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('registrations')}
              className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all relative ${activeTab === 'registrations' ? 'bg-accent text-white' : 'bg-white/5 text-text-secondary hover:text-white'}`}
            >
              Registrations
              {registrations.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center animate-pulse">
                  {registrations.length}
                </span>
              )}
            </button>
            <button
              onClick={handleRefreshClick}
              className="p-2 rounded-full bg-white/5 text-text-secondary hover:text-white transition-all"
            >
              <MdRefresh className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => stat.label === 'Currently Inside' && onNavigate('currently-inside')}
                      className={`p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl group hover:bg-white/[0.05] transition-all ${stat.label === 'Currently Inside' ? 'cursor-pointer' : ''}`}
                    >
                      <div className={`text-2xl mb-4 ${stat.color}`}>{stat.icon}</div>
                      <div className="text-4xl font-serif text-white mb-2">{stat.value}</div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-text-secondary">{stat.label}</div>
                      <div className="text-[8px] text-text-secondary/60 uppercase tracking-widest mt-1">{stat.sub}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {userStats.map((stat, i) => (
                    <div key={stat.label} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                      <div className="text-accent text-xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-serif text-white">{stat.value}</div>
                      <div className="text-[8px] font-bold tracking-widest uppercase text-text-secondary mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'registrations' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif text-white">Pending Registrations</h3>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                    {registrations.length} Requests
                  </span>
                </div>

                <div className="space-y-4">
                  {registrations.length === 0 ? (
                    <div className="p-12 text-center rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                      <MdPersonAdd className="text-4xl text-text-secondary/20 mx-auto mb-4" />
                      <p className="text-text-secondary text-[10px] uppercase tracking-widest">No pending registration requests</p>
                    </div>
                  ) : (
                    registrations.map((reg, i) => (
                      <motion.div
                        key={reg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col md:flex-row gap-6 items-center"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                          {reg.photo ? (
                            <img src={reg.photo} alt={reg.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl text-white/10">
                              <MdPeople />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h4 className="text-lg text-white font-medium mb-1">{reg.name}</h4>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center md:justify-start">
                            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{reg.moodle_id}</span>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{reg.email}</span>
                            <span className="text-[10px] font-bold text-text-secondary/60 uppercase tracking-widest">{reg.year} - {reg.division}</span>
                          </div>
                          {reg.note && (
                            <p className="mt-2 text-[10px] text-text-secondary/40 italic">"{reg.note}"</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(reg)}
                            className="px-6 py-3 rounded-2xl bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(reg.id)}
                            className="px-6 py-3 rounded-2xl bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'vehicles' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif text-white">Vehicle Management</h3>
                  <button
                    onClick={fetchVehicleData}
                    className="px-4 py-2 rounded-full bg-white/5 text-[10px] font-bold tracking-widest uppercase text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                  >
                    Refresh
                  </button>
                </div>

                {vehicleError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-[12px] text-red-300">
                    {vehicleError}
                  </div>
                )}

                <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-serif text-white">Pending Approvals</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                      {vehiclePending.length} Pending
                    </span>
                  </div>

                  {vehicleLoading ? (
                    <p className="text-[12px] text-text-secondary">Loading vehicle registrations...</p>
                  ) : vehiclePending.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-text-secondary">
                        No pending vehicle registrations.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-white/10">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.02]">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">User</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Plate</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Submitted</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehiclePending.map((registration) => (
                            <tr key={registration.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-sm text-white font-medium">
                                    {registration.user?.name || 'Unknown'}
                                  </span>
                                  <span className="text-[10px] text-text-secondary/70 uppercase tracking-widest">
                                    {registration.moodle_id} ({registration.user?.role || 'student'})
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-white font-mono font-semibold">
                                  {registration.plate}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[12px] text-text-secondary">
                                {new Date(registration.created_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleVehicleAction(registration, 'approve')}
                                    className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleVehicleAction(registration, 'deny')}
                                    className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                  >
                                    Deny
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-serif text-white">All Vehicle Registrations</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                      {vehicleAll.length} Total
                    </span>
                  </div>

                  {vehicleLoading ? (
                    <p className="text-[12px] text-text-secondary">Loading vehicle registrations...</p>
                  ) : vehicleAll.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-text-secondary">
                        No vehicle registrations found.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.02]">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">User</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Plate</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Status</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Submitted</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Updated</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicleAll.map((registration) => (
                            <tr key={registration.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="text-sm text-white font-medium">
                                    {registration.user?.name || 'Unknown'}
                                  </span>
                                  <span className="text-[10px] text-text-secondary/70 uppercase tracking-widest">
                                    {registration.moodle_id} ({registration.user?.role || 'student'})
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-white font-mono font-semibold">
                                  {registration.plate}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                    registration.status === 'approved'
                                      ? 'bg-green-500/20 text-green-400'
                                      : registration.status === 'denied'
                                      ? 'bg-red-500/20 text-red-400'
                                      : 'bg-yellow-500/20 text-yellow-300'
                                  }`}
                                >
                                  {registration.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[12px] text-text-secondary">
                                {new Date(registration.created_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-[12px] text-text-secondary">
                                {new Date(registration.updated_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-[12px] text-text-secondary">
                                {registration.note || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'attendance' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-serif text-white">Attendance Logs</h3>
                    <p className="text-[10px] uppercase tracking-widest text-text-secondary">
                      Filter by date, year and batch, then print
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">
                        From
                      </span>
                      <input
                        type="date"
                        value={attendanceDateFrom}
                        onChange={(e) => setAttendanceDateFrom(e.target.value)}
                        className="px-3 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[11px] text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">
                        To
                      </span>
                      <input
                        type="date"
                        value={attendanceDateTo}
                        onChange={(e) => setAttendanceDateTo(e.target.value)}
                        className="px-3 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[11px] text-white focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">
                        Year
                      </span>
                      <select
                        value={attendanceYear}
                        onChange={(e) => setAttendanceYear(e.target.value)}
                        className="px-3 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[11px] text-white focus:outline-none focus:border-accent"
                      >
                        <option value="">All</option>
                        <option value="FE">FE</option>
                        <option value="SE">SE</option>
                        <option value="TE">TE</option>
                        <option value="BE">BE</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">
                        Batch
                      </span>
                      <select
                        value={attendanceDivision}
                        onChange={(e) => setAttendanceDivision(e.target.value)}
                        className="px-3 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[11px] text-white focus:outline-none focus:border-accent"
                      >
                        <option value="">All</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-widest text-text-secondary mb-1">
                        Sort
                      </span>
                      <select
                        value={attendanceSort}
                        onChange={(e) => setAttendanceSort(e.target.value)}
                        className="px-3 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[11px] text-white focus:outline-none focus:border-accent"
                      >
                        <option value="time_desc">Newest first</option>
                        <option value="time_asc">Oldest first</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        setAttendanceDateFrom('');
                        setAttendanceDateTo('');
                        setAttendanceYear('');
                        setAttendanceDivision('');
                        setAttendanceSort('time_desc');
                      }}
                      className="self-end px-4 py-2 rounded-full bg-white/[0.02] border border-white/10 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="self-end px-4 py-2 rounded-full bg-accent text-[10px] font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-all"
                    >
                      Print
                    </button>
                  </div>
                </div>

                {attendanceError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-[12px] text-red-300">
                    {attendanceError}
                  </div>
                )}

                <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-serif text-white">
                      Logs ({attendanceLogs.length} records)
                    </h4>
                  </div>

                  {attendanceLoading ? (
                    <p className="text-[12px] text-text-secondary">Loading logs...</p>
                  ) : attendanceLogs.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-text-secondary">
                        No logs for current filters.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.02]">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                              Time
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                              Moodle ID
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                              Name
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                              Year
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                              Batch
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                              Direction
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                              Method
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceLogs.map((log) => {
                            const year = log.user?.year || log.year || '';
                            const division = log.user?.division || log.division || log.batch || '';
                            return (
                              <tr
                                key={log.id}
                                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-4 py-3 text-[12px] text-text-secondary">
                                  {log.timestamp
                                    ? new Date(log.timestamp).toLocaleString()
                                    : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-white font-mono">
                                  {log.moodle_id || log.user?.moodle_id || log.student_id || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-white">
                                  {log.user?.name || '-'}
                                </td>
                                <td className="px-4 py-3 text-[12px] text-text-secondary">
                                  {year || '-'}
                                </td>
                                <td className="px-4 py-3 text-[12px] text-text-secondary">
                                  {division || '-'}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                      log.direction === 'entry'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-blue-500/20 text-blue-300'
                                    }`}
                                  >
                                    {log.direction || '-'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[12px] text-text-secondary">
                                  {log.method || '-'}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                      log.success
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                    }`}
                                  >
                                    {log.success ? 'Present' : 'Failed'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-serif text-white">Manage Users</h3>
                    <p className="text-[10px] uppercase tracking-widest text-text-secondary">
                      Search, edit, reset face or delete accounts
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      placeholder="Search by name or Moodle ID"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[12px] text-white placeholder:text-text-secondary/60 focus:outline-none focus:border-accent"
                    />
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[11px] text-white focus:outline-none focus:border-accent"
                    >
                      <option value="">All Roles</option>
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select
                      value={userStatusFilter}
                      onChange={(e) => setUserStatusFilter(e.target.value)}
                      className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[11px] text-white focus:outline-none focus:border-accent"
                    >
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <button
                      onClick={() => {
                        setUserSearch('');
                        setUserRoleFilter('');
                        setUserStatusFilter('');
                      }}
                      className="px-4 py-2 rounded-full bg-white/[0.02] border border-white/10 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {usersError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-[12px] text-red-300">
                    {usersError}
                  </div>
                )}

                <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-serif text-white">
                      Users ({users.length} total)
                    </h4>
                  </div>

                  {usersLoading ? (
                    <p className="text-[12px] text-text-secondary">Loading users...</p>
                  ) : users.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                      <p className="text-[10px] uppercase tracking-widest text-text-secondary">
                        No users found for current filters.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.02]">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Moodle ID</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Name</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Role</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Status</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Face</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Vehicle</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Created</th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.moodle_id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3">
                                <span className="text-sm text-white font-mono font-semibold">
                                  {user.moodle_id}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-white">
                                  {user.name}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                    user.role === 'admin'
                                      ? 'bg-red-500/20 text-red-300'
                                      : user.role === 'staff'
                                      ? 'bg-yellow-500/20 text-yellow-300'
                                      : 'bg-blue-500/20 text-blue-300'
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                    user.status === 'active'
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-red-500/20 text-red-400'
                                  }`}
                                >
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                                    user.face_enrolled
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-yellow-500/20 text-yellow-300'
                                  }`}
                                >
                                  {user.face_enrolled ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[12px] text-text-secondary">
                                {user.vehicle_plate || '-'}
                              </td>
                              <td className="px-4 py-3 text-[12px] text-text-secondary">
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-accent hover:underline"
                                  >
                                    Edit
                                  </button>
                                  {user.face_enrolled && (
                                    <button
                                      onClick={() => handleResetFace(user)}
                                      className="text-[10px] font-bold uppercase tracking-widest text-yellow-300 hover:underline"
                                    >
                                      Reset Face
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteUser(user)}
                                    className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:underline"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {editingUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="w-full max-w-md mx-4 p-6 rounded-[2rem] bg-primary border border-white/10 backdrop-blur-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-serif text-white">
                          Edit User: {editingUser.name}
                        </h4>
                        <button
                          onClick={() => {
                            setEditingUser(null);
                            setEditUserData({});
                          }}
                          className="text-text-secondary hover:text-white text-xl"
                        >
                          ×
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                            Name
                          </label>
                          <input
                            type="text"
                            value={editUserData.name || ''}
                            onChange={(e) =>
                              setEditUserData((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                            Role
                          </label>
                          <select
                            value={editUserData.role || 'student'}
                            onChange={(e) =>
                              setEditUserData((prev) => ({ ...prev, role: e.target.value }))
                            }
                            className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-accent"
                          >
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                            Vehicle Plate
                          </label>
                          <input
                            type="text"
                            value={editUserData.vehicle_plate || ''}
                            onChange={(e) =>
                              setEditUserData((prev) => ({
                                ...prev,
                                vehicle_plate: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-accent"
                            placeholder="e.g., ABC123"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                            Status
                          </label>
                          <select
                            value={editUserData.status || 'active'}
                            onChange={(e) =>
                              setEditUserData((prev) => ({ ...prev, status: e.target.value }))
                            }
                            className="w-full px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white focus:outline-none focus:border-accent"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => {
                            setEditingUser(null);
                            setEditUserData({});
                          }}
                          className="px-5 py-2 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveUser}
                          className="px-5 py-2 rounded-full bg-accent text-[10px] font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-all"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-xl font-serif text-white">Recent Activity</h3>
                  <button 
                    onClick={() => onNavigate('logs')}
                    className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-8 py-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">User</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Type</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Status</th>
                        <th className="px-8 py-6 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivity.map((log, i) => (
                        <tr key={log.id || i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                           <td className="px-8 py-6">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold uppercase">
                                 {log.user?.name?.[0] || 'U'}
                               </div>
                               <div>
                                 <div className="text-sm text-white font-medium">{log.user?.name || 'Unknown User'}</div>
                                 <div className="text-[10px] text-text-secondary/60 uppercase tracking-widest">{log.user?.moodle_id || log.student_id || '---'}</div>
                               </div>
                             </div>
                           </td>
                           <td className="px-8 py-6">
                             <span className="text-[10px] font-bold text-white uppercase tracking-widest">{log.type} {log.direction}</span>
                           </td>
                           <td className="px-8 py-6">
                             <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                               log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                             }`}>
                               {log.success ? 'Granted' : 'Denied'}
                             </span>
                           </td>
                           <td className="px-8 py-6 text-[10px] text-text-secondary/60 font-medium">
                             {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </td>
                         </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: User Stats & Quick Actions */}
          <div className="space-y-8">
            <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <h2 className="text-2xl font-serif text-white mb-6">User Statistics</h2>
              <div className="space-y-6">
                {userStats.map((stat, i) => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="text-xl text-text-secondary">{stat.icon}</div>
                      <div>
                        <p className="text-sm text-white font-medium">{stat.label}</p>
                        <p className="text-[10px] text-text-secondary font-light">{stat.sub}</p>
                      </div>
                    </div>
                    <span className="text-xl font-serif text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Manage Users', icon: <MdPeople />, onClick: () => setActiveTab('users') },
                { label: 'Vehicles', icon: <MdDirectionsCar />, onClick: () => setActiveTab('vehicles') },
                { label: 'Attendance', icon: <MdAssignment />, onClick: () => setActiveTab('attendance') },
                { label: 'Registrations', icon: <MdPersonAdd />, onClick: () => setActiveTab('registrations') },
              ].map((action, i) => (
                <button
                  key={action.label}
                  onClick={action.onClick || (() => {})}
                  className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md hover:bg-accent transition-all group flex flex-col items-center gap-3 text-center"
                >
                  <div className="text-2xl text-accent group-hover:text-white transition-colors">
                    {action.icon}
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-white">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
