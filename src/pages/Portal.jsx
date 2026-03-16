import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  MdDirectionsCar,
  MdPerson,
  MdHistory
} from 'react-icons/md'
import { usersAPI, vehiclesAPI, logsAPI } from '../services/api'
import { formatConfidence } from '../utils/formatConfidence'

const Portal = ({ onLogout }) => {
  const queryClient = useQueryClient()
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [page, setPage] = useState(0)
  const rowsPerPage = 10

  const { data: userProfile, isLoading: profileLoading } = useQuery(
    'studentProfile',
    usersAPI.getMe
  )

  const { data: userVehicles, isLoading: vehiclesLoading } = useQuery(
    'studentVehicles',
    vehiclesAPI.getMy,
    { refetchInterval: 30000 }
  )

  const { data: userLogs, isLoading: logsLoading } = useQuery(
    'studentLogs',
    () => logsAPI.getMy({ limit: 50 }),
    { refetchInterval: 30000 }
  )

  const updateVehicleMutation = useMutation(vehiclesAPI.register, {
    onSuccess: () => {
      queryClient.invalidateQueries('studentVehicles')
      setVehiclePlate('')
    },
    onError: (error) => {
      console.error('Failed to update vehicle:', error)
    }
  })

  const handleVehicleUpdate = () => {
    const plate = vehiclePlate.trim().toUpperCase()
    if (!plate) return
    updateVehicleMutation.mutate({
      plate,
      note: 'Vehicle added from student portal'
    })
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const vehicles = Array.isArray(userVehicles)
    ? userVehicles
    : userVehicles?.data || []

  const logs = Array.isArray(userLogs)
    ? userLogs
    : userLogs?.data || []

  const currentUser =
    (userProfile && (userProfile.data || userProfile)) || null

  const pagedLogs = logs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  )

  const totalLogs = logs.length

  const getDirectionClasses = (direction) => {
    if (direction === 'entry') {
      return 'text-green-400 bg-green-500/10 border border-green-500/30'
    }
    return 'text-blue-400 bg-blue-500/10 border border-blue-500/30'
  }

  const getStatusClasses = (success) => {
    if (success) {
      return 'text-green-400 bg-green-500/10 border border-green-500/30'
    }
    return 'text-red-400 bg-red-500/10 border border-red-500/30'
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center relative z-10">
        <div className="px-8 py-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <p className="text-text-secondary text-xs uppercase tracking-widest">
            Loading your portal...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 relative z-10">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif text-white mb-2">
                {currentUser?.name
                  ? `${currentUser.name}'s Portal`
                  : 'Student Portal'}
              </h1>
              <p className="text-text-secondary font-light tracking-wide uppercase text-xs">
                Manage your profile, vehicles and access history
              </p>
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-white/10 hover:border-white/30 transition-all text-white"
            >
              Logout
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                  <MdPerson className="text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-white">
                    Profile Information
                  </h2>
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest">
                    Your campus identity
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                    Name
                  </p>
                  <p className="text-sm text-white">
                    {currentUser?.name || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                    Moodle ID
                  </p>
                  <p className="text-sm text-white">
                    {currentUser?.moodle_id || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                    Role
                  </p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-text-secondary">
                    {currentUser?.role || 'student'}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                    Face Enrollment
                  </p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      currentUser?.face_enrolled
                        ? 'bg-green-500/10 border-green-500/40 text-green-400'
                        : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
                    }`}
                  >
                    {currentUser?.face_enrolled ? 'Enrolled' : 'Not Enrolled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                  <MdDirectionsCar className="text-xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif text-white">
                    Vehicle Registration
                  </h2>
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest">
                    Manage vehicles linked to your account
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest ml-4 mb-2 block">
                    Add New License Plate
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) =>
                        setVehiclePlate(e.target.value.toUpperCase())
                      }
                      placeholder="e.g., MH12AB1234"
                      className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white placeholder:text-text-secondary/60 focus:outline-none focus:border-accent transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleVehicleUpdate}
                    disabled={
                      !vehiclePlate.trim() || updateVehicleMutation.isLoading
                    }
                    className={`px-8 py-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase transition-all shadow-lg shadow-accent/20 ${
                      !vehiclePlate.trim() || updateVehicleMutation.isLoading
                        ? 'bg-accent/40 text-white/70 cursor-not-allowed'
                        : 'bg-accent hover:bg-accent/90 text-white'
                    }`}
                  >
                    {updateVehicleMutation.isLoading ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4">
                  My Vehicles
                </h3>
                {vehiclesLoading ? (
                  <p className="text-xs text-text-secondary">
                    Loading vehicles...
                  </p>
                ) : vehicles.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id || vehicle.plate}
                        className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/10"
                      >
                        <div>
                          <p className="text-sm text-white font-mono">
                            {vehicle.plate}
                          </p>
                          <p className="text-[10px] text-text-secondary uppercase tracking-widest">
                            Added on{' '}
                            {vehicle.created_at
                              ? new Date(
                                  vehicle.created_at
                                ).toLocaleDateString()
                              : '-'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                              vehicle.status === 'approved'
                                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                : vehicle.status === 'denied'
                                ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
                            }`}
                          >
                            {vehicle.status || 'pending'}
                          </span>
                          {vehicle.note && (
                            <p className="text-[10px] text-text-secondary max-w-xs text-right">
                              {vehicle.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 rounded-2xl bg-white/5 border border-dashed border-white/20 text-xs text-text-secondary">
                    No vehicles registered yet. Add your first vehicle using the
                    form above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
              <MdHistory className="text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-white">Access History</h2>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest">
                Recent entry and exit events
              </p>
            </div>
          </div>

          {logsLoading ? (
            <p className="text-xs text-text-secondary">Loading access history...</p>
          ) : totalLogs === 0 ? (
            <div className="px-4 py-3 rounded-2xl bg-white/5 border border-dashed border-white/20 text-xs text-text-secondary">
              No access history found for your account yet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-4 text-[10px] font-bold tracking-widest uppercase text-text-secondary/60">
                        Date & Time
                      </th>
                      <th className="pb-4 text-[10px] font-bold tracking-widest uppercase text-text-secondary/60">
                        Method
                      </th>
                      <th className="pb-4 text-[10px] font-bold tracking-widest uppercase text-text-secondary/60">
                        Direction
                      </th>
                      <th className="pb-4 text-[10px] font-bold tracking-widest uppercase text-text-secondary/60">
                        Status
                      </th>
                      <th className="pb-4 text-[10px] font-bold tracking-widest uppercase text-text-secondary/60">
                        Plate
                      </th>
                      <th className="pb-4 text-[10px] font-bold tracking-widest uppercase text-text-secondary/60">
                        Confidence
                      </th>
                      <th className="pb-4 text-[10px] font-bold tracking-widest uppercase text-text-secondary/60">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pagedLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-4 text-xs text-white">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-text-secondary text-sm">
                              {log.method === 'pedestrian' ? (
                                <MdPerson />
                              ) : (
                                <MdDirectionsCar />
                              )}
                            </div>
                            <span className="text-xs text-white capitalize">
                              {log.method}
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getDirectionClasses(
                              log.direction
                            )}`}
                          >
                            {log.direction}
                          </span>
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusClasses(
                              log.success
                            )}`}
                          >
                            {log.success ? 'Success' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-mono text-white bg-white/5 px-2 py-1 rounded">
                            {log.plate_detected || '-'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-[10px] text-text-secondary">
                            {log.confidence !== null &&
                            log.confidence !== undefined
                              ? `${formatConfidence(log.confidence)}%`
                              : '-'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-xs text-text-secondary">
                            {log.note || '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 text-[10px] text-text-secondary">
                <span>
                  Showing{' '}
                  {totalLogs === 0
                    ? 0
                    : page * rowsPerPage + 1}{' '}
                  -{' '}
                  {Math.min(
                    (page + 1) * rowsPerPage,
                    totalLogs
                  )}{' '}
                  of {totalLogs} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPage((prev) => Math.max(prev - 1, 0))
                    }
                    disabled={page === 0}
                    className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
                      page === 0
                        ? 'border-white/10 text-text-secondary/40 cursor-not-allowed'
                        : 'border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((prev) =>
                        (prev + 1) * rowsPerPage >= totalLogs
                          ? prev
                          : prev + 1
                      )
                    }
                    disabled={(page + 1) * rowsPerPage >= totalLogs}
                    className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
                      (page + 1) * rowsPerPage >= totalLogs
                        ? 'border-white/10 text-text-secondary/40 cursor-not-allowed'
                        : 'border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Portal
