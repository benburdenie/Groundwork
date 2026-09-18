'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { apiPatch } from '../../lib/api'
import { COLORS, FONT_MONO } from '../../lib/theme'
import { useJobsContext } from './JobsContext'
import { Spinner } from './ui'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function isOverdue(job) {
  return job.status !== 'complete' && job.end_date && job.end_date < todayStr()
}

export default function OverdueBanner() {
  const { jobs, refreshJobs } = useJobsContext()
  const [busyId, setBusyId] = useState(null)
  const overdue = (jobs || []).filter(isOverdue)

  if (overdue.length === 0) return null

  const markComplete = async (job) => {
    setBusyId(job.id)
    await apiPatch('/api/jobs', { id: job.id, status: 'complete' })
    setBusyId(null)
    await refreshJobs()
  }

  return (
    <div style={styles.banner}>
      <div style={styles.label}>
        <AlertTriangle size={13} strokeWidth={2.25} />
        {overdue.length} overdue
      </div>
      <div style={styles.list}>
        {overdue.map(job => (
          <div key={job.id} style={styles.chip}>
            <span style={styles.jobName}>{job.name}</span>
            <span style={styles.jobDate}>{job.end_date}</span>
            <button className="btn btn-danger btn-sm" style={styles.chipBtn} disabled={busyId === job.id} onClick={() => markComplete(job)}>
              {busyId === job.id ? <Spinner /> : 'Mark complete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  banner: {
    background: COLORS.dangerSubtle, borderTop: `2px solid ${COLORS.danger}`,
    padding: '0 24px', height: '40px', display: 'flex', alignItems: 'center', gap: '16px',
    overflowX: 'auto', flexShrink: 0,
  },
  label: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontFamily: FONT_MONO, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em',
    color: COLORS.danger, flexShrink: 0,
  },
  list: { display: 'flex', gap: '8px', flexShrink: 0 },
  chip: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '3px 8px 3px 10px' },
  jobName: { fontSize: '0.78rem', color: COLORS.textPrimary, fontWeight: 500 },
  jobDate: { fontFamily: FONT_MONO, fontSize: '0.65rem', color: COLORS.danger },
  chipBtn: { padding: '3px 8px', fontSize: '0.68rem' },
}
