'use client'

import { useState } from 'react'
import { ChevronRight, ListTodo } from 'lucide-react'
import { COLORS, FONT_MONO, RADIUS } from '../../../lib/theme'
import { crewColor } from './helpers'

// A small floating panel pinned to the left edge of the calendar rather than a
// permanent layout column — it opens over the calendar and closes back down to
// a slim tab, so it never steals width from the schedule itself.
export default function UnscheduledSidebar({ jobs, draggingJobId, onJobDragStart, onJobDragEnd, onDropUnschedule, onJobClick }) {
  const [open, setOpen] = useState(false)
  const unscheduled = jobs.filter(j => !j.start_date)

  const handleDrop = (e) => {
    e.preventDefault()
    onDropUnschedule()
    setOpen(true)
  }

  if (!open) {
    return (
      <button
        style={styles.tab}
        onClick={() => setOpen(true)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        title="Unscheduled jobs"
      >
        <ListTodo size={15} />
        {unscheduled.length > 0 && <span style={styles.tabBadge}>{unscheduled.length}</span>}
      </button>
    )
  }

  return (
    <div
      className="card slide-panel"
      style={styles.panel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div style={styles.header}>
        <div style={styles.title}>Unscheduled ({unscheduled.length})</div>
        <button style={styles.collapseBtn} onClick={() => setOpen(false)} title="Collapse">
          <ChevronRight size={15} />
        </button>
      </div>
      <div style={styles.hint}>Drag onto the calendar to schedule. Drag a scheduled job here to unschedule it.</div>
      <div style={styles.list}>
        {unscheduled.map(job => (
          <div
            key={job.id}
            draggable
            onDragStart={() => onJobDragStart(job.id)}
            onDragEnd={onJobDragEnd}
            onClick={() => onJobClick(job)}
            style={{
              ...styles.item,
              borderLeft: `3px solid ${crewColor(job.crew)}`,
              opacity: draggingJobId === job.id ? 0.4 : 1,
            }}
          >
            {job.name}
          </div>
        ))}
        {unscheduled.length === 0 && <div style={styles.empty}>Nothing unscheduled</div>}
      </div>
    </div>
  )
}

const styles = {
  tab: {
    position: 'absolute', top: '12px', left: 0, zIndex: 20,
    display: 'flex', alignItems: 'center', gap: '6px',
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderLeft: 'none',
    borderRadius: `0 ${RADIUS} ${RADIUS} 0`, padding: '10px 10px', cursor: 'pointer', color: COLORS.textSecondary,
  },
  tabBadge: {
    fontFamily: FONT_MONO, fontSize: '0.65rem', fontWeight: 700, color: COLORS.bg,
    background: COLORS.yellow, borderRadius: '999px', padding: '1px 6px', minWidth: '16px', textAlign: 'center',
  },
  panel: {
    position: 'absolute', top: '12px', left: 0, zIndex: 20,
    width: '240px', maxHeight: 'calc(100% - 24px)', display: 'flex', flexDirection: 'column',
    padding: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' },
  collapseBtn: { background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: '2px', display: 'flex' },
  title: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted },
  hint: { fontSize: '0.72rem', color: COLORS.textMuted, marginBottom: '14px', lineHeight: 1.4 },
  list: { display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', minHeight: 0 },
  item: { background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', color: COLORS.textPrimary, cursor: 'grab' },
  empty: { color: COLORS.textMuted, fontSize: '0.78rem' },
}
