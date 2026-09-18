'use client'

import { COLORS, FONT_MONO, shared } from '../../../lib/theme'
import { crewColor } from './helpers'

export default function UnscheduledSidebar({ jobs, draggingJobId, onJobDragStart, onJobDragEnd, onDropUnschedule, onJobClick }) {
  const unscheduled = jobs.filter(j => !j.start_date)

  return (
    <div
      style={styles.sidebar}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropUnschedule}
    >
      <div style={styles.title}>Unscheduled ({unscheduled.length})</div>
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
  sidebar: { width: '220px', flexShrink: 0, background: COLORS.panelBg, border: `1px solid ${COLORS.border}`, padding: '0.9rem' },
  title: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: COLORS.mid, marginBottom: '0.4rem' },
  hint: { fontSize: '0.72rem', color: '#555', marginBottom: '0.75rem', lineHeight: 1.4 },
  list: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  item: { background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, padding: '0.5rem 0.6rem', fontSize: '0.8rem', cursor: 'grab' },
  empty: { color: '#444', fontSize: '0.78rem' },
}
