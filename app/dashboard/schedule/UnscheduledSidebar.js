'use client'

import { COLORS, FONT_MONO } from '../../../lib/theme'
import { crewColor } from './helpers'

// fill: pin the card to the height of the row it sits in (the month grid) and scroll
// its list internally, instead of letting a long list make the page taller.
export default function UnscheduledSidebar({ jobs, draggingJobId, onJobDragStart, onJobDragEnd, onDropUnschedule, onJobClick, fill = false }) {
  const unscheduled = jobs.filter(j => !j.start_date)

  const card = (
    <div
      className="card"
      style={fill ? styles.sidebarFill : styles.sidebar}
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

  if (!fill) return card
  // The wrapper has no in-flow content, so it adds nothing to the row's height;
  // align-items: stretch then sizes it to the calendar and the card fills it.
  return <div style={styles.fillSlot}>{card}</div>
}

const styles = {
  sidebar: { width: '220px', flexShrink: 0, padding: '16px' },
  fillSlot: { width: '220px', flexShrink: 0, position: 'relative' },
  sidebarFill: { position: 'absolute', inset: 0, overflowY: 'auto', padding: '16px', scrollbarWidth: 'thin' },
  title: { fontFamily: FONT_MONO, fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted, marginBottom: '6px' },
  hint: { fontSize: '0.72rem', color: COLORS.textMuted, marginBottom: '14px', lineHeight: 1.4 },
  list: { display: 'flex', flexDirection: 'column', gap: '6px' },
  item: { background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', color: COLORS.textPrimary, cursor: 'grab' },
  empty: { color: COLORS.textMuted, fontSize: '0.78rem' },
}
