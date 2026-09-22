'use client'

import { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { COLORS, FONT_MONO, RADIUS } from '../../../lib/theme'
import { crewColor } from './helpers'

const COLLAPSED_WIDTH = '32px'
const EXPANDED_WIDTH = '200px'

// A real layout sibling of the calendar grid, not an overlay — expanding it
// pushes the grid right by its width instead of covering the leftmost column.
// Collapsed, it's a slim vertical "UNSCHEDULED (N)" tab; the width itself
// transitions, so the calendar smoothly resizes instead of jumping.
export default function UnscheduledPanel({ jobs, draggingJobId, onJobDragStart, onJobDragEnd, onDropUnschedule, onJobClick }) {
  const [open, setOpen] = useState(false)
  const unscheduled = (jobs || []).filter(j => !j.start_date)

  if (unscheduled.length === 0) return null

  const handleDrop = (e) => {
    e.preventDefault()
    onDropUnschedule()
    setOpen(true)
  }

  return (
    <div
      className="card"
      style={{ ...styles.container, width: open ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {!open ? (
        <button style={styles.tab} onClick={() => setOpen(true)} title="Show unscheduled jobs">
          <span style={styles.tabLabel}>UNSCHEDULED ({unscheduled.length})</span>
          <ChevronRight size={13} />
        </button>
      ) : (
        <div style={styles.panel}>
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
      )}
    </div>
  )
}

const styles = {
  container: {
    flexShrink: 0, overflow: 'hidden', transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex', flexDirection: 'column',
  },
  tab: {
    flex: 1, width: COLLAPSED_WIDTH, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '10px', background: 'transparent', border: 'none', cursor: 'pointer',
    color: COLORS.textSecondary, padding: '12px 0',
  },
  tabLabel: {
    writingMode: 'vertical-rl', transform: 'rotate(180deg)',
    fontFamily: FONT_MONO, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap',
  },
  panel: {
    width: EXPANDED_WIDTH, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '14px',
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' },
  collapseBtn: { background: 'transparent', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: '2px', display: 'flex', borderRadius: RADIUS },
  title: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted },
  hint: { fontSize: '0.7rem', color: COLORS.textMuted, marginBottom: '12px', lineHeight: 1.4 },
  list: { display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', minHeight: 0 },
  item: { background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', color: COLORS.textPrimary, cursor: 'grab' },
}
