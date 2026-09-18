'use client'

import { useState } from 'react'
import { apiPatch } from '../../lib/api'
import { COLORS, FONT_COND, FONT_MONO } from '../../lib/theme'
import { useJobsContext } from './JobsContext'

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
      <span style={styles.label}>⚠ {overdue.length} Overdue Job{overdue.length !== 1 ? 's' : ''}</span>
      <div style={styles.list}>
        {overdue.map(job => (
          <div key={job.id} style={styles.item}>
            <span style={styles.jobName}>{job.name}</span>
            <span style={styles.jobDate}>due {job.end_date}</span>
            <button style={styles.button} disabled={busyId === job.id} onClick={() => markComplete(job)}>
              {busyId === job.id ? '...' : 'Mark Complete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  banner: {
    background: '#2a0d0d', borderBottom: `2px solid ${COLORS.red}`,
    padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem',
    flexWrap: 'wrap', flexShrink: 0,
  },
  label: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: COLORS.red, flexShrink: 0 },
  list: { display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1 },
  item: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.25rem 0.6rem' },
  jobName: { fontSize: '0.8rem', color: '#fff', fontWeight: 600 },
  jobDate: { fontFamily: FONT_MONO, fontSize: '0.65rem', color: '#e87070' },
  button: {
    background: 'transparent', border: `1px solid ${COLORS.red}`, color: '#e87070',
    fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '0.5px', textTransform: 'uppercase',
    padding: '0.2rem 0.5rem', cursor: 'pointer',
  },
}
