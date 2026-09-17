'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '../../../lib/api'
import { COLORS, FONT_COND, FONT_MONO, STATUS_LABELS, shared, badgeStyle } from '../../../lib/theme'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmt(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startDow = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let i = startDow; i > 0; i--) {
    cells.push(new Date(year, month, 1 - i))
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d))
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1]
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1))
  }
  return cells
}

function todayStr() {
  return fmt(new Date())
}

function displayStatus(job) {
  if (job.status === 'complete') return 'complete'
  const t = todayStr()
  if (job.end_date && job.end_date < t) return 'overdue'
  if (job.start_date && job.end_date && job.start_date <= t && t <= job.end_date) return 'inprogress'
  return job.status === 'inprogress' ? 'inprogress' : 'notstarted'
}

export default function CalendarPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    async function load() {
      const res = await apiGet('/api/jobs')
      if (res.error) setError(res.error)
      else setJobs(res.jobs || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={shared.loading}>Loading...</div>

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const cells = buildMonthGrid(year, month)
  const today = todayStr()

  const jobsForDate = (dateStr) => jobs.filter(j => {
    if (j.start_date && j.end_date) return j.start_date <= dateStr && dateStr <= j.end_date
    if (j.start_date && !j.end_date) return j.start_date === dateStr
    return false
  })

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={styles.page}>
      <div style={shared.titleRow}>
        <h2 style={shared.pageTitle}>Calendar</h2>
      </div>

      {error && <div style={shared.errorBox}>{error}</div>}

      <div style={styles.toolbar}>
        <div style={styles.nav}>
          <button style={styles.navBtn} onClick={() => setCursor(new Date(year, month - 1, 1))}>←</button>
          <button style={styles.todayBtn} onClick={() => setCursor(new Date())}>Today</button>
          <button style={styles.navBtn} onClick={() => setCursor(new Date(year, month + 1, 1))}>→</button>
        </div>
        <div style={styles.monthLabel}>{monthLabel}</div>
      </div>

      <div style={styles.grid}>
        {DOW.map(d => <div key={d} style={styles.dowHeader}>{d}</div>)}
        {cells.map((date, i) => {
          const dateStr = fmt(date)
          const inMonth = date.getMonth() === month
          const isToday = dateStr === today
          const dayJobs = jobsForDate(dateStr)
          return (
            <div key={i} style={{ ...styles.cell, ...(isToday ? styles.cellToday : {}), ...(!inMonth ? styles.cellDim : {}) }}>
              <div style={{ ...styles.cellDate, ...(isToday ? styles.cellDateToday : {}) }}>{date.getDate()}</div>
              <div style={styles.cellJobs}>
                {dayJobs.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJob(job)}
                    style={{
                      ...styles.pill,
                      background: `${job.crew?.color || COLORS.yellow}26`,
                      borderLeft: `3px solid ${job.crew?.color || COLORS.yellow}`,
                      color: '#eee',
                    }}
                    title={job.name}
                  >
                    {job.name}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {selectedJob && (
        <div style={styles.overlay} onClick={() => setSelectedJob(null)}>
          <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...styles.panelAccent, background: selectedJob.crew?.color || COLORS.yellow }} />
            <div style={styles.panelBody}>
              <div style={styles.panelHeader}>
                <h3 style={styles.panelTitle}>{selectedJob.name}</h3>
                <span style={badgeStyle(displayStatus(selectedJob))}>{STATUS_LABELS[displayStatus(selectedJob)]}</span>
              </div>
              <p style={styles.panelMeta}>
                {selectedJob.start_date && selectedJob.end_date
                  ? `${selectedJob.start_date} → ${selectedJob.end_date}`
                  : selectedJob.start_date || 'Unscheduled'}
              </p>
              {selectedJob.address && <p style={styles.panelLine}>📍 {selectedJob.address}{selectedJob.city ? `, ${selectedJob.city}` : ''}</p>}
              {selectedJob.client_name && <p style={styles.panelLine}>{selectedJob.client_name}{selectedJob.client_phone ? ` · ${selectedJob.client_phone}` : ''}</p>}
              <p style={styles.panelLine}>
                {selectedJob.crew
                  ? <><span style={{ ...styles.dot, background: selectedJob.crew.color || COLORS.yellow }} />{selectedJob.crew.name}</>
                  : 'No crew assigned'}
              </p>
              {selectedJob.job_equipment?.length > 0 && (
                <p style={styles.panelLine}>
                  Equipment: {selectedJob.job_equipment.map(je => je.equipment?.name).filter(Boolean).join(', ')}
                </p>
              )}
              {selectedJob.notes && <p style={styles.panelNotes}>{selectedJob.notes}</p>}
              <div style={styles.panelActions}>
                <button style={shared.btnSecondary} onClick={() => setSelectedJob(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100%' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' },
  nav: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  navBtn: { background: 'transparent', border: `1px solid ${COLORS.border}`, color: '#fff', width: '30px', height: '30px', cursor: 'pointer', fontSize: '0.9rem' },
  todayBtn: { background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.mid, fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', padding: '0.3rem 0.8rem', cursor: 'pointer' },
  monthLabel: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.4rem', letterSpacing: '2px', textTransform: 'uppercase' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: `1px solid ${COLORS.border}`, borderRight: 'none', borderBottom: 'none' },
  dowHeader: { fontFamily: FONT_MONO, fontSize: '0.6rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.mid, padding: '0.5rem', borderRight: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, background: '#0f0f0f' },
  cell: { minHeight: '110px', padding: '0.4rem', borderRight: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, background: COLORS.black, display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  cellToday: { background: '#1a1600' },
  cellDim: { background: '#0c0c0c' },
  cellDate: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.1rem', color: '#fff' },
  cellDateToday: { color: COLORS.yellow },
  cellJobs: { display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' },
  pill: { fontFamily: FONT_COND, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.3px', textTransform: 'uppercase', padding: '2px 5px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'flex-end', zIndex: 300 },
  panel: { display: 'flex', width: '420px', maxWidth: '100%', background: COLORS.cardBg, height: '100%', overflowY: 'auto' },
  panelAccent: { width: '4px', flexShrink: 0 },
  panelBody: { padding: '1.5rem', flex: 1 },
  panelHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.5rem' },
  panelTitle: { fontFamily: FONT_COND, fontWeight: 800, fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 },
  panelMeta: { fontFamily: FONT_MONO, fontSize: '0.75rem', color: COLORS.mid, marginBottom: '1rem' },
  panelLine: { fontSize: '0.85rem', color: '#ccc', margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  panelNotes: { fontSize: '0.85rem', color: '#999', marginTop: '1rem', padding: '0.75rem', borderLeft: `2px solid ${COLORS.border}`, fontStyle: 'italic' },
  panelActions: { marginTop: '1.5rem', paddingTop: '1rem', borderTop: `1px solid ${COLORS.border}` },
  dot: { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
}
