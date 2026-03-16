import React, { useState, useEffect } from 'react'
import { MdCheckCircle, MdCancel, MdRefresh, MdHistory } from 'react-icons/md'
import { formatConfidence } from '../utils/formatConfidence'

const ResultCard = ({ 
  success, 
  user, 
  method, 
  direction, 
  confidence, 
  plateDetected, 
  timestamp,
  onNewScan,
  onViewLog,
  note
}) => {
  const [showAlert, setShowAlert] = useState(true)

  useEffect(() => {
    const alertTimer = setTimeout(() => {
      setShowAlert(false)
    }, 3000)

    return () => {
      clearTimeout(alertTimer)
    }
  }, [])

  return (
    <div className="max-w-xl mx-auto mt-6">
      <div className="p-6 md:p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl text-white">
        {showAlert && (
          <div
            className={`mb-4 px-4 py-3 rounded-2xl border text-[10px] font-bold tracking-widest uppercase flex items-center gap-3 ${
              success
                ? 'bg-green-500/10 border-green-500/40 text-green-200'
                : 'bg-red-500/10 border-red-500/40 text-red-200'
            }`}
          >
            <span>{success ? 'Access Granted' : 'Access Denied'}</span>
          </div>
        )}

        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center ${
              success ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}
          >
            {success ? (
              <MdCheckCircle className="text-4xl text-green-400" />
            ) : (
              <MdCancel className="text-4xl text-red-400" />
            )}
          </div>

          <h2
            className={`text-2xl md:text-3xl font-serif ${
              success ? 'text-green-100' : 'text-red-100'
            }`}
          >
            {success ? 'Access Granted' : 'Access Denied'}
          </h2>

          {note && (
            <p className="text-[11px] text-text-secondary max-w-md">
              {note}
            </p>
          )}

          {user && (
            <div className="mt-2 space-y-1 text-sm text-text-secondary">
              <p className="text-base text-white font-semibold">{user.name}</p>
              <p>Moodle ID: {user.moodle_id}</p>
              <p className="uppercase text-[10px] tracking-widest">
                Role: {user.role}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase">
            <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-text-secondary">
              {method === 'pedestrian' ? 'Pedestrian' : 'Vehicle'}
            </span>
            <span
              className={`px-3 py-1 rounded-full border ${
                direction === 'entry'
                  ? 'bg-emerald-500/10 border-emerald-400/60 text-emerald-200'
                  : 'bg-sky-500/10 border-sky-400/60 text-sky-200'
              }`}
            >
              {direction || '-'}
            </span>
            {confidence !== null && confidence !== undefined && (
              <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-text-secondary">
                {formatConfidence(confidence)}% confidence
              </span>
            )}
          </div>

          {plateDetected && (
            <div className="mt-4 w-full px-4 py-3 rounded-2xl bg-sky-500/10 border border-sky-500/40 text-[12px] text-sky-100 text-left">
              <p>
                <span className="font-semibold">Vehicle Plate:</span>{' '}
                {plateDetected}
              </p>
            </div>
          )}

          <p className="mt-4 text-[11px] text-text-secondary">
            {timestamp
              ? new Date(timestamp).toLocaleString()
              : new Date().toLocaleString()}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onNewScan}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-accent text-[10px] font-bold uppercase tracking-widest text-white hover:bg-accent/90 transition-all"
            >
              <MdRefresh className="text-sm" />
              New Scan
            </button>
            {onViewLog && (
              <button
                type="button"
                onClick={onViewLog}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-bold uppercase tracking-widest text-text-secondary hover:text-white hover:bg-white/10 transition-all"
              >
                <MdHistory className="text-sm" />
                View Log
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultCard
