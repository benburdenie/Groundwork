'use client'

import { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { COLORS, FONT_MONO, RADIUS } from '../../../lib/theme'
import { crewColor } from './helpers'

// A slim panel pinned to the left edge of the calendar grid — physically close
// to where jobs actually get dragged, without taking permanent layout space.
// Collapsed: a vertical "UNSCHEDULED (N)" tab. Expanded: a 200px panel that
// overlaps the leftmost column slightly.
export default function UnscheduledPanel({ jobs, draggingJobId, onJobDragStart, onJobDragEnd, onDropUnschedule, onJobClick }) {
  const [open, setOpen] = useState(false)
  const unscheduled = (jobs || []).filter(j => !j.start_date)

  if (unscheduled.length === 0) return null

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
        title="Show unscheduled jobs"
      >
        <span style={styles.tabLabel}>UNSCHEDULED ({unscheduled.length})</span>
        <ChevronRight size={13} />
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
          <ChevronLeft size={15} />
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
      </div>
    </div>
  )
}

const styles = {
  tab: {
    position: 'absolute', top: '12px', left: 0, zIndex: 20,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderLeft: 'none',
    borderRadius: `0 ${RADIUS} ${RADIUS} 0`, padding: '12px 7px', cursor: 'pointer', color: COLORS.textSecondary,
  },
  tabLabel: {
    writingMode: 'vertical-rl', transform: 'rotate(180deg)',
    fontFamily: FONT_MONO, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap',
  },
  panel: {
    position: 'absolute', top: '12px', left: 0, zIndex: 20,
    width: '200px', maxHeight: 'calc(100% - 24px)', display: 'flex', flexDirection: 'column',
    padding: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' },
  collapseBtn: { background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: '2px', display: 'flex' },
  title: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted },
  hint: { fontSize: '0.7rem', color: COLORS.textMuted, marginBottom: '12px', lineHeight: 1.4 },
  list: { display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', minHeight: 0 },
  item: { background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', color: COLORS.textPrimary, cursor: 'grab' },
}
