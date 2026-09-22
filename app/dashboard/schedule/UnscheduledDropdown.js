'use client'

import { useEffect, useRef, useState } from 'react'
import { ListTodo, ChevronDown } from 'lucide-react'
import { COLORS } from '../../../lib/theme'
import { crewColor } from './helpers'

// Toolbar button + dropdown for unscheduled jobs — replaces the old floating
// calendar panel so the calendar itself never loses space to it. Hidden
// entirely once there's nothing unscheduled.
export default function UnscheduledDropdown({ jobs, draggingJobId, onJobDragStart, onJobDragEnd, onDropUnschedule, onJobClick }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const unscheduled = (jobs || []).filter(j => !j.start_date)

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Hides itself entirely once nothing's unscheduled — no need to separately
  // reset `open`, since returning null here unmounts the dropdown with it.
  if (unscheduled.length === 0) return null

  const handleDrop = (e) => {
    e.preventDefault()
    onDropUnschedule()
  }

  return (
    <div style={styles.container} ref={containerRef} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(o => !o)}>
        <ListTodo size={15} />
        Unscheduled ({unscheduled.length})
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }} />
      </button>

      {open && (
        <div className="card slide-panel" style={styles.dropdown}>
          <div style={styles.hint}>Drag onto the calendar to schedule. Drag a scheduled job here to unschedule it.</div>
          <div style={styles.list}>
            {unscheduled.map(job => (
              <div
                key={job.id}
                draggable
                onDragStart={() => onJobDragStart(job.id)}
                onDragEnd={onJobDragEnd}
                onClick={() => { onJobClick(job); setOpen(false) }}
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
  container: { position: 'relative' },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 500,
    width: '260px', maxHeight: '360px', display: 'flex', flexDirection: 'column',
    padding: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
  },
  hint: { fontSize: '0.72rem', color: COLORS.textMuted, marginBottom: '12px', lineHeight: 1.4 },
  list: { display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', minHeight: 0 },
  item: { background: COLORS.surfaceRaised, border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px 10px', fontSize: '0.8rem', color: COLORS.textPrimary, cursor: 'grab' },
}
